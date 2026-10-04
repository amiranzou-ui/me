"use client";

import { useEffect, useRef } from "react";
import { useWorld } from "../store";
import { allLamps } from "../scene/kit/lamps";
import { rig } from "../scene/rigState";
import type { Region } from "../stations";

/**
 * Three of today's effects, moved into the world (design doc §18):
 *  - the Matrix glitch becomes a rare print misregistration, Day Wing only;
 *  - the crossing ripple becomes a soft exposure swap when you cross the
 *    Seam between day and night;
 *  - now and then a bulb in the tower flickers once.
 * All off under reduced motion.
 */
const NIGHTISH = new Set<Region>(["night", "cold", "deep", "plan"]);

export function LiveEffects({ region }: { region: Region }) {
  const reduced = useWorld((s) => s.reducedMotion);
  const readMode = useWorld((s) => s.readMode);
  const prev = useRef<Region>(region);

  useEffect(() => {
    const was = NIGHTISH.has(prev.current);
    const is = NIGHTISH.has(region);
    prev.current = region;
    if (was === is || reduced || readMode) return;
    const stage = document.querySelector(".world-stage");
    stage?.classList.remove("crossing");
    void (stage as HTMLElement | null)?.offsetWidth;
    stage?.classList.add("crossing");
    const t = setTimeout(() => stage?.classList.remove("crossing"), 900);
    return () => clearTimeout(t);
  }, [region, reduced, readMode]);

  useEffect(() => {
    if (reduced || readMode || region !== "day") return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        if (!document.hidden) {
          const stage = document.querySelector(".world-stage");
          stage?.classList.add("misregister");
          setTimeout(() => stage?.classList.remove("misregister"), Math.random() > 0.5 ? 180 : 300);
        }
        schedule();
      }, 16000 + Math.random() * 26000);
    };
    schedule();
    return () => clearTimeout(t);
  }, [region, reduced, readMode]);

  useEffect(() => {
    if (reduced || readMode || !NIGHTISH.has(region)) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        const lamps = [...allLamps().values()].filter((l) => !l.shaft);
        const l = lamps[Math.floor(Math.random() * lamps.length)];
        if (l) {
          rig.flickerId = l.id;
          setTimeout(() => (rig.flickerId = null), 140);
        }
        schedule();
      }, 25000 + Math.random() * 30000);
    };
    schedule();
    return () => clearTimeout(t);
  }, [region, reduced, readMode]);

  return null;
}
