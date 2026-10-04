"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useWorld } from "../store";
import type { WorldContent } from "../content";
import type { World } from "../stations";
import { Scene } from "./Scene";

/**
 * The one persistent canvas (design doc §26). Mounted once by the world
 * shell in the (world) layout, so it never remounts between routes: a URL
 * change only moves the camera. Renders on demand — when nothing moves,
 * nothing is drawn.
 */
export default function WorldCanvas({ world, content }: { world: World; content: WorldContent }) {
  const quality = useWorld((s) => s.quality);
  const light = quality === "light";
  return (
    <Canvas
      className="world-canvas"
      frameloop="demand"
      dpr={light ? [1, 1.5] : [1, 2]}
      gl={{ antialias: !light, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: 50, near: 0.05, far: 320, position: [0, 8, 44] }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        scene.background = new THREE.Color("#d6c9b4");
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          // Switching to "Read as page" unmounts the canvas and releases its
          // context on purpose; only an unexpected loss means the GPU gave up.
          if (useWorld.getState().readMode) return;
          useWorld.setState({ readMode: true, quality: "page" });
        });
      }}
    >
      <Scene world={world} content={content} />
    </Canvas>
  );
}
