"use client";

import { useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/human/types";
import { mediaUrl } from "@/lib/supabase/media";
import { playTonearmSfx } from "@/lib/human/tonearm-sfx";
import { events } from "@/lib/world/core";

const MOODS: Record<string, { label: string; color: string; room: string; desc: string }> = {
  arabic: { label: "Arabic", color: "#c4a06a", room: "The Sharqi Room", desc: "When the oud speaks, the heart answers." },
  quiet: { label: "Quiet", color: "#8baab8", room: "After Midnight", desc: "The hour when rooms remember themselves." },
  english: { label: "English", color: "#c4b49a", room: "The Archive", desc: "Songs kept in a box under the bed." },
  dancing: { label: "Dancing", color: "#c4622d", room: "Moving Alone", desc: "When the body knows before the mind does." },
  jazz: { label: "Jazz", color: "#7a8fc4", room: "The Blue Hour", desc: "Smoke and brass and something unfinished." },
  turkish: { label: "Turkish", color: "#c4806a", room: "The Bosphorus", desc: "Melodies that cross water and don't come back." },
};

const PRESENCE = [
  "i didn't skip this one",
  "this felt different back then",
  "i remember where i was",
  "some things don't need words",
  "still not sure why this stayed",
  "yeah. that.",
  "it was playing when —",
  "i kept this one",
];

function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const TONEARM_PARKED = -58;
const TONEARM_PLAY = 6;
const TONEARM_SWEEP = 18;

export default function MusicCapsule({
  tracks,
  open,
  onClose,
}: {
  tracks: Track[];
  open: boolean;
  onClose: () => void;
}) {
  const [trackIdx, setTrackIdx] = useState(() => {
    if (typeof window === "undefined") return 0;
    const raw = parseInt(localStorage.getItem("music_track_v1") || "0", 10);
    return Number.isFinite(raw) && raw >= 0 && raw < tracks.length ? raw : 0;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [presence, setPresence] = useState<string | null>(null);
  const [discRevealed, setDiscRevealed] = useState(false);
  const [fragmentRevealed, setFragmentRevealed] = useState(false);
  const [fragmentFade, setFragmentFade] = useState(false);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const tonearmRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const capsuleRef = useRef<HTMLDivElement>(null);

  const track = tracks[trackIdx];
  const presencePool = useRef<string[]>(shuffle(PRESENCE));

  // ── Persist + sync media session on track change ──
  useEffect(() => {
    try {
      localStorage.setItem("music_track_v1", String(trackIdx));
    } catch {
      /* no-op */
    }
  }, [trackIdx]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !track) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist ?? "Unknown Artist",
      album: "Listening Room",
    });
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [track, isPlaying]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      playTonearmSfx("off");
      audio.pause();
      setIsPlaying(false);
    } else {
      playTonearmSfx("on");
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  function selectTrack(i: number) {
    if (i < 0 || i >= tracks.length) return;
    playTonearmSfx("off");
    setTrackIdx(i);
    setFragmentFade(true);
    setTimeout(() => setFragmentFade(false), 340);

    const audio = audioRef.current;
    const next = tracks[i];
    if (!audio || !next) return;
    audio.src = mediaUrl(next.storage_path);
    audio.load();
    playTonearmSfx("on");
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }

  function goPrev() {
    selectTrack((trackIdx - 1 + tracks.length) % tracks.length);
  }
  function goNext() {
    selectTrack((trackIdx + 1) % tracks.length);
  }
  function seekBy(s: number) {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + s));
  }

  const wakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function wakeUp() {
    setControlsVisible(true);
    if (wakeTimer.current) clearTimeout(wakeTimer.current);
    wakeTimer.current = setTimeout(() => setControlsVisible(false), 2800);
  }

  // ── Auto-advance when a track ends ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setTimeout(() => selectTrack((trackIdx + 1) % tracks.length), 3000 + Math.random() * 2000);
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIdx]);

  // ── Progress display ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const sync = () => setProgress({ current: audio.currentTime, duration: audio.duration || 0 });
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("loadedmetadata", sync);
    audio.addEventListener("waiting", () => setIsLoading(true));
    audio.addEventListener("stalled", () => setIsLoading(true));
    audio.addEventListener("playing", () => setIsLoading(false));
    audio.addEventListener("canplay", () => setIsLoading(false));
    return () => audio.removeEventListener("timeupdate", sync);
  }, []);

  // ── Open/close reveal choreography ──
  useEffect(() => {
    if (!open) {
      // Deliberately reset so the staggered reveal (disc, then fragment)
      // replays each time the capsule re-opens, not just on first mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDiscRevealed(false);
      setFragmentRevealed(false);
      return;
    }
    const audio = audioRef.current;
    if (audio && track) {
      const wanted = mediaUrl(track.storage_path);
      if (!audio.src.endsWith(track.storage_path)) {
        audio.src = wanted;
        audio.load();
      }
    }
    const t1 = setTimeout(() => setDiscRevealed(true), 700);
    const t2 = setTimeout(() => setFragmentRevealed(true), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close quietly when the archive is returning to the lobby via nav-back.
  useEffect(() => events.on("archive:returning", onClose), [onClose]);

  function handleBackClick() {
    onClose();
    events.emit("music:closed-by-user");
  }

  // ── Keyboard ──
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      wakeUp();
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === "ArrowRight" || e.key === "l") {
        e.preventDefault();
        seekBy(10);
      }
      if (e.key === "ArrowLeft" || e.key === "j") {
        e.preventDefault();
        seekBy(-10);
      }
      if (e.key === "n") goNext();
      if (e.key === "p") goPrev();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isPlaying, trackIdx]);

  // ── The big RAF loop: spin, tilt, tonearm, visualizer, presence ──
  useEffect(() => {
    let rafId: number;
    let lastFrame = Date.now();
    let lastActivity = Date.now();
    let spinAngle = 0;
    let spinSpeed = 0;
    let tiltX = 18,
      tiltY = -6,
      targetTiltX = 18,
      targetTiltY = -6;
    let breathPhase = 0;
    let tonearmAngle = TONEARM_PARKED;
    let tonearmTargetAngle = TONEARM_PARKED;
    let tonearmDriftPhase = 0;
    let tonearmVisualProgress = 0;
    let vizDist = 0,
      targetVizDist = 0,
      vizColl = 0,
      targetVizColl = 0;
    let listenTime = 0;
    let presenceNextAt = 10000 + Math.random() * 7000;
    let presenceActiveLocal = false;

    function onSceneMove(e: MouseEvent) {
      wakeUp();
      const r = sceneRef.current!.getBoundingClientRect();
      targetTiltX = 18 - ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * 9;
      targetTiltY = -6 + ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 9;
    }
    function onSceneLeave() {
      targetTiltX = 18;
      targetTiltY = -6;
    }
    const scene = sceneRef.current;
    scene?.addEventListener("mousemove", onSceneMove);
    scene?.addEventListener("mouseleave", onSceneLeave);

    function scheduleViz() {
      return setTimeout(() => {
        const r = Math.random();
        if (r < 0.42) {
          targetVizDist = 0;
          targetVizColl = 0;
        } else if (r < 0.72) {
          targetVizDist = 0.4 + Math.random() * 0.4;
          targetVizColl = Math.random() * 0.2;
        } else {
          targetVizDist = Math.random() * 0.3;
          targetVizColl = 0.5 + Math.random() * 0.4;
        }
        vizTimer = scheduleViz();
      }, 7000 + Math.random() * 9000);
    }
    let vizTimer = scheduleViz();

    function drawViz(energy: number, wake: number, ctx: CanvasRenderingContext2D) {
      ctx.clearRect(0, 0, 380, 380);
      const cx = 190,
        cy = 190,
        baseR = 132,
        maxH = 50;
      const bars = 64;
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        let norm = 0.03;
        if (vizDist > 0.01) {
          const n = Math.sin(i * 2.5 + breathPhase * 3.5) * 0.5 + 0.5;
          norm = norm * (1 - vizDist) + norm * (0.25 + n * 1.5) * vizDist;
          norm = Math.min(1, Math.max(0, norm));
        }
        const collW = Math.max(0, Math.cos(angle + 0.9));
        norm *= 1 - vizColl * collW * 0.92;
        const len = norm * maxH * wake + (isPlaying ? 1 : 0.4);
        const alpha = (0.18 + norm * 0.75) * wake;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * baseR, cy + Math.sin(angle) * baseR);
        ctx.lineTo(cx + Math.cos(angle) * (baseR + len), cy + Math.sin(angle) * (baseR + len));
        ctx.strokeStyle = `rgba(196,160,100,${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    function loop() {
      rafId = requestAnimationFrame(loop);
      const now = Date.now();
      const dt = Math.min(now - lastFrame, 50);
      lastFrame = now;

      const isIdle = now - lastActivity > 6000;
      const wake = isIdle ? 0.55 : 1.0;
      breathPhase += dt * 0.00018;

      let energy = 0;
      if (isPlaying) {
        energy = Math.max(0.06, 0.14 + Math.sin(now * 0.0022) * 0.04 + Math.sin(now * 0.0007 + 1.4) * 0.03);
      }

      if (isPlaying) {
        spinSpeed += (0.95 * wake - spinSpeed) * 0.018;
      } else {
        spinSpeed = 0;
      }
      spinAngle += spinSpeed;
      tiltX += (targetTiltX - tiltX) * 0.055;
      tiltY += (targetTiltY - tiltY) * 0.055;
      if (discRef.current) {
        discRef.current.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) rotateZ(${spinAngle.toFixed(2)}deg)`;
      }

      if (open) {
        tonearmDriftPhase += dt * (isPlaying ? 0.0012 : 0.0004);
        tonearmVisualProgress = isPlaying ? Math.min(1, tonearmVisualProgress + dt / 90000) : 0;
        if (tonearmRef.current) {
          let angle = TONEARM_PARKED;
          if (isPlaying) {
            const drift = Math.sin(tonearmDriftPhase) * 1.2 + Math.sin(tonearmDriftPhase * 0.45 + 1.1) * 0.55;
            angle = TONEARM_PLAY + tonearmVisualProgress * TONEARM_SWEEP + drift + energy * 0.6;
          }
          tonearmTargetAngle = angle;
          const ease = isPlaying ? Math.min(0.05, dt * 0.0018) : Math.min(0.08, dt * 0.0024);
          tonearmAngle += (tonearmTargetAngle - tonearmAngle) * ease;
          tonearmRef.current.style.setProperty("--tonearm-angle", `${tonearmAngle.toFixed(2)}deg`);
          tonearmRef.current.classList.toggle("playing", isPlaying);
        }
      }

      vizDist += (targetVizDist - vizDist) * 0.007;
      vizColl += (targetVizColl - vizColl) * 0.007;
      if (canvasRef.current) drawViz(energy, wake, canvasRef.current.getContext("2d")!);

      if (isPlaying) {
        listenTime += dt;
        if (!presenceActiveLocal && listenTime >= presenceNextAt) {
          presenceActiveLocal = true;
          if (!presencePool.current.length) presencePool.current = shuffle(PRESENCE);
          const text = presencePool.current.shift()!;
          setPresence(text);
          setTimeout(() => setPresence(null), 4800);
          setTimeout(() => {
            presenceActiveLocal = false;
          }, 7000);
          listenTime = 0;
          presenceNextAt = 13000 + Math.random() * 10000;
        }
      }
    }
    rafId = requestAnimationFrame(loop);

    function onActivity() {
      lastActivity = Date.now();
    }
    const capsule = capsuleRef.current;
    capsule?.addEventListener("mousemove", onActivity);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(vizTimer);
      scene?.removeEventListener("mousemove", onSceneMove);
      scene?.removeEventListener("mouseleave", onSceneLeave);
      capsule?.removeEventListener("mousemove", onActivity);
    };
  }, [open, isPlaying]);

  const filteredTracks = tracks
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => !activeMood || t.mood.includes(activeMood));
  const moodColor = activeMood ? MOODS[activeMood]?.color : "#c4b49a";
  const moodDesc = activeMood ? MOODS[activeMood]?.desc : "Every song is a room. You choose which one to enter.";
  const moodRoom = activeMood ? MOODS[activeMood]?.room : "Listening Room";

  return (
    <>
      <div id="mc-backdrop" className={open ? "open" : ""} onClick={onClose} />
      <div
        id="music-capsule"
        className={open ? "open" : ""}
        ref={capsuleRef}
        style={{ "--mc-mood-color": moodColor } as React.CSSProperties}
        onWheel={(e) => {
          e.preventDefault();
          wakeUp();
          if (e.deltaY > 0) goNext();
          else goPrev();
        }}
      >
        <div className="mc-frame-corner mc-fc-tl" />
        <div className="mc-frame-corner mc-fc-tr" />
        <div className="mc-frame-corner mc-fc-bl" />
        <div className="mc-frame-corner mc-fc-br" />

        <div className="mc-topbar">
          <span className="mc-top-name">II</span>
          <button className="mc-top-back" type="button" onClick={handleBackClick}>
            ← Back
          </button>
        </div>
        <div className="mc-top-rule" />
        <span className="mc-close-hint" onClick={onClose}>
          esc
        </span>
        <div className="mc-archive-head">
          <span className="mc-ah-label">Private Listening Archive</span>
          <span className="mc-ah-copy">Room Copy / After Midnight</span>
        </div>

        <div className="mc-player-col">
          <div className="mc-scene" ref={sceneRef}>
            <canvas className="mc-canvas" width={380} height={380} ref={canvasRef} />
            <div className="mc-platter" />
            <div className={`mc-disc-3d${discRevealed ? " revealed" : ""}`} ref={discRef} onClick={togglePlay}>
              <div className="mc-disc-label" />
            </div>
            <div className="mc-tonearm-assy">
              <div className="mc-tonearm-pivot" />
              <div className="mc-tonearm-arm" ref={tonearmRef} />
            </div>
            <div className="mc-scene-meta">
              <span className="mc-scene-tag">Needle Warm</span>
              <span className="mc-scene-tag">Lamp Low</span>
              <span className="mc-scene-tag">Room Tone</span>
            </div>
          </div>

          <p className={`mc-fragment-text${fragmentRevealed ? " revealed" : ""}${fragmentFade ? " fade" : ""}`}>
            {track?.fragment}
          </p>

          <div
            className="mc-progress"
            onClick={(e) => {
              const audio = audioRef.current;
              const rect = e.currentTarget.getBoundingClientRect();
              if (audio?.duration) audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
            }}
          >
            <div
              className="mc-progress-fill"
              style={{ width: progress.duration ? `${(progress.current / progress.duration) * 100}%` : "0%" }}
            />
          </div>
          <div className="mc-time-row">
            <span className="mc-time">{formatTime(progress.current)}</span>
            <span className="mc-time">{progress.duration ? formatTime(progress.duration) : "0:00"}</span>
          </div>

          <div className={`mc-controls${controlsVisible ? " visible" : ""}`}>
            <button className="mc-btn" title="Back 10 seconds" onClick={() => seekBy(-10)}>
              « 10
            </button>
            <button className={`mc-btn mc-btn-play${isPlaying ? " is-playing" : ""}${isLoading ? " is-loading" : ""}`} onClick={togglePlay} />
            <button className="mc-btn" title="Forward 10 seconds" onClick={() => seekBy(10)}>
              10 »
            </button>
          </div>
        </div>

        <p className={`mc-presence${presence ? " visible" : ""}`}>{presence}</p>

        <div className="mc-room-panel">
          <div className="mc-room-watermark">{moodRoom}</div>
          <div className="mc-mood-row">
            {Object.entries(MOODS).map(([key, m]) => (
              <button
                key={key}
                className={`mc-mood-btn${activeMood === key ? " active" : ""}`}
                style={{ "--mc-btn-c": m.color } as React.CSSProperties}
                onClick={() => setActiveMood(activeMood === key ? null : key)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="mc-mood-desc">{moodDesc}</p>

          <div className="mc-room-card">
            <span className="mc-room-card-label">Now Playing</span>
            <span className="mc-room-card-stamp">{track?.room ?? "Listening Room"}</span>
            <h3 className="mc-room-title">{track?.title ?? "Untitled Recording"}</h3>
            <p className="mc-room-artist">{track?.artist ?? "Unknown Artist"}</p>
            <p className="mc-room-note">{track?.note ?? track?.fragment ?? "A memory left on the turntable."}</p>
          </div>

          <div className="mc-track-head">
            <span>Recordings</span>
            <span className="mc-mood-count">{tracks.length} in archive</span>
          </div>

          <div id="mc-playlist">
            {filteredTracks.length === 0 ? (
              <div className="mc-empty-state">
                <span className="mc-empty-line">No recordings in this archive yet.</span>
                <span className="mc-empty-sub">Add tracks with mood: &quot;{activeMood}&quot;</span>
              </div>
            ) : (
              filteredTracks.map(({ t, i }) => {
                const primaryMood = t.mood[0];
                const dotColor = (primaryMood && MOODS[primaryMood]?.color) || "#c4b49a";
                return (
                  <div
                    key={t.id}
                    className={`mc-frag-item mc-pl-item${i === trackIdx ? " active" : ""}`}
                    onClick={() => selectTrack(i)}
                  >
                    <span className="mc-frag-dot" style={{ "--mc-dot-c": dotColor } as React.CSSProperties} />
                    <span className="mc-frag-body">
                      <span className="mc-frag-title">{t.title}</span>
                      <span className="mc-frag-sub">{t.fragment}</span>
                    </span>
                    <span className="mc-frag-year">{t.year}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="mc-room-foot">
            <p className="mc-room-foot-line">For nights that only make sense at low volume.</p>
            <div className="mc-room-foot-ledger">
              <span>Baghdad</span>
              <span>After Midnight</span>
              <span>Room Copy</span>
            </div>
          </div>
        </div>
      </div>

      <audio ref={audioRef} preload="auto" style={{ display: "none" }} />
    </>
  );
}
