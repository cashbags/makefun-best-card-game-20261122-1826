// audio.js — tiny synthesized sound effects for Ember Court.
//
// No audio files ship with the game: every sound is a short WebAudio
// oscillator blip built at run time. The audio context is only created
// after a real user gesture (a click or a key press), because browsers
// refuse to start audio before one.

let audioCtx = null;

/** Create (or reuse) the shared AudioContext after a user gesture. */
export function unlockAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return;
  }
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return;
  audioCtx = new Ctor();
}

/** Play one short tone: frequency in Hz, length in seconds, wave shape. */
function blip(freq, seconds, type, volume, when = 0) {
  if (!audioCtx) return;
  const start = audioCtx.currentTime + when;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

/** Named game sounds. Unknown names stay silent. */
export function playSound(name) {
  if (!audioCtx) return;
  if (name === 'play') {
    blip(660, 0.09, 'triangle', 0.12);
    blip(880, 0.12, 'triangle', 0.1, 0.07);
  } else if (name === 'hit') {
    blip(160, 0.16, 'sawtooth', 0.14);
    blip(110, 0.2, 'square', 0.08, 0.05);
  } else if (name === 'heal') {
    blip(520, 0.14, 'sine', 0.12);
    blip(780, 0.18, 'sine', 0.09, 0.09);
  } else if (name === 'poison') {
    blip(220, 0.12, 'sawtooth', 0.07);
    blip(185, 0.16, 'sawtooth', 0.07, 0.08);
  } else if (name === 'armor') {
    blip(330, 0.1, 'square', 0.08);
    blip(440, 0.14, 'square', 0.06, 0.06);
  } else if (name === 'turn') {
    blip(440, 0.08, 'triangle', 0.09);
  } else if (name === 'win') {
    blip(523, 0.14, 'triangle', 0.12);
    blip(659, 0.14, 'triangle', 0.12, 0.12);
    blip(784, 0.22, 'triangle', 0.12, 0.24);
  } else if (name === 'lose') {
    blip(392, 0.16, 'triangle', 0.11);
    blip(311, 0.16, 'triangle', 0.11, 0.14);
    blip(233, 0.28, 'triangle', 0.11, 0.28);
  }
}
