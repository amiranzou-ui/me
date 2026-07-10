"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { unlockAudio, sndClick, sndElevatorMove, sndDing } from "@/lib/human/audio";
import { events } from "@/lib/world/core";
import type { Category } from "@/lib/human/types";

/**
 * Ported from legacy/js/archive.js — the friend gate, archive hall, and
 * elevator-ride navigation between chapters. Sidebar clicks while already
 * inside a chapter don't switch directly; they show a "return to floor 00"
 * notice instead, matching the original's elevator metaphor (you have to
 * go back to the lobby to change floors).
 *
 * Not ported: `visited` chapter tracking and #final-scene/#chapter-card —
 * confirmed dead code, never rendered by the current JS (see ARCHITECTURE.md
 * commit notes). The legacy "pick-screen" chooser is dead code too (always
 * hidden on load by this same module) and isn't reproduced here at all.
 */

// The real password from legacy/js/archive.js (there it was lightly
// XOR-obfuscated; kept plain here since it's a soft pacing gate, not real
// security — same call already made in the original). Could move to a
// Studio-editable config table in a later pass.
const GATE_PASSWORD = "ameer.is.off";

type TransClass = "" | "visible" | "hold" | "fading";
type ElevatorState = {
  visible: boolean;
  moving: boolean;
  from: string;
  to: string;
  counter: string;
  status: string;
  arrived: boolean;
};

const IDLE_ELEVATOR: ElevatorState = { visible: false, moving: false, from: "00", to: "00", counter: "00", status: "", arrived: false };

export function useArchive() {
  const [accessLevel, setAccessLevel] = useState<"friend" | "visitor" | null>(null);
  const [gateReady, setGateReady] = useState(false);
  const [archiveHallVisible, setArchiveHallVisible] = useState(false);
  const [insideChapter, setInsideChapter] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [bgNumeral, setBgNumeral] = useState("I");
  const [transClass, setTransClass] = useState<TransClass>("");
  const [elevator, setElevator] = useState<ElevatorState>(IDLE_ELEVATOR);
  const [sectionNotice, setSectionNotice] = useState<{ label: string; title: string } | null>(null);
  const [musicOpen, setMusicOpen] = useState(false);
  const [bottomRevealed, setBottomRevealed] = useState(false);
  const [lockPulse, setLockPulse] = useState<string | null>(null);

  const currentFloorRef = useRef("00");
  const insideChapterRef = useRef(false);
  useEffect(() => {
    insideChapterRef.current = insideChapter;
  }, [insideChapter]);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    // Reading sessionStorage must happen post-mount (SSR has no access to
    // it, and reading during render would risk a hydration mismatch) —
    // this is the one legitimate case for a synchronous setState-in-effect
    // here, not a derived-state anti-pattern.
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem("archive_access");
    } catch {
      /* no-op */
    }
    if (saved === "friend" || saved === "visitor") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccessLevel(saved);
      setArchiveHallVisible(true);
    }
    setGateReady(true);

    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach(clearTimeout);
    };
  }, []);

  const passGate = useCallback((level: "friend" | "visitor") => {
    try {
      sessionStorage.setItem("archive_access", level);
    } catch {
      /* no-op */
    }
    setAccessLevel(level);
    schedule(() => setArchiveHallVisible(true), 700);
  }, [schedule]);

  function trans(state: TransClass) {
    setTransClass(state);
  }

  const returnToArchive = useCallback(() => {
    sndClick(0.18);
    events.emit("archive:returning");
    trans("visible");
    schedule(() => {
      trans("hold");
      setInsideChapter(false);
      const fromNum = currentFloorRef.current;
      if (fromNum === "00") {
        schedule(() => {
          trans("visible");
          schedule(() => {
            setElevator(IDLE_ELEVATOR);
            trans("hold");
            setArchiveHallVisible(true);
            schedule(() => trans("fading"), 80);
          }, 700);
        }, 0);
        return;
      }
      setElevator({ visible: true, moving: true, from: fromNum, to: "00", counter: fromNum, status: "DESCENDING", arrived: false });
      schedule(() => sndElevatorMove(), 150);
      const from = parseInt(fromNum, 10);
      const steps = from || 1;
      const step = Math.min(380, Math.max(130, 1200 / steps));
      let cur = from;
      const tick = () => {
        cur--;
        const label = cur < 10 ? "0" + cur : String(cur);
        setElevator((e) => ({ ...e, counter: label }));
        sndClick(0.05);
        if (cur > 0) {
          schedule(tick, step);
        } else {
          setElevator((e) => ({ ...e, moving: false, status: "LOBBY", arrived: true }));
          currentFloorRef.current = "00";
          schedule(() => sndDing(), 80);
          schedule(() => {
            trans("visible");
            schedule(() => {
              setElevator(IDLE_ELEVATOR);
              trans("hold");
              setArchiveHallVisible(true);
              schedule(() => trans("fading"), 80);
            }, 700);
          }, 1800);
        }
      };
      schedule(tick, 400);
    }, 720);
  }, [schedule]);

  // MusicCapsule's "← Back" button emits this — if we're inside a chapter,
  // treat it like clicking nav-back: ride the elevator down to the lobby.
  useEffect(() => {
    const off = events.on("music:closed-by-user", () => {
      if (insideChapterRef.current) returnToArchive();
    });
    return off;
  }, [returnToArchive]);

  const revealContent = useCallback((slug: string) => {
    setActiveCategory(slug);
    setInsideChapter(true);
    if (slug === "music") setMusicOpen(true);
    schedule(() => setBottomRevealed(true), 900);
  }, [schedule]);

  const startElevator = useCallback((category: Category) => {
    const fromNum = currentFloorRef.current;
    const toNum = String(category.sort_order + 1).padStart(2, "0");

    setElevator({ visible: true, moving: true, from: fromNum, to: toNum, counter: fromNum, status: "ASCENDING", arrived: false });
    schedule(() => sndElevatorMove(), 150);

    const from = parseInt(fromNum, 10);
    const to = parseInt(toNum, 10);
    const steps = Math.abs(to - from) || 1;
    const step = Math.min(420, Math.max(150, 1300 / steps));

    let cur = from;
    const tick = () => {
      cur++;
      const label = cur < 10 ? "0" + cur : "" + cur;
      setElevator((e) => ({ ...e, counter: label }));
      sndClick(0.055);
      if (cur < to) {
        schedule(tick, step);
      } else {
        setElevator((e) => ({ ...e, moving: false, status: "ARRIVED", arrived: true }));
        currentFloorRef.current = toNum;
        schedule(() => sndDing(), 80);
        schedule(() => {
          trans("visible");
          schedule(() => {
            setElevator(IDLE_ELEVATOR);
            trans("hold");
            revealContent(category.slug);
            schedule(() => trans("fading"), 320);
          }, 620);
        }, 2000);
      }
    };
    schedule(tick, 460);
  }, [schedule, revealContent]);

  const enterChapter = useCallback((category: Category) => {
    unlockAudio();
    sndClick(0.22);
    trans("visible");
    schedule(() => {
      setArchiveHallVisible(false);
      trans("hold");
      schedule(() => {
        trans("fading");
        startElevator(category);
      }, 80);
    }, 720);
  }, [schedule, startElevator]);

  const flashLocked = useCallback((slug: string) => {
    setLockPulse(slug);
    schedule(() => setLockPulse(null), 500);
  }, [schedule]);

  const handleChapterClick = useCallback((category: Category) => {
    if (category.is_locked && accessLevel === "visitor") {
      flashLocked(category.slug);
      return;
    }
    enterChapter(category);
  }, [accessLevel, flashLocked, enterChapter]);

  const handleChapterHover = useCallback((category: Category) => {
    setBgNumeral(category.roman);
    unlockAudio();
    sndClick(0.07);
  }, []);

  const showSectionNotice = useCallback((category: Category) => {
    sndClick(0.09);
    setSectionNotice({ label: `CHAPTER ${category.roman}`, title: category.label });
    schedule(() => setSectionNotice(null), 3000);
  }, [schedule]);

  const handleSidebarClick = useCallback((category: Category) => {
    if (!insideChapter || category.slug === activeCategory) return;
    showSectionNotice(category);
  }, [insideChapter, activeCategory, showSectionNotice]);

  return {
    gateReady,
    accessLevel,
    passGate,
    archiveHallVisible,
    insideChapter,
    activeCategory,
    bgNumeral,
    transClass,
    elevator,
    sectionNotice,
    musicOpen,
    setMusicOpen,
    bottomRevealed,
    lockPulse,
    handleChapterClick,
    handleChapterHover,
    handleSidebarClick,
    returnToArchive,
    GATE_PASSWORD,
  };
}
