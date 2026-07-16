"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/styles/landing.css";
import "@/styles/intro.css";

/**
 * First-visit-only entrance sequence — ported from legacy/intro.html.
 * The redirect that lands visitors here (checking localStorage's
 * seen_intro flag) lives in the root layout's beforeInteractive script.
 */
export default function IntroPage() {
  const [visible, setVisible] = useState({ l1: false, l2: false, l3: false, enter: false });

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisible((v) => ({ ...v, l1: true })), 400),
      setTimeout(() => setVisible((v) => ({ ...v, l2: true })), 1400),
      setTimeout(() => setVisible((v) => ({ ...v, l3: true })), 2400),
      setTimeout(() => setVisible((v) => ({ ...v, enter: true })), 3400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main className="landing-root">
      <div className="frame-corner fc-tl" />
      <div className="frame-corner fc-tr" />
      <div className="frame-corner fc-bl" />
      <div className="frame-corner fc-br" />

      <div id="intro-stage">
        <h1 className="sr-only">Ameer Al-Butaihi</h1>
        <p className={`intro-line${visible.l1 ? " visible" : ""}`}>I don&apos;t chase things.</p>
        <p className={`intro-line${visible.l2 ? " visible" : ""}`}>They just keep being interesting.</p>
        <p className={`intro-line intro-line-3${visible.l3 ? " visible" : ""}`}>
          I arrived here by curiosity. You probably did too.
        </p>
        <Link href="/" className={`intro-enter${visible.enter ? " visible" : ""}`}>
          Enter
        </Link>
      </div>
    </main>
  );
}
