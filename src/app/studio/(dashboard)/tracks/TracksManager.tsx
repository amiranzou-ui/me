"use client";

import { useState } from "react";
import { mediaUrl } from "@/lib/supabase/media";
import { createClient } from "@/lib/supabase/client";
import AudioUpload from "@/components/studio/AudioUpload";
import { upsertTrack, deleteTrack, reorderTracks } from "./actions";
import type { Track } from "@/lib/human/types";

const inputCls =
  "border border-tan bg-cream-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent w-full";
const labelCls = "font-sans text-[11px] uppercase tracking-wider text-brown mb-1.5 block";

// Matches MusicCapsule.tsx's hardcoded MOODS record — adding a new mood key
// here does nothing on the public page unless it's also added there.
const MOODS = [
  { key: "arabic", label: "Arabic" },
  { key: "quiet", label: "Quiet" },
  { key: "english", label: "English" },
  { key: "dancing", label: "Dancing" },
  { key: "jazz", label: "Jazz" },
  { key: "turkish", label: "Turkish" },
];

function MoodCheckboxes({ mood, onChange }: { mood: string[]; onChange: (mood: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {MOODS.map((m) => (
        <label key={m.key} className="flex items-center gap-1.5 text-xs text-brown">
          <input
            type="checkbox"
            checked={mood.includes(m.key)}
            onChange={(e) => onChange(e.target.checked ? [...mood, m.key] : mood.filter((x) => x !== m.key))}
          />
          {m.label}
        </label>
      ))}
    </div>
  );
}

export default function TracksManager({ tracks }: { tracks: Track[] }) {
  const [allTracks, setAllTracks] = useState([...tracks].sort((a, b) => a.sort_order - b.sort_order));
  const [adding, setAdding] = useState(false);

  async function move(track: Track, dir: -1 | 1) {
    const sorted = [...allTracks].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((t) => t.id === track.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const updated = sorted.map((t) => {
      if (t.id === a.id) return { ...t, sort_order: b.sort_order };
      if (t.id === b.id) return { ...t, sort_order: a.sort_order };
      return t;
    });
    setAllTracks(updated);
    await reorderTracks([
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order },
    ]);
  }

  async function remove(track: Track) {
    setAllTracks((all) => all.filter((t) => t.id !== track.id));
    await deleteTrack(track.id);
  }

  function replaceTrack(updated: Track) {
    setAllTracks((all) => all.map((t) => (t.id === updated.id ? updated : t)));
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl italic text-ink">Tracks</h1>
        <button
          onClick={() => setAdding((v) => !v)}
          className="bg-ink px-4 py-2 text-xs uppercase tracking-widest text-cream hover:bg-accent"
        >
          {adding ? "Cancel" : "Add track"}
        </button>
      </div>

      {adding && (
        <AddTrackForm
          nextSortOrder={allTracks.length}
          onChange={(next) => {
            setAllTracks(next.sort((a, b) => a.sort_order - b.sort_order));
            setAdding(false);
          }}
        />
      )}

      <div className="flex flex-col gap-3">
        {allTracks.map((track) => (
          <TrackRow key={track.id} track={track} onSave={replaceTrack} onMove={move} onDelete={remove} />
        ))}
        {allTracks.length === 0 && <p className="text-sm text-brown">No tracks yet.</p>}
      </div>
    </div>
  );
}

function TrackRow({
  track,
  onSave,
  onMove,
  onDelete,
}: {
  track: Track;
  onSave: (t: Track) => void;
  onMove: (t: Track, dir: -1 | 1) => void;
  onDelete: (t: Track) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist ?? "");
  const [year, setYear] = useState(track.year ?? "");
  const [mood, setMood] = useState<string[]>(track.mood);
  const [fragment, setFragment] = useState(track.fragment ?? "");
  const [side, setSide] = useState(track.side ?? "");
  const [room, setRoom] = useState(track.room ?? "");
  const [note, setNote] = useState(track.note ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    const res = await upsertTrack({
      id: track.id,
      title,
      artist: artist || null,
      year: year || null,
      mood,
      fragment: fragment || null,
      side: side || null,
      room: room || null,
      note: note || null,
      storage_path: track.storage_path,
      sort_order: track.sort_order,
      status: track.status,
    });
    setSaving(false);
    if (!("error" in res)) {
      onSave({
        ...track,
        title,
        artist: artist || null,
        year: year || null,
        mood,
        fragment: fragment || null,
        side: side || null,
        room: room || null,
        note: note || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function toggleStatus() {
    const status = track.status === "published" ? "draft" : "published";
    const res = await upsertTrack({
      id: track.id,
      title: track.title,
      artist: track.artist,
      year: track.year,
      mood: track.mood,
      fragment: track.fragment,
      side: track.side,
      room: track.room,
      note: track.note,
      storage_path: track.storage_path,
      sort_order: track.sort_order,
      status,
    });
    if (!("error" in res)) onSave({ ...track, status });
  }

  return (
    <div className="border border-tan">
      <button className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={() => setOpen((v) => !v)}>
        <div>
          <span className="font-serif text-base italic text-ink mr-3">{track.title}</span>
          <span className="text-xs text-brown">{track.artist}</span>
        </div>
        <span className="text-xs text-brown uppercase tracking-wider">{track.status}</span>
      </button>
      {open && (
        <div className="border-t border-tan p-4 flex flex-col gap-3">
          <audio controls src={mediaUrl(track.storage_path)} className="w-full" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Title</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Artist</label>
              <input className={inputCls} value={artist} onChange={(e) => setArtist(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Year / era label</label>
              <input className={inputCls} value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. Archive 01" />
            </div>
            <div>
              <label className={labelCls}>Side</label>
              <input className={inputCls} value={side} onChange={(e) => setSide(e.target.value)} placeholder="A" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Room (overrides the mood&apos;s default room)</label>
            <input className={inputCls} value={room} onChange={(e) => setRoom(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Fragment (short line shown while playing)</label>
            <input className={inputCls} value={fragment} onChange={(e) => setFragment(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Note</label>
            <textarea className={inputCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Mood</label>
            <MoodCheckboxes mood={mood} onChange={setMood} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="bg-ink px-4 py-2 text-xs uppercase tracking-widest text-cream hover:bg-accent disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {saved && <span className="text-xs text-brown">Saved</span>}
            <button onClick={() => onMove(track, -1)} className="text-xs text-brown hover:text-accent">
              ↑
            </button>
            <button onClick={() => onMove(track, 1)} className="text-xs text-brown hover:text-accent">
              ↓
            </button>
            <button onClick={toggleStatus} className="text-xs uppercase tracking-wider text-brown hover:text-accent">
              {track.status === "published" ? "Published — click to unpublish" : "Draft — click to publish"}
            </button>
            <button onClick={() => onDelete(track)} className="ml-auto text-xs uppercase tracking-wider text-brown hover:text-accent">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddTrackForm({
  nextSortOrder,
  onChange,
}: {
  nextSortOrder: number;
  onChange: (tracks: Track[]) => void;
}) {
  const [pending, setPending] = useState<{ path: string; previewUrl: string } | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [year, setYear] = useState("");
  const [mood, setMood] = useState<string[]>([]);
  const [fragment, setFragment] = useState("");
  const [side, setSide] = useState("");
  const [room, setRoom] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!pending) return;
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await upsertTrack({
      title,
      artist: artist || null,
      year: year || null,
      mood,
      fragment: fragment || null,
      side: side || null,
      room: room || null,
      note: note || null,
      storage_path: pending.path,
      sort_order: nextSortOrder,
      status: "published",
    });
    setSaving(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase.from("tracks").select("*").order("sort_order");
    onChange((data ?? []) as Track[]);
  }

  return (
    <div className="border border-dashed border-tan p-4 flex flex-col gap-3">
      <p className="text-xs uppercase tracking-wider text-brown">New track</p>

      {pending ? (
        <>
          <audio controls src={pending.previewUrl} className="w-full" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Title</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
            </div>
            <div>
              <label className={labelCls}>Artist</label>
              <input className={inputCls} value={artist} onChange={(e) => setArtist(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Year / era label</label>
              <input className={inputCls} value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. Archive 01" />
            </div>
            <div>
              <label className={labelCls}>Side</label>
              <input className={inputCls} value={side} onChange={(e) => setSide(e.target.value)} placeholder="A" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Room (overrides the mood&apos;s default room)</label>
            <input className={inputCls} value={room} onChange={(e) => setRoom(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Fragment (short line shown while playing)</label>
            <input className={inputCls} value={fragment} onChange={(e) => setFragment(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Note</label>
            <textarea className={inputCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Mood</label>
            <MoodCheckboxes mood={mood} onChange={setMood} />
          </div>

          {error && <p className="text-xs text-accent">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              onClick={add}
              disabled={saving}
              className="self-start bg-ink px-4 py-2 text-xs uppercase tracking-widest text-cream hover:bg-accent disabled:opacity-50"
            >
              {saving ? "Adding…" : "Add"}
            </button>
            <button onClick={() => setPending(null)} disabled={saving} className="text-xs text-brown hover:text-accent">
              Replace file
            </button>
          </div>
        </>
      ) : (
        <AudioUpload pathPrefix="music" onUploaded={(path, previewUrl) => setPending({ path, previewUrl })} />
      )}
    </div>
  );
}
