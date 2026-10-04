"use client";

import { useEffect, useState } from "react";
import { useWorld } from "../store";

/**
 * Arrival (design doc §21, 00:00): first visits only. Today's three intro
 * lines fade in on cream; on the third, a single vertical hairline of light
 * appears — the Seam — and the cream lifts away while the camera pulls in
 * on the building. Skippable at any moment.
 */
export function Arrival() {
  const arrival = useWorld((s) => s.arrival);
  const reduced = useWorld((s) => s.reducedMotion);
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (!arrival) return;
    const k = reduced ? 0.35 : 1;
    const t = [
      setTimeout(() => setStep(1), 400 * k),
      setTimeout(() => setStep(2), 1400 * k),
      setTimeout(() => setStep(3), 2400 * k),
      setTimeout(() => setStep(4), 3300 * k),
      setTimeout(() => setLeaving(true), 4600 * k),
      setTimeout(() => useWorld.setState({ arrival: false }), 5300 * k),
    ];
    return () => t.forEach(clearTimeout);
  }, [arrival, reduced]);
  if (!arrival) return null;
  const skip = () => {
    setLeaving(true);
    setTimeout(() => useWorld.setState({ arrival: false }), 300);
  };
  return (
    <div className={`arrival${leaving ? " leaving" : ""}`} onClick={skip} role="presentation">
      <h1 className="sr-only">Ameer Al-Butaihi</h1>
      <p className={`arrival-line${step >= 1 ? " on" : ""}`}>I don&apos;t chase things.</p>
      <p className={`arrival-line${step >= 2 ? " on" : ""}`}>They just keep being interesting.</p>
      <p className={`arrival-line arrival-third${step >= 3 ? " on" : ""}`}>I arrived here by curiosity. You probably did too.</p>
      <span className={`arrival-seam${step >= 4 ? " on" : ""}`} aria-hidden="true" />
      <button type="button" className="arrival-skip" onClick={skip}>
        Enter
      </button>
    </div>
  );
}
