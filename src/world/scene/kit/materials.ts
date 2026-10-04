"use client";

import * as THREE from "three";

/**
 * The shared material library (design doc §28). Created once per visit and
 * reused by every room, so adding a room adds geometry, not materials or
 * shader variants. Textures are small procedural canvases: the character of
 * the building comes from light and linework, not from big image maps.
 */

const texCache = new Map<string, THREE.Texture>();

function canvasTex(key: string, size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, repeat = 1) {
  const hit = texCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

const rnd = (() => {
  let s = 1234567;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
})();

function speckle(g: CanvasRenderingContext2D, s: number, base: string, spread: number, n: number) {
  g.fillStyle = base;
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < n; i++) {
    const v = (rnd() - 0.5) * spread;
    g.fillStyle = v > 0 ? `rgba(255,250,240,${v})` : `rgba(20,16,8,${-v})`;
    g.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2, 1 + rnd() * 2);
  }
}

export const textures = {
  plaster: () => canvasTex("plaster", 256, (g, s) => speckle(g, s, "#efe8da", 0.08, 2600)),
  grid: () =>
    canvasTex("grid", 256, (g, s) => {
      // the 40px hover grid of today's Matrix side, as floor tiles
      speckle(g, s, "#ece4d4", 0.06, 1800);
      g.strokeStyle = "rgba(44,36,22,0.16)";
      g.lineWidth = 2;
      g.strokeRect(1, 1, s - 2, s - 2);
    }),
  oak: () =>
    canvasTex("oak", 256, (g, s) => {
      g.fillStyle = "#b28d61";
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 70; i++) {
        g.strokeStyle = `rgba(80,52,26,${0.05 + rnd() * 0.12})`;
        g.lineWidth = 1 + rnd() * 2;
        g.beginPath();
        const y = rnd() * s;
        g.moveTo(0, y);
        g.bezierCurveTo(s * 0.3, y + (rnd() - 0.5) * 18, s * 0.7, y + (rnd() - 0.5) * 18, s, y);
        g.stroke();
      }
    }),
  planks: () =>
    canvasTex("planks", 256, (g, s) => {
      g.fillStyle = "#3d2b1d";
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 8; i++) {
        g.fillStyle = `rgba(${70 + rnd() * 20},${48 + rnd() * 14},${30 + rnd() * 10},0.6)`;
        g.fillRect(0, (i * s) / 8 + 1, s, s / 8 - 2);
      }
      for (let i = 0; i < 160; i++) {
        g.fillStyle = `rgba(10,6,2,${rnd() * 0.25})`;
        g.fillRect(rnd() * s, rnd() * s, 8 + rnd() * 30, 1);
      }
    }),
  brick: () =>
    canvasTex("brick", 256, (g, s) => {
      g.fillStyle = "#2a1d14";
      g.fillRect(0, 0, s, s);
      const rows = 8;
      const h = s / rows;
      for (let r = 0; r < rows; r++) {
        const off = r % 2 ? h * 1.1 : 0;
        for (let x = -off; x < s; x += h * 2.2) {
          const k = 0.75 + rnd() * 0.35;
          g.fillStyle = `rgb(${Math.round(78 * k)},${Math.round(48 * k)},${Math.round(34 * k)})`;
          g.fillRect(x + 2, r * h + 2, h * 2.2 - 4, h - 4);
        }
      }
    }),
  concrete: () => canvasTex("concrete", 256, (g, s) => speckle(g, s, "#8e8b85", 0.14, 5000)),
  felt: () => canvasTex("felt", 128, (g, s) => speckle(g, s, "#2c2924", 0.1, 1500)),
  terrazzo: () =>
    canvasTex("terrazzo", 256, (g, s) => {
      speckle(g, s, "#e4dccb", 0.05, 800);
      for (let i = 0; i < 120; i++) {
        g.fillStyle = ["#c4b49a", "#a99579", "#d6cbb6", "#8e7d64"][i % 4];
        g.beginPath();
        g.arc(rnd() * s, rnd() * s, 1 + rnd() * 3, 0, Math.PI * 2);
        g.fill();
      }
    }),
  nightCity: () =>
    canvasTex("night-city", 512, (g, s) => {
      const grd = g.createLinearGradient(0, 0, 0, s);
      grd.addColorStop(0, "#07080c");
      grd.addColorStop(0.6, "#151219");
      grd.addColorStop(1, "#2a1d14");
      g.fillStyle = grd;
      g.fillRect(0, 0, s, s);
      let x = 0;
      while (x < s) {
        const w = 18 + rnd() * 50;
        const h = s * (0.12 + rnd() * 0.4);
        g.fillStyle = "#08070a";
        g.fillRect(x, s - h, w, h);
        for (let wy = s - h + 6; wy < s - 4; wy += 9) {
          for (let wx = x + 4; wx < x + w - 4; wx += 8) {
            if (rnd() < 0.12) {
              g.fillStyle = rnd() < 0.8 ? "rgba(242,210,150,0.85)" : "rgba(220,226,232,0.6)";
              g.fillRect(wx, wy, 3, 4);
            }
          }
        }
        if (rnd() < 0.18) {
          // a dome or minaret on the skyline
          g.beginPath();
          g.arc(x + w / 2, s - h, w / 2.4, Math.PI, 0);
          g.fill();
        }
        x += w + rnd() * 6;
      }
    }),
};

let lib: ReturnType<typeof build> | null = null;

function build() {
  const std = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, ...extra });
  return {
    plaster: std("#f1eadc", { map: textures.plaster() }),
    plasterDusk: std("#ddd2bf", { map: textures.plaster() }),
    plasterNight: std("#3a2e23", { map: textures.plaster() }),
    plasterDark: std("#1d1712"),
    gridFloor: std("#ffffff", { map: textures.grid() }),
    terrazzo: std("#ffffff", { map: textures.terrazzo() }),
    oak: std("#ffffff", { map: textures.oak(), roughness: 0.75 }),
    walnut: std("#5a3f2a", { roughness: 0.7 }),
    planks: std("#ffffff", { map: textures.planks(), roughness: 0.85 }),
    linen: std("#ece3d0"),
    paper: std("#f6f1e6"),
    board: std("#a39d92"),
    ink: std("#18140e"),
    brass: std("#b48f55", { metalness: 0.6, roughness: 0.38 }),
    brassDark: std("#7a6038", { metalness: 0.55, roughness: 0.5 }),
    glass: new THREE.MeshStandardMaterial({ color: "#dfe7e4", transparent: true, opacity: 0.16, roughness: 0.08, depthWrite: false }),
    felt: std("#ffffff", { map: textures.felt() }),
    rug: std("#5a3a28"),
    brick: std("#ffffff", { map: textures.brick() }),
    concrete: std("#ffffff", { map: textures.concrete() }),
    vinyl: std("#0d0c0c", { roughness: 0.32, metalness: 0.15 }),
    tape: std("#e8dcbb", { roughness: 1 }),
    steel: std("#4a4d50", { metalness: 0.5, roughness: 0.5 }),
    cork: std("#a27d55"),
    lampGlow: new THREE.MeshBasicMaterial({ color: "#ffe2b0", toneMapped: false }),
    lampCold: new THREE.MeshBasicMaterial({ color: "#eef3f6", toneMapped: false }),
    safelight: new THREE.MeshBasicMaterial({ color: "#a8341c", toneMapped: false }),
    accent: new THREE.MeshBasicMaterial({ color: "#c4622d", toneMapped: false }),
    leak: new THREE.MeshBasicMaterial({ color: "#f2c98a", toneMapped: false, transparent: true, opacity: 0.85 }),
    skylight: new THREE.MeshBasicMaterial({ color: "#fbf8f1", toneMapped: false }),
    nightWindow: new THREE.MeshBasicMaterial({ map: textures.nightCity(), toneMapped: false }),
    dayWindow: new THREE.MeshBasicMaterial({ color: "#f3ede0", toneMapped: false }),
  };
}

export type Mats = ReturnType<typeof build>;

export function mats(): Mats {
  if (!lib) lib = build();
  return lib;
}

export const INK = "#18140e";
export const TAN = "#c4b49a";
export const ACCENT = "#c4622d";
export const CREAM = "#f2ece0";

export const MOOD_COLORS: Record<string, string> = {
  arabic: "#c4a06a",
  quiet: "#8baab8",
  english: "#c4b49a",
  dancing: "#c4622d",
  jazz: "#7a8fc4",
  turkish: "#c4806a",
};

export const MOOD_ROOMS: Record<string, { room: string; desc: string }> = {
  arabic: { room: "The Sharqi Room", desc: "When the oud speaks, the heart answers." },
  quiet: { room: "After Midnight", desc: "The hour when rooms remember themselves." },
  english: { room: "The Archive", desc: "Songs kept in a box under the bed." },
  dancing: { room: "Moving Alone", desc: "When the body knows before the mind does." },
  jazz: { room: "The Blue Hour", desc: "Smoke and brass and something unfinished." },
  turkish: { room: "The Bosphorus", desc: "Melodies that cross water and don't come back." },
};
