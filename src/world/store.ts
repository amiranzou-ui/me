"use client";

import { create } from "zustand";
import type { SheetSpec } from "./stations";
import type { WorldItem } from "./content";

/**
 * The world store — shared by the HTML layer and the 3D canvas (which runs
 * in its own React tree). Replaces the old core.ts event bus. Per-frame
 * values (camera, audio level) are NOT kept here; those live in refs to
 * avoid re-rendering React every frame.
 */

export type Quality = "high" | "light" | "page";
export type Access = "friend" | "visitor" | null;

type ElevatorHud = { visible: boolean; from: number; to: number; counter: string; status: string };

type State = {
  stationId: string;
  /** Station the camera is travelling toward (null when settled). */
  travellingTo: string | null;
  railIndex: number;
  sheet: SheetSpec | null;
  hovered: { id: string; label: string } | null;
  focusedObject: string | null;
  access: Access;
  lockedItems: Record<string, WorldItem[]>;
  quality: Quality;
  readMode: boolean;
  reducedMotion: boolean;
  muted: boolean;
  headphones: boolean;
  soundUnlocked: boolean;
  trackIndex: number;
  playing: boolean;
  loading: boolean;
  mood: string | null;
  drawer: number | null;
  pattern: number;
  discovered: string[];
  lastRoom: string | null;
  mapOpen: boolean;
  quickOpen: boolean;
  elevator: ElevatorHud;
  arrival: boolean;
  owner: boolean;
  zoneActive: string[];
  zoneVisible: string[];
  zoneNow: string;
  skipRide: boolean;
  flash: number;
  set: (p: Partial<State>) => void;
  discover: (stationId: string) => void;
};

const read = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
};
export const persist = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: per-visit only */
  }
};

export const useWorld = create<State>((set, get) => ({
  stationId: "approach",
  travellingTo: null,
  railIndex: -1,
  sheet: null,
  hovered: null,
  focusedObject: null,
  access: null,
  lockedItems: {},
  quality: "high",
  readMode: false,
  reducedMotion: false,
  muted: false,
  headphones: false,
  soundUnlocked: false,
  trackIndex: 0,
  playing: false,
  loading: false,
  mood: null,
  drawer: null,
  pattern: 0,
  discovered: [],
  lastRoom: null,
  mapOpen: false,
  quickOpen: false,
  elevator: { visible: false, from: 0, to: 0, counter: "00", status: "" },
  arrival: false,
  owner: false,
  zoneActive: ["approach", "seam"],
  zoneVisible: ["approach"],
  zoneNow: "approach",
  skipRide: false,
  flash: 0,
  set: (p) => set(p),
  discover: (stationId) => {
    const d = get().discovered;
    if (d.includes(stationId)) return;
    const next = [...d, stationId];
    persist("world_discovered_v1", next);
    set({ discovered: next });
  },
}));

/** Hydrate per-visitor conveniences after mount (never during SSR). */
export function hydrateStore() {
  let access: Access = null;
  try {
    const a = sessionStorage.getItem("archive_access");
    if (a === "friend" || a === "visitor") access = a;
  } catch {
    /* no session storage */
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useWorld.setState({
    access,
    reducedMotion: reduced,
    readMode: read("world_read_mode_v1", false),
    muted: read("world_muted_v1", false),
    trackIndex: read("music_track_v1", 0),
    discovered: read("world_discovered_v1", [] as string[]),
    lastRoom: read("world_last_room_v1", null as string | null),
  });
}
