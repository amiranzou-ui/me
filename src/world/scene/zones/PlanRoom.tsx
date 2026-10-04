"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useWorld } from "../../store";
import { PLAN_ROOM, PLAN_TABLE, nodeOnTable, type Vec3 } from "../../layout";
import type { WorldContent, WorldNode } from "../../content";
import { mats, ACCENT } from "../kit/materials";
import { Hot, Label, Pendant, Slab, useActive } from "../kit/primitives";

/**
 * The Plan Room (design doc §10). The System graph as a place at two
 * scales: a model on the table (nodes at their stored x/y), and — at a
 * node's own station — the same model at the visitor's feet, walked path
 * by path. Timeline nodes are stones set in the ground, skills are plinths,
 * projects are miniature bays, thoughts are glass forms hanging above.
 * A node's thinking steps line the path that leads to it.
 */
const signPaper = new THREE.MeshBasicMaterial({ color: "#f3ead6", toneMapped: false });
const hitbox = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

const TYPE_COLOR: Record<WorldNode["type"], string> = {
  project: "#9d5a32",
  skill: "#4f7584",
  thought: "#7d7196",
  timeline: "#647f5c",
};

export default function PlanRoom({ content }: { content: WorldContent }) {
  const P = PLAN_ROOM;
  const T = PLAN_TABLE;
  const stationId = useWorld((s) => s.stationId);
  const hovered = useWorld((s) => s.hovered?.id ?? null);
  const focused = useWorld((s) => s.focusedObject);
  const nodes = content.nodes;
  const byKey = useMemo(() => Object.fromEntries(nodes.map((n) => [n.key, n])), [nodes]);
  const here = stationId.startsWith("node-") ? stationId.slice(5) : null;
  // the camera arrives along the path from the node's first connection
  // (the same path the station's pose is placed on)
  const cameFrom = here ? (byKey[here]?.connections[0] ?? null) : null;
  const focusKey = [hovered, focused].map((id) => (id?.startsWith("node-") ? id.slice(5) : id?.startsWith("path-") ? id.slice(5) : null)).find(Boolean) ?? here;

  const edges = useMemo(() => {
    const seen = new Set<string>();
    const out: { a: WorldNode; b: WorldNode }[] = [];
    for (const n of nodes)
      for (const k of n.connections) {
        const key = [n.key, k].sort().join("|");
        if (seen.has(key) || !byKey[k]) continue;
        seen.add(key);
        out.push({ a: n, b: byKey[k] });
      }
    return out;
  }, [nodes, byKey]);

  const cx = (P.x0 + P.x1) / 2;
  const cz = (P.z0 + P.z1) / 2;
  return (
    <group>
      {/* the dark room, inside the mezzanine box */}
      <Slab pos={[cx, P.floor + 0.005, cz]} size={[P.x1 - P.x0 - 0.1, 0.01, P.z1 - P.z0 - 0.1]} mat={mats().planks} uv={0.6} />
      <Slab pos={[cx, P.floor + P.height / 2, P.z0 + 0.02]} size={[P.x1 - P.x0, P.height, 0.03]} mat={mats().plasterDark} />
      <Slab pos={[cx, P.floor + P.height / 2, P.z1 - 0.2]} size={[P.x1 - P.x0, P.height, 0.03]} mat={mats().plasterDark} />
      <Slab pos={[P.x0 + 0.02, P.floor + P.height / 2, cz]} size={[0.03, P.height, P.z1 - P.z0]} mat={mats().plasterDark} />
      <Slab pos={[P.x1 - 0.02, P.floor + P.height / 2, -2.1]} size={[0.03, P.height, 4.2]} mat={mats().plasterDark} />
      <Slab pos={[cx, P.floor + P.height, cz]} size={[P.x1 - P.x0, 0.05, P.z1 - P.z0]} mat={mats().plasterDark} />

      {/* the table */}
      <Slab pos={[T.cx, T.top - 0.03, T.cz]} size={[T.w + 0.2, 0.06, T.d + 0.2]} mat={mats().walnut} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <Slab key={`${sx}${sz}`} pos={[T.cx + sx * (T.w / 2 - 0.1), P.floor + (T.top - P.floor) / 2, T.cz + sz * (T.d / 2 - 0.1)]} size={[0.07, T.top - P.floor - 0.06, 0.07]} mat={mats().walnut} />
      )))}
      <Slab pos={[T.cx, T.top + 0.001, T.cz]} size={[T.w, 0.002, T.d]} mat={mats().linen} />
      <Pendant id="plan-lamp" pos={[T.cx, T.top + 1.25, T.cz]} intensity={5.5} distance={5} drop={0.4} />

      {edges.map(({ a, b }) => {
        const lit = focusKey === a.key || focusKey === b.key;
        return <PathInlay key={a.key + b.key} a={a} b={b} lit={lit} />;
      })}
      {nodes.map((n) => (
        <NodeForm key={n.key} n={n} dim={!!focusKey && focusKey !== n.key && !byKey[focusKey]?.connections.includes(n.key)} />
      ))}
      {here && cameFrom && byKey[cameFrom] && <ThinkingSteps from={byKey[cameFrom]} to={byKey[here]} />}

      <Label pos={[T.cx, T.top + 0.002, T.cz + T.d / 2 - 0.06]} rot={[-Math.PI / 2, 0, 0]} size={0.045} font="sans" color="#6b5f4e" spacing={0.3}>
        PROJECT · SKILL · THOUGHT · TIMELINE
      </Label>
    </group>
  );
}

function curveBetween(a: WorldNode, b: WorldNode) {
  const p0 = new THREE.Vector3(...nodeOnTable(a.x, a.y));
  const p2 = new THREE.Vector3(...nodeOnTable(b.x, b.y));
  const mid = p0.clone().add(p2).multiplyScalar(0.5);
  const dir = p2.clone().sub(p0);
  // the paths lean, like the old divider bending toward the cursor
  const lean = new THREE.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(dir.length() * 0.12);
  return new THREE.QuadraticBezierCurve3(p0, mid.add(lean), p2);
}

function PathInlay({ a, b, lit }: { a: WorldNode; b: WorldNode; lit: boolean }) {
  const mesh = useMemo(() => {
    const curve = curveBetween(a, b);
    const geo = new THREE.TubeGeometry(curve, 40, 0.005, 5, false);
    return geo;
  }, [a, b]);
  useEffect(() => () => mesh.dispose(), [mesh]);
  return (
    <mesh geometry={mesh} position={[0, 0.002, 0]}>
      <meshStandardMaterial color={lit ? ACCENT : "#b48f55"} metalness={0.5} roughness={0.4} emissive={lit ? ACCENT : "#000000"} emissiveIntensity={lit ? 0.6 : 0} />
    </mesh>
  );
}

function NodeForm({ n, dim }: { n: WorldNode; dim: boolean }) {
  const p = nodeOnTable(n.x, n.y);
  const id = `node-${n.key}`;
  const active = useActive(id);
  const color = active ? ACCENT : TYPE_COLOR[n.type];
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        roughness: 0.6,
        color,
        transparent: n.type === "thought" || dim,
        opacity: n.type === "thought" ? 0.55 : dim ? 0.4 : 1,
      }),
    [color, dim, n.type],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  let form: React.ReactNode;
  if (n.type === "timeline") form = <mesh position={[0, 0.006, 0]} material={mat}><cylinderGeometry args={[0.07, 0.075, 0.012, 24]} /></mesh>;
  else if (n.type === "skill") form = <mesh position={[0, 0.06, 0]} material={mat}><boxGeometry args={[0.075, 0.12, 0.075]} /></mesh>;
  else if (n.type === "project")
    form = (
      <group>
        <mesh position={[0, 0.03, -0.03]} material={mats().linen}><boxGeometry args={[0.13, 0.06, 0.006]} /></mesh>
        <mesh position={[-0.063, 0.03, 0]} material={mats().oak}><boxGeometry args={[0.004, 0.06, 0.06]} /></mesh>
        <mesh position={[0.063, 0.03, 0]} material={mats().oak}><boxGeometry args={[0.004, 0.06, 0.06]} /></mesh>
        <mesh position={[0, 0.012, 0.03]} material={mat}><boxGeometry args={[0.05, 0.024, 0.024]} /></mesh>
      </group>
    );
  else
    form = (
      <group>
        <mesh position={[0, 0.16, 0]} material={mats().ink}><cylinderGeometry args={[0.0008, 0.0008, 0.18, 3]} /></mesh>
        <mesh position={[0, 0.07, 0]} material={mat}><octahedronGeometry args={[0.045, 0]} /></mesh>
      </group>
    );
  return (
    <group position={p}>
      <Hot id={id} label={`${n.title} — ${n.summary}`} marker={[0, 0.2, 0]}>
        {form}
        <mesh position={[0, 0.06, 0]} material={hitbox}>
          <boxGeometry args={[0.16, 0.14, 0.16]} />
        </mesh>
      </Hot>
      <Label pos={[0, 0.003, 0.1]} rot={[-Math.PI / 2, 0, 0]} size={0.026} font="serif" color={dim ? "#8a7a65" : "#2b2119"} maxWidth={0.34} align="center">
        {n.title}
      </Label>
    </group>
  );
}

/** Origin → tension → belief, laid along the path the visitor arrives by. */
function ThinkingSteps({ from, to }: { from: WorldNode; to: WorldNode }) {
  const curve = useMemo(() => curveBetween(from, to), [from, to]);
  const steps = to.thinking;
  return (
    <group>
      {steps.map((s, i) => {
        // laid in walking order between the camera and the node: the first
        // step furthest out, the last (belief, result…) at the node itself
        const len = curve.getLength();
        const dist = 0.1 + (steps.length - 1 - i) * 0.16;
        const t = Math.max(0.05, 1 - dist / len);
        const p = curve.getPointAt(t);
        const tan = curve.getTangentAt(t);
        const yaw = Math.atan2(tan.x, tan.z) + Math.PI;
        const pos: Vec3 = [p.x, p.y, p.z];
        return (
          <group key={i} position={pos} rotation={[0, yaw, 0]}>
            <mesh position={[0, 0.03, 0]} material={mats().brassDark}>
              <boxGeometry args={[0.002, 0.06, 0.002]} />
            </mesh>
            <mesh position={[0, 0.072, 0]} material={signPaper}>
              <boxGeometry args={[0.16, 0.06, 0.0015]} />
            </mesh>
            <Label pos={[-0.072, 0.094, 0.0012]} size={0.0085} font="sansMedium" color={ACCENT} anchorX="left" spacing={0.2}>
              {s.phase.toUpperCase()}
            </Label>
            <Label pos={[-0.072, 0.084, 0.0012]} size={0.0074} font="serif" color="#2b2119" anchorX="left" anchorY="top" maxWidth={0.145}>
              {s.text}
            </Label>
          </group>
        );
      })}
    </group>
  );
}
