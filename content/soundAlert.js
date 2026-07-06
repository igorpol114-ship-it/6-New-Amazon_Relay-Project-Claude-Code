// NO clicks on page elements, NO booking, NO Layout B.
// Web Audio API only — no external audio files.

var audioCtx = null;

function getAudioContext() {
  logger.log('soundAlert', 'getAudioContext');
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

// Pure function — returns tone descriptors for a given soundId.
// startTime is ctx.currentTime. SOUND_DEFS global from utils/soundDefs.js.
function getSoundTones(soundId, startTime) {
  logger.log('soundAlert', 'getSoundTones', { soundId: soundId });
  var fn = SOUND_DEFS[soundId] || SOUND_DEFS['default'];
  return fn(startTime);
}

async function playSoundConfig(soundId, gainPeak) {
  logger.log('soundAlert', 'playSoundConfig', { soundId: soundId, gainPeak: gainPeak });
  try {
    var ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    var now = ctx.currentTime;
    var tones = getSoundTones(soundId, now);

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
    logger.error('soundAlert', 'playSoundConfig failed', { error: e });
  }
}

async function playAlert() {
  logger.log('soundAlert', 'playAlert');
  try {
    var volume  = await storage.get(STORAGE_KEYS.VOLUME,   70);
    var soundId = await storage.get(STORAGE_KEYS.SOUND_ID, 'default');
    if (volume === 0) return;
    await playSoundConfig(soundId, volume / 100);
  } catch (e) {
    logger.error('soundAlert', 'playAlert failed', { error: e });
  }
}

window.__EXT_DEBUG = window.__EXT_DEBUG || {};
window.__EXT_DEBUG.playAlert = playAlert;
