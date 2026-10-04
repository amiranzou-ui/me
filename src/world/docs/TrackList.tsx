"use client";

import { playTrack, togglePlay } from "../actions";
import { useWorld } from "../store";
import type { WorldTrack } from "../content";

/**
 * The Listening Room's records as an ordinary list (design doc §13: the
 * music must stay usable without entering the 3D room). Plays through the
 * same audio engine the turntable uses, so the two never disagree.
 */
export function TrackList({ tracks }: { tracks: WorldTrack[] }) {
  const trackIndex = useWorld((s) => s.trackIndex);
  const playing = useWorld((s) => s.playing);
  return (
    <ol className="doc-tracks" aria-label="Recordings">
      {tracks.map((t, i) => {
        const current = i === trackIndex;
        return (
          <li key={t.id} className={current ? "is-current" : ""}>
            <button
              type="button"
              className="doc-track-btn"
              aria-pressed={current && playing}
              onClick={() => (current ? togglePlay() : playTrack(i))}
            >
              <span className="doc-track-state" aria-hidden="true">
                {current && playing ? "❚❚" : "▶"}
              </span>
              <span className="doc-track-title">{t.title}</span>
              {t.artist && <span className="doc-muted"> — {t.artist}</span>}
            </button>
            {t.fragment && <span className="doc-track-fragment">{t.fragment}</span>}
          </li>
        );
      })}
    </ol>
  );
}
