"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useWorld } from "../store";
import { engine } from "../audio/engine";
import type { Region } from "../stations";
import { allLamps, lampVersion, type Lamp } from "./kit/lamps";
import { rig } from "./rigState";

/**
 * Lighting grammar (design doc §20): day = work, lamp light = life, dusk =
 * where they meet. One hemisphere, one sun, and a fixed pool of point
 * lights moved to the lamps nearest the camera. Exposure, sky and fog ease
 * between regimes over about a second, like eyes adapting.
 */

type Regime = {
  bg: string;
  fog: [number, number];
  sky: string;
  ground: string;
  hemi: number;
  sun: number;
  sunColor: string;
  exposure: number;
  lampScale: number;
};

function roofRegime(): Regime {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  if (h >= 7 && h < 17) return { bg: "#e9e2d4", fog: [30, 140], sky: "#fbf6ec", ground: "#b9ab94", hemi: 1.1, sun: 0.9, sunColor: "#fff3df", exposure: 1, lampScale: 0.3 };
  if ((h >= 5 && h < 7) || (h >= 17 && h < 19.5)) return { bg: "#c9a17a", fog: [30, 140], sky: "#f0c9a0", ground: "#4a3626", hemi: 0.75, sun: 0.5, sunColor: "#f3b47e", exposure: 1, lampScale: 0.8 };
  return { bg: "#0d0c12", fog: [30, 140], sky: "#4a4a5e", ground: "#0a0806", hemi: 0.42, sun: 0, sunColor: "#ffffff", exposure: 1.05, lampScale: 2.6 };
}

export const REGIMES: Record<Region, () => Regime> = {
  exterior: () => ({ bg: "#d6c9b4", fog: [70, 220], sky: "#f4e7d2", ground: "#5c4a37", hemi: 1.0, sun: 0.75, sunColor: "#f6c896", exposure: 1, lampScale: 1.4 }),
  seam: () => ({ bg: "#2a2119", fog: [14, 60], sky: "#efe3cf", ground: "#5a4834", hemi: 0.85, sun: 0.3, sunColor: "#f6c896", exposure: 1, lampScale: 2 }),
  day: () => ({ bg: "#efe9dc", fog: [26, 110], sky: "#fdf9f0", ground: "#d7cbb5", hemi: 1.3, sun: 0.95, sunColor: "#fff6e8", exposure: 1, lampScale: 0.6 }),
  plan: () => ({ bg: "#110d09", fog: [6, 22], sky: "#6a5844", ground: "#0e0a07", hemi: 0.34, sun: 0, sunColor: "#ffffff", exposure: 1.1, lampScale: 3 }),
  night: () => ({ bg: "#0c0904", fog: [9, 30], sky: "#5a4632", ground: "#120d08", hemi: 0.46, sun: 0, sunColor: "#ffffff", exposure: 1.12, lampScale: 3.4 }),
  cold: () => ({ bg: "#141519", fog: [9, 32], sky: "#9aa0a6", ground: "#1b1c1f", hemi: 0.55, sun: 0, sunColor: "#ffffff", exposure: 1.05, lampScale: 2.6 }),
  roof: roofRegime,
  deep: () => ({ bg: "#060504", fog: [6, 20], sky: "#3a3022", ground: "#050403", hemi: 0.24, sun: 0, sunColor: "#ffffff", exposure: 1.1, lampScale: 3.2 }),
};

const POOL = 4;

export function LightRig({ region }: { region: Region }) {
  const { scene, gl, camera, invalidate } = useThree();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const pool = useRef<(THREE.PointLight | null)[]>([]);
  const pointer = useRef<THREE.PointLight>(null);
  const cur = useRef<Regime | null>(null);
  const target = useMemo(() => REGIMES[region](), [region]);
  const tmp = useMemo(() => ({ c: new THREE.Color(), d: new THREE.Color() }), []);
  const lastPick = useRef({ v: -1, frame: 0 });
  const picked = useRef<Lamp[]>([]);
  const night = region === "night" || region === "cold" || region === "deep" || region === "plan";

  useEffect(() => {
    if (!scene.background) scene.background = new THREE.Color(target.bg);
    if (!scene.fog) scene.fog = new THREE.Fog(target.bg, target.fog[0], target.fog[1]);
    invalidate();
  }, [scene, target, invalidate]);

  useFrame((_, dt) => {
    const t = Math.min(1, dt * 2.2);
    const r = target;
    if (!cur.current) cur.current = { ...r };
    const c = cur.current;
    let moving = false;
    const lerpNum = (k: "hemi" | "sun" | "exposure" | "lampScale") => {
      const d = r[k] - c[k];
      if (Math.abs(d) > 0.002) moving = true;
      c[k] += d * t;
    };
    lerpNum("hemi");
    lerpNum("sun");
    lerpNum("exposure");
    lerpNum("lampScale");
    c.fog = [c.fog[0] + (r.fog[0] - c.fog[0]) * t, c.fog[1] + (r.fog[1] - c.fog[1]) * t];
    const bg = scene.background as THREE.Color;
    tmp.c.set(r.bg);
    if (bg && !bg.equals(tmp.c)) {
      bg.lerp(tmp.c, t);
      if (Math.abs(bg.r - tmp.c.r) + Math.abs(bg.g - tmp.c.g) + Math.abs(bg.b - tmp.c.b) > 0.004) moving = true;
      else bg.copy(tmp.c);
    }
    const fog = scene.fog as THREE.Fog;
    if (fog) {
      fog.color.copy(bg);
      fog.near = c.fog[0];
      fog.far = c.fog[1];
    }
    gl.toneMappingExposure = c.exposure;
    if (hemi.current) {
      hemi.current.intensity = c.hemi;
      hemi.current.color.lerp(tmp.d.set(r.sky), t);
      hemi.current.groundColor.lerp(tmp.d.set(r.ground), t);
    }
    if (sun.current) {
      sun.current.intensity = c.sun;
      sun.current.color.lerp(tmp.d.set(r.sunColor), t);
    }

    // Move the lamp pool to the lamps nearest the camera (re-picked when
    // lamps change or every 20 frames while travelling).
    const v = lampVersion();
    lastPick.current.frame++;
    if (v !== lastPick.current.v || (rig.moving && lastPick.current.frame % 20 === 0)) {
      lastPick.current.v = v;
      const p = camera.position;
      picked.current = [...allLamps().values()]
        .filter((l) => !l.shaft)
        .sort((a, b) => dist2(a.pos, p) - dist2(b.pos, p))
        .slice(0, POOL);
    }
    for (let i = 0; i < POOL; i++) {
      const L = pool.current[i];
      if (!L) continue;
      const lamp = picked.current[i];
      if (!lamp) {
        L.intensity = 0;
        continue;
      }
      L.position.set(lamp.pos[0], lamp.pos[1], lamp.pos[2]);
      L.color.set(lamp.color);
      L.distance = lamp.distance * 1.7;
      const flicker = rig.flickerId === lamp.id ? 0.35 : 1;
      L.intensity = lamp.intensity * c.lampScale * flicker * (1 + engine.level() * 0.25);
    }
    if (pointer.current) {
      const want = night && !rig.coarse ? 1.4 : 0;
      pointer.current.intensity += (want - pointer.current.intensity) * t;
      pointer.current.position.set(rig.pointer[0], rig.pointer[1], rig.pointer[2]);
    }
    if (moving) invalidate();
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#f4e7d2", "#5c4a37", 1]} />
      <directionalLight ref={sun} position={[-12, 30, 18]} intensity={0.8} />
      {Array.from({ length: POOL }, (_, i) => (
        <pointLight key={i} ref={(el) => void (pool.current[i] = el)} intensity={0} decay={1.15} />
      ))}
      <pointLight ref={pointer} color="#ffcf94" intensity={0} distance={2.6} decay={2} />
    </>
  );
}

const dist2 = (a: [number, number, number], p: THREE.Vector3) => (a[0] - p.x) ** 2 + (a[1] - p.y) ** 2 + (a[2] - p.z) ** 2;

/**
 * Dust: one GPU particle field, visible only inside light — lamp pools at
 * night, skylight shafts by day. Particles drift in the vertex shader, so
 * the CPU does nothing per frame but update a time uniform. Music loudness
 * stirs it slightly.
 */
export function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const base = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) seed[i] = Math.random();
    g.setAttribute("position", new THREE.BufferAttribute(base, 3));
    g.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uLevel: { value: 0 }, uColor: { value: new THREE.Color("#f4dcae") } },
        vertexShader: /* glsl */ `
          attribute float seed;
          uniform float uTime;
          uniform float uLevel;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            float t = uTime * (0.04 + seed * 0.05);
            p.y += mod(t + seed * 3.0, 1.6) - 0.8;
            p.x += sin(uTime * 0.21 + seed * 40.0) * (0.12 + uLevel * 0.1);
            p.z += cos(uTime * 0.17 + seed * 23.0) * (0.12 + uLevel * 0.1);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (1.6 + seed * 1.8) * (6.0 / -mv.z);
            vAlpha = (0.25 + 0.6 * fract(seed * 7.13)) * (0.7 + uLevel * 0.6);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            gl_FragColor = vec4(uColor, vAlpha * (1.0 - d * 2.0));
          }`,
      }),
    [],
  );
  const last = useRef(-1);
  useFrame((state) => {
    const v = lampVersion();
    if (v !== last.current || (rig.moving && state.clock.elapsedTime % 1 < 0.02)) {
      last.current = v;
      const p = camera.position;
      const near = [...allLamps().values()].sort((a, b) => dist2(a.pos, p) - dist2(b.pos, p)).slice(0, 5);
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        const l = near[i % Math.max(1, near.length)];
        if (l && !l.shaft && l.intensity < 3.5 && i % 3 !== 0) {
          pos.setXYZ(i, 0, -999, 0);
          continue;
        }
        if (!l) {
          pos.setXYZ(i, 0, -999, 0);
          continue;
        }
        const r = Math.sqrt(Math.random()) * (l.shaft ? 0.9 : 0.75);
        const a = Math.random() * Math.PI * 2;
        const drop = Math.random() * (l.shaft ? 3.2 : 1.6);
        pos.setXYZ(i, l.pos[0] + Math.cos(a) * r * (1 + drop * 0.25), l.pos[1] - drop, l.pos[2] + Math.sin(a) * r * (1 + drop * 0.25));
      }
      pos.needsUpdate = true;
    }
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uLevel.value = engine.level();
  });
  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);
  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} />;
}

/** Keeps a gentle ambient frame rate for living things; stops when hidden,
 * and entirely under reduced motion. One timer for the whole world. */
export function AmbientTicker() {
  const { invalidate } = useThree();
  const reduced = useWorld((s) => s.reducedMotion);
  const quality = useWorld((s) => s.quality);
  useEffect(() => {
    if (reduced) return;
    const fps = quality === "light" ? 20 : 30;
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (!document.hidden) invalidate();
      id = setTimeout(tick, 1000 / fps);
    };
    tick();
    return () => clearTimeout(id);
  }, [reduced, quality, invalidate]);
  return null;
}
