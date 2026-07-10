/** Ported from legacy/js/music.js's playTonearmSfx — a separate small
 * Web Audio context from the archive ambience, just for the needle
 * drop/lift sound. */
let sfxCtx: AudioContext | null = null;
let tonearmNoiseBuffer: AudioBuffer | null = null;

function ensureSfxCtx(): AudioContext | null {
  try {
    if (!sfxCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      sfxCtx = new Ctx();
    }
    if (sfxCtx.state === "suspended") sfxCtx.resume().catch(() => {});
    if (!tonearmNoiseBuffer) {
      const len = Math.floor(sfxCtx.sampleRate * 0.18);
      tonearmNoiseBuffer = sfxCtx.createBuffer(1, len, sfxCtx.sampleRate);
      const data = tonearmNoiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t * 0.65);
      }
    }
    return sfxCtx;
  } catch {
    return null;
  }
}

export function playTonearmSfx(kind: "on" | "off") {
  const ctx = ensureSfxCtx();
  if (!ctx || !tonearmNoiseBuffer) return;

  const now = ctx.currentTime + 0.01;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(kind === "on" ? 0.06 : 0.045, now + 0.012);
  master.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "on" ? 0.16 : 0.13));
  master.connect(ctx.destination);

  const noise = ctx.createBufferSource();
  noise.buffer = tonearmNoiseBuffer;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.setValueAtTime(kind === "on" ? 1850 : 1350, now);
  band.Q.setValueAtTime(0.7, now);
  const high = ctx.createBiquadFilter();
  high.type = "highpass";
  high.frequency.setValueAtTime(kind === "on" ? 620 : 420, now);
  noise.connect(band);
  band.connect(high);
  high.connect(master);
  noise.start(now);
  noise.stop(now + (kind === "on" ? 0.11 : 0.09));

  const thunk = ctx.createOscillator();
  const thunkGain = ctx.createGain();
  thunk.type = "triangle";
  thunk.frequency.setValueAtTime(kind === "on" ? 170 : 145, now);
  thunk.frequency.exponentialRampToValueAtTime(kind === "on" ? 92 : 78, now + 0.07);
  thunkGain.gain.setValueAtTime(0.0001, now);
  thunkGain.gain.exponentialRampToValueAtTime(kind === "on" ? 0.022 : 0.016, now + 0.006);
  thunkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  thunk.connect(thunkGain);
  thunkGain.connect(master);
  thunk.start(now);
  thunk.stop(now + 0.09);
}
