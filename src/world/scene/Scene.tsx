"use client";

import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useWorld } from "../store";
import { engine } from "../audio/engine";
import type { WorldContent } from "../content";
import type { World } from "../stations";
import { AmbientTicker, Dust, LightRig } from "./Atmosphere";
import { CameraRig } from "./CameraRig";
import { rig } from "./rigState";

/**
 * Everything inside the one persistent canvas: the camera director, the
 * light rig, dust, and the zone streamer. Zones are separate code chunks
 * (React.lazy) and are mounted only while they are the current zone, a
 * direct neighbour, or on the route being travelled; everything else is
 * unmounted, which disposes its geometry, materials and textures.
 */

const Approach = lazy(() => import("./zones/Approach"));
const Seam = lazy(() => import("./zones/Seam"));
const DayWing = lazy(() => import("./zones/DayWing"));
const PlanRoom = lazy(() => import("./zones/PlanRoom"));
const ArchiveHall = lazy(() => import("./zones/ArchiveHall"));
const TowerFloor = lazy(() => import("./zones/TowerFloor"));
const Roof = lazy(() => import("./zones/Roof"));
const DeepArchive = lazy(() => import("./zones/DeepArchive"));

type ZoneComp = ComponentType<{ content: WorldContent }>;

const SEEN_THROUGH: Record<string, string[]> = {
  seam: ["daywing", "hall"],
  daywing: ["seam", "planroom"],
  planroom: ["daywing"],
  hall: ["seam"],
};

export function Scene({ world, content }: { world: World; content: WorldContent }) {
  const zoneNow = useWorld((s) => s.zoneNow);
  const region = world.zones[zoneNow]?.region ?? "exterior";
  const quality = useWorld((s) => s.quality);
  useEffect(() => {
    engine.setRegion(region);
  }, [region]);
  return (
    <>
      <CameraRig world={world} />
      <LightRig region={region} />
      <AmbientTicker />
      <Dust count={quality === "light" ? 140 : 420} />
      <group
        onPointerMove={(e) => {
          rig.pointer = [e.point.x, e.point.y, e.point.z];
        }}
        onPointerMissed={() => useWorld.setState({ hovered: null })}
      >
        <ZoneStreamer world={world} content={content} />
      </group>
    </>
  );
}

function ZoneStreamer({ world, content }: { world: World; content: WorldContent }) {
  const active = useWorld((s) => s.zoneActive);
  const visible = useWorld((s) => s.zoneVisible);
  const zoneNow = useWorld((s) => s.zoneNow);
  const hovered = useWorld((s) => s.hovered?.id);
  // hovering a destination warms it: load that floor before the click
  const warmed = useMemo(() => {
    if (!hovered) return null;
    const m = hovered.match(/^(?:chapter-line-|dir-)(.+)$/);
    if (m && world.zones[`floor-${m[1]}`]) return `floor-${m[1]}`;
    if (hovered.startsWith("bay-") || hovered === "matrix-side" || hovered === "archway") return "daywing";
    if (hovered === "human-side" || hovered === "tower-door") return "hall";
    return null;
  }, [hovered, world.zones]);

  const wanted = useMemo(() => new Set([...active, zoneNow, ...(warmed ? [warmed] : [])]), [active, zoneNow, warmed]);
  const [mounted, setMounted] = useState<string[]>(() => [...wanted]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    // add immediately; release after a short delay so a zone just left
    // doesn't flicker out mid-walk
    for (const z of wanted) {
      const t = timers.current.get(z);
      if (t) {
        clearTimeout(t);
        timers.current.delete(z);
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted((m) => [...new Set([...m, ...wanted])]);
    for (const z of mounted) {
      if (wanted.has(z) || timers.current.has(z)) continue;
      timers.current.set(
        z,
        setTimeout(() => {
          timers.current.delete(z);
          setMounted((m) => m.filter((x) => x !== z || wanted.has(x)));
        }, 2500),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted]);

  const vis = useMemo(() => new Set([...visible, zoneNow]), [visible, zoneNow]);
  return (
    <>
      {mounted.map((id) => {
        const zone = world.zones[id];
        if (!zone) return null;
        let el: React.ReactNode = null;
        if (id === "approach") el = <Approach content={content} />;
        else if (id === "seam") el = <Seam content={content} />;
        else if (id === "daywing") el = <DayWing content={content} />;
        else if (id === "planroom") el = <PlanRoom content={content} />;
        else if (id === "hall") el = <ArchiveHall content={content} />;
        else if (id === "roof") el = <Roof content={content} />;
        else if (id === "below") el = <DeepArchive />;
        else if (id.startsWith("floor-")) {
          const cat = content.categories.find((c) => `floor-${c.slug}` === id);
          if (cat) el = <TowerFloor content={content} category={cat} />;
        }
        // Zones you can see through an opening stay drawn: the Day Wing and
        // the Archive Hall through the lobby's archway and door, the lobby
        // from either side, the hall below the Plan Room.
        const shown = vis.has(id) || [...vis].some((v) => SEEN_THROUGH[v]?.includes(id));
        return (
          <group key={id} visible={shown}>
            <Suspense fallback={null}>{el}</Suspense>
          </group>
        );
      })}
    </>
  );
}

export type { ZoneComp };
