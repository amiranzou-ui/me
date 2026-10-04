"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useWorld } from "../../store";
import { runAction } from "../../actions";
import {
  DAY,
  FRONT_DESK,
  PLAN_ROOM,
  RECORDS,
  STRIP_Z,
  TYPE_CASE,
  planDayWing,
  type DayWingPlan,
} from "../../layout";
import type { WorldContent } from "../../content";
import { mats, INK, ACCENT } from "../kit/materials";
import { Hot, Label, LampLight, Slab, useActive } from "../kit/primitives";
import { Bay } from "./Bay";

/**
 * The Day Wing (design doc §5): a long daylit drafting pavilion under a
 * sawtooth roof of north lights. The career runs along its length on a
 * brass time strip — the far west end is where it started, the end at the
 * Seam is now. Fully public: no doors close here.
 */
export default function DayWing({ content }: { content: WorldContent }) {
  const plan = useMemo(() => planDayWing(content), [content]);
  const len = Math.abs(plan.hallMinX - DAY.x1);
  const cx = (plan.hallMinX + DAY.x1) / 2;
  return (
    <group>
      {/* floor: the 40px hover grid of today's Matrix side, as tiles */}
      <Slab pos={[cx, -0.05, -7]} size={[len, 0.1, 14]} mat={mats().gridFloor} uv={1} />
      {/* back and front walls, the west end */}
      <Slab pos={[cx, DAY.height / 2, DAY.z0 - 0.08]} size={[len, DAY.height, 0.16]} mat={mats().plaster} edges={INK} edgeOpacity={0.25} />
      <Slab pos={[cx, DAY.height / 2, -0.12]} size={[len, DAY.height, 0.16]} mat={mats().plaster} edges={INK} edgeOpacity={0.25} />
      <Slab pos={[plan.hallMinX - 0.08, DAY.height / 2, -7]} size={[0.16, DAY.height, 14]} mat={mats().plaster} edges={INK} edgeOpacity={0.25} />
      {/* tall front windows: daylight from the street */}
      {Array.from({ length: Math.floor(len / 6) }, (_, i) => {
        const x = -22 - i * 6;
        if (x < plan.hallMinX + 2 || (x > RECORDS.x0 - 1 && x < RECORDS.x1 + 1)) return null;
        return (
          <mesh key={i} position={[x, 3.1, -0.2]} rotation={[0, Math.PI, 0]} material={mats().dayWindow}>
            <planeGeometry args={[1.4, 2.6]} />
          </mesh>
        );
      })}

      <Skylights plan={plan} />
      <TimeStrip plan={plan} />
      <Clerestory plan={plan} />
      <EmployerBeams plan={plan} />
      <FrontDesk content={content} />
      <TypeCase content={content} plan={plan} />
      <RecordsRoom content={content} />
      <SchoolDesk content={content} plan={plan} />
      <Mezzanine />
      {plan.bays.map((b) => (
        <Bay key={b.project.slug} b={b} />
      ))}
    </group>
  );
}

function Skylights({ plan }: { plan: DayWingPlan }) {
  // A true sawtooth: each 4m module is a roof plane rising from 7m to 8.2m,
  // closed by a vertical north-light glazing strip. Continuous, no gaps.
  const n = Math.ceil(Math.abs(plan.hallMinX - DAY.x1) / 4);
  const rise = 1.2;
  const slope = Math.atan2(rise, 4);
  const len = Math.hypot(4, rise);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const xEast = DAY.x1 - i * 4;
        const xWest = xEast - 4;
        return (
          <group key={i}>
            <mesh position={[(xEast + xWest) / 2, DAY.height + rise / 2, -7]} rotation={[0, 0, -slope]} material={mats().plaster}>
              <boxGeometry args={[len + 0.02, 0.06, 14.2]} />
            </mesh>
            <mesh position={[xWest + 0.01, DAY.height + rise / 2, -7]} rotation={[0, Math.PI / 2, 0]} material={mats().skylight}>
              <planeGeometry args={[14, rise]} />
            </mesh>
            <mesh position={[xWest, DAY.height, -7]} material={mats().ink}>
              <boxGeometry args={[0.03, 0.03, 14]} />
            </mesh>
            {i % 2 === 0 && <LampLight id={`shaft-${i}`} pos={[xWest + 1, DAY.height - 0.3, -6.2]} shaft intensity={0} />}
          </group>
        );
      })}
    </group>
  );
}

function TimeStrip({ plan }: { plan: DayWingPlan }) {
  const x0 = plan.hallMinX + 2;
  const x1 = DAY.x1 - 0.6;
  const now = plan.years[plan.years.length - 1];
  return (
    <group>
      <mesh position={[(x0 + x1) / 2, 0.004, STRIP_Z]} rotation={[-Math.PI / 2, 0, 0]} material={mats().brass}>
        <planeGeometry args={[x1 - x0, 0.09]} />
      </mesh>
      {plan.years.map((y) => {
        const x = plan.yearX(y);
        if (x < x0 || x > x1) return null;
        return (
          <group key={y}>
            <mesh position={[x, 0.005, STRIP_Z]} rotation={[-Math.PI / 2, 0, 0]} material={mats().brassDark}>
              <planeGeometry args={[0.03, 0.4]} />
            </mesh>
            <Label pos={[x + 0.08, 0.006, STRIP_Z + 0.42]} rot={[-Math.PI / 2, 0, 0]} size={0.16} font="sans" color="#7a6038" anchorX="left" spacing={0.08}>
              {y === now ? "now" : String(y)}
            </Label>
          </group>
        );
      })}
    </group>
  );
}

/** Signals: the four sentences etched into the high windows, cast as light
 * across the floor. Read in passing; owned by no single room. */
function Clerestory({ plan }: { plan: DayWingPlan }) {
  return (
    <group>
      {plan.signals.map((s, i) => (
        <group key={i}>
          <mesh position={[s.x, 5.9, DAY.z0 + 0.02]} material={mats().skylight}>
            <planeGeometry args={[5.4, 0.8]} />
          </mesh>
          <Label pos={[s.x, 5.9, DAY.z0 + 0.04]} size={0.085} font="serifItalic" color="#6b5f4e" maxWidth={5.1} align="center">
            {s.text}
          </Label>
          <Label pos={[s.x, 0.008, -5.3]} rot={[-Math.PI / 2, 0, 0.04]} size={0.2} font="serifItalic" color="#d9c9a6" maxWidth={5.4} align="center" opacity={0.85}>
            {s.text}
          </Label>
        </group>
      ))}
    </group>
  );
}

function EmployerBeams({ plan }: { plan: DayWingPlan }) {
  return (
    <group>
      {plan.groups.map((g) => {
        const cx = (g.x0 + g.x1) / 2;
        const w = g.x1 - g.x0 + 0.6;
        return (
          <group key={g.name + g.x0}>
            <Slab pos={[cx, 5.5, -9.55]} size={[w, 0.34, 0.16]} mat={mats().oak} edges={INK} edgeOpacity={0.35} />
            <Label pos={[g.x1 - 0.2, 5.52, -9.46]} size={0.19} font="serif" color={INK} anchorX="right">
              {g.name}
            </Label>
            <Label pos={[g.x0 + 0.2, 5.52, -9.46]} size={0.08} font="sans" color="#6b5f4e" anchorX="left" spacing={0.15}>
              {g.label}
            </Label>
          </group>
        );
      })}
    </group>
  );
}

/** The Front Desk: today's L1 poster, printed huge on the wall. */
function FrontDesk({ content }: { content: WorldContent }) {
  const cv = content.cv;
  const [first, ...rest] = cv.name.split(" ");
  const cx = (FRONT_DESK.x0 + FRONT_DESK.x1) / 2;
  const z = DAY.z0 + 0.03;
  const ring = useMemo(() => new THREE.MeshBasicMaterial({ color: "#c4b49a", transparent: true, opacity: 0.35 }), []);
  const deskLabels: [string, string][] = [
    ["to-work", "Workshop →"],
    ["to-records", "Records →"],
    ["to-thinking", "Plan Room ↑"],
    ["to-skills", "Type Case"],
  ];
  return (
    <group>
      {/* the poster */}
      <Slab pos={[cx, 2.65, z]} size={[5.6, 3.9, 0.03]} mat={mats().plasterDark} />
      <mesh position={[cx + 1.6, 3.2, z + 0.02]} material={ring}>
        <ringGeometry args={[1.25, 1.262, 64]} />
      </mesh>
      <mesh position={[cx + 1.6, 3.2, z + 0.02]} material={ring}>
        <ringGeometry args={[0.8, 0.81, 64]} />
      </mesh>
      <mesh position={[cx + 1.6 + 1.255, 3.2, z + 0.025]} material={mats().accent}>
        <circleGeometry args={[0.035, 12]} />
      </mesh>
      <Label pos={[cx - 2.55, 4.4, z + 0.03]} size={0.07} font="sans" color="#c4b49a" anchorX="left" spacing={0.25}>
        {cv.tag.toUpperCase()}
      </Label>
      <Label pos={[cx + 2.55, 4.4, z + 0.03]} size={0.07} font="sans" color="#c4b49a" anchorX="right" spacing={0.2}>
        {`${cv.contact.location} · ${content.nowYear}`.toUpperCase()}
      </Label>
      <Label pos={[cx - 2.55, 3.75, z + 0.03]} size={0.78} font="serif" color="#f2ece0" anchorX="left">
        {first}
      </Label>
      <Label pos={[cx - 2.55, 2.95, z + 0.03]} size={0.78} font="serifItalic" color="#f2ece0" anchorX="left">
        {rest.join(" ")}
      </Label>
      <mesh position={[cx, 2.25, z + 0.03]} material={mats().accent}>
        <planeGeometry args={[5.1, 0.008]} />
      </mesh>
      <Label pos={[cx - 2.55, 1.98, z + 0.03]} size={0.13} font="serifItalic" color="#e8dcc6" anchorX="left" anchorY="top" maxWidth={4.2}>
        {`“${cv.bio.split(".")[0]}.”`}
      </Label>
      {/* registration marks */}
      {[
        [cx - 2.68, 4.5],
        [cx + 2.68, 4.5],
        [cx - 2.68, 0.8],
        [cx + 2.68, 0.8],
      ].map(([x, y], i) => (
        <group key={i} position={[x, y, z + 0.03]}>
          <mesh material={ring}>
            <ringGeometry args={[0.06, 0.068, 24]} />
          </mesh>
          <mesh material={ring}>
            <planeGeometry args={[0.2, 0.006]} />
          </mesh>
          <mesh material={ring}>
            <planeGeometry args={[0.006, 0.2]} />
          </mesh>
        </group>
      ))}

      {/* the reception desk with its brass labels */}
      <Slab pos={[cx, 0.52, -11.1]} size={[4.2, 1.04, 0.8]} mat={mats().oak} edges={INK} edgeOpacity={0.4} />
      <Slab pos={[cx, 1.06, -11.1]} size={[4.3, 0.05, 0.86]} mat={mats().walnut} />
      {deskLabels.map(([id, text], i) => (
        <Hot key={id} id={id} label={text} marker={[cx - 1.55 + i * 1.03, 0.98, -10.6]}>
          <Slab pos={[cx - 1.55 + i * 1.03, 0.72, -10.69]} size={[0.86, 0.17, 0.02]} mat={mats().brass} />
          <Label pos={[cx - 1.55 + i * 1.03, 0.72, -10.675]} size={0.06} font="sans" color="#2b2119" spacing={0.08}>
            {text}
          </Label>
        </Hot>
      ))}
      {cv.links.map((l, i) => (
        <Hot key={l.icon} id={`link-${l.icon}`} label={`${l.label} ↗`} marker={[cx - 1.2 + i * 0.8, 1.32, -11.0]}>
          <Slab pos={[cx - 1.2 + i * 0.8, 1.12, -11.0]} size={[0.6, 0.06, 0.2]} mat={mats().brassDark} />
          <Label pos={[cx - 1.2 + i * 0.8, 1.152, -10.98]} rot={[-Math.PI / 2, 0, 0]} size={0.055} font="sans" color="#f2ece0">
            {l.label}
          </Label>
        </Hot>
      ))}
      <Hot id="card-catalogue" label="Card catalogue — every project" marker={[cx + 2.6, 1.5, -11.1]}>
        <Slab pos={[cx + 2.65, 0.6, -11.1]} size={[0.7, 1.2, 0.6]} mat={mats().oak} edges={INK} edgeOpacity={0.4} />
        {[0, 1, 2, 3].map((r) => (
          <Slab key={r} pos={[cx + 2.65, 0.25 + r * 0.26, -10.79]} size={[0.56, 0.18, 0.02]} mat={mats().walnut} />
        ))}
        <Label pos={[cx + 2.65, 1.28, -10.79]} size={0.045} font="sans" color={INK} spacing={0.15}>
          CARD CATALOGUE
        </Label>
      </Hot>
      <LampLight id="desk-lamp" pos={[cx, 3.0, -10]} color="#fff2dc" intensity={2} distance={8} />
    </group>
  );
}

function TypeCase({ content, plan }: { content: WorldContent; plan: DayWingPlan }) {
  const open = useWorld((s) => s.drawer);
  const hovered = useWorld((s) => s.hovered?.id ?? null);
  const groups = content.skills;
  const h = 0.32;
  const top = 0.35 + groups.length * h;
  const hoveredTag = hovered?.startsWith("skill:") ? hovered.slice(6) : null;
  const bays = hoveredTag ? plan.bays.filter((b) => matchesSkill(b.project.stack.join(" ") + " " + b.project.description, hoveredTag)) : [];
  return (
    <group position={[TYPE_CASE.x, 0, TYPE_CASE.z]}>
      <Slab pos={[0, top / 2, 0.05]} size={[1.7, top, 0.7]} mat={mats().oak} edges={INK} edgeOpacity={0.45} />
      <Label pos={[0, top + 0.12, -0.2]} rot={[0, Math.PI, 0]} size={0.09} font="sans" color="#6b5f4e" spacing={0.3}>
        TYPE CASE
      </Label>
      {groups.map((g, i) => {
        const y = 0.35 + (groups.length - 1 - i) * h + h / 2;
        const isOpen = open === i;
        return (
          <group key={g.group} position={[0, y, isOpen ? -0.62 : -0.29]}>
            <Hot id={`drawer-${i}`} label={`Drawer — ${g.group}`} marker={[0.72, 0, -0.02]}>
              <Slab pos={[0, 0, 0]} size={[1.62, h - 0.04, 0.06]} mat={mats().oak} edges={INK} edgeOpacity={0.4} />
              <Slab pos={[0, 0, -0.04]} size={[0.24, 0.035, 0.03]} mat={mats().brass} />
              <Label pos={[-0.76, 0.06, -0.035]} rot={[0, Math.PI, 0]} size={0.05} font="sans" color="#2b2119" anchorX="right" spacing={0.1}>
                {g.group.toUpperCase()}
              </Label>
            </Hot>
            {isOpen && <DrawerTray tags={g.tags} />}
          </group>
        );
      })}
      {bays.map((b) => (
        <ThreadTo key={b.project.slug} from={[TYPE_CASE.x, 1.0, TYPE_CASE.z - 0.7]} to={[b.cx, 1.6, -9.5]} />
      ))}
    </group>
  );
}

function DrawerTray({ tags }: { tags: string[] }) {
  return (
    <group position={[0, -0.1, 0.35]}>
      <Slab pos={[0, 0, 0]} size={[1.6, 0.04, 0.62]} mat={mats().walnut} />
      {tags.map((t, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = -0.38 + col * 0.78;
        const z = -0.2 + row * 0.16;
        return (
          <TypeBlock key={t} tag={t} pos={[x, 0.04, z]} />
        );
      })}
    </group>
  );
}

function TypeBlock({ tag, pos }: { tag: string; pos: [number, number, number] }) {
  const id = `skill:${tag}`;
  const active = useActive(id);
  return (
    <Hot id={id} label={`${tag} — threads show where it was used`} onActivate={() => runAction({ type: "none" })}>
      <Slab pos={pos} size={[0.72, 0.05, 0.12]} mat={active ? mats().brass : mats().brassDark} />
      <Label pos={[pos[0], pos[1] + 0.03, pos[2]]} rot={[-Math.PI / 2, 0, Math.PI]} size={0.05} font="serif" color="#f2ece0">
        {tag}
      </Label>
    </Hot>
  );
}

function ThreadTo({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const line = useMemo(() => {
    const mid = new THREE.Vector3((from[0] + to[0]) / 2, 2.8, (from[2] + to[2]) / 2);
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...from), mid, new THREE.Vector3(...to));
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(30)), new THREE.LineBasicMaterial({ color: ACCENT }));
  }, [from, to]);
  return <primitive object={line} />;
}

function matchesSkill(text: string, tag: string) {
  const t = text.toLowerCase();
  return tag
    .toLowerCase()
    .replace(/adobe /, "")
    .split(/[\s/]+/)
    .filter((w) => w.length > 3)
    .some((w) => t.includes(w.slice(0, 6)));
}

function RecordsRoom({ content }: { content: WorldContent }) {
  const cv = content.cv;
  const rx = (RECORDS.x0 + RECORDS.x1) / 2;
  const depth = RECORDS.z1 - RECORDS.z0;
  return (
    <group>
      {/* side partitions and lintel make the alcove */}
      <Slab pos={[RECORDS.x0, 1.6, RECORDS.z0 / 2]} size={[0.14, 3.2, depth]} mat={mats().plaster} edges={INK} edgeOpacity={0.3} />
      <Slab pos={[RECORDS.x1, 1.6, RECORDS.z0 / 2]} size={[0.14, 3.2, depth]} mat={mats().plaster} edges={INK} edgeOpacity={0.3} />
      <Slab pos={[rx, 3.3, RECORDS.z0 + 0.1]} size={[RECORDS.x1 - RECORDS.x0, 0.3, 0.16]} mat={mats().oak} edges={INK} edgeOpacity={0.35} />
      <Label pos={[rx, 3.3, RECORDS.z0 + 0.0]} rot={[0, Math.PI, 0]} size={0.12} font="sans" color={INK} spacing={0.3}>
        RECORDS
      </Label>
      {/* lectern with the open CV */}
      <Hot id="lectern" label="The CV on the lectern — read it" marker={[rx - 0.2, 1.55, -1.2]}>
        <Slab pos={[rx - 0.2, 0.55, -0.95]} size={[0.5, 1.1, 0.4]} mat={mats().walnut} edges={INK} edgeOpacity={0.3} />
        <group position={[rx - 0.2, 1.15, -0.95]} rotation={[-0.45, Math.PI, 0]}>
          <Slab pos={[0, 0, 0]} size={[0.9, 0.62, 0.03]} mat={mats().walnut} />
          <Slab pos={[-0.21, 0, 0.02]} size={[0.42, 0.56, 0.004]} mat={mats().paper} />
          <Slab pos={[0.21, 0, 0.02]} size={[0.42, 0.56, 0.004]} mat={mats().paper} />
          <Label pos={[-0.4, 0.24, 0.025]} size={0.03} font="serif" color={INK} anchorX="left">
            {cv.name}
          </Label>
          <Label pos={[-0.4, 0.19, 0.025]} size={0.014} font="sans" color="#6b5f4e" anchorX="left" anchorY="top" maxWidth={0.37} lineHeight={1.5}>
            {cv.summary}
          </Label>
          {content.experience.slice(0, 4).map((e, i) => (
            <Label key={e.id} pos={[0.02, 0.24 - i * 0.12, 0.025]} size={0.016} font="sans" color={INK} anchorX="left" anchorY="top" maxWidth={0.37}>
              {`${e.role}\n${e.company} · ${e.dateLabel}`}
            </Label>
          ))}
        </group>
      </Hot>
      {/* index tabs: one per job, leading out to the strip */}
      {content.experience.map((e, i) => (
        <Hot key={e.id} id={`tab-${e.id}`} label={`Index tab — ${e.company}`} marker={[rx + 0.35, 1.32 - i * 0.07, -1.12]}>
          <Slab pos={[rx + 0.27, 1.25 - i * 0.07, -1.06]} size={[0.07, 0.05, 0.01]} rot={[-0.45, Math.PI, 0]} mat={i % 2 ? mats().brass : mats().tape} />
        </Hot>
      ))}
      <Hot id="visiting-cards" label="Visiting cards — email and phone" marker={[rx + 0.45, 1.1, -0.9]}>
        <Slab pos={[rx + 0.42, 0.98, -0.95]} size={[0.16, 0.08, 0.1]} mat={mats().brass} />
        <Slab pos={[rx + 0.42, 1.04, -0.95]} size={[0.14, 0.06, 0.003]} mat={mats().paper} />
      </Hot>
      {/* plan chest with the language labels */}
      <Slab pos={[RECORDS.x0 + 1.05, 0.45, -1.3]} size={[1.6, 0.9, 1.1]} mat={mats().oak} edges={INK} edgeOpacity={0.4} />
      {cv.languages.map((l, i) => (
        <Label key={l.lang} pos={[RECORDS.x0 + 0.45 + i * 0.55, 0.91, -1.0]} rot={[-Math.PI / 2, 0, Math.PI]} size={0.055} font="serif" color={INK}>
          {`${l.lang} — ${l.level}`}
        </Label>
      ))}
      {/* archive boxes: education */}
      <Hot id="archive-box" label="Archive box — education" marker={[RECORDS.x1 - 0.45, 2.15, -2.2]}>
        {[0, 1, 2, 3].map((i) => (
          <Slab key={i} pos={[RECORDS.x1 - 0.45, 0.3 + i * 0.42, -2.2]} size={[0.6, 0.38, 0.9]} mat={mats().board} edges={INK} edgeOpacity={0.3} />
        ))}
        <Label pos={[RECORDS.x1 - 0.76, 1.56, -2.2]} rot={[0, -Math.PI / 2, 0]} size={0.045} font="sans" color={INK} maxWidth={0.8} align="center">
          {cv.education[0] ? `${cv.education[0].school} · ${cv.education[0].date}` : "Education"}
        </Label>
      </Hot>
      {/* the tray of printed copies by the door */}
      <Hot id="cv-copy" label="Take a copy — download the CV (PDF)" marker={[RECORDS.x1 - 0.5, 1.2, -4.6]}>
        <Slab pos={[RECORDS.x1 - 0.5, 0.95, -4.7]} size={[0.5, 0.06, 0.38]} mat={mats().brassDark} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Slab key={i} pos={[RECORDS.x1 - 0.5, 0.99 + i * 0.006, -4.7]} size={[0.42, 0.004, 0.3]} mat={mats().paper} />
        ))}
        <Slab pos={[RECORDS.x1 - 0.5, 0.47, -4.7]} size={[0.06, 0.94, 0.06]} mat={mats().walnut} />
        <Label pos={[RECORDS.x1 - 0.5, 1.12, -4.88]} size={0.045} font="serifItalic" color={INK}>
          take a copy
        </Label>
      </Hot>
      <Hot id="cv-view" label="View the PDF" marker={[RECORDS.x0 + 0.5, 1.55, -4.75]}>
        <Slab pos={[RECORDS.x0 + 0.5, 1.35, -4.85]} size={[0.5, 0.22, 0.02]} mat={mats().brass} />
        <Label pos={[RECORDS.x0 + 0.5, 1.35, -4.835]} size={0.05} font="sans" color="#2b2119" spacing={0.12}>
          VIEW PDF ↗
        </Label>
      </Hot>
      <LampLight id="records-skylight" pos={[rx, 3.0, -2.6]} color="#fff8ec" intensity={3.2} distance={7} />
    </group>
  );
}

function SchoolDesk({ content, plan }: { content: WorldContent; plan: DayWingPlan }) {
  const x = plan.schoolDeskX;
  const edu = content.cv.education[0];
  return (
    <group position={[x, 0, -9.6]}>
      <Hot id="student-folder" label="Student folder — education" marker={[0, 1.4, 0.3]}>
        <Slab pos={[0, 0.82, 0]} size={[1.4, 0.04, 0.9]} rot={[0.22, 0, 0]} mat={mats().oak} edges={INK} edgeOpacity={0.45} />
        {[-0.62, 0.62].map((dx) => (
          <Slab key={dx} pos={[dx, 0.4, 0]} size={[0.05, 0.8, 0.8]} mat={mats().walnut} />
        ))}
        <Slab pos={[0.05, 0.9, 0.05]} size={[0.9, 0.012, 0.04]} rot={[0.22, 0, 0]} mat={mats().ink} />
        <Slab pos={[-0.38, 0.9, -0.05]} size={[0.04, 0.012, 0.6]} rot={[0.22, 0, 0]} mat={mats().ink} />
        <Slab pos={[0.25, 0.88, 0.12]} size={[0.5, 0.02, 0.36]} rot={[0.22, 0, 0.05]} mat={mats().linen} />
        <Label pos={[0.25, 0.9, 0.13]} rot={[-Math.PI / 2 + 0.22, 0, 0.05]} size={0.032} font="type" color="#2b2119" maxWidth={0.46} align="center">
          {edu ? `${edu.degree}\n${edu.school}\n${edu.date}` : "Student folder"}
        </Label>
      </Hot>
      <Label pos={[0, 2.4, -4.2]} size={0.5} font="serifItalic" color="#c4b49a">
        {String(plan.years[0])}
      </Label>
    </group>
  );
}

/** The Plan Room's outside: a mezzanine box above the hall, reached by an
 * open stair. Its dark interior is its own zone (planroom). */
function Mezzanine() {
  const P = PLAN_ROOM;
  const cx = (P.x0 + P.x1) / 2;
  const steps = 14;
  return (
    <group>
      <Slab pos={[cx, P.floor - 0.1, (P.z0 + P.z1) / 2]} size={[P.x1 - P.x0, 0.2, P.z1 - P.z0]} mat={mats().oak} edges={INK} edgeOpacity={0.4} />
      {/* outer skin of the room, cream; its inner skin is dark (Plan Room zone) */}
      <Slab pos={[cx, P.floor + P.height / 2, P.z0 - 0.04]} size={[P.x1 - P.x0, P.height, 0.06]} mat={mats().plaster} edges={INK} edgeOpacity={0.3} />
      <Slab pos={[P.x1 + 0.04, P.floor + P.height / 2, -2.4]} size={[0.06, P.height, 4.8]} mat={mats().plaster} edges={INK} edgeOpacity={0.3} />
      <Slab pos={[P.x0 - 0.04, P.floor + P.height / 2, P.z0 / 2]} size={[0.06, P.height, -P.z0]} mat={mats().plaster} edges={INK} edgeOpacity={0.3} />
      <Label pos={[cx, P.floor + 1.6, P.z0 - 0.08]} rot={[0, Math.PI, 0]} size={0.16} font="sans" color={INK} spacing={0.35}>
        PLAN ROOM
      </Label>
      {/* the stair: rising west along the front wall, oak treads on two stringers */}
      {Array.from({ length: steps }, (_, i) => (
        <Slab key={i} pos={[-12.9 - (i + 0.5) * (5.5 / steps), ((i + 1) * P.floor) / steps - 0.05, -0.75]} size={[5.5 / steps + 0.02, 0.06, 0.95]} mat={mats().oak} />
      ))}
      {[-1.24, -0.26].map((z) => (
        <Slab key={z} pos={[-15.65, P.floor / 2 - 0.15, z]} size={[Math.hypot(5.5, P.floor), 0.22, 0.05]} rot={[0, 0, -Math.atan2(P.floor, 5.5)]} mat={mats().walnut} />
      ))}
      <Hot id="to-thinking" label="Stair up to the Plan Room" marker={[-12.6, 1.9, -1.4]}>
        <Slab pos={[-12.6, 0.6, -1.5]} size={[0.05, 1.2, 0.05]} mat={mats().brass} />
        <Slab pos={[-12.6, 1.3, -1.5]} size={[0.62, 0.2, 0.02]} mat={mats().brass} />
        <Label pos={[-12.6, 1.3, -1.488]} rot={[0, 0, 0]} size={0.07} font="sans" color="#2b2119" spacing={0.15}>
          PLAN ROOM ↑
        </Label>
      </Hot>
    </group>
  );
}
