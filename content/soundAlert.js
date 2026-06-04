// NO clicks on page elements, NO booking, NO Layout B.
// Web Audio API only — no external audio files. Not wired to refresh/detector yet.

var audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

async function playAlert() {
  var muted = await storage.get(STORAGE_KEYS.SOUND_MUTED, false);
  logger.log('soundAlert', 'playAlert', { muted: muted });

  if (muted) return;

  try {
    var ctx = getAudioContext();

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    var now = ctx.currentTime;

    // Two-tone beep: 880 Hz then 1100 Hz, ~120ms each, modest gain ~0.15
    var tones = [
      { freq: 880,  start: now,        end: now + 0.12 },
      { freq: 1100, start: now + 0.12, end: now + 0.24 }
    ];

    tones.forEach(function (tone) {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = tone.freq;

      // Envelope: quick attack to 0.15, exponential decay to near-silence.
      // Exponential ramp requires non-zero target; 0.0001 is inaudible.
      gain.gain.setValueAtTime(0.0001, tone.start);
      gain.gain.exponentialRampToValueAtTime(0.15, tone.start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, tone.end);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(tone.start);
      osc.stop(tone.end);
    });

  } catch (e) {
    logger.warn('soundAlert', 'playAlert failed', { error: e });
  }
}

// Expose for manual console testing only — NOT called automatically.
window.__EXT_DEBUG = window.__EXT_DEBUG || {};
window.__EXT_DEBUG.playAlert = playAlert;
