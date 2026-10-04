"use client";

import { useRef } from "react";
import { go, runAction } from "../actions";
import { useWorld } from "../store";
import type { World } from "../stations";

/**
 * The accessibility mirror (design doc §25): every object at the current
 * station as a real button, in reading order. Tab moves through them and
 * lights the matching object in the world in orange; Enter or Space acts.
 * It stays out of sight until it has focus, then appears as a strip of
 * brass labels along the bottom of the frame.
 */
export function Mirror({ world }: { world: World }) {
  const stationId = useWorld((s) => s.stationId);
  const set = useWorld((s) => s.set);
  const here = world.byId[stationId];
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (!here) return null;
  return (
    <nav className="world-mirror" aria-label={`Things at ${here.label}`}>
      <a className="mirror-skip" href="#station-doc">
        Skip to the page text
      </a>
      <ul>
        {here.objects.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              className="mirror-btn"
              onFocus={() => set({ focusedObject: o.id })}
              onBlur={() => set({ focusedObject: null })}
              onClick={() => runAction(o.action)}
              onKeyDown={(e) => {
                // the elevator panel: hold Enter for two seconds to go below
                if (o.id === "elevator" && e.key === "Enter" && !e.repeat) {
                  hold.current = setTimeout(() => {
                    useWorld.getState().discover("below");
                    go("below");
                  }, 2000);
                }
              }}
              onKeyUp={() => {
                if (hold.current) clearTimeout(hold.current);
              }}
              title={o.hint}
            >
              {o.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
