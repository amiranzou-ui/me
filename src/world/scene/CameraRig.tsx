"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useWorld } from "../store";
import { engine } from "../audio/engine";
import { moveRail } from "../actions";
import { carPose, levelY, type Pose } from "../layout";
import { planRoute, routeZones, type Segment } from "../route";
import type { World } from "../stations";
import { rig } from "./rigState";
import { setCameraForNear } from "./kit/primitives";

/**
 * The camera director (design doc §16). The camera only rests at stations;
 * between them it follows the physical route — a smooth dolly through
 * doorways, or the elevator. Travel time is also the loading budget: every
 * zone on the route is mounted before the camera reaches it.
 */

const V = (a: [number, number, number]) => new THREE.Vector3(a[0], a[1], a[2]);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Phase =
  | { kind: "path"; pos: THREE.CatmullRomCurve3; target: THREE.CatmullRomCurve3; dur: number; zones: string[]; fov: number; near: number }
  | { kind: "ride"; from: number; to: number; dur: number };

type Anim = { phases: Phase[]; i: number; t: number };

function fovFor(pose: Pose, aspect: number) {
  const f = pose.fov ?? 50;
  return aspect < 0.8 ? Math.min(82, f * 1.38) : f;
}

export function CameraRig({ world }: { world: World }) {
  const { camera, gl, invalidate, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const stationId = useWorld((s) => s.stationId);
  const railIndex = useWorld((s) => s.railIndex);
  const arrival = useWorld((s) => s.arrival);
  const anim = useRef<Anim | null>(null);
  const zoneNow = useRef(world.byId[stationId]?.zone ?? "approach");
  const base = useRef({ pos: new THREE.Vector3(), target: new THREE.Vector3() });
  const look = useRef({ yaw: 0, pitch: 0 });
  const aspect = size.width / Math.max(1, size.height);

  // ── initial placement (before the first frame) ─────────────────────
  useLayoutEffect(() => {
    const st = world.byId[stationId] ?? world.byId.approach;
    const p = st.pose;
    const from = arrival && st.id === "approach" ? { ...p, pos: [p.pos[0] - 6, p.pos[1] + 9, p.pos[2] + 38] as [number, number, number] } : p;
    base.current.pos.copy(V(from.pos));
    base.current.target.copy(V(from.target));
    cam.position.copy(base.current.pos);
    cam.fov = fovFor(p, aspect);
    cam.near = p.near ?? 0.05;
    cam.updateProjectionMatrix();
    cam.lookAt(base.current.target);
    useWorld.setState({ zoneNow: st.zone, zoneActive: [st.zone, ...(world.zones[st.zone]?.neighbors ?? [])], zoneVisible: [st.zone] });
    invalidate();
    // placement happens once, on mount; later moves are routed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── plan a route whenever the station or rail stop changes ─────────
  useEffect(() => {
    const st = world.byId[stationId];
    if (!st || arrival) return;
    const final = railIndex >= 0 && st.rail?.[railIndex] ? st.rail[railIndex].pose : st.pose;
    const segs = planRoute(world, zoneNow.current, stationId, final);
    const zones = routeZones(segs, world);
    const neighbors = world.zones[st.zone]?.neighbors ?? [];
    useWorld.setState({
      zoneActive: [...new Set([...zones, ...neighbors, zoneNow.current])],
      zoneVisible: [...new Set([...zones, zoneNow.current])],
      travellingTo: stationId,
    });
    look.current = { yaw: 0, pitch: 0 };
    anim.current = { phases: buildPhases(segs, base.current, aspect), i: 0, t: 0 };
    rig.moving = true;
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId, railIndex, arrival]);

  // ── drag to look, wheel and swipe to move along the room's line ─────
  useEffect(() => {
    const el = gl.domElement;
    let down: { x: number; y: number; t: number; touch: boolean } | null = null;
    let dragging = false;
    let wheelAcc = 0;
    let wheelLock = 0;
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now(), touch: e.pointerType === "touch" };
      dragging = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!down || !(e.buttons & 1)) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      if (!dragging && Math.hypot(dx, dy) > 7) dragging = true;
      if (dragging && !(down.touch && Math.abs(dy) > Math.abs(dx) * 1.3)) {
        look.current.yaw = THREE.MathUtils.clamp(look.current.yaw - e.movementX * 0.0035, -0.32, 0.32);
        look.current.pitch = THREE.MathUtils.clamp(look.current.pitch - e.movementY * 0.0025, -0.16, 0.16);
        invalidate();
      }
    };
    const onUp = (e: PointerEvent) => {
      if (down && dragging) {
        rig.suppressClick = true;
        setTimeout(() => (rig.suppressClick = false), 60);
        const dy = e.clientY - down.y;
        const dx = e.clientX - down.x;
        if (down.touch && performance.now() - down.t < 450 && Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx) * 1.3) {
          moveRail(dy < 0 ? 1 : -1);
        }
      }
      down = null;
    };
    const onWheel = (e: WheelEvent) => {
      if (useWorld.getState().sheet) return;
      const now = performance.now();
      if (now < wheelLock) return;
      wheelAcc += e.deltaY;
      if (Math.abs(wheelAcc) > 90) {
        moveRail(wheelAcc > 0 ? 1 : -1);
        wheelAcc = 0;
        wheelLock = now + 650;
      }
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl, invalidate]);

  const listenTick = useRef(0);
  const tmp = useRef({ dir: new THREE.Vector3(), right: new THREE.Vector3(), q: new THREE.Quaternion() });

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const s = useWorld.getState();
    const a = anim.current;
    if (a) {
      const ph = a.phases[a.i];
      if (!ph) {
        anim.current = null;
        rig.moving = false;
        const st = world.byId[s.stationId];
        if (st) {
          zoneNow.current = st.zone;
          useWorld.setState({ zoneNow: st.zone, zoneVisible: [st.zone], travellingTo: null, elevator: { ...s.elevator, visible: false }, skipRide: false });
          if (st.access !== "hidden" || true) s.discover(st.id);
        }
        setCameraForNear([base.current.pos.x, base.current.pos.y, base.current.pos.z]);
      } else if (ph.kind === "path") {
        a.t += ph.dur > 0 ? dt / ph.dur : 1;
        const e = ease(Math.min(1, a.t));
        ph.pos.getPointAt(e, base.current.pos);
        ph.target.getPointAt(e, base.current.target);
        if (!Number.isFinite(base.current.pos.x) || !Number.isFinite(base.current.target.x)) {
          // a degenerate curve: jump to the end instead of drawing nothing
          ph.pos.getPoint(1, base.current.pos);
          ph.target.getPoint(1, base.current.target);
          a.t = 1;
        }
        cam.fov += (ph.fov - cam.fov) * Math.min(1, dt * 3);
        if (ph.near < cam.near || e > 0.92) cam.near = ph.near;
        cam.updateProjectionMatrix();
        const zi = Math.min(ph.zones.length - 1, Math.floor(e * ph.zones.length));
        const z = ph.zones[zi];
        if (z && z !== zoneNow.current) {
          zoneNow.current = z;
          useWorld.setState({ zoneNow: z });
        }
        if (a.t >= 1) {
          a.i++;
          a.t = 0;
        }
      } else {
        // the elevator
        if (a.t === 0) {
          engine.elevatorMove(ph.dur);
          useWorld.setState({
            elevator: { visible: true, from: ph.from, to: ph.to, counter: pad(ph.from), status: ph.to > ph.from ? "ASCENDING" : "DESCENDING" },
          });
        }
        const speed = s.skipRide ? 6 : 1;
        a.t += (dt * speed) / ph.dur;
        const e = ease(Math.min(1, a.t));
        const lvl = ph.from + (ph.to - ph.from) * e;
        rig.carY = levelY(lvl);
        const p = carPose(lvl);
        base.current.pos.set(p.pos[0], p.pos[1], p.pos[2]);
        base.current.target.set(p.target[0], p.target[1], p.target[2]);
        const shown = pad(Math.round(lvl));
        if (shown !== s.elevator.counter) {
          engine.click(0.04, "brass");
          useWorld.setState({ elevator: { ...s.elevator, counter: shown } });
        }
        const zoneAtLevel = Object.values(world.zones).find((z) => z.level === Math.round(lvl) && z.level !== 0);
        const z = zoneAtLevel?.id ?? "seam";
        if (z !== zoneNow.current && Math.abs(lvl - Math.round(lvl)) < 0.2) {
          zoneNow.current = z;
          useWorld.setState({ zoneNow: z });
        }
        if (a.t >= 1) {
          engine.ding();
          useWorld.setState({ elevator: { ...useWorld.getState().elevator, counter: pad(ph.to), status: "ARRIVED" } });
          a.i++;
          a.t = 0;
        }
      }
      invalidate();
    } else if (!s.travellingTo && !s.reducedMotion) {
      // idle life: a slow breath, and the head turning a little with the pointer
      const tt = state.clock.elapsedTime;
      base.current.pos.y += Math.sin(tt * 0.55) * 0.00012;
    }

    // apply look offsets (drag + gentle pointer parallax)
    const d = tmp.current.dir.copy(base.current.target).sub(base.current.pos);
    const dist = d.length();
    const pointerYaw = s.reducedMotion || rig.coarse ? 0 : -state.pointer.x * 0.035;
    const pointerPitch = s.reducedMotion || rig.coarse ? 0 : state.pointer.y * 0.02;
    tmp.current.q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, look.current.yaw + pointerYaw);
    d.applyQuaternion(tmp.current.q);
    tmp.current.right.crossVectors(d, THREE.Object3D.DEFAULT_UP).normalize();
    tmp.current.q.setFromAxisAngle(tmp.current.right, look.current.pitch + pointerPitch);
    d.applyQuaternion(tmp.current.q).setLength(dist);
    cam.position.copy(base.current.pos);
    cam.lookAt(tmp.current.dir.add(base.current.pos));

    if (++listenTick.current % 6 === 0) {
      const f = tmp.current.right.copy(base.current.target).sub(base.current.pos).normalize();
      engine.setListener([cam.position.x, cam.position.y, cam.position.z], [f.x, f.y, f.z], zoneNow.current === musicZone(world));
    }
  });

  return null;
}

const pad = (n: number) => (n < 0 ? "−1" : String(n).padStart(2, "0"));

function musicZone(world: World) {
  return Object.values(world.zones).find((z) => world.stations.some((s) => s.zone === z.id && s.objects.some((o) => o.id === "turntable")))?.id;
}

function buildPhases(segs: Segment[], from: { pos: THREE.Vector3; target: THREE.Vector3 }, aspect: number): Phase[] {
  const reduced = useWorld.getState().reducedMotion;
  const phases: Phase[] = [];
  let cur = { pos: from.pos.clone(), target: from.target.clone() };
  let run: { pose: Pose; zone: string }[] = [];
  const flush = () => {
    if (!run.length) return;
    const pts = [cur.pos.clone()];
    const tgts = [cur.target.clone()];
    run.forEach((r, i) => {
      const p = V(r.pose.pos);
      pts.push(p);
      if (i < run.length - 1) {
        // intermediate waypoint: look where we're walking
        const nxt = V(run[i + 1].pose.pos);
        const dir = nxt.clone().sub(p).setY(0).normalize().multiplyScalar(4);
        tgts.push(p.clone().add(dir));
      } else tgts.push(V(r.pose.target));
    });
    const dedupe = (arr: THREE.Vector3[]) => arr.filter((v, i) => i === 0 || v.distanceTo(arr[i - 1]) > 0.01);
    const P = dedupe(pts);
    const T = tgts.length === P.length ? tgts : tgts.slice(-P.length);
    if (P.length < 2) {
      P.push(P[0].clone().add(new THREE.Vector3(0, 0.0001, 0)));
      T.push(T[T.length - 1].clone());
    }
    while (T.length < P.length) T.unshift(T[0].clone());
    if (P.length === 2 && P[0].distanceTo(P[1]) < 0.01) P[1] = P[0].clone().add(new THREE.Vector3(0, 0.02, 0));
    const pos = new THREE.CatmullRomCurve3(P, false, "centripetal");
    const target = new THREE.CatmullRomCurve3(T, false, "centripetal");
    const len = pos.getLength();
    const last = run[run.length - 1].pose;
    phases.push({
      kind: "path",
      pos,
      target,
      dur: reduced ? 0 : THREE.MathUtils.clamp(len / 4.6 + 0.35, 0.9, 5.2),
      zones: run.map((r) => r.zone),
      fov: fovFor(last, aspect),
      near: last.near ?? 0.05,
    });
    cur = { pos: V(last.pos), target: V(last.target) };
    run = [];
  };
  for (const s of segs) {
    if (s.kind === "move") run.push({ pose: s.pose, zone: s.zone });
    else {
      flush();
      phases.push({ kind: "ride", from: s.from, to: s.to, dur: reduced ? 0.35 : 1.1 + 0.42 * Math.abs(s.to - s.from) });
      const p = carPose(s.to);
      cur = { pos: V(p.pos), target: V(p.target) };
    }
  }
  flush();
  return phases;
}
