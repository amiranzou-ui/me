/**
 * Turns "go from here to that station" into the physical route through the
 * building: walk out through doorways to the Seam, ride the elevator if
 * levels differ, walk in. The camera rig animates the result; the zone
 * streamer loads every zone the route touches before the camera gets there.
 */
import { carPose, type Pose } from "./layout";
import type { World, ZoneId } from "./stations";

export type Segment =
  | { kind: "move"; pose: Pose; zone: ZoneId; final?: boolean }
  | { kind: "ride"; from: number; to: number };

/** Ground-level chain of zones from a zone out to the Seam. */
const CHAIN: Record<string, ZoneId[]> = {
  approach: ["approach", "seam"],
  seam: ["seam"],
  daywing: ["daywing", "seam"],
  planroom: ["planroom", "daywing", "seam"],
  hall: ["hall", "seam"],
};

function groundPath(world: World, from: ZoneId, to: ZoneId): Segment[] {
  const a = CHAIN[from] ?? ["seam"];
  const b = CHAIN[to] ?? ["seam"];
  let ia = 0;
  let ib = -1;
  for (; ia < a.length; ia++) {
    ib = b.indexOf(a[ia]);
    if (ib >= 0) break;
  }
  const out: Segment[] = [];
  const doorOf = (z: ZoneId) => world.zones[z]?.door;
  // leave: every door from `from` up to (and including) the common zone
  for (let i = 1; i <= ia; i++) {
    const d = doorOf(a[i - 1]);
    if (d) out.push({ kind: "move", pose: d, zone: a[i] });
  }
  // passing through the lobby between two other zones: step through it
  if (ia > 0 && a[ia] === "seam" && ib > 0) {
    const d = doorOf("seam");
    if (d) out.push({ kind: "move", pose: d, zone: "seam" });
  }
  // enter: the doors from the common zone back down to `to`
  for (let j = ib - 1; j >= 0; j--) {
    const d = doorOf(b[j]);
    if (d) out.push({ kind: "move", pose: d, zone: b[j] });
  }
  return out;
}

export function planRoute(world: World, fromZone: ZoneId, toStationId: string, finalPose?: Pose): Segment[] {
  const to = world.byId[toStationId];
  if (!to) return [];
  const pose = finalPose ?? to.pose;
  const final: Segment = { kind: "move", pose, zone: to.zone, final: true };
  if (fromZone === to.zone) return [final];

  const fl = world.zones[fromZone]?.level ?? 0;
  const tl = world.zones[to.zone]?.level ?? 0;
  const groundFrom = fl === 0 && CHAIN[fromZone];
  const groundTo = tl === 0 && CHAIN[to.zone];
  const segs: Segment[] = [];

  if (groundFrom && groundTo) {
    return [...groundPath(world, fromZone, to.zone), final];
  }
  if (groundFrom) segs.push(...groundPath(world, fromZone, "seam"));
  // into the car at the starting level, ride, step out
  segs.push({ kind: "move", pose: carPose(fl), zone: "seam" });
  segs.push({ kind: "ride", from: fl, to: groundTo ? 0 : tl });
  if (groundTo) {
    segs.push({ kind: "move", pose: world.zones.seam.door!, zone: "seam" });
    segs.push(...groundPath(world, "seam", to.zone));
  }
  segs.push(final);
  return segs;
}

export function routeZones(segs: Segment[], world: World): ZoneId[] {
  const z = new Set<ZoneId>();
  for (const s of segs) {
    if (s.kind === "move") z.add(s.zone);
    else {
      z.add("seam");
      for (const zone of Object.values(world.zones)) if (zone.level === s.to && zone.level !== 0) z.add(zone.id);
    }
  }
  return [...z];
}
