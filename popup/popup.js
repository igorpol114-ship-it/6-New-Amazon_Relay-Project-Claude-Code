// Popup — Step 3 wiring, one control at a time.
// WIRED: Night Mode, Hide Similar Matches.
// NOT WIRED YET (visual only): Tab Alert, Sound volume/selector, Price Surge,
// Hide Promoted, Reset.
// Popup runs in its own isolated context: never clicks page elements, never
// parses loads, never triggers refresh. State shared via chrome.storage.local.

var KEY_NIGHT_MODE   = 'nightMode';          // STORAGE_KEYS.NIGHT_MODE
var KEY_HIDE_SIMILAR = 'hideSimilarMatches'; // STORAGE_KEYS.HIDE_SIMILAR

document.addEventListener('DOMContentLoaded', function () {
  var nightToggle   = document.getElementById('popup-night-mode');
  var similarToggle = document.getElementById('popup-hide-similar');

  chrome.storage.local.get([KEY_NIGHT_MODE, KEY_HIDE_SIMILAR], function (data) {
    if (nightToggle)   nightToggle.checked   = data[KEY_NIGHT_MODE] === true;
    if (similarToggle) similarToggle.checked = data[KEY_HIDE_SIMILAR] === true;
  });

  if (nightToggle) {
    nightToggle.addEventListener('change', function () {
      chrome.storage.local.set({ [KEY_NIGHT_MODE]: nightToggle.checked });
    });
  }
  if (similarToggle) {
    similarToggle.addEventListener('change', function () {
      chrome.storage.local.set({ [KEY_HIDE_SIMILAR]: similarToggle.checked });
    });
  }

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== 'local') return;
    if (changes[KEY_NIGHT_MODE] !== undefined && nightToggle) {
      nightToggle.checked = changes[KEY_NIGHT_MODE].newValue === true;
    }
    if (changes[KEY_HIDE_SIMILAR] !== undefined && similarToggle) {
      similarToggle.checked = changes[KEY_HIDE_SIMILAR].newValue === true;
    }
  });
});
