// Popup — Step 3 wiring.
// WIRED: Night Mode, Tab Alert, Hide Similar Matches, Sound (volume + sound select + preview).
// NOT WIRED YET: Price Surge, Hide Promoted, Reset.
// Popup runs in its own isolated context: never clicks page elements, never
// parses loads, never triggers refresh. State shared via chrome.storage.local.

var KEY_NIGHT_MODE   = 'nightMode';          // STORAGE_KEYS.NIGHT_MODE
var KEY_TAB_ALERT    = 'tabAlert';           // STORAGE_KEYS.TAB_ALERT
var KEY_HIDE_SIMILAR = 'hideSimilarMatches'; // STORAGE_KEYS.HIDE_SIMILAR
var KEY_VOLUME       = 'soundVolume';        // STORAGE_KEYS.VOLUME   (0–100, default 70)
var KEY_SOUND_ID     = 'soundId';            // STORAGE_KEYS.SOUND_ID (string, default 'default')

// ── Sound preview (popup context — mirrors soundAlert.js getSoundTones exactly) ──

var popupAudioCtx = null;

function getPopupAudioCtx() {
  if (!popupAudioCtx) popupAudioCtx = new AudioContext();
  return popupAudioCtx;
}

// Keep in sync with SOUND_DEFS in content/soundAlert.js.
// Tone descriptor: { freq, freqEnd?, start, end, type }
var POPUP_SOUND_DEFS = {
  'default': function (t) {
    return [
      { freq: 880,  start: t,        end: t + 0.12, type: 'sine' },
      { freq: 1100, start: t + 0.12, end: t + 0.24, type: 'sine' }
    ];
  },
  'soft': function (t) {
    return [{ freq: 660, start: t, end: t + 0.30, type: 'sine' }];
  },
  'sharp': function (t) {
    return [
      { freq: 1200, start: t,        end: t + 0.08, type: 'square' },
      { freq: 1500, start: t + 0.08, end: t + 0.16, type: 'square' }
    ];
  },
  'bell': function (t) {
    return [{ freq: 523, start: t, end: t + 0.60, type: 'sine' }];
  },
  'deep': function (t) {
    return [{ freq: 110, start: t, end: t + 0.70, type: 'sine' }];
  },
  'high': function (t) {
    return [{ freq: 1760, start: t, end: t + 0.04, type: 'sine' }];
  },
  'click': function (t) {
    return [{ freq: 1800, start: t, end: t + 0.02, type: 'sine' }];
  },
  'ding': function (t) {
    return [{ freq: 1568, start: t, end: t + 0.35, type: 'sine' }];
  },
  'sonar': function (t) {
    return [{ freq: 800, start: t, end: t + 0.50, type: 'sine' }];
  },
  'low': function (t) {
    return [{ freq: 180, start: t, end: t + 0.25, type: 'sawtooth' }];
  },
  'blip': function (t) {
    return [{ freq: 440, start: t, end: t + 0.065, type: 'square' }];
  },
  'wood': function (t) {
    return [{ freq: 900, start: t, end: t + 0.075, type: 'triangle' }];
  },
  'double': function (t) {
    return [
      { freq: 880, start: t,        end: t + 0.09, type: 'sine' },
      { freq: 880, start: t + 0.19, end: t + 0.28, type: 'sine' }
    ];
  },
  'notify': function (t) {
    return [
      { freq: 784,  start: t,        end: t + 0.15, type: 'sine' },
      { freq: 1047, start: t + 0.15, end: t + 0.30, type: 'sine' }
    ];
  },
  'drop': function (t) {
    return [
      { freq: 880, start: t,        end: t + 0.10, type: 'sine' },
      { freq: 440, start: t + 0.10, end: t + 0.20, type: 'sine' }
    ];
  },
  'triple': function (t) {
    return [
      { freq: 523, start: t,        end: t + 0.075, type: 'sine' },
      { freq: 659, start: t + 0.08, end: t + 0.155, type: 'sine' },
      { freq: 784, start: t + 0.16, end: t + 0.235, type: 'sine' }
    ];
  },
  'alarm': function (t) {
    return [
      { freq: 900, start: t,        end: t + 0.12, type: 'square' },
      { freq: 700, start: t + 0.12, end: t + 0.24, type: 'square' },
      { freq: 900, start: t + 0.24, end: t + 0.36, type: 'square' },
      { freq: 700, start: t + 0.36, end: t + 0.48, type: 'square' }
    ];
  },
  'fanfare': function (t) {
    return [
      { freq: 523,  start: t,        end: t + 0.09, type: 'sine' },
      { freq: 659,  start: t + 0.09, end: t + 0.18, type: 'sine' },
      { freq: 784,  start: t + 0.18, end: t + 0.27, type: 'sine' },
      { freq: 1047, start: t + 0.27, end: t + 0.40, type: 'sine' }
    ];
  },
  'sparkle': function (t) {
    return [
      { freq: 1047, start: t,        end: t + 0.045, type: 'sine' },
      { freq: 1319, start: t + 0.05, end: t + 0.095, type: 'sine' },
      { freq: 1568, start: t + 0.10, end: t + 0.145, type: 'sine' },
      { freq: 1760, start: t + 0.15, end: t + 0.195, type: 'sine' },
      { freq: 2093, start: t + 0.20, end: t + 0.245, type: 'sine' }
    ];
  },
  'sweep_up': function (t) {
    return [{ freq: 300, freqEnd: 1400, start: t, end: t + 0.38, type: 'sine' }];
  },
  'sweep_down': function (t) {
    return [{ freq: 1400, freqEnd: 280, start: t, end: t + 0.35, type: 'sine' }];
  },
  'chord': function (t) {
    return [
      { freq: 523, start: t, end: t + 0.20, type: 'sine' },
      { freq: 659, start: t, end: t + 0.20, type: 'sine' },
      { freq: 784, start: t, end: t + 0.20, type: 'sine' }
    ];
  },
  'dial': function (t) {
    return [
      { freq: 440, start: t, end: t + 0.40, type: 'sine' },
      { freq: 480, start: t, end: t + 0.40, type: 'sine' }
    ];
  },
  'burst': function (t) {
    return [
      { freq: 1047, start: t,        end: t + 0.04, type: 'sine' },
      { freq: 1047, start: t + 0.07, end: t + 0.11, type: 'sine' },
      { freq: 1047, start: t + 0.14, end: t + 0.18, type: 'sine' },
      { freq: 1047, start: t + 0.21, end: t + 0.25, type: 'sine' },
      { freq: 1047, start: t + 0.28, end: t + 0.32, type: 'sine' }
    ];
  },
  'error': function (t) {
    return [
      { freq: 300, start: t,        end: t + 0.20, type: 'square' },
      { freq: 220, start: t + 0.20, end: t + 0.40, type: 'square' }
    ];
  }
};

function popupGetSoundTones(soundId, startTime) {
  var fn = POPUP_SOUND_DEFS[soundId] || POPUP_SOUND_DEFS['default'];
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
  var nightToggle   = document.getElementById('popup-night-mode');
  var tabToggle     = document.getElementById('popup-tab-alert');
  var similarToggle = document.getElementById('popup-hide-similar');
  var volumeSlider  = document.getElementById('popup-volume');
  var soundSelect   = document.getElementById('popup-sound-select');
  var replayBtn     = document.getElementById('popup-sound-replay');

  // ── Read all settings from storage and initialise the UI ──────────────────
  chrome.storage.local.get(
    [KEY_NIGHT_MODE, KEY_TAB_ALERT, KEY_HIDE_SIMILAR, KEY_VOLUME, KEY_SOUND_ID],
    function (data) {
      if (nightToggle)   nightToggle.checked  = data[KEY_NIGHT_MODE] === true;
      if (tabToggle)     tabToggle.checked    = data[KEY_TAB_ALERT] === true;
      if (similarToggle) similarToggle.checked = data[KEY_HIDE_SIMILAR] === true;
      if (volumeSlider)  volumeSlider.value   = (data[KEY_VOLUME] !== undefined) ? data[KEY_VOLUME] : 70;
      if (soundSelect)   soundSelect.value    = data[KEY_SOUND_ID] || 'default';
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

  // ── Live sync: storage → UI (handles changes from other extension pages) ──
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== 'local') return;
    if (changes[KEY_NIGHT_MODE]   !== undefined && nightToggle)   nightToggle.checked   = changes[KEY_NIGHT_MODE].newValue === true;
    if (changes[KEY_TAB_ALERT]    !== undefined && tabToggle)     tabToggle.checked     = changes[KEY_TAB_ALERT].newValue === true;
    if (changes[KEY_HIDE_SIMILAR] !== undefined && similarToggle) similarToggle.checked = changes[KEY_HIDE_SIMILAR].newValue === true;
    if (changes[KEY_VOLUME]       !== undefined && volumeSlider)  volumeSlider.value    = changes[KEY_VOLUME].newValue;
    if (changes[KEY_SOUND_ID]     !== undefined && soundSelect)   soundSelect.value     = changes[KEY_SOUND_ID].newValue;
  });
});
