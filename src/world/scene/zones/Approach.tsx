"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { useWorld } from "../../store";
import { planDayWing, towerLevels, levelY } from "../../layout";
import type { WorldContent } from "../../content";
import { mats, INK, TAN } from "../kit/materials";
import { Hot, Label, LampLight, Slab, useActive } from "../kit/primitives";
import { Oculus } from "./Oculus";

/**
 * The Approach (design doc §7): the building front-on at dusk, composed so
 * the first stable frame reads like today's split-screen homepage — cream
 * wing left, dark tower right, a hairline of light between, the portrait
 * window at the top.
 */
export default function Approach({ content }: { content: WorldContent }) {
  const day = useMemo(() => planDayWing(content), [content]);
  const { roof } = towerLevels(content);
  const towerTop = levelY(roof);
  const lastRoom = useWorld((s) => s.lastRoom);
  const matrixHot = useActive("matrix-side");
  const humanHot = useActive("human-side");

  const dayFacade = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#efe7d8", roughness: 0.95, emissive: "#f6ecd8", emissiveIntensity: 0.3 }),
    [],
  );
  const brickFacade = useMemo(() => {
    const m = mats().brick.clone();
    m.emissive = new THREE.Color("#3a2416");
    m.emissiveIntensity = 0;
    return m;
  }, []);
  useEffect(() => {
    dayFacade.emissiveIntensity = matrixHot ? 0.5 : 0.3;
    brickFacade.emissiveIntensity = humanHot ? 0.5 : 0;
  }, [matrixHot, humanHot, dayFacade, brickFacade]);

  const ground = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e4d8c4", roughness: 1, emissive: "#e9dcc6", emissiveIntensity: 0.25 }), []);
  const wingLen = Math.abs(day.hallMinX) - 2;
  const wingCx = (day.hallMinX - 2) / 2;
  const floorsLit = useMemo(() => {
    const lit: number[] = [];
    for (let l = 1; l < roof; l++) if ((l * 7) % 3 !== 0) lit.push(l);
    return lit;
  }, [roof]);
  const lastLevel = useMemo(() => {
    const c = content.categories.find((x) => `chapter-${x.slug}` === lastRoom);
    return c?.floor ?? null;
  }, [lastRoom, content.categories]);

  return (
    <group>
      {/* ground: paper, with a path of stone slabs to the door */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 30]} material={ground}>
        <planeGeometry args={[300, 180]} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <Slab key={i} pos={[0, 0.005, 1.6 + i * 1.5]} size={[1.6, 0.012, 1.1]} mat={mats().terrazzo} edges={INK} edgeOpacity={0.18} />
      ))}

      {/* Day Wing facade (Matrix) */}
      <Hot id="matrix-side" label="Matrix Side — the Day Wing" marker={[-14, 1.6, 0.36]}>
        <Slab pos={[wingCx, 3.5, 0.15]} size={[wingLen, 7, 0.3]} mat={dayFacade} edges={INK} edgeOpacity={0.35} />
        {Array.from({ length: Math.floor(wingLen / 4) }, (_, i) => (
          <mesh key={i} position={[-4 - i * 4 - 2, 7.35, -0.8]} rotation={[0, 0, 0]} material={dayFacade}>
            <boxGeometry args={[3.96, 0.7, 1.6]} />
            <Edges color={INK} transparent opacity={0.3} />
          </mesh>
        ))}
        {Array.from({ length: Math.floor(wingLen / 6) }, (_, i) => (
          <mesh key={`w${i}`} position={[-22 - i * 6, 3.1, 0.31]} material={mats().dayWindow}>
            <planeGeometry args={[1.4, 2.6]} />
          </mesh>
        ))}
        <Label pos={[-13.6, 5.2, 0.32]} size={0.32} font="serifItalic" color="#c4b49a" anchorX="left" spacing={0.2}>
          I
        </Label>
        <Label pos={[-13.6, 4.35, 0.32]} size={1.05} font="serif" color={INK} anchorX="left" spacing={0.04}>
          Matrix Side
        </Label>
        <Label pos={[-13.6, 3.25, 0.32]} size={0.26} font="sans" color="#6b5f4e" anchorX="left" anchorY="top" lineHeight={1.9} maxWidth={6}>
          {content.cv.matrixSideDesc.join("\n")}
        </Label>
        <Label pos={[-13.6, 1.25, 0.32]} size={0.24} font="sans" color={matrixHot ? "#c4622d" : "#6b5f4e"} anchorX="left" spacing={0.15}>
          Enter →
        </Label>
      </Hot>

      {/* the lobby front with its door */}
      <Slab pos={[-3, 2.75, 0.12]} size={[2, 5.5, 0.24]} mat={mats().plasterDusk} edges={INK} edgeOpacity={0.3} />
      <Slab pos={[1.5, 2.75, 0.12]} size={[1, 5.5, 0.24]} mat={mats().plasterDusk} edges={INK} edgeOpacity={0.3} />
      <Slab pos={[0, 4.25, 0.12]} size={[2, 2.5, 0.24]} mat={mats().plasterDusk} edges={INK} edgeOpacity={0.3} />
      <Hot id="front-door" label="Enter the building" marker={[0, 3.25, 0.4]}>
        <mesh position={[0, 1.5, 0.02]} material={mats().leak}>
          <planeGeometry args={[2, 3]} />
        </mesh>
      </Hot>
      <LampLight id="approach-door" pos={[0, 3.4, 1.6]} color="#ffd29a" intensity={5} distance={9} />

      {/* the Seam: a hairline of light, the elevator's lamp travelling in it */}
      <SeamLine top={towerTop + 3} />

      {/* Night Tower facade (Human) */}
      <Hot id="human-side" label="Human Side — the Night Tower" marker={[5.2, 0.9, 0.36]}>
        <Slab pos={[9, towerTop / 2, 0.15]} size={[14, towerTop, 0.3]} mat={brickFacade} uv={0.45} edges={TAN} edgeOpacity={0.18} />
        {Array.from({ length: roof - 1 }, (_, i) => {
          const l = i + 1;
          const lit = floorsLit.includes(l) || l === lastLevel;
          const bright = l === lastLevel;
          return [6, 12].map((x) => (
            <mesh key={`${l}-${x}`} position={[x, levelY(l) + 1.9, 0.31]} material={lit ? (bright ? mats().lampGlow : mats().nightWindow) : mats().plasterDark}>
              <planeGeometry args={[1.5, 2]} />
            </mesh>
          ));
        })}
        <Label pos={[5.2, 3.25, 0.32]} size={0.3} font="serifItalic" color="#c4b49a" anchorX="left" spacing={0.2}>
          II
        </Label>
        <Label pos={[5.2, 2.45, 0.32]} size={0.95} font="serif" color="#ede4d3" anchorX="left" spacing={0.04}>
          Human Side
        </Label>
        <Label pos={[5.2, 1.6, 0.32]} size={0.22} font="sans" color="#c4b49a" anchorX="left" anchorY="top" lineHeight={1.7} maxWidth={6}>
          {content.cv.humanSideDesc.join("\n")}
        </Label>
        <Label pos={[12.4, 0.55, 0.32]} size={0.22} font="sans" color={humanHot ? "#c4622d" : "#c4b49a"} anchorX="left" spacing={0.15}>
          Feel →
        </Label>
      </Hot>
      {/* the roof study's glow above the tower */}
      <mesh position={[8, towerTop + 1.5, -6]} material={mats().glass}>
        <boxGeometry args={[8, 3, 8]} />
        <Edges color="#c4b49a" transparent opacity={0.4} />
      </mesh>
      <LampLight id="approach-roof" pos={[8, towerTop + 2, -6]} color="#ffd8a0" intensity={3} distance={8} />

      <Oculus content={content} y={towerTop + 2.4} />
    </group>
  );
}

function SeamLine({ top }: { top: number }) {
  const scan = useRef<THREE.Mesh>(null);
  const reduced = useWorld((s) => s.reducedMotion);
  useFrame((state) => {
    if (!scan.current) return;
    const t = reduced ? 0.3 : (state.clock.elapsedTime * 0.035) % 1;
    scan.current.position.y = 5.5 + t * (top - 8);
  });
  return (
    <group>
      <mesh position={[0, (top + 5.5) / 2, 0.12]} material={mats().glass}>
        <boxGeometry args={[2.4, top - 5.5, 0.2]} />
      </mesh>
      <mesh position={[0, (top + 5.5) / 2, 0.24]}>
        <planeGeometry args={[0.07, top - 5.5]} />
        <meshBasicMaterial color="#e9dcc4" toneMapped={false} transparent opacity={0.9} />
      </mesh>
      <mesh ref={scan} position={[0, 10, 0.26]} material={mats().accent}>
        <planeGeometry args={[0.1, 2.2]} />
      </mesh>
      <mesh position={[0, 5.2, 0.26]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.28, 0.28]} />
        <meshBasicMaterial color="#e9dcc4" toneMapped={false} />
      </mesh>
    </group>
  );
}
