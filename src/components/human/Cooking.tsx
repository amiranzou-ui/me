"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GalleryItem } from "@/lib/human/types";
import { mediaUrl } from "@/lib/supabase/media";

/** Deterministic pseudo-random in [0,1), seeded by a string — gives each
 * card a stable scatter (same rotation every render) instead of Math.random()
 * reshuffling the layout on every re-render. */
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return (h >>> 0) / 4294967295;
}

/** Ported from legacy/js/cooking.js. `active` mirrors the section:change gate. */
export default function Cooking({ items, active }: { items: GalleryItem[]; active: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const [expanded, setExpanded] = useState(-1);
  const cardStyles = useMemo(
    () =>
      items.map((item, i) => ({
        rot: ((seededRandom(item.id + "r") - 0.5) * 3).toFixed(2) + "deg",
        nudge: ((seededRandom(item.id + "n") - 0.5) * 12).toFixed(1) + "px",
        wide: i % 3 === 1,
      })),
    [items],
  );
  const builtRef = useRef(false);

  useEffect(() => {
    if (active && !builtRef.current) {
      builtRef.current = true;
      requestAnimationFrame(() => requestAnimationFrame(() => setRevealed(true)));
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (expanded < 0) return;
      if (e.key === "Escape") setExpanded(-1);
      if (e.key === "ArrowRight") setExpanded((expanded + 1) % items.length);
      if (e.key === "ArrowLeft") setExpanded((expanded - 1 + items.length) % items.length);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, expanded, items.length]);

  const moment = expanded >= 0 ? items[expanded] : null;

  return (
    <div className={`ck-section${active ? " active" : ""}${revealed ? " ck-revealed" : ""}`} id="cooking" style={{ display: active ? "block" : "none" }}>
      <div className="ck-grid">
        {items.map((item, i) => {
          const hover = item.meta?.hover_caption ?? item.caption ?? "";
          return (
            <div
              key={item.id}
              className={`ck-card${cardStyles[i].wide ? " ck-wide" : ""}${expanded === i ? " ck-active" : ""}`}
              style={{ "--rot": cardStyles[i].rot, "--nudge": cardStyles[i].nudge } as React.CSSProperties}
              onClick={() => setExpanded(i)}
            >
              {item.assets && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(item.assets.path)} alt="" loading="lazy" />
              )}
              <span className="ck-label">{hover}</span>
              <span className="ck-hint" />
            </div>
          );
        })}
      </div>

      <div id="ck-overlay" className={moment ? "open" : ""} onClick={(e) => e.target === e.currentTarget && setExpanded(-1)} onWheel={(e) => {
        e.preventDefault();
        if (expanded < 0) return;
        setExpanded(e.deltaY > 0 ? (expanded + 1) % items.length : (expanded - 1 + items.length) % items.length);
      }}>
        <div className="ck-exp-inner">
          {moment?.assets && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="ck-exp-img" src={mediaUrl(moment.assets.path)} alt="" />
          )}
          <div className="ck-exp-text">
            {(moment?.meta?.text ?? []).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
