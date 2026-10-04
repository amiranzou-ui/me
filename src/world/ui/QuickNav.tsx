"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { go, playTrack } from "../actions";
import { useWorld } from "../store";
import type { WorldContent } from "../content";
import type { World } from "../stations";

/**
 * Quick navigation (design doc §16): "Go to…". Searches rooms, projects,
 * thoughts and records by name and returns places, not pages — choosing a
 * project flies to its bay. The fastest way in for anyone who doesn't want
 * to walk.
 */
type Entry = { id: string; label: string; kind: string; run: () => void };

export function QuickNav({ world, content }: { world: World; content: WorldContent }) {
  const open = useWorld((s) => s.quickOpen);
  const discovered = useWorld((s) => s.discovered);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const entries = useMemo<Entry[]>(() => {
    const out: Entry[] = [];
    for (const s of world.stations) {
      if (s.access === "hidden" && !discovered.includes(s.id)) continue;
      const kind = s.projectSlug ? "Project" : s.nodeKey ? "Thought" : s.categorySlug ? "Floor" : "Room";
      out.push({ id: s.id, label: s.label, kind, run: () => go(s.id) });
    }
    const music = content.categories.find((c) => c.room === "listening");
    content.tracks.forEach((t, i) =>
      out.push({
        id: `track-${t.id}`,
        label: `${t.title}${t.artist ? ` — ${t.artist}` : ""}`,
        kind: "Record",
        run: () => {
          playTrack(i);
          if (music) go(`chapter-${music.slug}`);
        },
      }),
    );
    out.push({ id: "contact", label: "Contact — write to me", kind: "Roof", run: () => (go("roof"), useWorld.setState({ sheet: { kind: "contact" } })) });
    out.push({ id: "cv", label: "CV — read or download", kind: "Records", run: () => (go("records"), useWorld.setState({ sheet: { kind: "cv" } })) });
    return out;
  }, [world, content, discovered]);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (t ? entries.filter((e) => e.label.toLowerCase().includes(t) || e.kind.toLowerCase().includes(t)) : entries).slice(0, 12);
  }, [q, entries]);
  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 20);
  }, [open]);
  if (!open) return null;
  const close = () => {
    useWorld.setState({ quickOpen: false });
    setQ("");
    setSel(0);
  };
  const choose = (e: Entry) => {
    close();
    e.run();
  };
  return (
    <div className="map-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="quick" role="dialog" aria-modal="true" aria-label="Go to">
        <input
          ref={input}
          autoFocus
          className="quick-input"
          placeholder="Go to… a room, a project, a record"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((s) => Math.min(results.length - 1, s + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((s) => Math.max(0, s - 1));
            } else if (e.key === "Enter" && results[sel]) {
              e.preventDefault();
              choose(results[sel]);
            }
          }}
          role="combobox"
          aria-expanded="true"
          aria-controls="quick-list"
          aria-activedescendant={results[sel] ? `quick-${results[sel].id}` : undefined}
        />
        <ul id="quick-list" role="listbox" className="quick-list">
          {results.map((r, i) => (
            <li key={r.id} id={`quick-${r.id}`} role="option" aria-selected={i === sel} className={i === sel ? "is-sel" : ""} onMouseEnter={() => setSel(i)} onClick={() => choose(r)}>
              <span className="quick-kind">{r.kind}</span>
              {r.label}
            </li>
          ))}
          {results.length === 0 && <li className="quick-empty">Nothing by that name in the building.</li>}
        </ul>
      </div>
    </div>
  );
}
