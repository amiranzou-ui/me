"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { Edges, Text } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { act } from "../../actions";
import { useWorld } from "../../store";
import { textureSrc, type Img } from "../../content";
import type { Vec3 } from "../../layout";
import { mats, ACCENT } from "./materials";
import { registerLamp, unregisterLamp } from "./lamps";
import { useTex } from "./useTexture";
import { rig } from "../rigState";

// ── Geometry with world-scaled UVs, shared by size ─────────────────────
const geoCache = new Map<string, THREE.BufferGeometry>();

function boxGeo(w: number, h: number, d: number, density: number) {
  const key = `b${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${density}`;
  const hit = geoCache.get(key);
  if (hit) return hit;
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // face order: +x, −x, +y, −y, +z, −z (4 vertices each)
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * dims[f][0] * density, uv.getY(i) * dims[f][1] * density);
    }
  }
  geoCache.set(key, g);
  return g;
}

function planeGeo(w: number, h: number, density: number) {
  const key = `p${w.toFixed(3)}|${h.toFixed(3)}|${density}`;
  const hit = geoCache.get(key);
  if (hit) return hit;
  const g = new THREE.PlaneGeometry(w, h);
  if (density) {
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * density, uv.getY(i) * h * density);
  }
  geoCache.set(key, g);
  return g;
}

type SlabProps = {
  pos: Vec3;
  size: Vec3;
  mat: THREE.Material;
  uv?: number;
  rot?: Vec3;
  edges?: string | false;
  edgeOpacity?: number;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
};

/** A box: walls, floors, furniture. Ink linework on its edges by default. */
export function Slab({ pos, size, mat, uv = 0.5, rot, edges = false, edgeOpacity = 0.5 }: SlabProps) {
  const geo = boxGeo(size[0], size[1], size[2], uv);
  return (
    <mesh geometry={geo} material={mat} position={pos} rotation={rot}>
      {edges && <Edges color={edges} transparent opacity={edgeOpacity} threshold={20} />}
    </mesh>
  );
}

export function Panel({ pos, size, mat, uv = 0, rot }: { pos: Vec3; size: [number, number]; mat: THREE.Material; uv?: number; rot?: Vec3 }) {
  return <mesh geometry={planeGeo(size[0], size[1], uv)} material={mat} position={pos} rotation={rot} />;
}

// ── Text in the site's own faces ───────────────────────────────────────
const FONTS = {
  serif: "/fonts/cormorant-300.woff",
  serifItalic: "/fonts/cormorant-300-italic.woff",
  serifRegular: "/fonts/cormorant-400.woff",
  sans: "/fonts/inter-300.woff",
  sansMedium: "/fonts/inter-500.woff",
  type: "/fonts/special-elite.woff",
} as const;

export type LabelProps = {
  children: string;
  pos: Vec3;
  rot?: Vec3;
  size?: number;
  font?: keyof typeof FONTS;
  color?: string;
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "middle" | "bottom" | "top-baseline" | "bottom-baseline";
  maxWidth?: number;
  opacity?: number;
  spacing?: number;
  lineHeight?: number;
  align?: "left" | "center" | "right" | "justify";
  direction?: "ltr" | "rtl" | "auto";
};

/** Cormorant and Inter's latin subsets have ↑ ↓ › but not → or ↗; anything
 * missing makes the text engine fetch a fallback font from a CDN first. */
const glyphs = (t: string) => t.replace(/→/g, "›").replace(/↗/g, "›").replace(/←/g, "‹");

export function Label({
  children,
  pos,
  rot,
  size = 0.12,
  font = "serif",
  color = "#18140e",
  anchorX = "center",
  anchorY = "middle",
  maxWidth,
  opacity = 1,
  spacing = 0,
  lineHeight = 1.25,
  align = "left",
  direction = "auto",
}: LabelProps) {
  return (
    <Text
      position={pos}
      rotation={rot}
      fontSize={size}
      font={FONTS[font]}
      color={color}
      anchorX={anchorX}
      anchorY={anchorY}
      maxWidth={maxWidth}
      letterSpacing={spacing}
      lineHeight={lineHeight}
      textAlign={align}
      direction={direction}
      fillOpacity={opacity}
      sdfGlyphSize={32}
    >
      {glyphs(children)}
    </Text>
  );
}

// ── Interactive wrapper: orange = you can act here ─────────────────────
export function useActive(id: string) {
  return useWorld((s) => s.hovered?.id === id || s.focusedObject === id);
}

export function Hot({
  id,
  label,
  children,
  marker,
  onLongPress,
  longMs = 1500,
  onActivate,
}: {
  id: string;
  label: string;
  children: ReactNode;
  marker?: Vec3;
  onLongPress?: () => void;
  longMs?: number;
  onActivate?: () => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const active = useActive(id);
  const set = useWorld((s) => s.set);
  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        set({ hovered: { id, label } });
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (useWorld.getState().hovered?.id === id) set({ hovered: null });
        document.body.style.cursor = "";
        if (timer.current) clearTimeout(timer.current);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        fired.current = false;
        if (onLongPress) {
          timer.current = setTimeout(() => {
            fired.current = true;
            onLongPress();
          }, longMs);
        }
      }}
      onPointerUp={() => {
        if (timer.current) clearTimeout(timer.current);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (fired.current || rig.suppressClick) return;
        if (onActivate) onActivate();
        else act(id);
      }}
      scale={active ? 1.012 : 1}
    >
      {children}
      {marker && active && (
        <mesh position={marker} rotation={[0, 0, Math.PI / 4]} material={mats().accent}>
          <planeGeometry args={[0.05, 0.05]} />
        </mesh>
      )}
    </group>
  );
}

// ── Lamps ───────────────────────────────────────────────────────────────
export function LampLight({ id, pos, color = "#ffd9a0", intensity = 6, distance = 7, shaft }: { id: string; pos: Vec3; color?: string; intensity?: number; distance?: number; shaft?: boolean }) {
  const key = pos.join(",");
  useEffect(() => {
    registerLamp({ id, pos, color, intensity, distance, shaft });
    return () => unregisterLamp(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, key, color, intensity, distance, shaft]);
  return null;
}

export function Pendant({ id, pos, color = "#ffd9a0", intensity = 7, shade = "#2b2119", drop = 0.6, distance = 7 }: { id: string; pos: Vec3; color?: string; intensity?: number; shade?: string; drop?: number; distance?: number }) {
  const shadeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: shade, roughness: 0.7, side: THREE.DoubleSide }), [shade]);
  return (
    <group position={pos}>
      <mesh position={[0, drop / 2, 0]} material={mats().ink}>
        <cylinderGeometry args={[0.006, 0.006, drop, 4]} />
      </mesh>
      <mesh position={[0, -0.05, 0]} material={shadeMat}>
        <coneGeometry args={[0.26, 0.24, 20, 1, true]} />
      </mesh>
      <mesh position={[0, -0.13, 0]} material={mats().lampGlow}>
        <sphereGeometry args={[0.055, 10, 8]} />
      </mesh>
      <LampLight id={id} pos={[pos[0], pos[1] - 0.3, pos[2]]} color={color} intensity={intensity} distance={distance} />
    </group>
  );
}

export function Bulb({ id, pos, color = "#ffe1ad", intensity = 5, distance = 7, cold }: { id: string; pos: Vec3; color?: string; intensity?: number; distance?: number; cold?: boolean }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.35, 0]} material={mats().ink}>
        <cylinderGeometry args={[0.005, 0.005, 0.7, 4]} />
      </mesh>
      <mesh material={cold ? mats().lampCold : mats().lampGlow}>
        <sphereGeometry args={[0.06, 12, 10]} />
      </mesh>
      <LampLight id={id} pos={pos} color={color} intensity={intensity} distance={distance} />
    </group>
  );
}

// ── Prints: photographs, posters, covers ───────────────────────────────
export function Print({
  id,
  label,
  img,
  pos,
  rotY = 0,
  w,
  h,
  tilt = 0,
  frame = "black",
  pictureLight = true,
  onActivate,
  caption,
  captionFont = "serifItalic",
  dim = true,
}: {
  id: string;
  label: string;
  img: Img | null;
  pos: Vec3;
  rotY?: number;
  w: number;
  h: number;
  tilt?: number;
  frame?: "black" | "oak" | "none" | "brass";
  pictureLight?: boolean;
  onActivate?: () => void;
  caption?: string | null;
  captionFont?: "serifItalic" | "type" | "sans";
  dim?: boolean;
}) {
  const quality = useWorld((s) => s.quality);
  const url = img ? textureSrc(img, quality === "light" ? 640 : 1080) : null;
  const tex = useTex(url);
  const active = useActive(id);
  const near = useNear(pos, 3.2);
  const lit = active || near || !dim;
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6, emissive: "#ffffff", emissiveIntensity: 0 }),
    [],
  );
  useEffect(() => {
    mat.map = tex;
    mat.emissiveMap = tex;
    mat.color.set(tex ? "#ffffff" : "#d8cfbf");
    mat.needsUpdate = true;
  }, [tex, mat]);
  useEffect(() => {
    mat.emissiveIntensity = lit ? (active ? 0.42 : 0.3) : 0.05;
  }, [lit, active, mat]);
  useEffect(() => () => mat.dispose(), [mat]);
  const fw = 0.035;
  const frameMat = frame === "oak" ? mats().oak : frame === "brass" ? mats().brass : mats().ink;
  return (
    <group position={pos} rotation={[0, rotY, tilt]}>
      <Hot id={id} label={label} onActivate={onActivate} marker={[0, -h / 2 - 0.09, 0.03]}>
        {frame !== "none" && <Slab pos={[0, 0, -0.012]} size={[w + fw * 2 + 0.08, h + fw * 2 + 0.08, 0.025]} mat={frameMat} />}
        {frame !== "none" && <Slab pos={[0, 0, 0.0]} size={[w + 0.08, h + 0.08, 0.004]} mat={mats().paper} />}
        <mesh position={[0, 0, 0.004]} material={mat}>
          <planeGeometry args={[w, h]} />
        </mesh>
      </Hot>
      {pictureLight && (
        <mesh position={[0, h / 2 + 0.16, 0.08]} material={lit ? mats().lampGlow : mats().brass}>
          <boxGeometry args={[Math.min(w * 0.6, 0.5), 0.025, 0.04]} />
        </mesh>
      )}
      {caption && (
        <Label pos={[-w / 2, -h / 2 - 0.16, 0.01]} size={0.034} font={captionFont} color="#c4b49a" anchorX="left" anchorY="top" maxWidth={Math.max(w, 0.7)} opacity={lit ? 0.95 : 0.55}>
          {caption}
        </Label>
      )}
      {active && (
        <mesh position={[0, -h / 2 - 0.06, 0.012]} material={mats().accent}>
          <planeGeometry args={[w * 0.5, 0.006]} />
        </mesh>
      )}
    </group>
  );
}

/** True while the settled camera is within `radius` of a point. */
const nearSubs = new Set<() => void>();
let camPos: Vec3 = [0, 0, 0];
export function setCameraForNear(p: Vec3) {
  const moved = Math.hypot(p[0] - camPos[0], p[1] - camPos[1], p[2] - camPos[2]) > 0.25;
  camPos = p;
  if (moved) nearSubs.forEach((f) => f());
}
export function useNear(pos: Vec3, radius: number) {
  const compute = () => Math.hypot(pos[0] - camPos[0], pos[1] - camPos[1], pos[2] - camPos[2]) < radius;
  const [near, setNear] = useState(false);
  useEffect(() => {
    const f = () => setNear(compute());
    nearSubs.add(f);
    f();
    return () => {
      nearSubs.delete(f);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos[0], pos[1], pos[2], radius]);
  return near;
}

export const accentColor = ACCENT;
