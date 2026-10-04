"use client";

import { back, go, playTrack, togglePlay } from "../actions";
import { persist, useWorld } from "../store";
import type { WorldContent } from "../content";
import type { World } from "../stations";

/**
 * The persistent interface, kept to the minimum the design allows (§23):
 * the back label top-left, the station's name, map / search / sound /
 * read-as-page top-right, the travelling record sleeve bottom-left, the
 * caption line for whatever is under the pointer, the elevator dial during
 * rides, and the frame corners — the viewfinder you are looking through.
 */
export function Hud({ world, content }: { world: World; content: WorldContent }) {
  const stationId = useWorld((s) => s.stationId);
  const readMode = useWorld((s) => s.readMode);
  const quality = useWorld((s) => s.quality);
  const muted = useWorld((s) => s.muted);
  const hovered = useWorld((s) => s.hovered);
  const focused = useWorld((s) => s.focusedObject);
  const access = useWorld((s) => s.access);
  const elevator = useWorld((s) => s.elevator);
  const set = useWorld((s) => s.set);
  const here = world.byId[stationId];
  const parent = here?.parent ? world.byId[here.parent] : null;
  const cat = here?.categorySlug ? content.categories.find((c) => c.slug === here.categorySlug) : null;
  const caption = hovered?.label ?? (focused ? here?.objects.find((o) => o.id === focused)?.label : null);

  return (
    <>
      <div className="hud-corner hud-tl" aria-hidden="true" />
      <div className="hud-corner hud-tr" aria-hidden="true" />
      <div className="hud-corner hud-bl" aria-hidden="true" />
      <div className="hud-corner hud-br" aria-hidden="true" />

      <header className="hud-top">
        <div className="hud-left">
          {parent ? (
            <button type="button" className="hud-back" onClick={() => back()}>
              ← {parent.short}
            </button>
          ) : (
            <span className="hud-mark">AmeerStudio</span>
          )}
        </div>
        <p className="hud-title" aria-live="polite">
          {cat ? <span className="hud-roman">{cat.roman}</span> : null}
          {here?.short}
        </p>
        <nav className="hud-right" aria-label="World controls">
          <button type="button" className="hud-btn" onClick={() => set({ mapOpen: true, quickOpen: false })} aria-haspopup="dialog">
            Map
          </button>
          <button type="button" className="hud-btn" onClick={() => set({ quickOpen: true, mapOpen: false })} aria-haspopup="dialog">
            Go to…
          </button>
          <button
            type="button"
            className="hud-btn"
            aria-pressed={!muted}
            onClick={() => {
              set({ muted: !muted });
              persist("world_muted_v1", !muted);
            }}
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
          {quality !== "page" && (
            <button
              type="button"
              className="hud-btn"
              aria-pressed={readMode}
              onClick={() => {
                set({ readMode: !readMode });
                persist("world_read_mode_v1", !readMode);
              }}
            >
              {readMode ? "Enter the world" : "Read as page"}
            </button>
          )}
        </nav>
      </header>

      {!readMode && caption && (
        <p className="hud-caption" role="status">
          {caption}
        </p>
      )}

      {access === "visitor" && !readMode && (
        <span className="hud-visitor" aria-hidden="true">
          visitor
        </span>
      )}

      {stationId === "approach" && !readMode && (
        <>
          <span className="hud-place hud-place-l">Baghdad, IQ</span>
          <span className="hud-place hud-place-r">{content.nowYear}</span>
        </>
      )}

      <MusicSleeve content={content} />

      {elevator.visible && !readMode && (
        <div className="hud-elevator" role="status" aria-live="polite" onClick={() => set({ skipRide: true })}>
          <span className="el-label">Memory Archive</span>
          <span className="el-floors">
            <span>
              <small>Current floor</small>
              {pad(elevator.from)}
            </span>
            <span aria-hidden="true">→</span>
            <span>
              <small>Destination</small>
              {pad(elevator.to)}
            </span>
          </span>
          <span className={`el-counter${elevator.status === "ARRIVED" ? " arrived" : ""}`}>{elevator.counter}</span>
          <span className="el-status">{elevator.status}</span>
          <span className="el-skip">click to hurry</span>
        </div>
      )}
    </>
  );
}

const pad = (n: number) => (n < 0 ? "−1" : n >= 7 ? "R" : String(n).padStart(2, "0"));

function MusicSleeve({ content }: { content: WorldContent }) {
  const trackIndex = useWorld((s) => s.trackIndex);
  const playing = useWorld((s) => s.playing);
  const loading = useWorld((s) => s.loading);
  const headphones = useWorld((s) => s.headphones);
  const stationId = useWorld((s) => s.stationId);
  const set = useWorld((s) => s.set);
  const soundUnlocked = useWorld((s) => s.soundUnlocked);
  const t = content.tracks[trackIndex];
  const music = content.categories.find((c) => c.room === "listening");
  if (!t || (!playing && !loading && !soundUnlocked)) return null;
  if (!playing && !loading) return null;
  const inRoom = music && stationId === `chapter-${music.slug}`;
  return (
    <aside className="hud-sleeve" aria-label="Now playing">
      <span className="sleeve-disc" data-playing={playing} aria-hidden="true" />
      <span className="sleeve-text">
        <span className="sleeve-label">Now playing</span>
        <span className="sleeve-title">{t.title}</span>
      </span>
      <button type="button" className="sleeve-btn" onClick={() => togglePlay()} aria-label={playing ? "Pause" : "Play"}>
        {playing ? "❚❚" : "▶"}
      </button>
      <button type="button" className="sleeve-btn" onClick={() => playTrack((trackIndex + 1) % content.tracks.length)} aria-label="Next record">
        »
      </button>
      <button type="button" className="sleeve-btn" aria-pressed={headphones} onClick={() => set({ headphones: !headphones })} title="Keep it close while you walk">
        {headphones ? "in your ears" : "in the room"}
      </button>
      {!inRoom && music && (
        <button type="button" className="sleeve-btn" onClick={() => go(`chapter-${music.slug}`)}>
          go to the room
        </button>
      )}
    </aside>
  );
}
