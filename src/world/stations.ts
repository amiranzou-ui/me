/**
 * The station registry — the single source of truth for every place in the
 * world (design doc §16, §26). Navigation, URLs, the map, quick navigation,
 * the accessibility mirror, zone loading and camera destinations all read
 * from what `buildWorld()` returns. Pure: runs on the server (routes,
 * metadata, sitemap) and in the browser (the world) from the same content.
 */
import type { WorldContent } from "./content";
import {
  EYE,
  FLOOR_H,
  PLAN_ROOM,
  PLAN_TABLE,
  RECORDS,
  TYPE_CASE,
  bayApproachPose,
  bayPose,
  carPose,
  facingPose,
  hangGallery,
  hangPosters,
  levelY,
  nodeWalkPose,
  planDayWing,
  tapeKitchen,
  towerLevels,
  towerRoomPose,
  type Pose,
} from "./layout";

export type Region = "exterior" | "seam" | "day" | "plan" | "night" | "cold" | "roof" | "deep";
export type ZoneId = string;

export type Zone = {
  id: ZoneId;
  label: string;
  region: Region;
  /** Elevator level: 0 = ground (lobby, Day Wing, Archive Hall). */
  level: number;
  /** Ground-level way in/out, used to route walks between zones. */
  door?: Pose;
  neighbors: ZoneId[];
};

export type SheetSpec =
  | { kind: "project"; slug: string }
  | { kind: "image"; set: string; index: number }
  | { kind: "node"; key: string }
  | { kind: "cv" }
  | { kind: "contact" }
  | { kind: "education" }
  | { kind: "skills"; group?: number }
  | { kind: "cooking"; index: number }
  | { kind: "logbook" }
  | { kind: "making-of" }
  | { kind: "about" }
  | { kind: "threshold"; then?: string };

export type Action =
  | { type: "go"; to: string }
  | { type: "open"; sheet: SheetSpec }
  | { type: "link"; href: string; external?: boolean; download?: boolean }
  | { type: "music"; op: "play-track"; index: number }
  | { type: "music"; op: "toggle" | "next" | "prev" }
  | { type: "mood"; mood: string | null }
  | { type: "drawer"; index: number }
  | { type: "pattern"; index: number }
  | { type: "none" };

export type WorldObject = { id: string; label: string; action: Action; hint?: string };

export type MapRect = { x: number; y: number; w: number; h: number };

export type Station = {
  id: string;
  path: string;
  zone: ZoneId;
  label: string;
  /** Short title for the ← back label and the map. */
  short: string;
  description: string;
  parent: string | null;
  pose: Pose;
  rail?: { id: string; label: string; pose: Pose; objectId?: string }[];
  objects: WorldObject[];
  access: "public" | "friends" | "hidden";
  map?: MapRect;
  categorySlug?: string;
  projectSlug?: string;
  nodeKey?: string;
};

export type World = {
  stations: Station[];
  byId: Record<string, Station>;
  byPath: Record<string, Station>;
  zones: Record<ZoneId, Zone>;
  roofLevel: number;
};

const SECTION = {
  wing: { x: 24, w: 416 },
  seam: { x: 456, w: 56 },
  tower: { x: 528, w: 216 },
};

export function floorZone(slug: string) {
  return `floor-${slug}`;
}

export function buildWorld(content: WorldContent): World {
  const day = planDayWing(content);
  const { roof } = towerLevels(content);
  const towerMapY = (level: number) => 24 + (roof - level) * 40;

  // ── Zones ──────────────────────────────────────────────────────────────
  const zones: Record<ZoneId, Zone> = {};
  const addZone = (z: Zone) => (zones[z.id] = z);

  addZone({
    id: "approach",
    label: "The Approach",
    region: "exterior",
    level: 0,
    door: { pos: [0, EYE, 3.5], target: [0, 1.8, -6] },
    neighbors: ["seam"],
  });
  addZone({
    id: "seam",
    label: "The Seam",
    region: "seam",
    level: 0,
    door: { pos: [-0.8, EYE, -1.6], target: [-0.8, 1.7, -8] },
    neighbors: ["approach", "daywing", "hall"],
  });
  addZone({
    id: "daywing",
    label: "Day Wing",
    region: "day",
    level: 0,
    door: { pos: [-6, EYE, -6.6], target: [-20, 1.5, -7] },
    neighbors: ["seam", "planroom"],
  });
  addZone({
    id: "planroom",
    label: "Plan Room",
    region: "plan",
    level: 0,
    door: { pos: [-19.3, PLAN_ROOM.floor + EYE, -5.2], target: [PLAN_TABLE.cx, PLAN_TABLE.top, PLAN_TABLE.cz] },
    neighbors: ["daywing"],
  });
  addZone({
    id: "hall",
    label: "Archive Hall",
    region: "night",
    level: 0,
    door: { pos: [3.4, EYE, -2.6], target: [12, 1.8, -8] },
    neighbors: ["seam"],
  });

  const floors = [...content.categories].sort((a, b) => a.floor - b.floor);
  floors.forEach((c, i) => {
    const prev = i === 0 ? "hall" : floorZone(floors[i - 1].slug);
    const next = i === floors.length - 1 ? "roof" : floorZone(floors[i + 1].slug);
    addZone({
      id: floorZone(c.slug),
      label: `${c.roman} · ${c.label}`,
      region: c.room === "unfinished" ? "cold" : "night",
      level: c.floor,
      neighbors: [prev, next],
    });
  });
  zones.hall.neighbors.push(floors[0] ? floorZone(floors[0].slug) : "roof");
  addZone({
    id: "roof",
    label: "Roof Study",
    region: "roof",
    level: roof,
    neighbors: [floors.length ? floorZone(floors[floors.length - 1].slug) : "hall"],
  });
  addZone({ id: "below", label: "Deep Archive", region: "deep", level: -1, neighbors: ["seam"] });

  // ── Stations ───────────────────────────────────────────────────────────
  const stations: Station[] = [];
  const add = (s: Station) => stations.push(s);
  const cv = content.cv;

  const firstChapter = floors[0];
  add({
    id: "approach",
    path: "/",
    zone: "approach",
    label: "The Approach",
    short: "Outside",
    description:
      "The building seen from the front at dusk. The cream Day Wing on the left is the Matrix side: work. The dark Night Tower on the right is the Human side: life. Between them, a hairline of light: the Seam. At its top, a round window holds a portrait.",
    parent: null,
    pose: { pos: [-3, 9, 60], target: [0, 14.5, -4], fov: 40 },
    rail: [
      { id: "far", label: "The building", pose: { pos: [-3, 9, 60], target: [0, 14.5, -4], fov: 40 } },
      { id: "near", label: "The front door", pose: { pos: [-1, 2.4, 13], target: [-0.5, 3.8, 0], fov: 50 } },
    ],
    objects: [
      { id: "matrix-side", label: "Matrix Side — the Day Wing", hint: cv.matrixSideDesc.join(" "), action: { type: "go", to: "desk" } },
      { id: "human-side", label: "Human Side — the Night Tower", hint: cv.humanSideDesc.join(" "), action: { type: "go", to: "hall" } },
      { id: "front-door", label: "Enter the building", action: { type: "go", to: "lobby" } },
      { id: "oculus", label: "The Oculus — go up to the Roof Study", action: { type: "go", to: "roof" } },
    ],
    access: "public",
  });

  add({
    id: "lobby",
    path: "/lobby",
    zone: "seam",
    label: "The Threshold Lobby",
    short: "Lobby",
    description:
      "Floor 00, at the foot of the Seam. To the left, an archway into the daylit Day Wing. To the right, the heavy door of the Night Tower: Memory Archive. Ahead, the elevator in its glass shaft and the building directory.",
    parent: "approach",
    pose: { pos: [1.3, EYE, -0.7], target: [-2.2, 1.85, -7.4], fov: 62 },
    objects: [
      { id: "archway", label: "Archway — Day Wing (Matrix)", action: { type: "go", to: "desk" } },
      { id: "tower-door", label: "Tower door — Memory Archive (Human)", action: { type: "go", to: "hall" } },
      ...floors.map((c) => ({
        id: `dir-${c.slug}`,
        label: `Directory: Chapter ${c.roman} — ${c.label}`,
        action: { type: "go", to: `chapter-${c.slug}` } as Action,
      })),
      { id: "dir-roof", label: "Directory: Roof Study", action: { type: "go", to: "roof" } },
      { id: "elevator", label: "Elevator", hint: "The needle rests at 00.", action: { type: "none" } },
      { id: "front-door-out", label: "Step outside", action: { type: "go", to: "approach" } },
    ],
    access: "public",
    map: { x: SECTION.seam.x, y: towerMapY(0), w: SECTION.seam.w, h: 36 },
  });

  // Day Wing ────────────────────────────────────────────────────────────
  const firstBay = day.bays[0];
  add({
    id: "desk",
    path: "/desk",
    zone: "daywing",
    label: "Front Desk",
    short: "Front Desk",
    description: `The first room of the Day Wing. Behind the reception desk, the poster: ${cv.name}, ${cv.tag}. "${cv.bio.split(".")[0]}." Brass labels point to the Workshop, the Records Room and the Plan Room.`,
    parent: "lobby",
    pose: { pos: [-7.7, EYE, -4.0], target: [-8, 2.6, -13.9], fov: 54 },
    objects: [
      { id: "to-work", label: "Workshop →", action: { type: "go", to: "work" } },
      { id: "to-records", label: "Records →", action: { type: "go", to: "records" } },
      { id: "to-thinking", label: "Plan Room ↑", action: { type: "go", to: "thinking" } },
      { id: "to-skills", label: "Type Case", action: { type: "go", to: "skills" } },
      ...cv.links.map((l) => ({
        id: `link-${l.icon}`,
        label: `${l.label} ↗`,
        action: { type: "link", href: l.url, external: true } as Action,
      })),
      { id: "card-catalogue", label: "Card catalogue — every project", action: { type: "open", sheet: { kind: "about" } } as Action },
    ],
    access: "public",
    map: { x: 336, y: towerMapY(0), w: 96, h: 36 },
  });

  add({
    id: "work",
    path: "/work",
    zone: "daywing",
    label: "The Workshop",
    short: "Workshop",
    description: `The main hall of the Day Wing. A brass time strip runs along the floor from ${day.years[0]} in the far west to now at the Seam. Workbench bays line the back wall, one per project, grouped under the employer they belong to.`,
    parent: "desk",
    pose: { pos: [-10.6, 2.25, -6.4], target: [-30, 1.2, -9.6], fov: 55 },
    rail: day.bays.map((b) => ({
      id: b.project.slug,
      label: b.project.title,
      pose: bayApproachPose(b),
      objectId: `bay-${b.project.slug}`,
    })),
    objects: [
      ...day.bays.map((b) => ({
        id: `bay-${b.project.slug}`,
        label: `Bay ${String(b.index + 1).padStart(2, "0")} — ${b.project.title}`,
        hint: b.project.role,
        action: { type: "go", to: `project-${b.project.slug}` } as Action,
      })),
      { id: "to-skills", label: "Type Case — skills", action: { type: "go", to: "skills" } },
      { id: "to-records", label: "Records Room — CV", action: { type: "go", to: "records" } },
      { id: "to-thinking", label: "Stair up to the Plan Room", action: { type: "go", to: "thinking" } },
      { id: "to-origin", label: "School Desk — where the strip begins", action: { type: "go", to: "origin" } },
    ],
    access: "public",
    map: { x: 156, y: towerMapY(0), w: 172, h: 36 },
  });

  day.bays.forEach((b, i) => {
    const p = b.project;
    const prev = day.bays[i - 1];
    const next = day.bays[i + 1];
    add({
      id: `project-${p.slug}`,
      path: `/work/${p.slug}`,
      zone: "daywing",
      label: p.title,
      short: p.title,
      description: `Bay ${String(i + 1).padStart(2, "0")}. ${p.title} — ${p.role}${p.employer ? `, ${p.employer}` : ""}${p.yearStart ? ` (${p.yearStart}${p.yearEnd && p.yearEnd !== p.yearStart ? `–${p.yearEnd}` : ""})` : ""}. ${p.description} ${p.impact}`,
      parent: "work",
      pose: bayPose(b),
      objects: [
        { id: "case", label: "Full case — read the project", action: { type: "open", sheet: { kind: "project", slug: p.slug } } },
        ...p.media.map((m, mi) => ({
          id: `media-${m.id}`,
          label: `Pinned visual ${mi + 1}${m.caption ? ` — ${m.caption}` : ""}`,
          action: { type: "open", sheet: { kind: "image", set: `project:${p.slug}`, index: mi } } as Action,
        })),
        ...(p.cover
          ? [{ id: "cover", label: "The cover print on the easel", action: { type: "open", sheet: { kind: "image", set: `cover:${p.slug}`, index: 0 } } as Action }]
          : []),
        ...(p.behanceUrl || p.externalUrl
          ? [
              {
                id: "exit-sign",
                label: p.behanceUrl ? "Behance ↗" : "External ↗",
                action: { type: "link", href: (p.behanceUrl || p.externalUrl)!, external: !(p.externalUrl === "/") } as Action,
              },
            ]
          : []),
        ...p.related.map((r) => ({
          id: `thread-${r.id}`,
          label: `Brass thread → ${r.title}${r.label ? ` (${r.label})` : ""}`,
          action:
            r.type === "project"
              ? ({ type: "go", to: `project-${r.slug}` } as Action)
              : r.type === "track"
                ? ({ type: "go", to: `chapter-${floors.find((c) => c.kind === "music")?.slug ?? "music"}` } as Action)
                : ({ type: "go", to: `chapter-${r.category}` } as Action),
        })),
        ...(prev ? [{ id: "prev-bay", label: `← ${prev.project.title}`, action: { type: "go", to: `project-${prev.project.slug}` } as Action }] : []),
        ...(next ? [{ id: "next-bay", label: `${next.project.title} →`, action: { type: "go", to: `project-${next.project.slug}` } as Action }] : []),
      ],
      access: "public",
      projectSlug: p.slug,
    });
  });

  add({
    id: "skills",
    path: "/skills",
    zone: "daywing",
    label: "The Type Case",
    short: "Type Case",
    description: `An oak letterpress cabinet with ${content.skills.length} drawers, one per skill group: ${content.skills.map((s) => s.group).join(", ")}. Each skill is set in metal type.`,
    parent: "work",
    pose: { pos: [TYPE_CASE.x + 0.4, EYE, TYPE_CASE.z - 3.3], target: [TYPE_CASE.x, 1.0, TYPE_CASE.z] },
    objects: content.skills.map((g, i) => ({
      id: `drawer-${i}`,
      label: `Drawer — ${g.group}`,
      hint: g.tags.join(", "),
      action: { type: "drawer", index: i } as Action,
    })),
    access: "public",
    map: { x: 212, y: towerMapY(0) + 40, w: 120, h: 30 },
  });

  const rx = (RECORDS.x0 + RECORDS.x1) / 2;
  add({
    id: "records",
    path: "/records",
    zone: "daywing",
    label: "The Records Room",
    short: "Records",
    description: "A quiet reading room off the Workshop: a lectern with the full CV, a plan chest, archive boxes and a tray of printed copies by the door.",
    parent: "work",
    pose: { pos: [rx + 1.9, EYE + 0.2, -5.0], target: [rx - 0.5, 1.1, -1.0], fov: 60 },
    objects: [
      { id: "lectern", label: "The CV on the lectern — read it", action: { type: "open", sheet: { kind: "cv" } } },
      { id: "cv-copy", label: "Take a copy — download the CV (PDF)", action: { type: "link", href: "/Abdulameer_Albutaihi_CV.pdf", download: true } },
      { id: "cv-view", label: "View the PDF", action: { type: "link", href: "/Abdulameer_Albutaihi_CV.pdf", external: true } },
      { id: "visiting-cards", label: "Visiting cards — email and phone", action: { type: "open", sheet: { kind: "contact" } } },
      { id: "archive-box", label: "Archive box — education", action: { type: "go", to: "origin" } },
      ...content.experience.map((e) => {
        const bay = day.bays.find((b) => b.project.employer === e.company);
        return {
          id: `tab-${e.id}`,
          label: `Index tab — ${e.company} (${e.dateLabel})`,
          action: (bay ? { type: "go", to: `project-${bay.project.slug}` } : { type: "open", sheet: { kind: "cv" } }) as Action,
        };
      }),
    ],
    access: "public",
    map: { x: 40, y: towerMapY(0) + 40, w: 156, h: 30 },
  });

  add({
    id: "origin",
    path: "/work/origin",
    zone: "daywing",
    label: "The School Desk",
    short: "School Desk",
    description: `One worn drafting desk at the far west end of the hall, where the time strip begins. ${cv.education.map((e) => `${e.degree}, ${e.school} (${e.date})`).join(". ")}.`,
    parent: "work",
    pose: { pos: [day.schoolDeskX + 2.6, EYE, -4.2], target: [day.schoolDeskX, 0.95, -9.6] },
    objects: [
      { id: "student-folder", label: "Student folder — education", action: { type: "open", sheet: { kind: "education" } } },
      { id: "look-back", label: "Look back east along the strip", action: { type: "go", to: "work" } },
    ],
    access: "public",
    map: { x: 40, y: towerMapY(0), w: 104, h: 36 },
  });

  // Plan Room ───────────────────────────────────────────────────────────
  add({
    id: "thinking",
    path: "/thinking",
    zone: "planroom",
    label: "The Plan Room",
    short: "Plan Room",
    description: `A darkened mezzanine above the Workshop. On a long table, a model of the thinking network: ${content.nodes.length} places joined by brass paths. Step in to walk from one idea to the next.`,
    parent: "work",
    pose: { pos: [PLAN_TABLE.cx + 0.1, PLAN_ROOM.floor + 2.35, -0.55], target: [PLAN_TABLE.cx, PLAN_TABLE.top, PLAN_TABLE.cz - 0.15], fov: 52 },
    objects: content.nodes.map((n) => ({
      id: `node-${n.key}`,
      label: `${n.title} (${n.type})`,
      hint: n.summary,
      action: { type: "go", to: `node-${n.key}` } as Action,
    })),
    access: "public",
    map: { x: 120, y: towerMapY(1) + 8, w: 224, h: 30 },
  });

  for (const n of content.nodes) {
    const from = content.nodes.find((m) => m.key === n.connections[0]);
    add({
      id: `node-${n.key}`,
      path: `/thinking/${n.key}`,
      zone: "planroom",
      label: n.title,
      short: n.title,
      description: `${n.type}: ${n.title}. ${n.summary} ${n.thinking.map((t) => `${t.phase} — ${t.text}`).join(" ")}`,
      parent: "thinking",
      pose: nodeWalkPose(n.x, n.y, from?.x, from?.y),
      objects: [
        { id: "sheet", label: `Read: ${n.title}`, action: { type: "open", sheet: { kind: "node", key: n.key } } },
        ...n.connections
          .map((k) => content.nodes.find((m) => m.key === k))
          .filter(Boolean)
          .map((m) => ({ id: `path-${m!.key}`, label: `Walk the path to ${m!.title}`, action: { type: "go", to: `node-${m!.key}` } as Action })),
        { id: "lift-out", label: "Back to the table", action: { type: "go", to: "thinking" } },
      ],
      access: "public",
      nodeKey: n.key,
    });
  }

  // Night Tower ─────────────────────────────────────────────────────────
  add({
    id: "hall",
    path: "/archive",
    zone: "hall",
    label: "The Archive Hall",
    short: "Archive Hall",
    description: `Floor 00 of the Night Tower. A tall dark hall with the chapter directory: ${floors.map((c) => `Chapter ${c.roman} — ${c.label}`).join(", ")}. The elevator in the Seam rides to each floor.`,
    parent: "lobby",
    pose: { pos: [5.4, EYE, -5.6], target: [9.6, 1.95, -11.9], fov: 56 },
    objects: floors.map((c) => ({
      id: `chapter-line-${c.slug}`,
      label: `Chapter ${c.roman} — ${c.label}`,
      hint: c.tagline,
      action: { type: "go", to: `chapter-${c.slug}` } as Action,
    })),
    access: "public",
    map: { x: SECTION.tower.x, y: towerMapY(0), w: SECTION.tower.w, h: 36 },
  });

  for (const c of floors) {
    const level = c.floor;
    const base = levelY(level);
    const items = content.items[c.slug] ?? [];
    const station: Station = {
      id: `chapter-${c.slug}`,
      path: `/archive/${c.slug}`,
      zone: floorZone(c.slug),
      label: `Chapter ${c.roman} — ${c.label}`,
      short: c.label,
      description: c.tagline,
      parent: "hall",
      pose: towerRoomPose(level),
      objects: [],
      access: c.locked ? "friends" : "public",
      map: { x: SECTION.tower.x, y: towerMapY(level), w: SECTION.tower.w, h: 32 },
      categorySlug: c.slug,
    };
    const imageObjects = (prefix: string) =>
      items.map((it, i) => ({
        id: `${prefix}-${it.id}`,
        label: it.caption || it.hover || `Print ${i + 1}`,
        action: { type: "open", sheet: { kind: "image", set: `chapter:${c.slug}`, index: i } } as Action,
      }));
    if (c.room === "gallery") {
      const hung = hangGallery(items, level);
      station.description = `${c.tagline} A long low gallery: ${items.length} prints hung under picture lights, a light table in the middle of the room.`;
      station.pose = { pos: [4.6, base + EYE, -2.0], target: [11, base + 1.5, -11.9], fov: 56 };
      station.rail = hung.map((h) => ({
        id: h.item.id,
        label: h.item.caption || `Print ${h.index + 1}`,
        pose: facingPose(h.pos, h.rotY, 2.0, EYE, base),
        objectId: `print-${h.item.id}`,
      }));
      station.objects = imageObjects("print");
    } else if (c.room === "stair") {
      const hung = hangPosters(items, level);
      station.description = `${c.tagline} A tall narrow room: a wooden stair climbs the back wall, one framed poster at each landing.`;
      station.pose = { pos: [4.6, base + EYE, -6.5], target: [10, base + 2.2, -11.9] };
      station.rail = hung.map((h) => ({
        id: h.item.id,
        label: h.item.caption || `Poster ${h.index + 1}`,
        pose: { pos: [h.pos[0] - 0.3, h.stepY + 1.5, -9.2], target: [h.pos[0], h.pos[1], h.pos[2]] },
        objectId: `poster-${h.item.id}`,
      }));
      station.objects = imageObjects("poster");
    } else if (c.room === "pattern") {
      station.description = `${c.tagline} A square room whose walls, floor and ceiling are covered with the graphics themselves.`;
      station.pose = { pos: [4.2, base + EYE, -1.6], target: [11, base + 1.9, -8] };
      station.rail = items.map((it, i) => ({
        id: it.id,
        label: it.caption || `Graphic ${i + 1}`,
        pose: i % 2 === 0
          ? { pos: [9, base + EYE, -4.5], target: [9, base + 2, -12] }
          : { pos: [8.5, base + EYE, -6], target: [16, base + 2, -6] },
        objectId: `pattern-${it.id}`,
      }));
      station.objects = [
        ...items.map((it, i) => ({ id: `pattern-${it.id}`, label: `${it.caption || `Graphic ${i + 1}`} — set it on the easel`, action: { type: "pattern", index: i } as Action })),
        ...imageObjects("pattern-view"),
      ];
    } else if (c.room === "listening") {
      station.description = `${c.tagline} A small living room: a turntable on a low cabinet, a crate of ${content.tracks.length} records, an armchair, a lamp, a window on the night city.`;
      station.pose = { pos: [6.0, base + 1.45, -3.0], target: [11.4, base + 0.95, -8.9] };
      station.objects = [
        { id: "turntable", label: "The record — play or pause", action: { type: "music", op: "toggle" } },
        { id: "next-record", label: "Next record", action: { type: "music", op: "next" } },
        { id: "prev-record", label: "Previous record", action: { type: "music", op: "prev" } },
        ...content.tracks.map((t, i) => ({
          id: `sleeve-${t.id}`,
          label: `${t.title}${t.artist ? ` — ${t.artist}` : ""}`,
          hint: t.fragment ?? undefined,
          action: { type: "music", op: "play-track", index: i } as Action,
        })),
        ...["arabic", "quiet", "english", "dancing", "jazz", "turkish"].map((m) => ({
          id: `mood-${m}`,
          label: `Mood: ${m}`,
          action: { type: "mood", mood: m } as Action,
        })),
      ];
    } else if (c.room === "kitchen") {
      const taped = tapeKitchen(items, level);
      station.description = `${c.tagline} A narrow kitchen late at night: counter, stove, fridge, a two-seat table. Cooking photos taped up around it, captions written on the tape.`;
      station.pose = { pos: [4.4, base + EYE, -4.6], target: [11, base + 1.4, -11.2] };
      station.rail = taped.map((t) => ({
        id: t.item.id,
        label: t.item.hover || `Print ${t.index + 1}`,
        pose: { pos: [t.pos[0] - 0.2, base + EYE, t.pos[2] + 1.6], target: t.pos },
        objectId: `taped-${t.item.id}`,
      }));
      station.objects = items.map((it, i) => ({
        id: `taped-${it.id}`,
        label: it.hover || it.caption || `Print ${i + 1}`,
        action: { type: "open", sheet: { kind: "cooking", index: i } } as Action,
      }));
    } else {
      station.description = `${c.tagline} The top floor is still under construction: bare concrete, a work lamp, a folding table with a laptop, a wire cube, walls drawn only in pencil.`;
      station.pose = { pos: [4.3, base + EYE, -1.8], target: [10.5, base + 1.2, -8] };
      station.objects = [
        { id: "laptop", label: "The laptop — how the building was made", action: { type: "open", sheet: { kind: "making-of" } } },
        { id: "corkboard", label: "Corkboard — rejected drafts (leads below)", action: { type: "open", sheet: { kind: "logbook" } } },
        ...items.map((it, i) => ({
          id: `model-${it.id}`,
          label: it.caption || `Model ${i + 1}`,
          action: { type: "open", sheet: { kind: "image", set: `chapter:${c.slug}`, index: i } } as Action,
        })),
      ];
    }
    add(station);
  }

  add({
    id: "darkroom",
    path: "/archive/darkroom",
    zone: floorZone(content.categories.find((c) => c.room === "gallery")?.slug ?? "photography"),
    label: "The Darkroom",
    short: "Darkroom",
    description: "A small door at the back of the Print Gallery, a red safelight above it. Friends-only prints hang drying on a line.",
    parent: `chapter-${content.categories.find((c) => c.room === "gallery")?.slug ?? "photography"}`,
    pose: (() => {
      const g = content.categories.find((c) => c.room === "gallery");
      const b = levelY(g?.floor ?? 1);
      return { pos: [14.6, b + EYE, -2.2], target: [15.6, b + 1.5, -0.4] } as Pose;
    })(),
    objects: [],
    access: "friends",
  });

  add({
    id: "roof",
    path: "/roof",
    zone: "roof",
    label: "The Roof Study",
    short: "Roof",
    description: `A small glazed study on the roof, behind the Oculus, overlooking a drawn Baghdad skyline. ${cv.name}. ${cv.tag}. ${cv.currentlyLabel ? `Right now — ${cv.currentlyLabel}: ${cv.currentlyValue}.` : ""} Two clocks: yours and Baghdad's.`,
    parent: "lobby",
    pose: { pos: [8, levelY(roof) + EYE, -2.4], target: [8, levelY(roof) + 1.15, -9.6] },
    objects: [
      { id: "note", label: `Right now — ${cv.currentlyLabel}: ${cv.currentlyValue}`, action: { type: "open", sheet: { kind: "about" } } },
      { id: "letter-tray", label: "Letter tray — contact", action: { type: "open", sheet: { kind: "contact" } } },
      ...cv.links.map((l) => ({ id: `postcard-${l.icon}`, label: `${l.label} ↗`, action: { type: "link", href: l.url, external: true } as Action })),
    ],
    access: "public",
    map: { x: SECTION.tower.x, y: towerMapY(roof), w: SECTION.tower.w, h: 32 },
  });

  add({
    id: "below",
    path: "/below",
    zone: "below",
    label: "The Deep Archive",
    short: "Deep Archive",
    description: "A low basement storeroom under the tower: metal shelving, archive boxes, one caged bulb. The building's past: earlier versions of the site, rejected homepage drafts, retired captions, the logbook.",
    parent: "lobby",
    pose: { pos: [3.4, levelY(-1) + EYE, -1.8], target: [10.5, levelY(-1) + 1.3, -9.5] },
    objects: [
      { id: "logbook", label: "The building's logbook", action: { type: "open", sheet: { kind: "logbook" } } },
      { id: "up", label: "Back up to the lobby", action: { type: "go", to: "lobby" } },
    ],
    access: "hidden",
    map: { x: SECTION.seam.x, y: towerMapY(-1), w: 288, h: 30 },
  });

  void firstBay;
  void firstChapter;
  void FLOOR_H;
  void carPose;

  const byId = Object.fromEntries(stations.map((s) => [s.id, s]));
  const byPath = Object.fromEntries(stations.map((s) => [s.path, s]));
  return { stations, byId, byPath, zones, roofLevel: roof };
}

/** Elevator level a station's zone is reached at. */
export function stationLevel(world: World, s: Station) {
  return world.zones[s.zone]?.level ?? 0;
}
