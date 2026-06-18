// loadObserver.js — MutationObserver for instant new-load detection.
// Supplements the timer tick; triggers the same pipeline without a refresh step
// when Amazon's DOM changes (new loads pushed, filter param changed).
//
// Anchor: document.body { childList:true, subtree:true } — never replaced by React.
//   div.load-list is volatile: Amazon unmounts/remounts it on filter change, so
//   binding to that node causes the observer to go deaf once the node is detached.
//
// Filter: hasExternalChange() — fires for ANY non-ext childList mutation.
//   No class-name matching; Amazon wraps load-list in React containers with hashed
//   class names. detectNewLoads() answers "new load?" after the 200ms debounce settles.
//   Non-load childList mutations (rare; most Amazon updates are characterData/attribute)
//   trigger a pipeline pass that finds newCount=0 and exits silently.
//
// Self-trigger prevention: isExtManagedNode() skips our own surge badges, inline panel,
//   and other ext-prefixed insertions. Highlighter class changes are attribute mutations —
//   childList never fires for them.
//
// Concurrency: _pipelineRunning flag prevents two overlapping observer pipeline runs.
//   orchTickRunning defers to the tick if it is already mid-run.
//
// Debounce: 200ms — coalesces a React render burst into one detection pass.
// Running-gated + per-tab via tabState. stopLoadObserver() cancels any pending debounce.

var _observer        = null;
var _debounceTimer   = null;
var _pipelineRunning = false;
var OBSERVE_DEBOUNCE_MS = 200;

// Returns true for DOM nodes the extension inserts itself.
// Non-element nodes are treated as managed — skip text/comment artefacts.
function isExtManagedNode(node) {
  if (node.nodeType !== 1) return true;
  if (node.id === 'ext-inline-panel') return true;
  if (node.id && node.id.startsWith('ext-')) return true;
  // Surge badge: data-testid="ext-surge-badge"
  if (node.dataset && node.dataset.testid && node.dataset.testid.startsWith('ext-')) return true;
  return false;
}

// Returns true if any mutation in the batch involves a node we did not insert.
// Intentionally class-name-agnostic: Amazon's React wrappers use hashed classes.
// detectNewLoads() does the real new-load check after the debounce fires.
function hasExternalChange(mutations) {
  for (var i = 0; i < mutations.length; i++) {
    var m       = mutations[i];
    var added   = m.addedNodes;
    var removed = m.removedNodes;
    for (var a = 0; a < added.length; a++) {
      if (!isExtManagedNode(added[a])) return true;
    }
    for (var r = 0; r < removed.length; r++) {
      if (!isExtManagedNode(removed[r])) return true;
    }
  }
  return false;
}

// Detection pipeline — mirrors orchestratorTick()'s detect→highlight→sound→tabAlert→
// auto-open→auto-stop path, without the refresh step (the DOM already changed).
async function runObserverPipeline() {
  logger.log('loadObserver', 'runObserverPipeline called');
  if (_pipelineRunning) {
    logger.log('loadObserver', 'runObserverPipeline: already running — skipping');
    return;
  }
  _pipelineRunning = true;
  try {
    if (!tabState.get('running')) {
      logger.log('loadObserver', 'runObserverPipeline: not running — skipping');
      return;
    }
    if (typeof orchTickRunning !== 'undefined' && orchTickRunning) {
      logger.log('loadObserver', 'runObserverPipeline: tick already running — skipping');
      return;
    }

    var loads  = parseLoads();
    var result = detectNewLoads(loads);
    logger.log('loadObserver', 'runObserverPipeline: diff done', {
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
      if (autoOpen) opened = openTopNewLoad(result.newLoads);

      if (autoOpen && opened) {
        await sleep(800);
        try {
          showInlinePanel(result.newLoads[0]._element);
          logger.log('loadObserver', 'inline panel shown for top new load');
        } catch (e) {
          logger.warn('loadObserver', 'inline panel render failed', { error: e });
        }
      }

      tabState.set('running', false);
      logger.log('loadObserver', 'new loads found — auto-stopping loop', { newCount: result.newCount });

    } else if (surgeLoads.length > 0) {
      var surgeAutoOpen = await storage.get(STORAGE_KEYS.AUTO_OPEN, true);
      var surgeOpened   = false;
      if (surgeAutoOpen) surgeOpened = openTopNewLoad(surgeLoads);

      if (surgeAutoOpen && surgeOpened) {
        await sleep(800);
        try {
          showInlinePanel(surgeLoads[0]._element);
          logger.log('loadObserver', 'inline panel shown for surge load');
        } catch (e) {
          logger.warn('loadObserver', 'inline panel render failed for surge load', { error: e });
        }
      }

      tabState.set('running', false);
      logger.log('loadObserver', 'surge detected — auto-stopping loop', { surgeCount: surgeLoads.length });
    }

  } catch (e) {
    logger.error('loadObserver', 'runObserverPipeline failed', { error: e });
  } finally {
    _pipelineRunning = false;
  }
}

// Anchor on document.body (never replaced). subtree:true catches both card-level
// changes within an existing div.load-list AND full container replacement.
function startLoadObserver() {
  logger.log('loadObserver', 'startLoadObserver called');
  if (_observer) {
    logger.log('loadObserver', 'startLoadObserver: already active — skipping');
    return;
  }

  _observer = new MutationObserver(function (mutations) {
    if (!hasExternalChange(mutations)) {
      logger.log('loadObserver', 'mutation: ext-managed change only — ignored');
      return;
    }

    if (!tabState.get('running')) {
      logger.log('loadObserver', 'mutation: not running — ignored');
      return;
    }

    logger.log('loadObserver', 'mutation: external change — debouncing');
    if (_debounceTimer !== null) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(function () {
      _debounceTimer = null;
      runObserverPipeline();
    }, OBSERVE_DEBOUNCE_MS);
  });

  _observer.observe(document.body, { childList: true, subtree: true });
  logger.log('loadObserver', 'observer active on document.body');
}

// Disconnect the observer and cancel any pending debounce. Safe to call when inactive.
function stopLoadObserver() {
  logger.log('loadObserver', 'stopLoadObserver called');
  if (_debounceTimer !== null) {
    clearTimeout(_debounceTimer);
    _debounceTimer = null;
  }
  if (_observer) {
    _observer.disconnect();
    _observer = null;
    logger.log('loadObserver', 'observer disconnected');
  }
}
