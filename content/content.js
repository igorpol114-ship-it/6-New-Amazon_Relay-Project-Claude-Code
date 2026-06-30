logger.log('content', 'extension loaded', { version: EXT_VERSION });

// --- Orchestrator ---

var orchTimer       = null;  // setTimeout handle; null means loop is not scheduled
var orchTickRunning = false; // overlap guard — prevents concurrent ticks

var REFRESH_SETTLE_MS = 1200; // ms to wait after refresh before parsing

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// Shared heap reader — used by sidebar.js's memory indicator (polled independently
// of the orchestrator loop). Returns null where performance.memory is unsupported.
function getHeapUsageRatio() {
  logger.log('content', 'getHeapUsageRatio called');
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

    var loads  = parseLoads();
    var result = detectNewLoads(loads);
    logger.log('content', 'orchestratorTick: diff done', {
      allCount: result.allCount,
      newCount: result.newCount
    });

    var surgeLoads = await checkPriceSurge(loads);

    if (result.newCount > 0) {
      highlightNewLoads(result.newLoads);
      await playAlert();
      if (typeof flashTabAlert === 'function') flashTabAlert(result.newCount);

      var autoOpen = await storage.get(STORAGE_KEYS.AUTO_OPEN, true);
      var opened   = false;
      if (autoOpen) {
        opened = openTopNewLoad(result.newLoads);
      }

      if (autoOpen && opened) {
        await sleep(800);
        try {
          showInlinePanel(result.newLoads[0]._element);
          logger.log('content', 'inline panel shown for top new load');
        } catch (e) {
          logger.warn('content', 'inline panel render failed', { error: e });
        }
      }

      // tabState subscriber fires stopOrchestrator() synchronously
      tabState.set('running', false);
      logger.log('content', 'new loads found — auto-stopping loop for dispatcher review', {
        newCount: result.newCount
      });
    } else if (surgeLoads.length > 0) {
      // Surge hit with no new loads — auto-stop and open top surge card.
      // Uses the existing neutral-zone click (openTopNewLoad) — no new .click() sites.
      var surgeAutoOpen = await storage.get(STORAGE_KEYS.AUTO_OPEN, true);
      var surgeOpened   = false;
      if (surgeAutoOpen) {
        surgeOpened = openTopNewLoad(surgeLoads);
      }

      if (surgeAutoOpen && surgeOpened) {
        await sleep(800);
        try {
          showInlinePanel(surgeLoads[0]._element);
          logger.log('content', 'inline panel shown for surge load');
        } catch (e) {
          logger.warn('content', 'inline panel render failed for surge load', { error: e });
        }
      }

      // tabState subscriber fires stopOrchestrator() synchronously
      tabState.set('running', false);
      logger.log('content', 'surge detected — auto-stopping loop for dispatcher review', {
        surgeCount: surgeLoads.length
      });
    }

  } catch (e) {
    logger.error('content', 'orchestratorTick: unexpected error', { error: e });
  } finally {
    orchTickRunning = false;
  }
}

function scheduleNextTick() {
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
  if (orchTimer !== null) {
    logger.warn('content', 'startOrchestrator: already scheduled, ignoring');
    return;
  }
  logger.log('content', 'startOrchestrator: starting loop');
  orchestratorTick().then(function () { scheduleNextTick(); });
}

function stopOrchestrator() {
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
