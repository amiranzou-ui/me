"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { Vec3 } from "../../layout";
import { mats } from "../kit/materials";
import { Label } from "../kit/primitives";

/** A wall clock showing real time: the visitor's, or another zone's
 * (the Roof's second clock shows Baghdad). Today's LiveStamp, made a thing. */
export function WallClock({ pos, radius = 0.3, label, timeZone, rotY = 0 }: { pos: Vec3; radius?: number; label?: string; timeZone?: string; rotY?: number }) {
  const hour = useRef<THREE.Group>(null);
  const minute = useRef<THREE.Group>(null);
  const last = useRef(-1);
  useFrame(() => {
    const now = new Date();
    const m = now.getMinutes();
    if (m === last.current) return;
    last.current = m;
    let h = now.getHours();
    if (timeZone) {
      const parts = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "numeric", hour12: false, timeZone }).formatToParts(now);
      h = Number(parts.find((p) => p.type === "hour")?.value ?? h);
    }
    if (hour.current) hour.current.rotation.z = -((h % 12) + m / 60) * (Math.PI / 6);
    if (minute.current) minute.current.rotation.z = -m * (Math.PI / 30);
  });
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh material={mats().paper}>
        <circleGeometry args={[radius, 40]} />
      </mesh>
      <mesh position={[0, 0, -0.01]} material={mats().brass}>
        <circleGeometry args={[radius + 0.025, 40]} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[Math.sin((i * Math.PI) / 6) * radius * 0.84, Math.cos((i * Math.PI) / 6) * radius * 0.84, 0.002]} rotation={[0, 0, (-i * Math.PI) / 6]} material={mats().ink}>
          <planeGeometry args={[0.008, i % 3 === 0 ? radius * 0.16 : radius * 0.08]} />
        </mesh>
      ))}
      <group ref={hour}>
        <mesh position={[0, radius * 0.25, 0.004]} material={mats().ink}>
          <planeGeometry args={[0.018, radius * 0.5]} />
        </mesh>
      </group>
      <group ref={minute}>
        <mesh position={[0, radius * 0.36, 0.006]} material={mats().ink}>
          <planeGeometry args={[0.012, radius * 0.72]} />
        </mesh>
      </group>
      {label && (
        <Label pos={[0, -radius - 0.09, 0]} size={radius * 0.22} font="serifItalic" color="#6b5f4e">
          {label}
        </Label>
      )}
    </group>
  );
}
