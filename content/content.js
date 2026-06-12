logger.log('content', 'extension loaded', { version: EXT_VERSION });

buildSidebar();
initManualToggle();

// --- Orchestrator ---

var orchTimer      = null;  // setTimeout handle; null means loop is not scheduled
var orchTickRunning = false; // overlap guard — prevents concurrent ticks

var REFRESH_SETTLE_MS = 1200; // ms to wait after refresh before parsing

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
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

    if (result.newCount > 0) {
      highlightNewLoads(result.newLoads);
      await playAlert();
      flashTabAlert();

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

      await storage.set(STORAGE_KEYS.RUNNING, false);
      stopOrchestrator();
      logger.log('content', 'new loads found — auto-stopping loop for dispatcher review', {
        newCount: result.newCount
      });
    }
  } catch (e) {
    logger.error('content', 'orchestratorTick: unexpected error', { error: e });
  } finally {
    orchTickRunning = false;
  }
}

async function scheduleNextTick() {
  var running = await storage.get(STORAGE_KEYS.RUNNING, false);
  if (!running) {
    logger.log('content', 'scheduleNextTick: loop halted');
    return;
  }
  var speedSec = await storage.get(STORAGE_KEYS.SPEED, 2);
  orchTimer = setTimeout(async function () {
    await orchestratorTick();
    scheduleNextTick();
  }, speedSec * 1000);
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

// React to Start/Stop toggle from sidebar or popup
chrome.storage.onChanged.addListener(function (changes, area) {
  if (area !== 'local') return;
  if (!changes[STORAGE_KEYS.RUNNING]) return;
  var newValue = changes[STORAGE_KEYS.RUNNING].newValue;
  if (newValue) {
    startOrchestrator();
  } else {
    stopOrchestrator();
  }
});

// On page load: always require manual Start — never auto-resume from storage
storage.set(STORAGE_KEYS.RUNNING, false);
logger.log('content', 'page load — forcing RUNNING=false, waiting for manual Start');
