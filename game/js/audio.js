// audio.js — WebAudio-only sound: soft footsteps, a rising alert sting,
// a click when a case opens, and small win / caught phrases. No audio files.

let ctx = null;
let master = null;

export function ensureAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  } catch {
    return false;
  }
}

function tone(freq, dur, type, vol, slideTo) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, filterFreq) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t0);
}

// A soft carpeted footstep; alternate pitch so the walk has a rhythm.
export function playFootstep(crouching, stepIndex) {
  if (crouching) noiseBurst(0.07, 0.05, 500);
  else noiseBurst(0.09, 0.13, stepIndex % 2 === 0 ? 700 : 560);
}

// Rising sting as the detection meter fills and the alarm trips.
export function playAlertSting() {
  tone(220, 0.55, 'sawtooth', 0.16, 660);
  tone(330, 0.55, 'triangle', 0.12, 990);
}

// A small mechanical click when a case opens.
export function playCaseClick() {
  tone(1400, 0.06, 'square', 0.1);
  setTimeout(() => tone(900, 0.09, 'square', 0.1), 70);
}

// A soft chime when a star chart is lifted.
export function playPickup() {
  tone(880, 0.18, 'sine', 0.14);
  setTimeout(() => tone(1318, 0.28, 'sine', 0.12), 90);
}

// Short phrase for the win screen.
export function playWin() {
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.35, 'triangle', 0.14), i * 130));
}

// Low phrase for being caught.
export function playCaught() {
  [392, 311, 233].forEach((f, i) => setTimeout(() => tone(f, 0.4, 'sawtooth', 0.1), i * 160));
}
