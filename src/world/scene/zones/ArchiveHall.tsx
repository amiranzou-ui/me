"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { useWorld } from "../../store";
import type { WorldContent } from "../../content";
import { mats, TAN, ACCENT } from "../kit/materials";
import { Bulb, Hot, Label, Slab, useActive } from "../kit/primitives";
import { TowerShell } from "./TowerShell";

/**
 * The Archive Hall (design doc §11): floor 00 of the tower. One hanging
 * bulb over the chapter directory; a huge italic numeral painted faintly on
 * the far wall changes as the visitor hovers a chapter, as it does today.
 * Hovering a line also starts loading that floor in the background.
 */
export default function ArchiveHall({ content }: { content: WorldContent }) {
  const access = useWorld((s) => s.access);
  const floors = [...content.categories].sort((a, b) => a.floor - b.floor);
  const [numeral, setNumeral] = useState(floors[0]?.roman ?? "I");
  const hovered = useWorld((s) => s.hovered?.id ?? s.focusedObject);
  const hoveredRoman = floors.find((c) => hovered === `chapter-line-${c.slug}`)?.roman;
  useEffect(() => {
    // the numeral keeps the last chapter hovered, as on today's site
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hoveredRoman) setNumeral(hoveredRoman);
  }, [hoveredRoman]);
  const boardX = 9.6;
  const top = 3.0;
  return (
    <TowerShell level={0} finish="plaster" roman="00" title="Archive Hall" tagline="Memory Archive" frontWindow={false}>
      {/* the painted numeral */}
      <Label pos={[15.93, 2.0, -6]} rot={[0, -Math.PI / 2, 0]} size={3.1} font="serifItalic" color={TAN} opacity={0.07}>
        {numeral}
      </Label>
      {/* the directory board */}
      <Slab pos={[boardX, 1.95, -11.92]} size={[4.6, 2.5, 0.04]} mat={mats().plasterDark} edges={TAN} edgeOpacity={0.45} />
      <Label pos={[boardX - 2.1, top + 0.1, -11.88]} size={0.07} font="sans" color={TAN} anchorX="left" spacing={0.4}>
        MEMORY ARCHIVE
      </Label>
      <Label pos={[boardX + 2.1, top + 0.1, -11.88]} size={0.1} font="serifItalic" color={TAN} anchorX="right">
        {String(content.nowYear)}
      </Label>
      <mesh position={[boardX, top - 0.02, -11.885]} material={mats().brassDark}>
        <planeGeometry args={[4.3, 0.006]} />
      </mesh>
      {floors.map((c, i) => (
        <ChapterLine
          key={c.slug}
          id={`chapter-line-${c.slug}`}
          y={top - 0.25 - i * 0.33}
          x={boardX - 2.1}
          roman={c.roman}
          label={c.label}
          tagline={c.tagline}
          locked={c.locked && access === "visitor"}
        />
      ))}
      <Bulb id="hall-bulb" pos={[boardX, 3.25, -10.4]} intensity={6} distance={8} />
    </TowerShell>
  );
}

function ChapterLine({ id, x, y, roman, label, tagline, locked }: { id: string; x: number; y: number; roman: string; label: string; tagline: string; locked: boolean }) {
  const active = useActive(id);
  return (
    <Hot id={id} label={locked ? `Chapter ${roman} — ${label} (closed to visitors)` : `Chapter ${roman} — ${label}`} marker={[x - 0.15, y, -11.86]}>
      <mesh position={[x + 2.1, y, -11.89]} material={invisibleWide}>
        <planeGeometry args={[4.4, 0.3]} />
      </mesh>
      <Label pos={[x, y, -11.88]} size={0.05} font="sans" color={active ? ACCENT : "#8a7a65"} anchorX="left" spacing={0.3}>
        {`CHAPTER ${roman}`}
      </Label>
      <Label pos={[x + 0.85, y, -11.88]} size={0.17} font="serifItalic" color={locked ? "#6b5842" : active ? "#f2e6cc" : "#c4b49a"} anchorX="left">
        {label}
      </Label>
      {locked && (
        <Label pos={[x + 4.05, y, -11.88]} size={0.06} font="sans" color="#6b5842" anchorX="right" spacing={0.2}>
          FRIENDS
        </Label>
      )}
      {active && (
        <Label pos={[x + 0.85, y - 0.13, -11.88]} size={0.05} font="serifItalic" color={ACCENT} anchorX="left">
          {tagline}
        </Label>
      )}
    </Hot>
  );
}

const invisibleWide = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
