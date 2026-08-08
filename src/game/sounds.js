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

// Call once from a user gesture to unlock audio
export function unlockAudio() {
  ensureCtx();
}

export function vibrate(pattern) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch { /* noop */ }
  }
}
