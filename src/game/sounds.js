// Web Audio synth — no audio assets needed. All sounds generated.
// AudioContext is created lazily on first user gesture (browser autoplay policy).

let ctx = null;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = 'square', vol = 0.15) {
  const c = ensureCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  gain.gain.setValueAtTime(0, c.currentTime + start);
  gain.gain.linearRampToValueAtTime(vol, c.currentTime + start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.05);
}

// Correct: rising arpeggio, pitch shifts up with streak (the hook!)
export function playCorrect(streak) {
  const base = 440 * Math.pow(1.06, Math.min(streak, 20)); // semitone-ish rise per streak
  tone(base, 0, 0.12, 'square', 0.12);
  tone(base * 1.25, 0.08, 0.12, 'square', 0.12);
  tone(base * 1.5, 0.16, 0.2, 'square', 0.12);
}

export function playWrong() {
  tone(160, 0, 0.25, 'sawtooth', 0.15);
  tone(110, 0.12, 0.35, 'sawtooth', 0.15);
}

export function playMilestone() {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((f, i) => tone(f, i * 0.09, 0.18, 'triangle', 0.14));
}

export function playGameOver() {
  const notes = [392, 330, 262, 196];
  notes.forEach((f, i) => tone(f, i * 0.22, 0.3, 'triangle', 0.14));
}

export function playTap() {
  tone(800, 0, 0.05, 'square', 0.06);
}

export function playCashCount() {
  tone(1200, 0, 0.04, 'square', 0.05);
}

// Low thump — the heartbeat that accelerates as the timer runs out
export function playHeartbeat() {
  const c = ensureCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(60, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(38, c.currentTime + 0.1);
  gain.gain.setValueAtTime(0.28, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.13);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.15);
}

// Time's up — descending three-tone
export function playTimeout() {
  tone(400, 0, 0.15, 'square', 0.12);
  tone(300, 0.15, 0.2, 'square', 0.12);
  tone(200, 0.3, 0.3, 'square', 0.12);
}

// Quizbert's mocking laugh — heh heh heh HA!
export function playRoast() {
  const notes = [392, 392, 330, 330, 262, 262, 196];
  const durs = [0.09, 0.09, 0.09, 0.09, 0.09, 0.09, 0.3];
  notes.forEach((f, i) => tone(f, i * 0.11, durs[i], 'square', 0.09));
}

// Whoosh — question transition
export function playWhoosh() {
  const c = ensureCtx();
  if (!c) return;
  const dur = 0.25;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(900, c.currentTime + dur);
  gain.gain.setValueAtTime(0.001, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.08, c.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + dur + 0.05);
}

// Rank-up fanfare — triumphant rising arpeggio with held "ta-da!" chord
export function playRankUp() {
  const c = ensureCtx();
  if (!c) return;
  const melody = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093];
  melody.forEach((f, i) => tone(f, i * 0.1, 0.22, 'square', 0.11));
  const bass = [130.81, 196, 261.63, 392];
  bass.forEach((f, i) => tone(f, i * 0.2, 0.45, 'triangle', 0.09));
  // Held final chord — the "ta-da!"
  [1046.5, 1318.5, 1568].forEach((f) => tone(f, 0.7, 0.9, 'triangle', 0.12));
}

// ---------- Saloon background music ----------
// Original honky-tonk ragtime loop in C — fully synthesized, no samples,
// no licensing, no copyright issues. Stride bass + jaunty right hand.

let saloonTimer = null;
let saloonBar = 0;
let saloonNextTime = 0;

const SALOON_BPM = 132;
const SALOON_BEAT = 60 / SALOON_BPM;

// 8-bar loop: C C G7 G7 C C G7 C
const SALOON_CHORDS = [
  { root: 48, tri: [60, 64, 67] },
  { root: 48, tri: [60, 64, 67] },
  { root: 43, tri: [55, 59, 62] },
  { root: 43, tri: [55, 59, 62] },
  { root: 48, tri: [60, 64, 67] },
  { root: 48, tri: [60, 64, 67] },
  { root: 43, tri: [55, 59, 62] },
  { root: 48, tri: [60, 64, 67] },
];

// Right-hand melody, eighth-note grid (0 = rest)
const SALOON_MELODY = [
  [67, 0, 72, 0, 76, 72, 74, 0],
  [67, 0, 72, 0, 76, 0, 72, 0],
  [71, 0, 74, 0, 77, 74, 72, 0],
  [71, 0, 74, 0, 77, 0, 74, 71],
  [67, 72, 76, 72, 79, 76, 74, 72],
  [74, 0, 72, 0, 67, 0, 64, 0],
  [71, 0, 74, 0, 71, 74, 77, 74],
  [72, 76, 79, 76, 72, 67, 64, 60],
];

function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

// Honky-tonk piano-ish note: triangle + slightly detuned square, quick decay
function pianoNote(midi, start, dur, vol) {
  const c = ensureCtx();
  if (!c) return;
  const notes = Array.isArray(midi) ? midi : [midi];
  notes.forEach((m) => {
    if (!m) return;
    const f = midiToFreq(m);
    const t = c.currentTime + start;
    const osc1 = c.createOscillator();
    const osc2 = c.createOscillator();
    const gain = c.createGain();
    osc1.type = 'triangle';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(f, t);
    osc2.frequency.setValueAtTime(f * 1.006, t); // detune = honky-tonk wobble
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(c.destination);
    osc1.start(t); osc1.stop(t + dur + 0.05);
    osc2.start(t); osc2.stop(t + dur + 0.05);
  });
}

function scheduleSaloonBar(barIndex, when) {
  const chord = SALOON_CHORDS[barIndex % SALOON_CHORDS.length];
  const melody = SALOON_MELODY[barIndex % SALOON_MELODY.length];
  const beat = SALOON_BEAT;
  // Stride bass: root, chord, fifth, chord
  pianoNote(chord.root, when, beat * 0.9, 0.13);
  pianoNote(chord.tri, when + beat, beat * 0.8, 0.08);
  pianoNote(chord.root + 7, when + beat * 2, beat * 0.9, 0.13);
  pianoNote(chord.tri, when + beat * 3, beat * 0.8, 0.08);
  // Jaunty right hand, eighth notes
  melody.forEach((m, i) => {
    if (m) pianoNote(m, when + (i * beat) / 2, beat * 0.45, 0.1);
  });
}

export function startSaloonMusic() {
  const c = ensureCtx();
  if (!c || saloonTimer) return;
  saloonBar = 0;
  saloonNextTime = c.currentTime + 0.05;
  saloonTimer = setInterval(() => {
    const c2 = ensureCtx();
    if (!c2) return;
    while (saloonNextTime < c2.currentTime + 0.35) {
      scheduleSaloonBar(saloonBar, saloonNextTime - c2.currentTime);
      saloonNextTime += 4 * SALOON_BEAT;
      saloonBar += 1;
    }
  }, 100);
}

export function stopSaloonMusic() {
  if (saloonTimer) {
    clearInterval(saloonTimer);
    saloonTimer = null;
  }
}

// Call once from a user gesture to unlock audio
export function unlockAudio() {
  ensureCtx();
}

export function vibrate(pattern) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch { /* noop */ }
  }
}
