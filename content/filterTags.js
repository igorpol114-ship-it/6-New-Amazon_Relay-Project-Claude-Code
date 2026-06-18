// content/filterTags.js
// Hides individual tag badge elements for Promoted / Starting soon / Trailer ready / Booked before.
// The load CARD stays fully visible and clickable; only the tag label element is hidden.
// Tag ids are DUPLICATED across cards (invalid HTML but real) — always use
// querySelectorAll('[id="..."]'), never getElementById.
// Uses display:none (not visibility:hidden) so the hidden tag collapses its space.
// After hiding individual tags, each .wo-tag wrapper is also collapsed if ALL its
// known tag children are hidden, to remove the reserved gap entirely.
// NO clicks, NO booking, NO Layout B.

var tagState = {
  promoted:     false,
  startingSoon: false,
  trailerReady: false,
  pastBook:     false
};
var tagObserver = null;

// After individual tags are set, collapse .wo-tag wrappers whose known children are all hidden.
// A wrapper is left visible if at least one known tag child is visible (display !== 'none').
// Wrappers with no known tag children are never touched.
function recomputeWrappers() {
  var wrappers = document.querySelectorAll('.wo-tag');
  for (var i = 0; i < wrappers.length; i++) {
    var wrapper = wrappers[i];
    var tagEls  = wrapper.querySelectorAll(
      '[id="PROMOTED"],[id="STARTING_SOON"],[id="TRAILER_READY"],[id="PAST_BOOK"]'
    );
    if (tagEls.length === 0) continue;
    var allHidden = true;
    for (var j = 0; j < tagEls.length; j++) {
      if (tagEls[j].style.display !== 'none') {
        allHidden = false;
        break;
      }
    }
    wrapper.style.display = allHidden ? 'none' : '';
  }
}

// Set display on every matching tag element, then recompute wrappers.
function recomputeTagHiding() {
  logger.log('filterTags', 'recomputeTagHiding', {
    promoted:     tagState.promoted,
    startingSoon: tagState.startingSoon,
    trailerReady: tagState.trailerReady,
    pastBook:     tagState.pastBook
  });
  try {
    var tags, i;

    tags = document.querySelectorAll('[id="PROMOTED"]');
    for (i = 0; i < tags.length; i++) {
      tags[i].style.display = tagState.promoted ? 'none' : '';
    }

    tags = document.querySelectorAll('[id="STARTING_SOON"]');
    for (i = 0; i < tags.length; i++) {
      tags[i].style.display = tagState.startingSoon ? 'none' : '';
    }

    tags = document.querySelectorAll('[id="TRAILER_READY"]');
    for (i = 0; i < tags.length; i++) {
      tags[i].style.display = tagState.trailerReady ? 'none' : '';
    }

    tags = document.querySelectorAll('[id="PAST_BOOK"]');
    for (i = 0; i < tags.length; i++) {
      tags[i].style.display = tagState.pastBook ? 'none' : '';
    }

    recomputeWrappers();
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
    trailerReady: tagState.trailerReady,
    pastBook:     tagState.pastBook
  });
  recomputeTagHiding();
  var anyOn = tagState.promoted || tagState.startingSoon || tagState.trailerReady || tagState.pastBook;
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
    tagState.pastBook     = (await storage.get(STORAGE_KEYS.HIDE_PAST_BOOK,     false)) === true;
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
    tagState.promoted     = changes[STORAGE_KEYS.HIDE_PROMOTED].newValue === true;
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
  if (changes[STORAGE_KEYS.HIDE_PAST_BOOK] !== undefined) {
    tagState.pastBook     = changes[STORAGE_KEYS.HIDE_PAST_BOOK].newValue === true;
    changed = true;
  }
  if (changed) applyTagHiding();
});

window.__EXT_DEBUG = window.__EXT_DEBUG || {};
window.__EXT_DEBUG.recomputeTagHiding = recomputeTagHiding;
