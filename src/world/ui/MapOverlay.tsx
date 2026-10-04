"use client";

import { useEffect, useRef } from "react";
import { go } from "../actions";
import { useWorld } from "../store";
import type { World } from "../stations";

/**
 * The map (design doc §16): the building drawn in section, as ink on cream
 * — the kind of drawing that would sit in his own portfolio. Generated from
 * the station registry, so a new floor or room appears here by itself.
 * Rooms are real buttons; locked rooms show their door; hidden rooms are
 * drawn only once found; the room you left a lamp on in is marked.
 */
const VB = { w: 760, h: 392 };

export function MapOverlay({ world }: { world: World }) {
  const open = useWorld((s) => s.mapOpen);
  const stationId = useWorld((s) => s.stationId);
  const discovered = useWorld((s) => s.discovered);
  const lastRoom = useWorld((s) => s.lastRoom);
  const access = useWorld((s) => s.access);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) ref.current?.querySelector<HTMLElement>("[aria-current='location']")?.focus();
  }, [open]);
  if (!open) return null;
  const here = world.byId[stationId];
  const hereRoom = here?.map ? here : here?.parent ? world.byId[here.parent] : null;
  const rooms = world.stations.filter((s) => s.map && (s.access !== "hidden" || discovered.includes(s.id)));
  const close = () => useWorld.setState({ mapOpen: false });
  const roofY = Math.min(...rooms.map((r) => r.map!.y));
  return (
    <div className="map-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="map-sheet" role="dialog" aria-modal="true" aria-label="Map of the building" ref={ref}>
        <div className="map-head">
          <p className="map-title">The building, in section</p>
          <button type="button" className="sheet-close" onClick={close} aria-label="Close map">
            ×
          </button>
        </div>
        <div className="map-drawing" style={{ aspectRatio: `${VB.w} / ${VB.h}` }}>
          <svg viewBox={`0 0 ${VB.w} ${VB.h}`} aria-hidden="true" className="map-svg">
            {/* ground line and the three regions */}
            <line x1="8" x2="752" y1="340" y2="340" className="map-ground" />
            <rect x="24" y="252" width="416" height="88" className="map-region" />
            <rect x="456" y={roofY - 8} width="56" height={340 - roofY + 8} className="map-seam" />
            <rect x="528" y={roofY - 8} width="216" height={340 - roofY + 8} className="map-region map-night" />
            <text x="32" y="246" className="map-label">DAY WING · MATRIX</text>
            <text x="536" y={roofY - 14} className="map-label">NIGHT TOWER · HUMAN</text>
            <text x="484" y={roofY - 14} className="map-label" textAnchor="middle">SEAM</text>
          </svg>
          {rooms.map((s) => {
            const m = s.map!;
            const locked = s.access === "friends" && access !== "friend";
            const current = hereRoom?.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={`map-room${locked ? " is-locked" : ""}${current ? " is-here" : ""}`}
                style={{ left: `${(m.x / VB.w) * 100}%`, top: `${(m.y / VB.h) * 100}%`, width: `${(m.w / VB.w) * 100}%`, height: `${(m.h / VB.h) * 100}%` }}
                aria-current={current ? "location" : undefined}
                onClick={() => {
                  close();
                  go(s.id);
                }}
              >
                <span>{s.short}</span>
                {locked && <small> · friends</small>}
                {lastRoom === s.id && !current && <i className="map-lamp" title="you left the lamp on" />}
                {current && <i className="map-here" aria-label="you are here" />}
              </button>
            );
          })}
        </div>
        <p className="map-foot">
          Click a room to go there — the route is walked, not skipped. Esc closes.
          {lastRoom && world.byId[lastRoom] && <span> You left the lamp on in {world.byId[lastRoom].short}.</span>}
        </p>
      </div>
    </div>
  );
}
