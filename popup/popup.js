// Popup — Step 3 wiring.
// WIRED: Night Mode, Tab Alert, Hide Similar Matches, Sound (volume + sound select + preview),
//        Hide Promoted, Hide Starting Soon, Hide Trailer Ready, Price Surge, Reset.
// Popup runs in its own isolated context: never clicks page elements, never
// parses loads, never triggers refresh. State shared via chrome.storage.local.
// utils/constants.js, utils/logger.js, utils/storage.js loaded before this file
// (see popup.html) — STORAGE_KEYS and logger are available as globals.

var KEY_NIGHT_MODE         = 'nightMode';          // STORAGE_KEYS.NIGHT_MODE
var KEY_TAB_ALERT          = 'tabAlert';           // STORAGE_KEYS.TAB_ALERT
var KEY_AUTO_OPEN          = 'autoOpenTopNew';     // STORAGE_KEYS.AUTO_OPEN (true-default)
var KEY_HIDE_SIMILAR       = 'hideSimilarMatches'; // STORAGE_KEYS.HIDE_SIMILAR
var KEY_VOLUME             = 'soundVolume';        // STORAGE_KEYS.VOLUME   (0–100, default 70)
var KEY_SOUND_ID           = 'soundId';            // STORAGE_KEYS.SOUND_ID (string, default 'default')
var KEY_HIDE_PROMOTED      = 'hidePromoted';       // STORAGE_KEYS.HIDE_PROMOTED
var KEY_HIDE_STARTING_SOON = 'hideStartingSoon';   // STORAGE_KEYS.HIDE_STARTING_SOON
var KEY_HIDE_TRAILER_READY = 'hideTrailerReady';   // STORAGE_KEYS.HIDE_TRAILER_READY
var KEY_HIDE_PAST_BOOK     = 'hidePastBook';       // STORAGE_KEYS.HIDE_PAST_BOOK  (boolean, default false)
var KEY_SURGE_ENABLED      = 'surgeEnabled';       // STORAGE_KEYS.SURGE_ENABLED  (boolean, default false)
var KEY_SURGE_THRESHOLD    = 'surgeThreshold';     // STORAGE_KEYS.SURGE_THRESHOLD (number, default 50)

// ── Sound preview (popup context — uses shared global SOUND_DEFS from utils/soundDefs.js) ──

var popupAudioCtx = null;

function getPopupAudioCtx() {
  if (!popupAudioCtx) popupAudioCtx = new AudioContext();
  return popupAudioCtx;
}

function popupGetSoundTones(soundId, startTime) {
  var fn = SOUND_DEFS[soundId] || SOUND_DEFS['default'];
  return fn(startTime);
}

async function previewSound(soundId, volume) {
  if (volume === 0) return;
  try {
    var ctx = getPopupAudioCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    var now      = ctx.currentTime;
    var gainPeak = volume / 100;
    var tones    = popupGetSoundTones(soundId, now);

    tones.forEach(function (tone) {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = tone.type;
      if (tone.freqEnd !== undefined) {
        osc.frequency.setValueAtTime(tone.freq, tone.start);
        osc.frequency.linearRampToValueAtTime(tone.freqEnd, tone.end);
      } else {
        osc.frequency.value = tone.freq;
      }

      gain.gain.setValueAtTime(0.0001, tone.start);
      gain.gain.exponentialRampToValueAtTime(gainPeak, tone.start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, tone.end);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(tone.start);
      osc.stop(tone.end);
    });
  } catch (e) {
    console.error('[popup] previewSound failed', e);
  }
}

// ── DOMContentLoaded ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  logger.log('popup', 'DOMContentLoaded');

  var nightToggle        = document.getElementById('popup-night-mode');
  var tabToggle          = document.getElementById('popup-tab-alert');
  var autoOpenToggle     = document.getElementById('popup-auto-open');
  var similarToggle      = document.getElementById('popup-hide-similar');
  var volumeSlider       = document.getElementById('popup-volume');
  var soundSelect        = document.getElementById('popup-sound-select');
  var replayBtn          = document.getElementById('popup-sound-replay');
  var promotedToggle     = document.getElementById('popup-hide-promoted');
  var startingSoonToggle = document.getElementById('popup-hide-starting-soon');
  var trailerReadyToggle = document.getElementById('popup-hide-trailer-ready');
  var pastBookToggle     = document.getElementById('popup-hide-past-book');
  var surgeToggle        = document.getElementById('popup-surge');
  var surgeThreshold     = document.getElementById('popup-surge-threshold');
  var resetBtn           = document.getElementById('popup-reset');

  // ── Read all settings from storage and initialise the UI ──────────────────
  chrome.storage.local.get(
    [
      KEY_NIGHT_MODE, KEY_TAB_ALERT, KEY_AUTO_OPEN, KEY_HIDE_SIMILAR,
      KEY_VOLUME, KEY_SOUND_ID,
      KEY_HIDE_PROMOTED, KEY_HIDE_STARTING_SOON, KEY_HIDE_TRAILER_READY, KEY_HIDE_PAST_BOOK,
      KEY_SURGE_ENABLED, KEY_SURGE_THRESHOLD
    ],
    function (data) {
      if (nightToggle)        nightToggle.checked        = data[KEY_NIGHT_MODE] === true;
      document.documentElement.classList.toggle('ext-night', data[KEY_NIGHT_MODE] === true);
      if (tabToggle)          tabToggle.checked          = data[KEY_TAB_ALERT] === true;
      if (autoOpenToggle)     autoOpenToggle.checked     = data[KEY_AUTO_OPEN] !== false; // true-default
      if (similarToggle)      similarToggle.checked      = data[KEY_HIDE_SIMILAR] === true;
      if (volumeSlider)       volumeSlider.value         = (data[KEY_VOLUME] !== undefined) ? data[KEY_VOLUME] : 70;
      if (soundSelect)        soundSelect.value          = data[KEY_SOUND_ID] || 'default';
      if (promotedToggle)     promotedToggle.checked     = data[KEY_HIDE_PROMOTED] === true;
      if (startingSoonToggle) startingSoonToggle.checked = data[KEY_HIDE_STARTING_SOON] === true;
      if (trailerReadyToggle) trailerReadyToggle.checked = data[KEY_HIDE_TRAILER_READY] === true;
      if (pastBookToggle)     pastBookToggle.checked     = data[KEY_HIDE_PAST_BOOK]     === true;
      if (surgeToggle)        surgeToggle.checked        = data[KEY_SURGE_ENABLED]      === true;
      if (surgeThreshold) {
        var storedThreshold = data[KEY_SURGE_THRESHOLD];
        surgeThreshold.value = (storedThreshold !== undefined) ? storedThreshold : 50;
        logger.log('popup', 'surgeThreshold loaded', { value: surgeThreshold.value });
      }
    }
  );

  // ── Write handlers ────────────────────────────────────────────────────────

  if (nightToggle) {
    nightToggle.addEventListener('change', function () {
      chrome.storage.local.set({ [KEY_NIGHT_MODE]: nightToggle.checked });
    });
  }

  if (tabToggle) {
    tabToggle.addEventListener('change', function () {
      chrome.storage.local.set({ [KEY_TAB_ALERT]: tabToggle.checked });
    });
  }

  if (autoOpenToggle) {
    autoOpenToggle.addEventListener('change', function () {
      chrome.storage.local.set({ [KEY_AUTO_OPEN]: autoOpenToggle.checked });
    });
  }

  if (similarToggle) {
    similarToggle.addEventListener('change', function () {
      chrome.storage.local.set({ [KEY_HIDE_SIMILAR]: similarToggle.checked });
    });
  }

  // Volume: write on 'change' (thumb released), not on every 'input' tick.
  if (volumeSlider) {
    volumeSlider.addEventListener('change', function () {
      chrome.storage.local.set({ [KEY_VOLUME]: Number(volumeSlider.value) });
    });
  }

  // Sound select: persist + immediately preview the chosen sound.
  if (soundSelect) {
    soundSelect.addEventListener('change', function () {
      var soundId = soundSelect.value;
      var vol     = volumeSlider ? Number(volumeSlider.value) : 70;
      chrome.storage.local.set({ [KEY_SOUND_ID]: soundId });
      previewSound(soundId, vol);
    });
  }

  // Replay button: preview current selection at current volume.
  if (replayBtn) {
    replayBtn.addEventListener('click', function () {
      var soundId = soundSelect ? soundSelect.value : 'default';
      var vol     = volumeSlider ? Number(volumeSlider.value) : 70;
      previewSound(soundId, vol);
    });
  }

  if (promotedToggle) {
    promotedToggle.addEventListener('change', function () {
      chrome.storage.local.set({ [KEY_HIDE_PROMOTED]: promotedToggle.checked });
    });
  }

  if (startingSoonToggle) {
    startingSoonToggle.addEventListener('change', function () {
      chrome.storage.local.set({ [KEY_HIDE_STARTING_SOON]: startingSoonToggle.checked });
    });
  }

  if (trailerReadyToggle) {
    trailerReadyToggle.addEventListener('change', function () {
      chrome.storage.local.set({ [KEY_HIDE_TRAILER_READY]: trailerReadyToggle.checked });
    });
  }

  if (pastBookToggle) {
    pastBookToggle.addEventListener('change', function () {
      chrome.storage.local.set({ [KEY_HIDE_PAST_BOOK]: pastBookToggle.checked });
    });
  }

  if (surgeToggle) {
    surgeToggle.addEventListener('change', function () {
      logger.log('popup', 'surgeEnabled saved', { value: surgeToggle.checked });
      chrome.storage.local.set({ [KEY_SURGE_ENABLED]: surgeToggle.checked });
    });
  }

  if (surgeThreshold) {
    function saveSurgeThreshold() {
      var n = Number(surgeThreshold.value);
      if (isNaN(n) || n <= 0) return;
      logger.log('popup', 'surgeThreshold saved', { value: n });
      chrome.storage.local.set({ [KEY_SURGE_THRESHOLD]: n });
    }
    surgeThreshold.addEventListener('input',  saveSurgeThreshold);
    surgeThreshold.addEventListener('change', saveSurgeThreshold);
  }

  // ── Reset to defaults ─────────────────────────────────────────────────────
  // Clears every extension-managed key from chrome.storage.local, then resets
  // the popup UI controls to their documented defaults. No confirm dialog.
  // tabState (sessionStorage, per-tab) is intentionally NOT touched — it is
  // session state, separate from persisted settings.

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      logger.log('popup', 'popup-reset clicked');
      var keys = Object.values(STORAGE_KEYS);
      chrome.storage.local.remove(keys, function () {
        logger.log('popup', 'extension storage cleared', { keys: keys });
        if (nightToggle)        nightToggle.checked        = false;
        if (tabToggle)          tabToggle.checked          = false;
        if (autoOpenToggle)     autoOpenToggle.checked     = true; // true-default
        if (similarToggle)      similarToggle.checked      = false;
        if (volumeSlider)       volumeSlider.value         = 70;
        if (soundSelect)        soundSelect.value          = 'default';
        if (promotedToggle)     promotedToggle.checked     = false;
        if (startingSoonToggle) startingSoonToggle.checked = false;
        if (trailerReadyToggle) trailerReadyToggle.checked = false;
        if (pastBookToggle)     pastBookToggle.checked     = false;
        if (surgeToggle)        surgeToggle.checked        = false;
        if (surgeThreshold)     surgeThreshold.value       = 50;
      });
    });
  }

  // ── Live sync: storage → UI (handles changes from other extension pages) ──
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== 'local') return;
    if (changes[KEY_NIGHT_MODE] !== undefined) {
      var nightOn = changes[KEY_NIGHT_MODE].newValue === true;
      document.documentElement.classList.toggle('ext-night', nightOn);
      if (nightToggle) nightToggle.checked = nightOn;
    }
    if (changes[KEY_TAB_ALERT]          !== undefined && tabToggle)          tabToggle.checked          = changes[KEY_TAB_ALERT].newValue === true;
    if (changes[KEY_AUTO_OPEN]          !== undefined && autoOpenToggle)     autoOpenToggle.checked     = changes[KEY_AUTO_OPEN].newValue !== false;
    if (changes[KEY_HIDE_SIMILAR]       !== undefined && similarToggle)      similarToggle.checked      = changes[KEY_HIDE_SIMILAR].newValue === true;
    if (changes[KEY_VOLUME]   !== undefined && volumeSlider)  volumeSlider.value = (changes[KEY_VOLUME].newValue   !== undefined) ? changes[KEY_VOLUME].newValue   : 70;
    if (changes[KEY_SOUND_ID] !== undefined && soundSelect)  soundSelect.value  = (changes[KEY_SOUND_ID].newValue !== undefined) ? changes[KEY_SOUND_ID].newValue : 'default';
    if (changes[KEY_HIDE_PROMOTED]      !== undefined && promotedToggle)     promotedToggle.checked     = changes[KEY_HIDE_PROMOTED].newValue === true;
    if (changes[KEY_HIDE_STARTING_SOON] !== undefined && startingSoonToggle) startingSoonToggle.checked = changes[KEY_HIDE_STARTING_SOON].newValue === true;
    if (changes[KEY_HIDE_TRAILER_READY] !== undefined && trailerReadyToggle) trailerReadyToggle.checked = changes[KEY_HIDE_TRAILER_READY].newValue === true;
    if (changes[KEY_HIDE_PAST_BOOK]     !== undefined && pastBookToggle)     pastBookToggle.checked     = changes[KEY_HIDE_PAST_BOOK].newValue     === true;
    if (changes[KEY_SURGE_ENABLED]      !== undefined && surgeToggle)        surgeToggle.checked        = changes[KEY_SURGE_ENABLED].newValue      === true;
    if (changes[KEY_SURGE_THRESHOLD] !== undefined && surgeThreshold) surgeThreshold.value = (changes[KEY_SURGE_THRESHOLD].newValue !== undefined) ? changes[KEY_SURGE_THRESHOLD].newValue : 50;
  });
});
