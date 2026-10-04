"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { back, bindActions, go, moveRail, runAction, seek, togglePlay } from "../actions";
import { engine } from "../audio/engine";
import { buildWorld } from "../stations";
import { hydrateStore, persist, useWorld } from "../store";
import type { WorldContent } from "../content";
import { rig } from "../scene/rigState";
import { friendItems } from "@/app/actions/friend";
import { Hud } from "./Hud";
import { Mirror } from "./Mirror";
import { SheetLayer } from "./Sheets";
import { MapOverlay } from "./MapOverlay";
import { QuickNav } from "./QuickNav";
import { Arrival } from "./Arrival";
import { LiveEffects } from "./LiveEffects";
import "../world.css";

const WorldCanvas = dynamic(() => import("../scene/WorldCanvas"), { ssr: false });

const OWNER_EMAIL = "amiranzou@outlook.com";
const ROOMS = /^(desk|work|records|skills|origin|thinking|hall|roof|below|chapter-.+)$/;

/**
 * The world shell: lives in the (world) layout, so it — and the canvas
 * inside it — mounts once per visit and never remounts between routes.
 * The URL is the source of truth for where the visitor is; this component
 * turns each URL into a station and lets the camera do the rest.
 */
export function WorldShell({ content, children }: { content: WorldContent; children: ReactNode }) {
  const world = useMemo(() => buildWorld(content), [content]);
  const router = useRouter();
  const pathname = usePathname();
  const readMode = useWorld((s) => s.readMode);
  const quality = useWorld((s) => s.quality);
  const muted = useWorld((s) => s.muted);
  const headphones = useWorld((s) => s.headphones);
  const zoneNow = useWorld((s) => s.zoneNow);
  const access = useWorld((s) => s.access);
  const hydrated = useRef(false);

  useEffect(() => {
    bindActions({ world, content, push: (p) => router.push(p, { scroll: false }) });
  }, [world, content, router]);

  // ── first mount: per-visitor state, quality tier, arrival ──────────────
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    hydrateStore();
    const gl2 = (() => {
      try {
        return !!document.createElement("canvas").getContext("webgl2");
      } catch {
        return false;
      }
    })();
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const small = Math.min(window.innerWidth, window.innerHeight) < 600;
    const lowMem = ((navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8) < 3;
    rig.coarse = coarse;
    const quality = !gl2 || lowMem ? "page" : coarse || small ? "light" : "high";
    let seen = true;
    try {
      seen = !!localStorage.getItem("seen_intro");
      if (!seen) localStorage.setItem("seen_intro", "1");
    } catch {
      /* no storage: no arrival */
    }
    useWorld.setState({
      quality,
      readMode: quality === "page" ? true : useWorld.getState().readMode,
      arrival: !seen && pathname === "/",
    });
    const unlock = () => {
      engine.unlock();
      engine.setMuted(useWorld.getState().muted);
      useWorld.setState({ soundUnlocked: true });
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    // the owner sees a "Private" door in the lobby
    const idle = window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1500));
    // (loaded lazily: only the owner needs the auth client, so visitors
    // don't download it up front)
    idle(() => {
      void import("@/lib/supabase/client")
        .then(({ createClient }) => createClient().auth.getUser())
        .then(({ data }) => data.user?.email === OWNER_EMAIL && useWorld.setState({ owner: true }))
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // friends who already said the word get their floors back after a reload
  useEffect(() => {
    if (access !== "friend" || Object.keys(useWorld.getState().lockedItems).length) return;
    void friendItems().then((items) => items && useWorld.setState({ lockedItems: items }));
  }, [access]);

  // ── the URL decides the station ─────────────────────────────────────────
  useEffect(() => {
    const path = decodeURI(pathname).replace(/\/$/, "") || "/";
    const st = world.byPath[path];
    if (!st) return;
    useWorld.setState({ stationId: st.id, railIndex: -1, hovered: null, focusedObject: null, mapOpen: false, quickOpen: false });
    if (ROOMS.test(st.id)) {
      persist("world_last_room_v1", st.id);
    }
    document.title = st.id === "approach" ? "Ameer Al-Butaihi" : `${st.label} — AmeerStudio`;
  }, [pathname, world]);

  useEffect(() => engine.setMuted(muted), [muted]);
  useEffect(() => engine.setHeadphones(headphones), [headphones]);

  // ── keyboard ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useWorld.getState();
      const typing = e.target instanceof HTMLElement && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable);
      if (e.key === "Escape") {
        e.preventDefault();
        back();
        return;
      }
      if (typing) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useWorld.setState({ quickOpen: !s.quickOpen, mapOpen: false });
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (s.sheet || s.quickOpen) return;
      if (e.key === "/") {
        e.preventDefault();
        useWorld.setState({ quickOpen: true, mapOpen: false });
        return;
      }
      if (e.key.toLowerCase() === "m") {
        useWorld.setState({ mapOpen: !s.mapOpen });
        return;
      }
      if (s.mapOpen) return;
      if (s.travellingTo && e.key === "Enter") {
        useWorld.setState({ skipRide: true });
        return;
      }
      const here = world.byId[s.stationId];
      const inListening = !!here?.objects.some((o) => o.id === "turntable");
      if (inListening) {
        const k = e.key.toLowerCase();
        if (k === " " || k === "k") {
          if (document.activeElement && document.activeElement !== document.body) return;
          e.preventDefault();
          togglePlay();
          return;
        }
        if (k === "l" || e.key === "ArrowRight") return void seek(10);
        if (k === "j" || e.key === "ArrowLeft") return void seek(-10);
        if (k === "n") return void runAction({ type: "music", op: "next" });
        if (k === "p") return void runAction({ type: "music", op: "prev" });
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        if (document.activeElement && document.activeElement !== document.body) return;
        e.preventDefault();
        moveRail(1);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        if (document.activeElement && document.activeElement !== document.body) return;
        e.preventDefault();
        moveRail(-1);
        return;
      }
      // elevator buttons: 0–9 for floors, R for the roof
      const zone = here ? world.zones[here.zone] : null;
      if (zone && ["seam", "night", "cold", "roof"].includes(zone.region)) {
        if (e.key.toLowerCase() === "r") return void go("roof");
        if (/^[0-9]$/.test(e.key)) {
          const n = Number(e.key);
          if (n === 0) return void go("hall");
          const c = content.categories.find((x) => x.floor === n);
          if (c) go(`chapter-${c.slug}`);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [world, content]);

  const region = world.zones[zoneNow]?.region ?? "exterior";
  const showWorld = !readMode && quality !== "page";

  return (
    <div className="world-root" data-region={region} data-read={readMode ? "true" : "false"}>
      {showWorld && (
        <div className="world-stage" aria-hidden="true">
          <WorldCanvas world={world} content={content} />
          <div className="world-grain" />
          <div className="world-vignette" />
        </div>
      )}
      <Hud world={world} content={content} />
      {showWorld && <Mirror world={world} />}
      <main id="station-doc" className={readMode || !showWorld ? "world-doc is-read" : "world-doc"} tabIndex={-1}>
        {children}
      </main>
      <SheetLayer world={world} content={content} />
      <MapOverlay world={world} />
      <QuickNav world={world} content={content} />
      {showWorld && <Arrival />}
      {showWorld && <LiveEffects region={region} />}
    </div>
  );
}
