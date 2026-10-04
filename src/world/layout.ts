/**
 * Building geometry: where every room, bay, print and record sits.
 *
 * Pure math, no three.js — imported by the station registry (camera poses,
 * rails) on the server and by the 3D zones in the browser, so a camera
 * station and the object it looks at can never drift apart.
 *
 * Coordinates are metres. The Seam is x = 0; the Day Wing runs west (−x),
 * the Night Tower east (+x). The front facade is z = 0, the building runs
 * back to −z. Tower floor k sits at y = k × FLOOR_H.
 */
import type { WorldContent, WorldItem, WorldProject } from "./content";

export type Vec3 = [number, number, number];
export type Pose = { pos: Vec3; target: Vec3; fov?: number; near?: number };

export const FLOOR_H = 4;
export const EYE = 1.62;

// ── Seam ────────────────────────────────────────────────────────────────
export const SEAM = {
  lobby: { x0: -4, x1: 2, z0: -12, z1: 0 },
  shaft: { x0: -1.2, x1: 1.2, z0: -9, z1: -5 },
  oculusY: 30.4,
};
export const levelY = (level: number) => level * FLOOR_H;

/** Where the camera stands inside the elevator car at a given level. */
export function carPose(level: number): Pose {
  const y = levelY(level) + EYE;
  return { pos: [-0.3, y, -7], target: [4, y - 0.05, -7], fov: 58 };
}

// ── Night Tower ─────────────────────────────────────────────────────────
export const TOWER = { x0: 2, x1: 16, z0: -12, z1: 0 };

export function towerLevels(content: WorldContent) {
  const floors = Math.max(6, ...content.categories.map((c) => c.floor));
  return { floors, roof: floors + 1 };
}

// ── Day Wing ────────────────────────────────────────────────────────────
export const DAY = { z0: -14, z1: 0, height: 7, x1: -4 };
export const STRIP_Z = -7.2;
export const BAY_BACK_Z = -13.85;
export const BAY_MOUTH_Z = -9.4;
export const BAY_WIDTH = { small: 4.6, standard: 6, large: 8 } as const;
export const FRONT_DESK = { x0: -11, x1: -5 };
export const TYPE_CASE = { x: -24.2, z: -2.0 };
export const PLAN_ROOM = { x0: -31, x1: -18.5, z0: -6.2, z1: 0, floor: 3.6, height: 3.2 };
export const PLAN_TABLE = { cx: -24.75, cz: -3.3, w: 4.4, d: 2.4, top: 3.6 + 0.86 };
export const RECORDS = { x0: -42, x1: -34.5, z0: -5.6, z1: 0 };

export type BayPlacement = { project: WorldProject; cx: number; width: number; index: number };

export type DayWingPlan = {
  yearX: (year: number) => number;
  bays: BayPlacement[];
  groups: { name: string; x0: number; x1: number; label: string }[];
  schoolDeskX: number;
  hallMinX: number;
  years: number[];
  signals: { text: string; x: number }[];
};

export function planDayWing(content: WorldContent): DayWingPlan {
  const now = content.nowYear;
  const yearX = (year: number) => -12 - (now - year) * 7;
  const sorted = [...content.projects].sort((a, b) => (b.yearEnd ?? 0) - (a.yearEnd ?? 0));
  const bays: BayPlacement[] = [];
  let edge = FRONT_DESK.x0 - 1.4;
  sorted.forEach((project, index) => {
    const width = BAY_WIDTH[project.bay] ?? BAY_WIDTH.standard;
    const year = project.yearEnd ?? project.yearStart ?? now - 1;
    const desired = yearX(year) + 2 - width / 2;
    const cx = Math.min(desired, edge - width / 2);
    edge = cx - width / 2 - 0.8;
    bays.push({ project, cx, width, index });
  });

  const groups: DayWingPlan["groups"] = [];
  for (const b of bays) {
    const name = b.project.employer ?? b.project.title;
    const last = groups[groups.length - 1];
    const x0 = b.cx - b.width / 2;
    const x1 = b.cx + b.width / 2;
    const label = b.project.yearStart
      ? b.project.yearEnd && b.project.yearEnd !== b.project.yearStart
        ? `${b.project.yearStart} — ${b.project.yearEnd === now ? "now" : b.project.yearEnd}`
        : `${b.project.yearStart}`
      : "";
    if (last && last.name === name) last.x0 = Math.min(last.x0, x0);
    else groups.push({ name, x0, x1, label });
  }

  const eduYear = Number((content.cv.education[0]?.date ?? "").match(/\d{4}/)?.[0]) || now - 6;
  const lastEdge = bays.length ? bays[bays.length - 1].cx - bays[bays.length - 1].width / 2 : -14;
  const schoolDeskX = Math.min(yearX(eduYear), lastEdge - 3.5, RECORDS.x0 - 4);
  const hallMinX = schoolDeskX - 5;

  const years: number[] = [];
  for (let y = eduYear; y <= now; y++) years.push(y);

  const signals = content.cv.signals.map((text, i) => ({
    text,
    x: -15 - i * ((Math.abs(hallMinX) - 18) / Math.max(1, content.cv.signals.length)),
  }));

  return { yearX, bays, groups, schoolDeskX, hallMinX, years, signals };
}

export function bayPose(b: BayPlacement): Pose {
  return { pos: [b.cx, EYE, -5.6], target: [b.cx, 1.55, BAY_BACK_Z] };
}
export function bayApproachPose(b: BayPlacement): Pose {
  return { pos: [b.cx + 1.2, EYE + 0.15, -2.2], target: [b.cx, 1.2, BAY_MOUTH_Z] };
}

/** Pinboard grid for a bay's media, on the back panel's left two thirds. */
export function pinboard(b: BayPlacement) {
  const media = b.project.media;
  const x0 = b.cx - b.width / 2 + 0.5;
  const usable = b.width * 0.62;
  const cols = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(media.length * 1.6))));
  const cell = usable / cols;
  return media.map((m, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const h = Math.min(cell * 0.78, 0.7) * (0.85 + 0.15 * m.weight);
    const w = Math.min(cell * 0.86, h * (m.img.width / m.img.height));
    return {
      media: m,
      pos: [x0 + cell * (col + 0.5), 2.05 - row * (h + 0.22), BAY_BACK_Z + 0.04] as Vec3,
      w,
      h: w / (m.img.width / m.img.height),
    };
  });
}

// ── Plan Room (thinking path) ───────────────────────────────────────────
export function nodeOnTable(x: number, y: number): Vec3 {
  return [
    PLAN_TABLE.cx + (x / 100 - 0.5) * (PLAN_TABLE.w - 0.4),
    PLAN_TABLE.top,
    PLAN_TABLE.cz + (y / 100 - 0.5) * (PLAN_TABLE.d - 0.3),
  ];
}

/** "Step in": the camera stands on the table among the nodes. */
export function nodeWalkPose(x: number, y: number, fromX?: number, fromY?: number): Pose {
  const p = nodeOnTable(x, y);
  let dx = p[0] - PLAN_TABLE.cx;
  let dz = p[2] - PLAN_TABLE.cz;
  if (fromX !== undefined && fromY !== undefined) {
    const f = nodeOnTable(fromX, fromY);
    dx = f[0] - p[0];
    dz = f[2] - p[2];
  }
  const len = Math.hypot(dx, dz) || 1;
  const d = 0.82;
  return {
    pos: [p[0] + (dx / len) * d, p[1] + 0.07, p[2] + (dz / len) * d],
    target: [p[0], p[1] + 0.05, p[2]],
    fov: 62,
    near: 0.004,
  };
}

// ── Tower rooms ─────────────────────────────────────────────────────────
export type Hung = { item: WorldItem; index: number; pos: Vec3; rotY: number; w: number; h: number; tilt: number; roll: number };

export function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}

const isNew = (item: WorldItem, now: number) =>
  item.createdAt ? now - Date.parse(item.createdAt) < 30 * 86400000 : false;

/** Salon hang along the gallery's walls; overflow goes to freestanding
 * "Roll" partitions in the middle of the room, 24 prints per roll. */
export function hangGallery(items: WorldItem[], level: number, now = Date.now()): Hung[] {
  const base = levelY(level);
  type Seg = { a: [number, number]; b: [number, number]; rotY: number; roll: number };
  const walls: Seg[] = [
    { a: [4.2, -11.9], b: [15.6, -11.9], rotY: 0, roll: 1 },
    { a: [15.9, -11.4], b: [15.9, -1.2], rotY: -Math.PI / 2, roll: 1 },
    { a: [14.6, -0.1], b: [6.0, -0.1], rotY: Math.PI, roll: 1 },
  ];
  const out: Hung[] = [];
  let seg = 0;
  let cursor = 0.35;
  let overflow = 0;
  items.forEach((item, index) => {
    const aspect = item.img ? item.img.width / item.img.height : 1.33;
    const hh = 0.52 * Math.sqrt(item.weight);
    let w = Math.min(1.25, hh * aspect);
    let h = w / aspect;
    if (h > 0.95) {
      h = 0.95;
      w = h * aspect;
    }
    const segLen = (s: Seg) => Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
    while (seg < walls.length && cursor + w + 0.35 > segLen(walls[seg])) {
      seg += 1;
      cursor = 0.35;
    }
    if (seg >= walls.length || index >= 24) {
      // Freestanding partitions in the room's middle, 14 prints each (7 a
      // face); every 24 prints past the first roll is labelled a new roll.
      const p = overflow++;
      const q = Math.floor(p / 14);
      const face = Math.floor(p / 7) % 2;
      const slot = p % 7;
      const pw = Math.min(w, 0.78);
      out.push({
        item,
        index,
        pos: [7.4 + slot * 1.08, base + 1.5, -4.2 - q * 2.6 + (face ? -0.06 : 0.06)],
        rotY: face ? Math.PI : 0,
        w: pw,
        h: pw / aspect,
        tilt: 0,
        roll: 2 + Math.floor(p / 24),
      });
      return;
    }
    const s = walls[seg];
    const len = segLen(s);
    const t = (cursor + w / 2) / len;
    const x = s.a[0] + (s.b[0] - s.a[0]) * t;
    const z = s.a[1] + (s.b[1] - s.a[1]) * t;
    const r = seeded(item.id);
    out.push({
      item,
      index,
      pos: [x, base + 1.52 + (r - 0.5) * 0.24, z],
      rotY: s.rotY,
      w,
      h,
      tilt: (seeded(item.id + "t") - 0.5) * 0.03 + (isNew(item, now) ? 0.035 : 0),
      roll: 1,
    });
    cursor += w + 0.32 + r * 0.12;
  });
  return out;
}

export function facingPose(pos: Vec3, rotY: number, dist = 1.9, eye = EYE, baseY = 0): Pose {
  const nx = Math.sin(rotY);
  const nz = Math.cos(rotY);
  return {
    pos: [pos[0] + nx * dist, baseY + eye, pos[2] + nz * dist],
    target: [pos[0], pos[1], pos[2]],
  };
}

/** Posters along the stair: the stair climbs the back wall west → east. */
export const STAIR = { x0: 4.4, x1: 14.2, rise: 1.9 };
export const stairHeight = (x: number) =>
  Math.max(0, Math.min(STAIR.rise, ((x - STAIR.x0) / (STAIR.x1 - STAIR.x0)) * STAIR.rise));

export function hangPosters(items: WorldItem[], level: number) {
  const base = levelY(level);
  const n = Math.max(items.length, 1);
  return items.map((item, index) => {
    const x = STAIR.x0 + 0.9 + ((STAIR.x1 - STAIR.x0 - 1.4) * (index + 0.5)) / n;
    const aspect = item.img ? item.img.width / item.img.height : 0.7;
    const h = 1.15;
    const w = Math.min(1.3, h * aspect);
    return {
      item,
      index,
      pos: [x, base + stairHeight(x) + 1.75, -11.86] as Vec3,
      w,
      h: w / aspect,
      stepY: base + stairHeight(x),
    };
  });
}

export const PATTERN_SURFACES = ["back", "east", "front", "ceiling"] as const;

/** The kitchen: prints taped to the fridge door and the tiles above the counter. */
export function tapeKitchen(items: WorldItem[], level: number) {
  const base = levelY(level);
  return items.map((item, index) => {
    const onFridge = index < 2;
    const r = seeded(item.id);
    const aspect = item.img ? item.img.width / item.img.height : 1.33;
    const w = 0.42;
    if (onFridge) {
      return {
        item,
        index,
        pos: [14.3 + (index ? 0.0 : 0), base + 1.55 - index * 0.5, -9.96] as Vec3,
        rotY: 0,
        w,
        h: w / aspect,
        tilt: (r - 0.5) * 0.12,
      };
    }
    const k = index - 2;
    const col = k % 6;
    const row = Math.floor(k / 6);
    return {
      item,
      index,
      pos: [5.6 + col * 1.15, base + 1.72 - row * 0.55 + (r - 0.5) * 0.08, -11.9] as Vec3,
      rotY: 0,
      w,
      h: w / aspect,
      tilt: (r - 0.5) * 0.1,
    };
  });
}

export function towerRoomPose(level: number): Pose {
  const b = levelY(level);
  return { pos: [4.6, b + EYE, -2.4], target: [11, b + 1.4, -8.5] };
}
