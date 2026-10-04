"use client";

/**
 * One audio graph for the whole visit (design doc §19). Replaces the old
 * archive ambience module, the separate tonearm context and the standalone
 * <audio> element. Everything is procedural except the music itself.
 *
 *   beds (per region) ─┐
 *   events (placed) ───┼─► master ─► destination
 *   music ─► panner ─► muffle ─┤
 *          └──── headphones ───┘
 *   music ─► analyser (drives dust and the record's sheen)
 *
 * Sound stays silent until the visitor's first click or key press.
 */
import type { Region } from "../stations";
import type { Vec3 } from "../layout";

type Bed = { gain: GainNode; stop: () => void };

class Engine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  beds = new Map<Region, Bed>();
  region: Region | null = null;
  audio: HTMLAudioElement | null = null;
  musicGain: GainNode | null = null;
  panner: PannerNode | null = null;
  muffle: BiquadFilterNode | null = null;
  direct: GainNode | null = null;
  spatial: GainNode | null = null;
  analyser: AnalyserNode | null = null;
  private freq: Uint8Array<ArrayBuffer> | null = null;
  private eventsTimer: ReturnType<typeof setTimeout> | null = null;
  private muted = false;
  private noise: AudioBuffer | null = null;
  musicPos: Vec3 = [11, 5, -9];

  /** Create the context on the first gesture. Safe to call repeatedly. */
  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new Ctx();
      } catch {
        return;
      }
      const ctx = this.ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(ctx.destination);
      const len = ctx.sampleRate * 3;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      if (this.region) this.setRegion(this.region, true);
      this.scheduleEvents();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  get ready() {
    return !!this.ctx;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.15);
  }

  // ── Beds ────────────────────────────────────────────────────────────
  private makeBed(region: Region): Bed | null {
    const ctx = this.ctx!;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(this.master!);
    const nodes: AudioScheduledSourceNode[] = [];
    const osc = (freq: number, vol: number, type: OscillatorType = "sine") => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g).connect(out);
      o.start();
      nodes.push(o);
    };
    const noise = (type: BiquadFilterType, freq: number, vol: number, q = 0.7) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ctx.createGain();
      g.gain.value = vol;
      src.connect(f).connect(g).connect(out);
      src.start();
      nodes.push(src);
    };
    switch (region) {
      case "exterior":
        noise("lowpass", 380, 0.012); // wind, far traffic
        noise("bandpass", 140, 0.006, 0.4);
        break;
      case "seam":
        osc(60, 0.008);
        osc(120, 0.004);
        noise("lowpass", 220, 0.004);
        break;
      case "day":
        noise("lowpass", 900, 0.0045); // room tone
        noise("highpass", 4200, 0.0012);
        break;
      case "plan":
        noise("lowpass", 500, 0.003);
        break;
      case "night":
      case "deep":
        // the archive hum: 42 / 84 / 168 Hz + filtered noise (from today's site)
        [42, 84, 168].forEach((f, i) => osc(f, 0.014 / (i + 1)));
        noise("lowpass", 200, 0.005);
        break;
      case "cold":
        noise("bandpass", 700, 0.006, 0.3); // wind through plastic sheeting
        osc(120, 0.0025, "sawtooth");
        break;
      case "roof":
        noise("lowpass", 320, 0.01);
        break;
    }
    return {
      gain: out,
      stop: () => {
        nodes.forEach((n) => {
          try {
            n.stop();
          } catch {
            /* already stopped */
          }
        });
        out.disconnect();
      },
    };
  }

  /** Crossfade the ambient bed to a region over ~1.5s. */
  setRegion(region: Region, force = false) {
    if (this.region === region && !force) return;
    this.region = region;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const [r, bed] of this.beds) {
      if (r !== region) {
        bed.gain.gain.setTargetAtTime(0, t, 0.5);
        const b = bed;
        setTimeout(() => {
          if (this.region !== r) {
            b.stop();
            this.beds.delete(r);
          }
        }, 3000);
      }
    }
    let bed = this.beds.get(region);
    if (!bed) {
      const made = this.makeBed(region);
      if (!made) return;
      bed = made;
      this.beds.set(region, bed);
    }
    bed.gain.gain.setTargetAtTime(1, t, 0.5);
  }

  // ── Placed events (tower) ───────────────────────────────────────────
  private scheduleEvents() {
    const delay = 30000 + Math.random() * 35000;
    this.eventsTimer = setTimeout(() => {
      if (this.region === "night" || this.region === "deep") {
        const r = Math.random();
        if (r < 0.35) this.click(0.05);
        else if (r < 0.65) this.rattle();
        else this.slam();
      }
      this.scheduleEvents();
    }, delay);
  }

  private burst(len: number, decay: number, vol: number, filter?: number, when = 0) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const n = Math.floor(ctx.sampleRate * len);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * decay));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = vol;
    let node: AudioNode = src;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = filter;
      node.connect(f);
      node = f;
    }
    node.connect(g).connect(this.master);
    src.start(ctx.currentTime + when);
  }

  /** A soft material click: paper, brass, wood or vinyl. */
  click(vol = 0.12, material: "paper" | "brass" | "wood" | "vinyl" = "wood") {
    const filter = { paper: 5200, brass: 9000, wood: 2600, vinyl: 1800 }[material];
    this.burst(0.042, 0.007, vol, filter);
  }
  rattle() {
    for (let i = 0; i < 6; i++) this.burst(0.018, 0.02, 0.035 + Math.random() * 0.03, undefined, i * (0.1 + Math.random() * 0.09));
  }
  slam() {
    this.burst(0.65, 0.08, 0.055, 260);
  }

  elevatorMove(dur: number) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.value = 50;
    f.type = "lowpass";
    f.frequency.value = 85;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.058, t + 0.18);
    g.gain.setValueAtTime(0.058, t + Math.max(0.3, dur - 0.22));
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(f).connect(g).connect(this.master);
    o.start();
    o.stop(t + dur + 0.05);
  }

  ding() {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    ([[880, 0.22, 2.2], [2418, 0.07, 0.9]] as const).forEach(([freq, vol, dur]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g).connect(this.master!);
      o.start();
      o.stop(ctx.currentTime + dur);
    });
  }

  tonearm(kind: "on" | "off") {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noise) return;
    const now = ctx.currentTime + 0.01;
    const m = ctx.createGain();
    m.gain.setValueAtTime(0.0001, now);
    m.gain.exponentialRampToValueAtTime(kind === "on" ? 0.06 : 0.045, now + 0.012);
    m.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "on" ? 0.16 : 0.13));
    m.connect(this.master);
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = kind === "on" ? 1850 : 1350;
    src.connect(band).connect(m);
    src.start(now);
    src.stop(now + 0.1);
    const th = ctx.createOscillator();
    const tg = ctx.createGain();
    th.type = "triangle";
    th.frequency.setValueAtTime(kind === "on" ? 170 : 145, now);
    th.frequency.exponentialRampToValueAtTime(kind === "on" ? 92 : 78, now + 0.07);
    tg.gain.setValueAtTime(0.0001, now);
    tg.gain.exponentialRampToValueAtTime(0.02, now + 0.006);
    tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    th.connect(tg).connect(m);
    th.start(now);
    th.stop(now + 0.09);
  }

  // ── Music ───────────────────────────────────────────────────────────
  private ensureMusic() {
    if (this.audio) return this.audio;
    const a = new Audio();
    a.crossOrigin = "anonymous";
    a.preload = "none";
    this.audio = a;
    if (this.ctx && this.master) {
      const ctx = this.ctx;
      const src = ctx.createMediaElementSource(a);
      this.musicGain = ctx.createGain();
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.freq = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
      this.panner = new PannerNode(ctx, {
        panningModel: "HRTF",
        distanceModel: "inverse",
        refDistance: 2.2,
        rolloffFactor: 1.1,
        maxDistance: 60,
      });
      this.muffle = ctx.createBiquadFilter();
      this.muffle.type = "lowpass";
      this.muffle.frequency.value = 20000;
      this.spatial = ctx.createGain();
      this.direct = ctx.createGain();
      this.direct.gain.value = 0;
      src.connect(this.musicGain);
      this.musicGain.connect(this.analyser);
      this.musicGain.connect(this.panner).connect(this.muffle).connect(this.spatial).connect(this.master);
      this.musicGain.connect(this.direct).connect(this.master);
      this.setMusicPosition(this.musicPos);
    }
    return a;
  }

  setMusicPosition(p: Vec3) {
    this.musicPos = p;
    if (!this.panner) return;
    this.panner.positionX.value = p[0];
    this.panner.positionY.value = p[1];
    this.panner.positionZ.value = p[2];
  }

  /** Listener follows the camera; `inRoom` controls the through-the-floor muffle. */
  setListener(pos: Vec3, forward: Vec3, inRoom: boolean) {
    const ctx = this.ctx;
    if (!ctx) return;
    const l = ctx.listener;
    if (l.positionX) {
      l.positionX.value = pos[0];
      l.positionY.value = pos[1];
      l.positionZ.value = pos[2];
      l.forwardX.value = forward[0];
      l.forwardY.value = forward[1];
      l.forwardZ.value = forward[2];
      l.upX.value = 0;
      l.upY.value = 1;
      l.upZ.value = 0;
    }
    if (this.muffle) this.muffle.frequency.setTargetAtTime(inRoom ? 20000 : 700, ctx.currentTime, 0.4);
  }

  setHeadphones(on: boolean) {
    if (!this.ctx || !this.direct || !this.spatial) return;
    const t = this.ctx.currentTime;
    this.direct.gain.setTargetAtTime(on ? 1 : 0, t, 0.2);
    this.spatial.gain.setTargetAtTime(on ? 0 : 1, t, 0.2);
  }

  load(src: string) {
    this.unlock();
    const a = this.ensureMusic();
    if (a.src !== src) {
      a.src = src;
      a.load();
    }
    return a;
  }

  async play(src: string) {
    const a = this.load(src);
    this.tonearm("on");
    try {
      await a.play();
      return true;
    } catch {
      return false;
    }
  }

  pause() {
    if (!this.audio) return;
    this.tonearm("off");
    this.audio.pause();
  }

  get musicElement() {
    return this.audio;
  }

  /** 0–1 loudness of the music right now (for dust and sheen). */
  level() {
    if (!this.analyser || !this.freq || !this.audio || this.audio.paused) return 0;
    this.analyser.getByteFrequencyData(this.freq);
    let sum = 0;
    for (let i = 2; i < 40; i++) sum += this.freq[i];
    return Math.min(1, sum / (38 * 180));
  }
}

export const engine = new Engine();
