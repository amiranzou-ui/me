"use client";

import { engine } from "./audio/engine";
import { mediaSrc, type WorldContent } from "./content";
import { persist, useWorld } from "./store";
import type { Action, Station, World, WorldObject } from "./stations";

/**
 * Everything a visitor can do goes through here, whether they clicked an
 * object in the 3D world, a button in the accessibility mirror, a map room
 * or a quick-navigation result. One path in, so the world, the HTML and the
 * keyboard can never disagree.
 */

type Ctx = { world: World; content: WorldContent; push: (path: string) => void };
let ctx: Ctx | null = null;
export function bindActions(c: Ctx) {
  ctx = c;
}
export function getWorld() {
  return ctx?.world ?? null;
}
export function getContent() {
  return ctx?.content ?? null;
}

const NIGHT = new Set(["night", "cold"]);

/** Travel to a station, asking the threshold question first if needed. */
export function go(stationId: string) {
  if (!ctx) return;
  const target = ctx.world.byId[stationId];
  if (!target) return;
  const zone = ctx.world.zones[target.zone];
  const s = useWorld.getState();
  if (zone && NIGHT.has(zone.region) && s.access === null) {
    useWorld.setState({ sheet: { kind: "threshold", then: target.path } });
    return;
  }
  engine.click(0.06, "wood");
  if (s.sheet) useWorld.setState({ sheet: null });
  ctx.push(target.path);
}

export function goPath(path: string) {
  if (!ctx) return;
  const st = ctx.world.byPath[path];
  if (st) go(st.id);
  else ctx.push(path);
}

/** Leave the building: the iris closes from the click point. */
export function leave(href: string, external = false) {
  const el = document.createElement("div");
  el.className = "world-iris";
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("closing"));
  setTimeout(() => {
    if (external) {
      window.open(href, "_blank", "noopener");
      el.remove();
    } else {
      window.location.href = href;
    }
  }, useWorld.getState().reducedMotion ? 60 : 640);
}

export function runAction(action: Action) {
  const s = useWorld.getState();
  engine.unlock();
  switch (action.type) {
    case "go":
      go(action.to);
      return;
    case "open":
      engine.click(0.08, "paper");
      useWorld.setState({ sheet: action.sheet });
      return;
    case "link":
      if (action.download) {
        const a = document.createElement("a");
        a.href = action.href;
        a.download = "";
        a.click();
        return;
      }
      if (action.href.startsWith("/") && !action.external) {
        goPath(action.href);
        return;
      }
      leave(action.href, true);
      return;
    case "music":
      if (action.op === "play-track") playTrack(action.index);
      else if (action.op === "toggle") togglePlay();
      else if (action.op === "next") playTrack((s.trackIndex + 1) % Math.max(1, ctx?.content.tracks.length ?? 1));
      else playTrack((s.trackIndex - 1 + (ctx?.content.tracks.length ?? 1)) % Math.max(1, ctx?.content.tracks.length ?? 1));
      return;
    case "mood":
      engine.click(0.06, "brass");
      useWorld.setState({ mood: s.mood === action.mood ? null : action.mood });
      return;
    case "drawer":
      engine.click(0.1, "wood");
      useWorld.setState({ drawer: s.drawer === action.index ? null : action.index });
      return;
    case "pattern":
      engine.click(0.06, "paper");
      useWorld.setState({ pattern: action.index });
      return;
    case "none":
      return;
  }
}

/** Find an object by id: the current station first, then any station whose
 * zone is loaded (a bay seen from the hall belongs to the Workshop). */
export function findObject(objectId: string): WorldObject | null {
  if (!ctx) return null;
  const s = useWorld.getState();
  const here = ctx.world.byId[s.stationId];
  const hit = here?.objects.find((o) => o.id === objectId);
  if (hit) return hit;
  for (const st of ctx.world.stations) {
    if (!s.zoneActive.includes(st.zone)) continue;
    const o = st.objects.find((x) => x.id === objectId);
    if (o) return o;
  }
  return null;
}

export function act(objectId: string) {
  const o = findObject(objectId);
  if (o) runAction(o.action);
}

export function back() {
  if (!ctx) return;
  const s = useWorld.getState();
  if (s.sheet) {
    useWorld.setState({ sheet: null });
    return;
  }
  if (s.mapOpen || s.quickOpen) {
    useWorld.setState({ mapOpen: false, quickOpen: false });
    return;
  }
  if (s.railIndex >= 0) {
    useWorld.setState({ railIndex: -1 });
    return;
  }
  const here = ctx.world.byId[s.stationId];
  if (here?.parent) go(here.parent);
}

export function moveRail(dir: 1 | -1) {
  if (!ctx) return;
  const s = useWorld.getState();
  const here: Station | undefined = ctx.world.byId[s.stationId];
  if (!here?.rail?.length) return;
  const next = s.railIndex + dir;
  if (next < 0) {
    useWorld.setState({ railIndex: -1 });
    return;
  }
  if (next >= here.rail.length) {
    // walking past the end of the Approach takes you through the door
    if (here.id === "approach") go("lobby");
    return;
  }
  useWorld.setState({ railIndex: next });
}

// ── Music ───────────────────────────────────────────────────────────────
let wiredAudio: HTMLAudioElement | null = null;
function wire(a: HTMLAudioElement) {
  if (wiredAudio === a) return;
  wiredAudio = a;
  a.addEventListener("playing", () => useWorld.setState({ playing: true, loading: false }));
  a.addEventListener("pause", () => useWorld.setState({ playing: false }));
  a.addEventListener("waiting", () => useWorld.setState({ loading: true }));
  a.addEventListener("canplay", () => useWorld.setState({ loading: false }));
  a.addEventListener("ended", () => {
    const n = ctx?.content.tracks.length ?? 1;
    setTimeout(() => playTrack((useWorld.getState().trackIndex + 1) % n), 3000 + Math.random() * 2000);
  });
  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => togglePlay());
    navigator.mediaSession.setActionHandler("pause", () => togglePlay());
    navigator.mediaSession.setActionHandler("nexttrack", () => runAction({ type: "music", op: "next" }));
    navigator.mediaSession.setActionHandler("previoustrack", () => runAction({ type: "music", op: "prev" }));
  }
}

export function playTrack(index: number) {
  const t = ctx?.content.tracks[index];
  if (!t) return;
  useWorld.setState({ trackIndex: index, loading: true });
  persist("music_track_v1", index);
  void engine.play(mediaSrc(t.path)).then((ok) => {
    if (!ok) useWorld.setState({ loading: false, playing: false });
  });
  if (engine.musicElement) wire(engine.musicElement);
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist ?? "", album: "The Listening Room" });
  }
}

export function togglePlay() {
  const s = useWorld.getState();
  const a = engine.musicElement;
  if (s.playing && a) {
    engine.pause();
    return;
  }
  if (a && a.src && !a.ended) {
    engine.tonearm("on");
    void a.play();
    return;
  }
  playTrack(s.trackIndex);
}

export function seek(seconds: number) {
  const a = engine.musicElement;
  if (a?.duration) a.currentTime = Math.max(0, Math.min(a.duration, a.currentTime + seconds));
}
