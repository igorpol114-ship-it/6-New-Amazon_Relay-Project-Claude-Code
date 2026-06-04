// Stage 13 — neutral-zone click to open load details.
// This is the SECOND allowed .click() in the codebase (see SAFETY.md).
// Target: div.load-card body only. isForbiddenElement() MUST return false before click.
// NO booking. NO Layout B. ONE card per call only.

function openTopNewLoad(newLoads) {
  logger.log('detailOpener', 'openTopNewLoad called', { newCount: newLoads ? newLoads.length : 0 });

  if (!newLoads || newLoads.length === 0) {
    logger.log('detailOpener', 'no new loads to open');
    return false;
  }

  var load = newLoads[0];
  var el   = load._element;

  // Gate 1: element must exist
  if (!el) {
    logger.warn('detailOpener', 'top new load has no _element, NOT clicking', {
      loadId: load.loadId
    });
    return false;
  }

  // Gate 2: MANDATORY — isForbiddenElement must return false
  if (isForbiddenElement(el)) {
    logger.error('detailOpener', 'BLOCKED: target matched FORBIDDEN selector — NOT clicking', {
      loadId: load.loadId
    });
    return false;
  }

  // Gate 3: element must still be in the live DOM
  if (!document.contains(el)) {
    logger.warn('detailOpener', 'target element no longer in DOM, NOT clicking', {
      loadId: load.loadId
    });
    return false;
  }

  // All gates passed — declare intent before clicking
  logger.log('detailOpener', 'intent: ' + ALLOWED_CLICK_INTENTS.NEUTRAL_ZONE, {
    loadId: load.loadId,
    payout: load.payout
  });

  // THE SECOND ALLOWED .click() in the codebase.
  // Clicks the div.load-card body (neutral zone) — opens details panel, does NOT book.
  // isForbiddenElement confirmed false above. ONE click on ONE card only.
  el.click();

  logger.log('detailOpener', 'neutral zone click sent — details panel should open', {
    loadId: load.loadId,
    payout: load.payout
  });

  return true;
}

// Expose for manual console testing only — NOT called automatically.
window.__EXT_DEBUG = window.__EXT_DEBUG || {};
window.__EXT_DEBUG.openTopNew = function () {
  var r = detectNewLoads(parseLoads());
  return openTopNewLoad(r.newLoads);
};
