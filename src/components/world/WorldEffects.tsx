"use client";

import { useEffect } from "react";
import { initWorldEffects } from "@/lib/world/world-effects";

/**
 * Mounts the ported world.js atmosphere layer once the landing page's DOM
 * (container/left/right/divider/aura/etc.) is present. Renders nothing
 * itself — it's a behavior-only component.
 */
export default function WorldEffects() {
  useEffect(() => {
    const cleanup = initWorldEffects();
    return cleanup;
  }, []);

  return null;
}
