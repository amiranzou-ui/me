"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { invalidate } from "@react-three/fiber";

/**
 * Reference-counted texture loading for content images (prints, covers,
 * the portrait). A texture is shared by everything showing the same image
 * and disposed from GPU memory a few seconds after the last user unmounts,
 * which is what lets distant zones actually release their memory.
 */
type Entry = { tex: THREE.Texture | null; refs: number; waiters: Set<(t: THREE.Texture) => void>; timer?: ReturnType<typeof setTimeout> };
const cache = new Map<string, Entry>();
const loader = typeof window !== "undefined" ? new THREE.TextureLoader() : null;

function acquire(url: string, onReady: (t: THREE.Texture) => void) {
  let e = cache.get(url);
  if (!e) {
    e = { tex: null, refs: 0, waiters: new Set() };
    cache.set(url, e);
    const entry = e;
    loader?.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        t.generateMipmaps = true;
        entry.tex = t;
        entry.waiters.forEach((w) => w(t));
        entry.waiters.clear();
        invalidate();
      },
      undefined,
      () => cache.delete(url),
    );
  }
  if (e.timer) clearTimeout(e.timer);
  e.refs++;
  if (e.tex) onReady(e.tex);
  else e.waiters.add(onReady);
  return () => {
    const entry = cache.get(url);
    if (!entry) return;
    entry.waiters.delete(onReady);
    entry.refs--;
    if (entry.refs <= 0) {
      entry.timer = setTimeout(() => {
        if (entry.refs <= 0) {
          entry.tex?.dispose();
          cache.delete(url);
        }
      }, 4000);
    }
  };
}

export function useTex(url: string | null) {
  const [tex, setTex] = useState<THREE.Texture | null>(() => (url ? (cache.get(url)?.tex ?? null) : null));
  useEffect(() => {
    if (!url) return;
    return acquire(url, setTex);
  }, [url]);
  return url ? tex : null;
}
