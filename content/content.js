logger.log('content', 'extension loaded', { version: EXT_VERSION });

// --- Orchestrator ---

var orchTimer       = null;  // setTimeout handle; null means loop is not scheduled
var orchTickRunning = false; // overlap guard — prevents concurrent ticks

var REFRESH_SETTLE_MS = 1200; // ms to wait after refresh before parsing

// Memory watchdog thresholds — reload only when heap is both large enough and near the limit.
var MEMORY_RELOAD_RATIO     = 0.7;
var MEMORY_RELOAD_MIN_BYTES = 500 * 1024 * 1024; // 500 MB

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function shouldReloadForMemory() {
  logger.log('content', 'shouldReloadForMemory called');
  try {
    if (!performance.memory) return false;
    var used  = performance.memory.usedJSHeapSize;
    var limit = performance.memory.jsHeapSizeLimit;
    var ratio = used / limit;
    logger.log('content', 'shouldReloadForMemory: heap stats', {
      usedMB:  Math.round(used  / 1024 / 1024),
      limitMB: Math.round(limit / 1024 / 1024),
      ratio:   ratio.toFixed(3)
    });
    return used >= MEMORY_RELOAD_MIN_BYTES && ratio >= MEMORY_RELOAD_RATIO;
  } catch (e) {
    logger.error('content', 'shouldReloadForMemory failed', { error: e });
    return false;
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

    // Memory watchdog — only fires when idle (no new loads, no surge, loop still running).
    // Amazon's React SPA leaks detached DOM nodes on every refresh; the only reset is a reload.
    if (result.newCount === 0 && surgeLoads.length === 0 && shouldReloadForMemory()) {
      logger.log('content', 'memory pressure — flagging for reload and reloading page');
      stopLoadObserver(); // disconnect before reload so no stale callbacks fire
      sessionStorage.setItem('ext_resume_after_memory_reload', '1');
      location.reload();
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

  // Memory-reload resume OR normal manual-start path.
  var _memResumeFlag = sessionStorage.getItem('ext_resume_after_memory_reload');
  if (_memResumeFlag === '1') {
    sessionStorage.removeItem('ext_resume_after_memory_reload');
    logger.log('content', 'page load — memory-reload resume detected, auto-starting loop');
    tabState.set('running', true); // subscriber → startOrchestrator()
  } else {
    logger.log('content', 'page load — waiting for manual Start');
    // tabState.running defaults to false — no action needed
  }
})();
