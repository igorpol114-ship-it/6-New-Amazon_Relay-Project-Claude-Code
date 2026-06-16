// content/filterTags.js
// Hides individual tag badge elements for Promoted / Starting soon / Trailer ready.
// The load card stays fully visible and clickable; only the tag label is hidden.
// Tag ids are DUPLICATED across cards (invalid HTML but real) — always use
// querySelectorAll('[id="..."]'), never getElementById.
// NO clicks, NO booking, NO Layout B.

var tagState = { promoted: false, startingSoon: false, trailerReady: false };
var tagObserver = null;

// Set visibility on every matching tag element.
// Uses visibility:hidden so the card layout never shifts (space is kept).
function recomputeTagHiding() {
  logger.log('filterTags', 'recomputeTagHiding', {
    promoted:     tagState.promoted,
    startingSoon: tagState.startingSoon,
    trailerReady: tagState.trailerReady
  });
  try {
    var tags, i;

    tags = document.querySelectorAll('[id="PROMOTED"]');
    for (i = 0; i < tags.length; i++) {
      tags[i].style.visibility = tagState.promoted ? 'hidden' : '';
    }

    tags = document.querySelectorAll('[id="STARTING_SOON"]');
    for (i = 0; i < tags.length; i++) {
      tags[i].style.visibility = tagState.startingSoon ? 'hidden' : '';
    }

    tags = document.querySelectorAll('[id="TRAILER_READY"]');
    for (i = 0; i < tags.length; i++) {
      tags[i].style.visibility = tagState.trailerReady ? 'hidden' : '';
    }
  } catch (e) {
    logger.error('filterTags', 'recomputeTagHiding failed', { error: e });
  }
}

function enableTagObserver() {
  if (tagObserver) return;
  tagObserver = new MutationObserver(function () {
    recomputeTagHiding();
  });
  tagObserver.observe(document.body, { childList: true, subtree: true });
  logger.log('filterTags', 'observer connected');
}

function disableTagObserver() {
  if (!tagObserver) return;
  tagObserver.disconnect();
  tagObserver = null;
  logger.log('filterTags', 'observer disconnected');
}

// Full recompute + observer lifecycle. Call after any state change.
function applyTagHiding() {
  logger.log('filterTags', 'applyTagHiding', {
    promoted:     tagState.promoted,
    startingSoon: tagState.startingSoon,
    trailerReady: tagState.trailerReady
  });
  recomputeTagHiding();
  var anyOn = tagState.promoted || tagState.startingSoon || tagState.trailerReady;
  if (anyOn) {
    enableTagObserver();
  } else {
    disableTagObserver();
  }
}

(async function initFilterTags() {
  try {
    tagState.promoted     = (await storage.get(STORAGE_KEYS.HIDE_PROMOTED,      false)) === true;
    tagState.startingSoon = (await storage.get(STORAGE_KEYS.HIDE_STARTING_SOON, false)) === true;
    tagState.trailerReady = (await storage.get(STORAGE_KEYS.HIDE_TRAILER_READY, false)) === true;
    applyTagHiding();
    logger.log('filterTags', 'init complete', tagState);
  } catch (e) {
    logger.error('filterTags', 'initFilterTags failed', { error: e });
  }
})();

chrome.storage.onChanged.addListener(function (changes, area) {
  if (area !== 'local') return;
  var changed = false;
  if (changes[STORAGE_KEYS.HIDE_PROMOTED] !== undefined) {
    tagState.promoted = changes[STORAGE_KEYS.HIDE_PROMOTED].newValue === true;
    changed = true;
  }
  if (changes[STORAGE_KEYS.HIDE_STARTING_SOON] !== undefined) {
    tagState.startingSoon = changes[STORAGE_KEYS.HIDE_STARTING_SOON].newValue === true;
    changed = true;
  }
  if (changes[STORAGE_KEYS.HIDE_TRAILER_READY] !== undefined) {
    tagState.trailerReady = changes[STORAGE_KEYS.HIDE_TRAILER_READY].newValue === true;
    changed = true;
  }
  if (changed) applyTagHiding();
});

window.__EXT_DEBUG = window.__EXT_DEBUG || {};
window.__EXT_DEBUG.recomputeTagHiding = recomputeTagHiding;
