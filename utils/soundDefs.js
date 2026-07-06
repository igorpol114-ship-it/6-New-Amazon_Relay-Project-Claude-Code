// Shared sound definitions — global SOUND_DEFS loaded before soundAlert.js and popup.js.
// Canonical source (soundAlert.js version, with numbered comments).
// Tone descriptor: { freq, freqEnd?, start, end, type }
// freqEnd: if set, oscillator frequency ramps linearly from freq to freqEnd.
var SOUND_DEFS = {
  // 01 — Default chime: rising two-sine (original)
  'default': function (t) {
    return [
      { freq: 880,  start: t,        end: t + 0.12, type: 'sine' },
      { freq: 1100, start: t + 0.12, end: t + 0.24, type: 'sine' }
    ];
  },
  // 02 — Soft ping: single mellow mid tone
  'soft': function (t) {
    return [{ freq: 660, start: t, end: t + 0.30, type: 'sine' }];
  },
  // 03 — Sharp beep: two short square tones stepping up
  'sharp': function (t) {
    return [
      { freq: 1200, start: t,        end: t + 0.08, type: 'square' },
      { freq: 1500, start: t + 0.08, end: t + 0.16, type: 'square' }
    ];
  },
  // 04 — Bell: long C5 sine, decay like a struck bell
  'bell': function (t) {
    return [{ freq: 523, start: t, end: t + 0.60, type: 'sine' }];
  },
  // 05 — Deep bong: very low A2, long
  'deep': function (t) {
    return [{ freq: 110, start: t, end: t + 0.70, type: 'sine' }];
  },
  // 06 — High tick: ultra-high A6, very brief
  'high': function (t) {
    return [{ freq: 1760, start: t, end: t + 0.04, type: 'sine' }];
  },
  // 07 — Click: near-instant transient
  'click': function (t) {
    return [{ freq: 1800, start: t, end: t + 0.02, type: 'sine' }];
  },
  // 08 — Bright ding: clear G6 sine
  'ding': function (t) {
    return [{ freq: 1568, start: t, end: t + 0.35, type: 'sine' }];
  },
  // 09 — Sonar ping: medium G5 sine, moderate length
  'sonar': function (t) {
    return [{ freq: 800, start: t, end: t + 0.50, type: 'sine' }];
  },
  // 10 — Low buzz: sub-bass sawtooth, growly
  'low': function (t) {
    return [{ freq: 180, start: t, end: t + 0.25, type: 'sawtooth' }];
  },
  // 11 — Retro blip: A4 square, short
  'blip': function (t) {
    return [{ freq: 440, start: t, end: t + 0.065, type: 'square' }];
  },
  // 12 — Wood block: triangle transient, percussive
  'wood': function (t) {
    return [{ freq: 900, start: t, end: t + 0.075, type: 'triangle' }];
  },
  // 13 — Double ping: same pitch, two taps
  'double': function (t) {
    return [
      { freq: 880, start: t,        end: t + 0.09, type: 'sine' },
      { freq: 880, start: t + 0.19, end: t + 0.28, type: 'sine' }
    ];
  },
  // 14 — Notify: perfect fourth rise G5→C6
  'notify': function (t) {
    return [
      { freq: 784,  start: t,        end: t + 0.15, type: 'sine' },
      { freq: 1047, start: t + 0.15, end: t + 0.30, type: 'sine' }
    ];
  },
  // 15 — Drop: octave fall A5→A4
  'drop': function (t) {
    return [
      { freq: 880, start: t,        end: t + 0.10, type: 'sine' },
      { freq: 440, start: t + 0.10, end: t + 0.20, type: 'sine' }
    ];
  },
  // 16 — Triple blip: C-E-G quick arpeggio
  'triple': function (t) {
    return [
      { freq: 523, start: t,        end: t + 0.075, type: 'sine' },
      { freq: 659, start: t + 0.08, end: t + 0.155, type: 'sine' },
      { freq: 784, start: t + 0.16, end: t + 0.235, type: 'sine' }
    ];
  },
  // 17 — Alarm siren: square wave alternating 900/700 Hz × 2 cycles
  'alarm': function (t) {
    return [
      { freq: 900, start: t,        end: t + 0.12, type: 'square' },
      { freq: 700, start: t + 0.12, end: t + 0.24, type: 'square' },
      { freq: 900, start: t + 0.24, end: t + 0.36, type: 'square' },
      { freq: 700, start: t + 0.36, end: t + 0.48, type: 'square' }
    ];
  },
  // 18 — Fanfare: four-note ascending C5-E5-G5-C6
  'fanfare': function (t) {
    return [
      { freq: 523,  start: t,        end: t + 0.09, type: 'sine' },
      { freq: 659,  start: t + 0.09, end: t + 0.18, type: 'sine' },
      { freq: 784,  start: t + 0.18, end: t + 0.27, type: 'sine' },
      { freq: 1047, start: t + 0.27, end: t + 0.40, type: 'sine' }
    ];
  },
  // 19 — Sparkle: rapid ascending cascade C6→E6→G6→A6→C7
  'sparkle': function (t) {
    return [
      { freq: 1047, start: t,        end: t + 0.045, type: 'sine' },
      { freq: 1319, start: t + 0.05, end: t + 0.095, type: 'sine' },
      { freq: 1568, start: t + 0.10, end: t + 0.145, type: 'sine' },
      { freq: 1760, start: t + 0.15, end: t + 0.195, type: 'sine' },
      { freq: 2093, start: t + 0.20, end: t + 0.245, type: 'sine' }
    ];
  },
  // 20 — Rising sweep: smooth frequency ramp 300→1400 Hz
  'sweep_up': function (t) {
    return [{ freq: 300, freqEnd: 1400, start: t, end: t + 0.38, type: 'sine' }];
  },
  // 21 — Falling sweep: smooth frequency ramp 1400→280 Hz
  'sweep_down': function (t) {
    return [{ freq: 1400, freqEnd: 280, start: t, end: t + 0.35, type: 'sine' }];
  },
  // 22 — Major chord: C5+E5+G5 simultaneous
  'chord': function (t) {
    return [
      { freq: 523, start: t, end: t + 0.20, type: 'sine' },
      { freq: 659, start: t, end: t + 0.20, type: 'sine' },
      { freq: 784, start: t, end: t + 0.20, type: 'sine' }
    ];
  },
  // 23 — Dial tone: classic telephone 440+480 Hz simultaneous
  'dial': function (t) {
    return [
      { freq: 440, start: t, end: t + 0.40, type: 'sine' },
      { freq: 480, start: t, end: t + 0.40, type: 'sine' }
    ];
  },
  // 24 — Pulse burst: 5 rapid C6 sine taps
  'burst': function (t) {
    return [
      { freq: 1047, start: t,        end: t + 0.04, type: 'sine' },
      { freq: 1047, start: t + 0.07, end: t + 0.11, type: 'sine' },
      { freq: 1047, start: t + 0.14, end: t + 0.18, type: 'sine' },
      { freq: 1047, start: t + 0.21, end: t + 0.25, type: 'sine' },
      { freq: 1047, start: t + 0.28, end: t + 0.32, type: 'sine' }
    ];
  },
  // 25 — Error tone: descending square pair
  'error': function (t) {
    return [
      { freq: 300, start: t,        end: t + 0.20, type: 'square' },
      { freq: 220, start: t + 0.20, end: t + 0.40, type: 'square' }
    ];
  }
};
