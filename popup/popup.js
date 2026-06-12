// Popup — Step 3 wiring, one control at a time.
// WIRED: Night Mode toggle, Tab Alert toggle.
// NOT WIRED YET: Sound volume/selector, Price Surge, Hide Promoted, Hide Similar, Reset.
//
// Popup runs in its own isolated context: it never clicks page elements,
// never parses loads, never triggers a refresh. State is shared with the
// content scripts purely via chrome.storage.local.

var KEY_NIGHT_MODE = 'nightMode'; // must match STORAGE_KEYS.NIGHT_MODE in utils/storage.js
var KEY_TAB_ALERT  = 'tabAlert';  // must match STORAGE_KEYS.TAB_ALERT  in utils/storage.js

document.addEventListener('DOMContentLoaded', function () {
  var nightToggle    = document.getElementById('popup-night-mode');
  var tabAlertToggle = document.getElementById('popup-tab-alert');

  // ── Night Mode ───────────────────────────────────────────────────────────────
  if (nightToggle) {
    chrome.storage.local.get([KEY_NIGHT_MODE], function (data) {
      nightToggle.checked = data[KEY_NIGHT_MODE] === true;
    });
    nightToggle.addEventListener('change', function () {
      chrome.storage.local.set({ [KEY_NIGHT_MODE]: nightToggle.checked });
    });
  }

  // ── Tab Alert ────────────────────────────────────────────────────────────────
  if (tabAlertToggle) {
    chrome.storage.local.get([KEY_TAB_ALERT], function (data) {
      tabAlertToggle.checked = data[KEY_TAB_ALERT] === true;
    });
    tabAlertToggle.addEventListener('change', function () {
      chrome.storage.local.set({ [KEY_TAB_ALERT]: tabAlertToggle.checked });
    });
  }

  // ── Live sync (storage → UI) ─────────────────────────────────────────────────
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== 'local') return;
    if (nightToggle && changes[KEY_NIGHT_MODE] !== undefined) {
      nightToggle.checked = changes[KEY_NIGHT_MODE].newValue === true;
    }
    if (tabAlertToggle && changes[KEY_TAB_ALERT] !== undefined) {
      tabAlertToggle.checked = changes[KEY_TAB_ALERT].newValue === true;
    }
  });
});
