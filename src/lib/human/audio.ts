/**
 * Procedurally synthesized archive ambience — ported near-verbatim from
 * legacy/js/archive.js. No audio files: a low ambient hum (oscillator
 * clusters + filtered noise), occasional atmospheric events (click/
 * projector-rattle/distant-slam), and the elevator motor + arrival ding.
 * Lazy-initialized on first user interaction (unlockAudio pattern).
 */

let audioCtx: AudioContext | null = null;
let ambientGain: GainNode | null = null;
let audioReady = false;
let eventsTimer: ReturnType<typeof setTimeout> | null = null;

function getCtx(): AudioContext | null {
  if (!audioCtx) {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctx();
    } catch {
      /* no-op */
    }
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function startAmbient(ctx: AudioContext) {
  if (ambientGain) return;
  ambientGain = ctx.createGain();
  ambientGain.gain.value = 0;
  ambientGain.connect(ctx.destination);

  [42, 84, 168].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.value = 0.014 / (i + 1);
    osc.connect(g).connect(ambientGain!);
    osc.start();
  });

  const nLen = ctx.sampleRate * 4;
  const nBuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
  const nd = nBuf.getChannelData(0);
  for (let i = 0; i < nLen; i++) nd[i] = Math.random() * 2 - 1;
  const nSrc = ctx.createBufferSource();
  nSrc.buffer = nBuf;
  nSrc.loop = true;
  const nFlt = ctx.createBiquadFilter();
  nFlt.type = "lowpass";
  nFlt.frequency.value = 200;
  const nG = ctx.createGain();
  nG.gain.value = 0.005;
  nSrc.connect(nFlt).connect(nG).connect(ambientGain);
  nSrc.start();

  ambientGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 4);
}

function scheduleAtmosphericEvents(ctx: AudioContext) {
  const delay = 30000 + Math.random() * 35000;
  eventsTimer = setTimeout(() => {
    if (!audioReady) return;
    const r = Math.random();
    if (r < 0.35) sndClick(0.055);
    else if (r < 0.65) sndProjectorRattle();
    else sndDistantSlam();
    scheduleAtmosphericEvents(ctx);
  }, delay);
}

export function unlockAudio() {
  if (audioReady) return;
  const ctx = getCtx();
  if (!ctx) return;
  audioReady = true;
  startAmbient(ctx);
  scheduleAtmosphericEvents(ctx);
}

export function stopAmbient() {
  audioReady = false;
  if (eventsTimer) clearTimeout(eventsTimer);
}

export function sndClick(vol = 0.18) {
  const ctx = getCtx();
  if (!ctx) return;
  const len = ctx.sampleRate * 0.042;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.007));
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(g).connect(ctx.destination);
  src.start();
}

export function sndProjectorRattle() {
  const ctx = getCtx();
  if (!ctx) return;
  for (let i = 0; i < 6; i++) {
    const len = ctx.sampleRate * 0.018;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * 0.5;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = 0.035 + Math.random() * 0.03;
    src.connect(g).connect(ctx.destination);
    src.start(ctx.currentTime + i * (0.1 + Math.random() * 0.09));
  }
}

export function sndDistantSlam() {
  const ctx = getCtx();
  if (!ctx) return;
  const len = ctx.sampleRate * 0.65;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 260;
  const g = ctx.createGain();
  g.gain.value = 0.055;
  src.connect(f).connect(g).connect(ctx.destination);
  src.start();
}

export function sndElevatorMove() {
  const ctx = getCtx();
  if (!ctx) return;
  const dur = 1.3;
  const osc = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = 50;
  f.type = "lowpass";
  f.frequency.value = 85;
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.058, ctx.currentTime + 0.18);
  g.gain.setValueAtTime(0.058, ctx.currentTime + dur - 0.22);
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
  osc.connect(f).connect(g).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

export function sndDing() {
  const ctx = getCtx();
  if (!ctx) return;
  ([[880, 0.26, 2.2], [2418, 0.085, 0.9]] as const).forEach(([freq, vol, dur]) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  });
}
