"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { towerLevels, levelY } from "../../layout";
import type { WorldContent } from "../../content";
import { mats, INK, TAN } from "../kit/materials";
import { Hot, Label, LampLight, Slab } from "../kit/primitives";
import { WallClock } from "./Clock";

/**
 * The Roof Study (design doc §7): where the person is. The profile panel's
 * "I. Elsewhere" and "II. Right now", made a room — a desk with the Right
 * now note, postcards for the four links, a letter tray for contact, two
 * clocks (yours and Baghdad's), and a skyline drawn in ink.
 */
export default function Roof({ content }: { content: WorldContent }) {
  const { roof } = towerLevels(content);
  const b = levelY(roof);
  const cv = content.cv;
  const skyline = useMemo(() => skylineTexture(), []);
  return (
    <group>
      {/* deck and glass study */}
      <Slab pos={[9, b - 0.05, -6]} size={[14, 0.1, 12]} mat={mats().planks} uv={0.8} />
      <mesh position={[8, b + 1.6, -6]} material={mats().glass}>
        <boxGeometry args={[8, 3.2, 8]} />
      </mesh>
      {[
        [4, -2],
        [12, -2],
        [4, -10],
        [12, -10],
      ].map(([x, z]) => (
        <Slab key={`${x}${z}`} pos={[x, b + 1.6, z]} size={[0.08, 3.2, 0.08]} mat={mats().ink} />
      ))}
      <Slab pos={[8, b + 3.22, -6]} size={[8.2, 0.06, 8.2]} mat={mats().plasterDark} />
      {/* the skyline, drawn in ink, far out to the north */}
      <mesh position={[8, b + 1.0, -40]}>
        <planeGeometry args={[90, 18]} />
        <meshBasicMaterial map={skyline} transparent toneMapped={false} />
      </mesh>
      <Label pos={[8, b + 2.6, -39.9]} size={0.6} font="serifItalic" color={TAN} opacity={0.5}>
        Baghdad
      </Label>

      {/* the desk */}
      <Slab pos={[8, b + 0.74, -8.4]} size={[2.2, 0.05, 0.9]} mat={mats().walnut} edges={TAN} edgeOpacity={0.25} />
      {[-1, 1].map((s) => (
        <Slab key={s} pos={[8 + s * 1.0, b + 0.36, -8.4]} size={[0.06, 0.72, 0.8]} mat={mats().walnut} />
      ))}
      <Hot id="note" label={`Right now — ${cv.currentlyLabel}: ${cv.currentlyValue}`} marker={[7.5, b + 1.0, -8.2]}>
        <group position={[7.5, b + 0.772, -8.25]} rotation={[-Math.PI / 2, 0, 0.06]}>
          <mesh material={mats().paper}>
            <planeGeometry args={[0.5, 0.34]} />
          </mesh>
          <Label pos={[-0.22, 0.13, 0.002]} size={0.022} font="sans" color="#9d4e24" anchorX="left" spacing={0.25}>
            {`II. RIGHT NOW`}
          </Label>
          <Label pos={[-0.22, 0.07, 0.002]} size={0.03} font="serifItalic" color={INK} anchorX="left" anchorY="top" maxWidth={0.44}>
            {`${cv.currentlyLabel} — ${cv.currentlyValue}`}
          </Label>
          <Label pos={[-0.22, -0.1, 0.002]} size={0.022} font="serif" color="#6b5f4e" anchorX="left" maxWidth={0.44}>
            {`${cv.name} · ${cv.tag}`}
          </Label>
        </group>
      </Hot>
      <Hot id="letter-tray" label="Letter tray — contact" marker={[8.65, b + 1.0, -8.3]}>
        <Slab pos={[8.65, b + 0.8, -8.3]} size={[0.4, 0.06, 0.3]} mat={mats().brassDark} />
        {[0, 1, 2].map((i) => (
          <Slab key={i} pos={[8.65, b + 0.835 + i * 0.006, -8.3]} size={[0.32, 0.004, 0.22]} mat={mats().paper} />
        ))}
        <Label pos={[8.65, b + 0.95, -8.15]} size={0.03} font="serifItalic" color={TAN}>
          write to me
        </Label>
      </Hot>
      {/* postcards on a rack: I. Elsewhere */}
      <Label pos={[5.2, b + 1.95, -9.95]} size={0.04} font="sans" color={TAN} anchorX="left" spacing={0.25}>
        I. ELSEWHERE
      </Label>
      {cv.links.map((l, i) => (
        <Hot key={l.icon} id={`postcard-${l.icon}`} label={`${l.label} ↗`} marker={[5.45 + i * 0.5, b + 1.95, -9.9]}>
          <group position={[5.45 + i * 0.5, b + 1.6, -9.96]} rotation={[0, 0, (i % 2 ? 1 : -1) * 0.04]}>
            <mesh material={mats().paper}>
              <planeGeometry args={[0.42, 0.28]} />
            </mesh>
            <Label pos={[0, 0, 0.002]} size={0.045} font="serif" color={INK}>
              {l.label}
            </Label>
          </group>
        </Hot>
      ))}
      <WallClock pos={[10.4, b + 2.1, -9.96]} radius={0.24} label="your time" />
      <WallClock pos={[11.2, b + 2.1, -9.96]} radius={0.24} label="Baghdad" timeZone="Asia/Baghdad" />
      <LampLight id="roof-desk" pos={[8, b + 1.6, -8.2]} color="#ffd9a0" intensity={4} distance={6} />
    </group>
  );
}

function skylineTexture() {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 400;
  const g = c.getContext("2d")!;
  g.strokeStyle = "rgba(196,180,154,0.85)";
  g.lineWidth = 2;
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const base = 360;
  g.beginPath();
  g.moveTo(0, base);
  let x = 0;
  while (x < 2048) {
    const k = r();
    const w = 30 + r() * 80;
    const h = 40 + r() * 140;
    if (k < 0.12) {
      // a dome on a drum
      g.lineTo(x, base - h * 0.6);
      g.arc(x + w / 2, base - h * 0.6, w / 2, Math.PI, 0);
      g.lineTo(x + w, base);
    } else if (k < 0.2) {
      // a minaret
      g.lineTo(x + w / 2 - 6, base);
      g.lineTo(x + w / 2 - 6, base - h * 1.5);
      g.lineTo(x + w / 2, base - h * 1.65);
      g.lineTo(x + w / 2 + 6, base - h * 1.5);
      g.lineTo(x + w / 2 + 6, base);
    } else if (k < 0.3) {
      // a palm
      g.lineTo(x + w / 2, base);
      g.moveTo(x + w / 2, base);
      g.quadraticCurveTo(x + w / 2 + 6, base - h * 0.6, x + w / 2, base - h);
      for (let f = 0; f < 5; f++) {
        g.moveTo(x + w / 2, base - h);
        g.quadraticCurveTo(x + w / 2 + (f - 2) * 14, base - h - 18, x + w / 2 + (f - 2) * 22, base - h + 10);
      }
      g.moveTo(x + w, base);
    } else {
      g.lineTo(x, base - h);
      g.lineTo(x + w, base - h);
      g.lineTo(x + w, base);
    }
    x += w;
  }
  g.stroke();
  // the river
  g.beginPath();
  g.moveTo(0, 385);
  for (let i = 0; i <= 2048; i += 64) g.quadraticCurveTo(i + 32, 380 + Math.sin(i) * 4, i + 64, 386);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
