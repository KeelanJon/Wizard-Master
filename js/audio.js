let audioCtx = null;
let masterGain = null;
let _volume = 0.8;
let _muted = false;

export function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = _muted ? 0 : _volume;
      masterGain.connect(audioCtx.destination);
    }
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

export function setVolume(v) {
  _volume = Math.max(0, Math.min(1, v));
  if (masterGain) masterGain.gain.value = _muted ? 0 : _volume;
}

export function setMuted(m) {
  _muted = !!m;
  if (masterGain) masterGain.gain.value = _muted ? 0 : _volume;
}

export function getVolume() { return _volume; }
export function getMuted()  { return _muted; }

function beep(freq, dur, type = "square", gain = 0.08) {
  if (!audioCtx || !masterGain) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g);
  g.connect(masterGain);
  o.start();
  o.stop(audioCtx.currentTime + dur + 0.02);
}

export function sfxHit() {
  ensureAudio();
  beep(120, 0.06, "sawtooth", 0.06);
  setTimeout(() => beep(80, 0.05, "square", 0.05), 30);
}

export function sfxKill() {
  ensureAudio();
  beep(180, 0.08, "triangle", 0.07);
  setTimeout(() => beep(100, 0.1, "square", 0.05), 60);
}

export function sfxCast() {
  ensureAudio();
  beep(380, 0.06, "sine", 0.055);
  setTimeout(() => beep(540, 0.09, "sine", 0.045), 45);
}

export function sfxCoin() {
  ensureAudio();
  beep(880, 0.04, "square", 0.07);
  setTimeout(() => beep(1320, 0.05, "square", 0.05), 35);
  setTimeout(() => beep(1760, 0.06, "square", 0.04), 70);
}

export function sfxUpgrade() {
  ensureAudio();
  [523, 659, 784, 1046].forEach((f, i) => {
    setTimeout(() => beep(f, 0.12, "square", 0.06), i * 90);
  });
}

export function sfxUnlock() {
  ensureAudio();
  [200, 300, 400, 500, 650].forEach((f, i) => {
    setTimeout(() => beep(f, 0.15, "triangle", 0.07), i * 100);
  });
}

export function sfxDash() {
  ensureAudio();
  beep(520, 0.04, "sine", 0.06);
  setTimeout(() => beep(340, 0.05, "sawtooth", 0.04), 25);
  setTimeout(() => beep(180, 0.06, "sine", 0.03), 60);
}

export function sfxFireball() {
  ensureAudio();
  // Deep whoosh launch
  beep(90, 0.18, "sawtooth", 0.11);
  setTimeout(() => beep(65, 0.22, "sawtooth", 0.09), 90);
  // Crackling ignition
  setTimeout(() => beep(220, 0.10, "triangle", 0.06), 180);
  setTimeout(() => beep(160, 0.14, "sawtooth", 0.07), 260);
}
