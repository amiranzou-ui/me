"use client";

import { useEffect, useRef, useState } from "react";
import { unlockAudio, sndClick } from "@/lib/human/audio";

export default function FriendGate({
  password,
  onPass,
}: {
  password: string;
  onPass: (level: "friend" | "visitor") => void;
}) {
  const [chose, setChose] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [exiting, setExiting] = useState(false);
  const pwInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!chose) return;
    // Matches .ag-pw-wrap's max-height transition — focusing before it's
    // done expanding is unreliable in some browsers since the input still
    // sits inside a zero-height, overflow:hidden box until then.
    const t = setTimeout(() => pwInputRef.current?.focus(), 460);
    return () => clearTimeout(t);
  }, [chose]);

  function choose(role: "friend" | "visitor") {
    unlockAudio();
    sndClick(0.08);
    if (role === "visitor") {
      finish("visitor");
    } else {
      setChose(true);
    }
  }

  function finish(level: "friend" | "visitor") {
    setExiting(true);
    onPass(level);
  }

  function tryPassword() {
    const ok = pw.trim().toLowerCase() === password.toLowerCase();
    if (ok) {
      setError(false);
      sndClick(0.18);
      finish("friend");
    } else {
      setError(true);
      setShake(false);
      requestAnimationFrame(() => setShake(true));
      setPw("");
      sndClick(0.06);
    }
  }

  return (
    <div id="access-gate" className={exiting ? "exiting" : "visible"}>
      <div className="ag-inner">
        <p className="ag-eyebrow">Memory Archive</p>
        <p className="ag-question">before you enter —</p>
        <div className={`ag-choices${chose ? " chose" : ""}`}>
          <button className="ag-choice-btn" onClick={() => choose("friend")}>
            <span className="ag-ch-roman">I</span>
            <span className="ag-ch-label">we know each other</span>
          </button>
          <button className="ag-choice-btn" onClick={() => choose("visitor")}>
            <span className="ag-ch-roman">II</span>
            <span className="ag-ch-label">just visiting</span>
          </button>
        </div>
        <div className={`ag-pw-wrap${chose ? " visible" : ""}`}>
          <span className="ag-pw-roman">the word</span>
          <input
            ref={pwInputRef}
            className={`ag-pw-input${shake ? " shake" : ""}`}
            type="password"
            placeholder="…"
            autoComplete="off"
            spellCheck={false}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryPassword()}
            onAnimationEnd={() => setShake(false)}
          />
          <button className="ag-pw-submit" onClick={tryPassword}>
            →
          </button>
        </div>
        <p className={`ag-pw-err${error ? " visible" : ""}`}>that&apos;s not it.</p>
      </div>
    </div>
  );
}
