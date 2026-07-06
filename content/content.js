logger.log('content', 'extension loaded', { version: EXT_VERSION });

// --- Orchestrator ---

var orchTimer       = null;   // setTimeout handle; null means loop is not scheduled
var orchTickRunning = false;  // overlap guard — prevents concurrent ticks
var orchLoopActive  = false;  // double-start guard — true between startOrchestrator and stopOrchestrator

var REFRESH_SETTLE_MS = 1200; // ms to wait after refresh before parsing

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// Shared heap reader — used by sidebar.js's memory indicator (polled independently
// of the orchestrator loop). Returns null where performance.memory is unsupported.
function getHeapUsageRatio() {
  logger.debug('content', 'getHeapUsageRatio called'); // debug: fires every 7s from sidebar poll
  try {
    if (!performance.memory) return null;
    var used  = performance.memory.usedJSHeapSize;
    var limit = performance.memory.jsHeapSizeLimit;
    var ratio = used / limit;
    return { usedBytes: used, limitBytes: limit, ratio: ratio };
  } catch (e) {
    logger.error('content', 'getHeapUsageRatio failed', { error: e });
    return null;
  }
}

// Returns a copy of the loads array sorted by numeric payout descending.
// Unparseable payout strings (null, missing, non-numeric) sort to the end (-Infinity).
// Does NOT mutate the input array.
function sortByPayoutDesc(loads) {
  logger.log('content', 'sortByPayoutDesc called', { count: loads ? loads.length : 0 });
  return loads.slice().sort(function (a, b) {
    var aNum = parseFloat((a.payout || '').replace(/[$,]/g, ''));
    var bNum = parseFloat((b.payout || '').replace(/[$,]/g, ''));
    if (isNaN(aNum)) aNum = -Infinity;
    if (isNaN(bNum)) bNum = -Infinity;
    return bNum - aNum;
  });
}

// Shared detection pipeline — called by both orchestratorTick (after a refresh) and
// runObserverPipeline (DOM already changed, no refresh step).
// sourceTag ('tick' | 'observer') is threaded through log lines to keep origin distinguishable.
async function runDetectionPipeline(sourceTag) {
  logger.log('content', 'runDetectionPipeline called', { source: sourceTag });

  var loads  = parseLoads();
  var result = detectNewLoads(loads);
  logger.log('content', 'runDetectionPipeline: diff done', {
    source: sourceTag, allCount: result.allCount, newCount: result.newCount
  });

  var surgeLoads = await checkPriceSurge(loads);

  if (result.newCount > 0) {
    highlightNewLoads(result.newLoads); // highlight all, original DOM order
    await playAlert();
    if (typeof flashTabAlert === 'function') flashTabAlert(result.newCount);

    var autoOpen = await storage.get(STORAGE_KEYS.AUTO_OPEN, true);
    var opened   = false;
    // Sort by payout desc so openTopNewLoad always opens the highest-paying new load.
    var ordered  = sortByPayoutDesc(result.newLoads);
    if (autoOpen) opened = openTopNewLoad(ordered);

    if (autoOpen && opened) {
      await sleep(800);
      try {
        showInlinePanel(ordered[0]._element);
        logger.log('content', 'runDetectionPipeline: inline panel shown', { source: sourceTag, topPayout: ordered[0].payout });
      } catch (e) {
        logger.warn('content', 'runDetectionPipeline: inline panel render failed', { source: sourceTag, error: e });
      }
    }

    tabState.set('running', false);
    logger.log('content', 'runDetectionPipeline: new loads found — auto-stopping', {
      source: sourceTag, newCount: result.newCount
    });
  } else if (surgeLoads.length > 0) {
    var surgeAutoOpen  = await storage.get(STORAGE_KEYS.AUTO_OPEN, true);
    var surgeOpened    = false;
    var orderedSurge   = sortByPayoutDesc(surgeLoads);
    if (surgeAutoOpen) surgeOpened = openTopNewLoad(orderedSurge);

    if (surgeAutoOpen && surgeOpened) {
      await sleep(800);
      try {
        showInlinePanel(orderedSurge[0]._element);
        logger.log('content', 'runDetectionPipeline: inline panel shown for surge', { source: sourceTag, topPayout: orderedSurge[0].payout });
      } catch (e) {
        logger.warn('content', 'runDetectionPipeline: inline panel render failed for surge', { source: sourceTag, error: e });
      }
    }

    tabState.set('running', false);
    logger.log('content', 'runDetectionPipeline: surge detected — auto-stopping', {
      source: sourceTag, surgeCount: surgeLoads.length
    });
  }
}

async function orchestratorTick() {
  if (orchTickRunning) {
    logger.warn('content', 'orchestratorTick: previous tick still running, skipping');
    return;
  }
  orchTickRunning = true;
  try {
    var refreshed = refreshNow();
    logger.log('content', 'orchestratorTick: refresh triggered', { refreshed: refreshed });
    await sleep(REFRESH_SETTLE_MS);
    await runDetectionPipeline('tick');
  } catch (e) {
    logger.error('content', 'orchestratorTick: unexpected error', { error: e });
  } finally {
    orchTickRunning = false;
  }
}

function scheduleNextTick() {
  if (!orchLoopActive) {
    logger.log('content', 'scheduleNextTick: loop not active — halted');
    return;
  }
  var running = tabState.get('running');
  if (!running) {
    logger.log('content', 'scheduleNextTick: loop halted');
    return;
  }
  var intervalMs = tabState.get('refreshIntervalMs');
  orchTimer = setTimeout(async function () {
    await orchestratorTick();
    scheduleNextTick();
  }, intervalMs);
}

async function startOrchestrator() {
  if (orchLoopActive) {
    logger.warn('content', 'startOrchestrator: loop already active — ignoring');
    return;
  }
  if (orchTimer !== null) {
    logger.warn('content', 'startOrchestrator: timer already scheduled — ignoring');
    return;
  }
  orchLoopActive = true;
  logger.log('content', 'startOrchestrator: starting loop');
  orchestratorTick().then(function () { scheduleNextTick(); });
}

function stopOrchestrator() {
  orchLoopActive = false;
  if (orchTimer !== null) {
    clearTimeout(orchTimer);
    orchTimer = null;
  }
  logger.log('content', 'stopOrchestrator: loop stopped');
}

// tabState subscriber replaces chrome.storage.onChanged for RUNNING.
// Fires synchronously when sidebar toggles or orchestrator auto-stops.
tabState.subscribe('running', function (val) {
  if (val) {
    closePanelsForStart(); // close detail panel once per loop start
    startLoadObserver();   // instant detection via MutationObserver
    startOrchestrator();   // timer-tick fallback
  } else {
    stopLoadObserver();
    stopOrchestrator();
  }
});

// Async init: await tabState.init() so sidebar reads correct seeded values synchronously.
(async function () {
  await tabState.init();

  buildSidebar();
  initManualToggle();

  logger.log('content', 'page load — waiting for manual Start');
  // tabState.running defaults to false — no action needed
})();
