"use client";

import { useEffect, useRef } from "react";
import { portal, dom } from "@/lib/world/core";

/**
 * Ported from legacy/js/index.js: click-to-portal navigation on the two
 * split-screen sides, mobile tap-to-expand-then-portal, and the profile
 * panel open/close toggle. The keyboard "secret word" easter egg
 * (legacy/js/secret.js) is intentionally not ported yet — unrelated to
 * the core visual identity, deferred to a later pass.
 */
export default function LandingInteractions() {
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = dom.qs<HTMLElement>("#container");
    const left = dom.qs<HTMLElement>("#left");
    const right = dom.qs<HTMLElement>("#right");
    if (!container || !left || !right) return;

    const isMobile = () => window.innerWidth <= 768;

    function expandSide(add: string, remove: string) {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
      container!.classList.remove(remove);
      container!.classList.add(add);
      collapseTimer.current = setTimeout(() => container!.classList.remove(add), 5000);
    }

    const onLeftClick = (e: MouseEvent) => {
      if (isMobile()) {
        if (container!.classList.contains("touch-left")) {
          if (collapseTimer.current) clearTimeout(collapseTimer.current);
          portal("/matrix", "#f2ece0", e.clientX, e.clientY);
        } else {
          expandSide("touch-left", "touch-right");
        }
      } else {
        portal("/matrix", "#f2ece0", e.clientX, e.clientY);
      }
    };

    const onRightClick = (e: MouseEvent) => {
      if (isMobile()) {
        if (container!.classList.contains("touch-right")) {
          if (collapseTimer.current) clearTimeout(collapseTimer.current);
          portal("/human", "#141008", e.clientX, e.clientY);
        } else {
          expandSide("touch-right", "touch-left");
        }
      } else {
        portal("/human", "#141008", e.clientX, e.clientY);
      }
    };

    left.addEventListener("click", onLeftClick);
    right.addEventListener("click", onRightClick);

    // ── Profile panel ─────────────────────────────────────────
    const pnToggle = dom.qs<HTMLElement>("#pn-toggle");
    const pnPanel = dom.qs<HTMLElement>("#pn-panel");
    const pnBackdrop = dom.qs<HTMLElement>("#pn-backdrop");

    const openPanel = () => {
      pnPanel?.classList.add("open");
      pnBackdrop?.classList.add("open");
    };
    const closePanel = () => {
      pnPanel?.classList.remove("open");
      pnBackdrop?.classList.remove("open");
    };
    const onToggleClick = () => (pnPanel?.classList.contains("open") ? closePanel() : openPanel());

    pnToggle?.addEventListener("click", onToggleClick);
    pnBackdrop?.addEventListener("click", closePanel);

    return () => {
      left.removeEventListener("click", onLeftClick);
      right.removeEventListener("click", onRightClick);
      pnToggle?.removeEventListener("click", onToggleClick);
      pnBackdrop?.removeEventListener("click", closePanel);
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
  }, []);

  return null;
}
