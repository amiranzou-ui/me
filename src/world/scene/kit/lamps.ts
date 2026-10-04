"use client";

import type { Vec3 } from "../../layout";

/**
 * Lamps register here instead of each adding a three.js light. The light
 * rig keeps a fixed pool of point lights and moves them to the lamps
 * nearest the camera, so the number of lights (and so the shaders) never
 * changes as rooms load and unload — no recompiles, no hitches.
 */
export type Lamp = {
  id: string;
  pos: Vec3;
  color: string;
  intensity: number;
  distance: number;
  /** A sunlight shaft: carries dust but adds no light. */
  shaft?: boolean;
};

const lamps = new Map<string, Lamp>();
let version = 0;

export function registerLamp(l: Lamp) {
  lamps.set(l.id, l);
  version++;
}
export function unregisterLamp(id: string) {
  if (lamps.delete(id)) version++;
}
export function lampVersion() {
  return version;
}
export function allLamps() {
  return lamps;
}
