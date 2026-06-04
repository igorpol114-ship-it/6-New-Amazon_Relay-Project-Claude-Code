// Popup runs in its own isolated context — no access to content script globals.
// All state is read/written via chrome.storage.local directly.
// NO .click() on any page element. NO load parsing. NO refresh triggering.

// Storage key literals — must stay in sync with utils/storage.js STORAGE_KEYS
// and any future keys written by content scripts.
var KEY_SPEED        = 'refreshSpeedSeconds'; // STORAGE_KEYS.SPEED
var KEY_RUNNING      = 'isRunning';           // STORAGE_KEYS.RUNNING — confirmed match
var KEY_LOAD_COUNT   = 'lastLoadCount';       // written by content (future stages); read-only here
var KEY_LAST_REFRESH = 'lastRefreshTime';     // written by content (future stages); read-only here

var DEFAULT_SPEED = 2;

function formatTime(isoString) {
  if (!isoString) return '—';
  try {
    var d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return '—';
  }
}

function applySpeed(speed) {
  var val = (typeof speed === 'number') ? speed : DEFAULT_SPEED;
  document.getElementById('popup-speed-slider').value = String(val);
  document.getElementById('popup-speed-value').textContent = parseFloat(val).toFixed(1) + 's';
}

function applyRunning(running) {
  document.getElementById('popup-toggle').checked = running === true;
}

function applyLoadCount(count) {
  var el = document.getElementById('popup-load-count');
  el.textContent = (count !== undefined && count !== null) ? String(count) : '—';
}

function applyLastRefresh(isoString) {
  document.getElementById('popup-last-refresh').textContent = formatTime(isoString);
}

function loadState() {
  chrome.storage.local.get(
    [KEY_SPEED, KEY_RUNNING, KEY_LOAD_COUNT, KEY_LAST_REFRESH],
    function (data) {
      applySpeed(data[KEY_SPEED]);
      applyRunning(data[KEY_RUNNING]);
      applyLoadCount(data[KEY_LOAD_COUNT]);
      applyLastRefresh(data[KEY_LAST_REFRESH]);
    }
  );
}

document.addEventListener('DOMContentLoaded', function () {
  loadState();

  var toggle     = document.getElementById('popup-toggle');
  var slider     = document.getElementById('popup-speed-slider');
  var speedValue = document.getElementById('popup-speed-value');

  // Toggle: write isRunning to storage; content script sidebar reads via storage change
  toggle.addEventListener('change', function () {
    chrome.storage.local.set({ [KEY_RUNNING]: toggle.checked });
  });

  // Slider: write speed to storage; content script sidebar reads via storage change
  slider.addEventListener('input', function () {
    var val = parseFloat(slider.value);
    speedValue.textContent = val.toFixed(1) + 's';
    chrome.storage.local.set({ [KEY_SPEED]: val });
  });

  // React to storage changes made by content scripts (status fields) or the other
  // direction (sidebar changes speed while popup is open)
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== 'local') return;

    if (changes[KEY_SPEED] !== undefined) {
      applySpeed(changes[KEY_SPEED].newValue);
    }
    if (changes[KEY_RUNNING] !== undefined) {
      applyRunning(changes[KEY_RUNNING].newValue);
    }
    if (changes[KEY_LOAD_COUNT] !== undefined) {
      applyLoadCount(changes[KEY_LOAD_COUNT].newValue);
    }
    if (changes[KEY_LAST_REFRESH] !== undefined) {
      applyLastRefresh(changes[KEY_LAST_REFRESH].newValue);
    }
  });
});
