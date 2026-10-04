"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { leave } from "../../actions";
import { useWorld } from "../../store";
import { textureSrc, type WorldContent } from "../../content";
import { mats } from "../kit/materials";
import { Hot, useActive } from "../kit/primitives";
import { useTex } from "../kit/useTexture";

/**
 * The floating profile node, evolved (design doc §7): a round window at the
 * top of the Seam holding the portrait. Its "eyes" follow the visitor a
 * little, as the profile photo does today. Click: up to the Roof Study.
 * Hold for 1.5s: the iris closes and the Studio opens (today's hidden entry).
 * Lit from inside when it is late at night in Baghdad.
 */
export function Oculus({ content, y }: { content: WorldContent; y: number }) {
  const img = content.cv.portrait;
  const tex = useTex(img ? textureSrc(img, 640, 75) : null);
  const face = useRef<THREE.Mesh>(null);
  const reduced = useWorld((s) => s.reducedMotion);
  const active = useActive("oculus");
  const r = 1.45;
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(r, 48);
    const a = img ? img.width / img.height : 1;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    // cover-crop the portrait into the circle, biased toward the face
    const sx = a < 1 ? 1 : 1 / a;
    const sy = a < 1 ? a : 1;
    const cy = a < 1 ? 0.64 : 0.5;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, 0.5 + (uv.getX(i) - 0.5) * sx, cy + (uv.getY(i) - 0.5) * sy);
    }
    return g;
  }, [img]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#e8dcc6", toneMapped: false, map: tex }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  useEffect(() => {
    const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Baghdad" }).format(new Date()));
    const lateInBaghdad = hour >= 23 || hour < 5;
    mat.color.set(lateInBaghdad ? "#ffe9c4" : active ? "#fff3e0" : "#e8dcc6");
  }, [mat, active]);

  useFrame((state) => {
    if (!face.current || reduced) return;
    face.current.position.x += (state.pointer.x * 0.05 - face.current.position.x) * 0.06;
    face.current.position.y += (state.pointer.y * 0.04 - face.current.position.y) * 0.06;
  });

  return (
    <group position={[0, y, 0.36]}>
      <Hot
        id="oculus"
        label="The Oculus — go up to the Roof Study"
        onLongPress={() => leave("/studio")}
        marker={[0, -r - 0.25, 0.05]}
      >
        <mesh material={mats().ink} position={[0, 0, -0.05]}>
          <circleGeometry args={[r + 0.02, 48]} />
        </mesh>
        <mesh ref={face} geometry={geo} material={mat} />
        <mesh material={mats().brass}>
          <torusGeometry args={[r + 0.06, 0.07, 10, 64]} />
        </mesh>
      </Hot>
    </group>
  );
}
