// Stage 13 — neutral-zone click to open load details.
// This is the SECOND allowed click site in the codebase (see SAFETY.md).
// Target: inner element of div.load-card body, resolved via elementFromPoint
//         at a point biased left (30% width) to stay away from the Book button.
// isForbiddenElement() MUST return false on BOTH the card container AND the
// resolved target before any .click() is called.
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

  // Gate 2: MANDATORY — isForbiddenElement must return false on the card container
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

  // Scroll the card into view so elementFromPoint can resolve a target,
  // then schedule the point-resolve + click after layout settles.
  try {
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
  } catch (scrollErr) {
    logger.warn('detailOpener', 'scrollIntoView failed (ignored)', { error: scrollErr });
  }

  setTimeout(function () {
    // Re-read rect after scroll has settled
    var r      = el.getBoundingClientRect();
    var x      = r.left + r.width  * 0.3;
    var y      = r.top  + r.height * 0.5;
    var target = document.elementFromPoint(x, y);

    if (!target) {
      logger.warn('detailOpener', 'elementFromPoint returned null — NOT clicking', {
        loadId: load.loadId, x: x, y: y
      });
      return;
    }

    // SAFETY: resolved target must not be a forbidden element
    if (isForbiddenElement(target)) {
      logger.error('detailOpener', 'BLOCKED: elementFromPoint resolved to a forbidden element — NOT clicking', {
        loadId: load.loadId, tagName: target.tagName, id: target.id
      });
      return;
    }

    // SAFETY: resolved target must be inside the card; fall back to card itself if not
    if (!el.contains(target) && target !== el) {
      logger.warn('detailOpener', 'resolved target outside card, falling back to card element', {
        loadId: load.loadId, targetTag: target.tagName
      });
      target = el;
    }

    // ONE .click() on the resolved inner element (neutral zone). NOT a booking element.
    target.click();

    logger.log('detailOpener', 'neutral zone click sent — details panel should open', {
      loadId: load.loadId,
      payout: load.payout
    });
  }, 250);

  // Return true optimistically — the click is scheduled and will fire after scroll settles
  return true;
}

// Expose for manual console testing only — NOT called automatically.
window.__EXT_DEBUG = window.__EXT_DEBUG || {};
window.__EXT_DEBUG.openTopNew = function () {
  var r = detectNewLoads(parseLoads());
  return openTopNewLoad(r.newLoads);
};
