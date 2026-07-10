"use client";

import { useRef, useState } from "react";
import { portal } from "@/lib/world/core";

/** Ported from the `.home-loop` section in legacy/human.html + human.js's wiring. */
export default function HomeLoop({ revealed }: { revealed: boolean }) {
  const [touchClass, setTouchClass] = useState<"" | "hl-touch-left" | "hl-touch-right">("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function expand(cls: "hl-touch-left" | "hl-touch-right") {
    if (timer.current) clearTimeout(timer.current);
    setTouchClass(cls);
    timer.current = setTimeout(() => setTouchClass(""), 5000);
  }

  function onLeftClick(e: React.MouseEvent) {
    if (window.innerWidth <= 768) {
      if (touchClass === "hl-touch-left") {
        if (timer.current) clearTimeout(timer.current);
        portal("/matrix", "#f0ebe0", e.clientX, e.clientY);
      } else {
        expand("hl-touch-left");
      }
    } else {
      portal("/matrix", "#f0ebe0", e.clientX, e.clientY);
    }
  }

  function onRightClick(e: React.MouseEvent) {
    portal("/human", "#141008", e.clientX, e.clientY);
  }

  return (
    <>
      <div className="page-bridge" style={{ display: revealed ? "block" : "none" }} />
      <section className={`home-loop ${touchClass}`} style={{ display: revealed ? "flex" : "none" }}>
        <div className="hl-corner hl-fc-tl" />
        <div className="hl-corner hl-fc-tr" />
        <div className="hl-corner hl-fc-bl" />
        <div className="hl-corner hl-fc-br" />

        <div className="hl-side" id="hl-left" onClick={onLeftClick}>
          <div className="hl-inner">
            <span className="hl-label">I</span>
            <h2 className="hl-title">Matrix Side</h2>
            <p className="hl-desc">
              Graphic Designer.
              <br />
              Social Media Manager.
              <br />
              Visual problem-solver.
            </p>
            <span className="hl-enter">Watch →</span>
          </div>
        </div>

        <div className="hl-divider">
          <div className="hl-profile">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/profile.JPG" alt="Ameer" className="hl-profile-img" />
          </div>
        </div>

        <div className="hl-side" id="hl-right" onClick={onRightClick}>
          <div className="hl-inner">
            <span className="hl-label">II</span>
            <h2 className="hl-title">Human Side</h2>
            <p className="hl-desc">
              Live music.
              <br />
              Curious mind.
              <br />
              Something else entirely.
            </p>
            <span className="hl-enter">↑ back to top</span>
          </div>
        </div>
      </section>

      <div className="closing" style={{ display: revealed ? "flex" : "none" }}>
        <div className="closing-line" />
        <p>more — eventually</p>
      </div>
    </>
  );
}
