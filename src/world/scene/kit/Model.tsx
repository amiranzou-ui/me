"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { KTX2Loader, type GLTFLoader } from "three-stdlib";

/**
 * The Blender → GLB pipeline's runtime end (design doc §28). Authored
 * models are optimised by `scripts/assets/build-models.mjs` (meshopt
 * geometry, KTX2 textures) into /public/world/models and listed in its
 * manifest. A <ModelSlot name="turntable"> renders that model when the
 * manifest has it, and the procedural kit piece (its children) when it
 * doesn't — so the building works today and gets richer as models arrive.
 */

type Manifest = Record<string, { file: string; scale?: number }>;
let manifest: Manifest | null = null;
let manifestPromise: Promise<Manifest> | null = null;

function loadManifest(): Promise<Manifest> {
  if (manifest) return Promise.resolve(manifest);
  manifestPromise ??= fetch("/world/models/manifest.json")
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((m: Manifest) => (manifest = m));
  return manifestPromise;
}

let ktx2: KTX2Loader | null = null;

export function useCompressedLoader() {
  const gl = useThree((s) => s.gl);
  return (loader: GLTFLoader) => {
    if (!ktx2) {
      ktx2 = new KTX2Loader().setTranscoderPath("/world/basis/").detectSupport(gl);
    }
    loader.setKTX2Loader(ktx2);
  };
}

export function GlbModel({ path, scale = 1 }: { path: string; scale?: number }) {
  const extend = useCompressedLoader();
  const { scene } = useGLTF(path, false, true, extend);
  const clone = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={clone} scale={scale} />;
}

export function ModelSlot({ name, children }: { name: string; children: ReactNode }) {
  const [entry, setEntry] = useState<Manifest[string] | null>(manifest?.[name] ?? null);
  useEffect(() => {
    let alive = true;
    void loadManifest().then((m) => alive && setEntry(m[name] ?? null));
    return () => {
      alive = false;
    };
  }, [name]);
  if (!entry) return <>{children}</>;
  return (
    <Suspense fallback={children}>
      <GlbModel path={`/world/models/${entry.file}`} scale={entry.scale} />
    </Suspense>
  );
}
