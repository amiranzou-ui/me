"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { runAction } from "../../actions";
import { useWorld } from "../../store";
import { BAY_BACK_Z, BAY_MOUTH_Z, pinboard, type BayPlacement } from "../../layout";
import { mats, INK, ACCENT } from "../kit/materials";
import { Hot, Label, Pendant, Print, Slab, useNear } from "../kit/primitives";

/**
 * One Workshop bay (design doc §8). Every project uses this same kit,
 * filled from data: plinth (number, title, role), easel (cover or a typed
 * index card), pinboard (project media), back wall (impact), desk (stack +
 * "Full case"), exit sign (Behance/external), brass thread tags (related
 * content). Distant bays render a simple version (level of detail).
 */
export function Bay({ b }: { b: BayPlacement }) {
  const p = b.project;
  const x0 = b.cx - b.width / 2;
  const x1 = b.cx + b.width / 2;
  const near = useNear([b.cx, 1.5, -11], 26);
  const accent = p.accent ?? "#2b2119";
  const shade = useMemo(() => p.accent ?? "#3a2e23", [p.accent]);
  const num = String(b.index + 1).padStart(2, "0");
  const coverAspect = p.cover ? p.cover.width / p.cover.height : 1.4;
  const cw = Math.min(1.15, 0.85 * Math.max(0.7, coverAspect));
  const ch = cw / coverAspect;

  return (
    <Hot id={`bay-${p.slug}`} label={`Bay ${num} — ${p.title}`} marker={[b.cx, 2.4, BAY_MOUTH_Z + 0.2]}>
      {/* partitions and pinboard back */}
      <Slab pos={[x0 + 0.03, 1.1, -12.4]} size={[0.06, 2.2, 2.9]} mat={mats().oak} edges={INK} edgeOpacity={0.35} />
      <Slab pos={[x1 - 0.03, 1.1, -12.4]} size={[0.06, 2.2, 2.9]} mat={mats().oak} edges={INK} edgeOpacity={0.35} />
      <Slab pos={[b.cx, 1.6, BAY_BACK_Z + 0.02]} size={[b.width - 0.12, 3.2, 0.04]} mat={mats().linen} edges={INK} edgeOpacity={0.2} />

      {/* plinth: brass number, engraved title */}
      <group position={[x0 + b.width * 0.24, 0, BAY_MOUTH_Z - 0.2]}>
        <Slab pos={[0, 0.27, 0]} size={[1.0, 0.54, 0.5]} mat={mats().oak} edges={INK} edgeOpacity={0.4} />
        <Label pos={[-0.42, 0.545, 0.05]} rot={[-Math.PI / 2, 0, 0]} size={0.11} font="sans" color="#7a6038" anchorX="left" spacing={0.1}>
          {num}
        </Label>
        <Label pos={[0, 0.36, 0.252]} size={0.085} font="serif" color={INK} maxWidth={0.92} align="center">
          {p.title}
        </Label>
        <Label pos={[0, 0.17, 0.252]} size={0.035} font="sans" color="#6b5f4e" maxWidth={0.92} align="center">
          {p.role.toUpperCase()}
        </Label>
      </group>

      {near ? (
        <>
          {/* easel with the cover print, or a typed index card */}
          <group position={[b.cx + b.width * 0.06, 0, -10.9]}>
            <Slab pos={[-0.42, 0.85, 0.05]} size={[0.035, 1.75, 0.035]} rot={[0.14, 0, 0.07]} mat={mats().walnut} />
            <Slab pos={[0.42, 0.85, 0.05]} size={[0.035, 1.75, 0.035]} rot={[0.14, 0, -0.07]} mat={mats().walnut} />
            <Slab pos={[0, 0.85, -0.3]} size={[0.035, 1.7, 0.035]} rot={[-0.28, 0, 0]} mat={mats().walnut} />
            <Slab pos={[0, 0.72, 0.08]} size={[1.1, 0.04, 0.09]} mat={mats().walnut} />
            {p.cover ? (
              <Print
                id="cover"
                label={`${p.title} — cover`}
                img={p.cover}
                pos={[b.cx + b.width * 0.06, 0.74 + ch / 2 + 0.02, -10.78]}
                w={cw}
                h={ch}
                tilt={0}
                frame="none"
                pictureLight={false}
                dim={false}
                onActivate={() => runAction({ type: "open", sheet: { kind: "image", set: `cover:${p.slug}`, index: 0 } })}
              />
            ) : (
              <group position={[0, 1.1, 0.11]} rotation={[-0.12, 0, 0]}>
                <Slab pos={[0, 0, 0]} size={[0.9, 0.6, 0.006]} mat={mats().paper} edges={INK} edgeOpacity={0.15} />
                <Label pos={[-0.38, 0.2, 0.006]} size={0.06} font="type" color="#2b2119" anchorX="left" maxWidth={0.78}>
                  {p.title}
                </Label>
                <Label pos={[-0.38, 0.06, 0.006]} size={0.034} font="type" color="#6b5f4e" anchorX="left" anchorY="top" maxWidth={0.78}>
                  {p.description}
                </Label>
                <Label pos={[-0.38, -0.22, 0.006]} size={0.03} font="serifItalic" color="#9d4e24" anchorX="left">
                  visuals to come
                </Label>
              </group>
            )}
          </group>

          {/* pinboard: the project's visuals, or honest empty pins */}
          {p.media.length ? (
            pinboard(b).map((m, i) => (
              <group key={m.media.id}>
                <Print
                  id={`media-${m.media.id}`}
                  label={m.media.caption ?? `Pinned visual ${i + 1}`}
                  img={m.media.img}
                  pos={m.pos}
                  w={m.w}
                  h={m.h}
                  tilt={(i % 3) * 0.008 - 0.008}
                  frame="none"
                  pictureLight={false}
                  dim={false}
                />
                <mesh position={[m.pos[0], m.pos[1] + m.h / 2 - 0.03, m.pos[2] + 0.02]} material={mats().brass}>
                  <sphereGeometry args={[0.016, 8, 6]} />
                </mesh>
              </group>
            ))
          ) : (
            <group>
              {[0, 1, 2, 3].map((i) => (
                <mesh key={i} position={[x0 + 0.7 + i * 0.75, 2.1 - (i % 2) * 0.35, BAY_BACK_Z + 0.06]} material={mats().brass}>
                  <sphereGeometry args={[0.016, 8, 6]} />
                </mesh>
              ))}
              <Label pos={[x0 + 0.62, 1.55, BAY_BACK_Z + 0.05]} size={0.07} font="serifItalic" color="#6b5f4e" anchorX="left">
                {"pins waiting for this project's visuals"}
              </Label>
            </group>
          )}

          {/* back wall: the impact, printed like a museum wall text */}
          <Label pos={[x0 + b.width * 0.68, 3.2, BAY_BACK_Z + 0.05]} size={0.045} font="sans" color="#6b5f4e" anchorX="left" anchorY="top" spacing={0.15} maxWidth={b.width * 0.29}>
            {[p.role, p.employer, p.yearStart ? `${p.yearStart}${p.yearEnd && p.yearEnd !== p.yearStart ? `–${p.yearEnd}` : ""}` : null].filter(Boolean).join("  ·  ").toUpperCase()}
          </Label>
          <Label pos={[x0 + b.width * 0.68, 2.95, BAY_BACK_Z + 0.05]} size={0.13} font="serifItalic" color={INK} anchorX="left" anchorY="top" maxWidth={b.width * 0.29} lineHeight={1.2}>
            {p.impact || p.description}
          </Label>

          {/* desk: tools of the job, the "Full case" folder */}
          <group position={[x1 - 0.95, 0, -12.6]}>
            <Slab pos={[0, 0.74, 0]} size={[1.3, 0.05, 0.7]} mat={mats().oak} edges={INK} edgeOpacity={0.3} />
            {[-0.6, 0.6].map((x) => (
              <Slab key={x} pos={[x, 0.36, 0]} size={[0.05, 0.72, 0.65]} mat={mats().oak} />
            ))}
            <Hot id="case" label={`Full case — ${p.title}`} marker={[0, 1.0, 0.1]}>
              <Slab pos={[-0.15, 0.79, 0.05]} size={[0.44, 0.04, 0.32]} rot={[0, 0.12, 0]} mat={mats().linen} edges={INK} edgeOpacity={0.4} />
              <Label pos={[-0.15, 0.812, 0.05]} rot={[-Math.PI / 2, 0, 0.12]} size={0.04} font="type" color="#2b2119">
                FULL CASE
              </Label>
            </Hot>
            {p.stack.slice(0, 6).map((s, i) => (
              <Label key={s} pos={[-0.58 + (i % 3) * 0.42, 0.62 - Math.floor(i / 3) * 0.1, 0.355]} size={0.034} font="sans" color="#7a6038" anchorX="left">
                {s}
              </Label>
            ))}
          </group>

          {(p.behanceUrl || p.externalUrl) && (
            <Hot id="exit-sign" label={p.behanceUrl ? "Behance ↗" : "External ↗"} marker={[x1 - 0.35, 2.55, -10.9]}>
              <Slab pos={[x1 - 0.35, 2.35, -10.95]} size={[0.5, 0.16, 0.02]} mat={mats().brass} />
              <Label pos={[x1 - 0.35, 2.35, -10.935]} size={0.055} font="sans" color="#2b2119" spacing={0.1}>
                {p.behanceUrl ? "BEHANCE ↗" : "EXTERNAL ↗"}
              </Label>
            </Hot>
          )}

          {p.related.map((r, i) => (
            <Hot key={r.id} id={`thread-${r.id}`} label={`Brass thread → ${r.title}`} marker={[x1 - 0.12, 2.05 - i * 0.22, -11.2]}>
              <mesh position={[x1 - 0.07, 1.9 - i * 0.22, -11.4]} rotation={[0, -Math.PI / 2, 0]} material={mats().brass}>
                <planeGeometry args={[0.5, 0.13]} />
              </mesh>
              <Label pos={[x1 - 0.075, 1.9 - i * 0.22, -11.4]} rot={[0, -Math.PI / 2, 0]} size={0.045} font="sans" color="#2b2119" maxWidth={0.46}>
                {`→ ${r.title}`}
              </Label>
            </Hot>
          ))}
          <ThreadLines b={b} />
          {(p.externalUrl === "/" || p.employer === "This website") && <MiniBuilding pos={[x0 + b.width * 0.24, 0.55, BAY_MOUTH_Z - 0.2]} />}
        </>
      ) : (
        // distant bay: just its cover (or card) and lamp glow
        <Slab pos={[b.cx + b.width * 0.06, 1.25, -10.85]} size={[cw, ch, 0.02]} mat={p.cover ? mats().paper : mats().linen} />
      )}

      <Pendant id={`bay-lamp-${p.slug}`} pos={[b.cx, 3.4, -11.4]} shade={shade} intensity={4} distance={6} />
      <mesh position={[b.cx, 0.006, BAY_MOUTH_Z + 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[b.width - 0.4, 0.012]} />
        <meshBasicMaterial color={accent === "#2b2119" ? "#b48f55" : accent} />
      </mesh>
    </Hot>
  );
}

/** The "This website" bay holds a model of the building you are standing
 * in; a tiny lamp is lit in the room you came from. */
function MiniBuilding({ pos }: { pos: [number, number, number] }) {
  const lastRoom = useWorld((s) => s.lastRoom);
  const towerRoom = !!lastRoom && (lastRoom.startsWith("chapter-") || lastRoom === "hall" || lastRoom === "roof");
  return (
    <group position={pos} scale={0.018}>
      <mesh position={[-10, 3.5, -6]} material={mats().plaster}>
        <boxGeometry args={[16, 7, 12]} />
      </mesh>
      <mesh position={[9, 14, -6]} material={mats().brick}>
        <boxGeometry args={[14, 28, 12]} />
      </mesh>
      <mesh position={[0, 15.5, -6]} material={mats().glass}>
        <boxGeometry args={[2.4, 31, 4]} />
      </mesh>
      <mesh position={[0, 30.4, 0.3]} material={mats().brass}>
        <torusGeometry args={[1.5, 0.2, 6, 24]} />
      </mesh>
      <mesh position={towerRoom ? [12, 18, 0.1] : [-8, 3, 0.1]} material={mats().lampGlow}>
        <planeGeometry args={[2, 2]} />
      </mesh>
    </group>
  );
}

/** Brass threads drawn from a bay toward the Seam when its related content
 * lives on the other side of the building. */
function ThreadLines({ b }: { b: BayPlacement }) {
  const hovered = useWorld((s) => s.hovered?.id);
  const show = b.project.related.some((r) => hovered === `thread-${r.id}`);
  const line = useMemo(() => {
    const pts = [new THREE.Vector3(b.cx + b.width / 2 - 0.1, 2.25, -10.6), new THREE.Vector3(-4, 2.6, -7), new THREE.Vector3(2, 2.6, -2)];
    const geo = new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(pts).getPoints(40));
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: ACCENT }));
  }, [b.cx, b.width]);
  if (!show) return null;
  return <primitive object={line} />;
}
