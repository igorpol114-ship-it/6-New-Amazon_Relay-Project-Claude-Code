// loadObserver.js — MutationObserver for instant new-load detection.
// Supplements the timer tick; triggers the same detection pipeline without a refresh
// step when Amazon's DOM changes (new loads pushed, filter param changed).
//
// ROOT CAUSE OF PREVIOUS FAILURE:
//   The observer was bound to div.load-list with subtree:false. When the user changes a
//   filter, Amazon (React SPA) unmounts the entire div.load-list and mounts a fresh one.
//   The old node is detached; an observer on a detached node never fires. Our observer
//   went deaf the moment the container was replaced.
//
// FIX:
//   Anchor on document.body (always stable; never replaced). Observe { childList:true,
//   subtree:true }. Filter the callback with hasLoadCardChange() so we only debounce
//   when actual load cards or the load-list container appear/disappear — Amazon's
//   unrelated UI updates (countdown, breadcrumbs, etc.) are ignored.
//
// Self-trigger prevention:
//   isExtManagedNode() returns true for our surge badges, inline panel, and other
//   ext-prefixed nodes. These are skipped during the hasLoadCardChange scan.
//   Highlighter class additions are attribute mutations — { childList } does not fire for them.
//
// Debounce: 200ms — coalesces a burst of mutations (filter clear + re-render) into one pass.
//
// Running-gated + per-tab: observer only acts when tabState.get('running') is true.
// startLoadObserver / stopLoadObserver called from tabState 'running' subscriber in content.js.
// stopLoadObserver also called before location.reload() in memory-watchdog path.

var _observer      = null;
var _debounceTimer = null;
var OBSERVE_DEBOUNCE_MS = 200;

// Returns true for nodes the extension injects into the page.
// Non-element nodes (text, comment) are treated as managed — skip them.
function isExtManagedNode(node) {
  if (node.nodeType !== 1) return true;
  if (node.id === 'ext-inline-panel') return true;
  if (node.id && node.id.startsWith('ext-')) return true;
  // Surge badge: data-testid="ext-surge-badge"
  if (node.dataset && node.dataset.testid && node.dataset.testid.startsWith('ext-')) return true;
  return false;
}

// Returns true if any mutation in the batch involves a real load-card or load-list change.
// Skips ext-managed nodes. Also checks if a large added container holds load cards inside it
// (handles the case where React replaces an intermediate wrapper above div.load-list).
// DIAG logs included so the user can verify what Amazon actually sends.
function hasLoadCardChange(mutations) {
  for (var i = 0; i < mutations.length; i++) {
    var m = mutations[i];

    // Case 1: mutation.target IS a load-list → cards were added/removed directly inside it
    if (m.target && m.target.nodeType === 1 &&
        m.target.classList && m.target.classList.contains('load-list')) {
      logger.log('loadObserver', 'DIAG hasLoadCardChange: target is load-list', {
        addedCount: m.addedNodes.length, removedCount: m.removedNodes.length
      });
      return true;
    }

    var added   = m.addedNodes;
    var removed = m.removedNodes;

    for (var a = 0; a < added.length; a++) {
      var node = added[a];
      if (isExtManagedNode(node)) continue;
      if (node.nodeType !== 1) continue;

      // Case 2: a load-card was directly added
      if (node.classList.contains('load-card') || node.classList.contains('load-card__selected')) {
        logger.log('loadObserver', 'DIAG hasLoadCardChange: load-card added');
        return true;
      }
      // Case 3: the load-list container itself was replaced (entire node swapped)
      if (node.classList.contains('load-list')) {
        logger.log('loadObserver', 'DIAG hasLoadCardChange: load-list node added (container replaced)');
        return true;
      }
      // Case 4: a parent wrapper was replaced that contains the load-list inside it
      if (node.querySelector && node.querySelector('div.load-card, div.load-list')) {
        logger.log('loadObserver', 'DIAG hasLoadCardChange: wrapper with load content added');
        return true;
      }
    }

    for (var r = 0; r < removed.length; r++) {
      var rnode = removed[r];
      if (isExtManagedNode(rnode)) continue;
      if (rnode.nodeType !== 1) continue;

      if (rnode.classList.contains('load-card') || rnode.classList.contains('load-card__selected')) {
        logger.log('loadObserver', 'DIAG hasLoadCardChange: load-card removed');
        return true;
      }
      if (rnode.classList.contains('load-list')) {
        logger.log('loadObserver', 'DIAG hasLoadCardChange: load-list node removed (container replaced)');
        return true;
      }
    }
  }
  return false;
}

// Detection pipeline — mirrors orchestratorTick()'s detect→highlight→sound→tabAlert→
// auto-open→auto-stop path, without the initial refresh step (the DOM already changed).
// Guards against concurrent runs with orchestratorTick via the orchTickRunning flag.
async function runObserverPipeline() {
  logger.log('loadObserver', 'runObserverPipeline called');
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
  }
}

// Anchor on document.body (never replaced). Observe subtree:true so we catch both
// card-level changes inside an existing div.load-list AND full container replacement.
function startLoadObserver() {
  logger.log('loadObserver', 'startLoadObserver called');
  if (_observer) {
    logger.log('loadObserver', 'startLoadObserver: already active — skipping');
    return;
  }

  // DIAG: log what's in the DOM at attach time so we can confirm load-list presence
  logger.log('loadObserver', 'DIAG startLoadObserver: attaching to document.body', {
    loadListFound:  !!document.querySelector('div.load-list'),
    loadCardCount:  document.querySelectorAll('div.load-card, div.load-card__selected').length,
    running:        tabState.get('running')
  });

  _observer = new MutationObserver(function (mutations) {
    // DIAG: log every callback invocation (first mutation summary for diagnosis)
    var m0 = mutations[0];
    logger.log('loadObserver', 'DIAG callback: fired', {
      batchSize:      mutations.length,
      running:        tabState.get('running'),
      target0Tag:     m0 ? m0.target.tagName : '(none)',
      target0Class:   m0 && typeof m0.target.className === 'string'
                        ? m0.target.className.substring(0, 80) : '(non-string)',
      target0Id:      m0 ? (m0.target.id || '(none)') : '(none)',
      added0Class:    m0 && m0.addedNodes[0] && m0.addedNodes[0].nodeType === 1
                        ? (m0.addedNodes[0].className || '(no-class)').substring(0, 60) : '(none)',
      removed0Class:  m0 && m0.removedNodes[0] && m0.removedNodes[0].nodeType === 1
                        ? (m0.removedNodes[0].className || '(no-class)').substring(0, 60) : '(none)'
    });

    if (!hasLoadCardChange(mutations)) {
      // Only log "not relevant" occasionally — not on every rapid UI tick
      return;
    }

    if (!tabState.get('running')) {
      logger.log('loadObserver', 'DIAG: load-change detected but not running — ignored');
      return;
    }

    logger.log('loadObserver', 'mutation: load-card/list change — debouncing');
    if (_debounceTimer !== null) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(function () {
      _debounceTimer = null;
      runObserverPipeline();
    }, OBSERVE_DEBOUNCE_MS);
  });

  _observer.observe(document.body, { childList: true, subtree: true });
  logger.log('loadObserver', 'DIAG startLoadObserver: observer active on document.body (childList+subtree)');
}

// Disconnect the observer and cancel any pending debounce. Safe to call when not active.
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
