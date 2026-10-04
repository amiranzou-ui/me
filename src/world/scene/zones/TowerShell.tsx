"use client";

import type { ReactNode } from "react";
import * as THREE from "three";
import { go } from "../../actions";
import { TOWER, levelY } from "../../layout";
import { mats, TAN } from "../kit/materials";
import { Hot, Label, Slab } from "../kit/primitives";

/**
 * One tower floor's architecture, shared by every chapter so the floors
 * read as one building (design doc §6): the same plaster or brick, the same
 * landing by the elevator with its numeral plaque, the same window on the
 * night city, and on every landing a tall window looking back west across
 * the Seam to the daylit wing (today's "home loop").
 */
export type Finish = "plaster" | "brick" | "concrete";

const FRAGMENTS = ["Baghdad, 2025", "2:14 AM", "taken after work", "almost walked past this", "still one of my favorites", "stayed on repeat for 11 days", "it was playing when —"];

export function TowerShell({
  level,
  finish = "plaster",
  roman,
  title,
  tagline,
  children,
  height = 3.9,
  frontWindow = true,
}: {
  level: number;
  finish?: Finish;
  roman: string;
  title: string;
  tagline?: string;
  children?: ReactNode;
  height?: number;
  frontWindow?: boolean;
}) {
  const b = levelY(level);
  const wall = finish === "brick" ? mats().brick : finish === "concrete" ? mats().concrete : mats().plasterNight;
  const floor = finish === "concrete" ? mats().concrete : mats().planks;
  const W = TOWER.x1 - TOWER.x0;
  const cx = (TOWER.x0 + TOWER.x1) / 2;
  const h = height;
  const frag = FRAGMENTS[(level + 2) % FRAGMENTS.length];
  return (
    <group>
      <Slab pos={[cx, b - 0.05, -6]} size={[W, 0.1, 12]} mat={floor} uv={0.8} />
      <Slab pos={[cx, b + h + 0.05, -6]} size={[W, 0.1, 12]} mat={mats().plasterDark} />
      <Slab pos={[cx, b + h / 2, TOWER.z0 - 0.05]} size={[W, h, 0.1]} mat={wall} uv={0.5} />
      <Slab pos={[TOWER.x1 + 0.05, b + h / 2, -6]} size={[0.1, h, 12]} mat={wall} uv={0.5} />
      {/* front wall with a window on the night city */}
      {frontWindow ? (
        <>
          <Slab pos={[6.5, b + h / 2, 0.05]} size={[9, h, 0.1]} mat={wall} uv={0.5} />
          <Slab pos={[15.25, b + h / 2, 0.05]} size={[1.5, h, 0.1]} mat={wall} uv={0.5} />
          <Slab pos={[13, b + 0.45, 0.05]} size={[3, 0.9, 0.1]} mat={wall} uv={0.5} />
          <Slab pos={[13, b + h - 0.35, 0.05]} size={[3, 0.7, 0.1]} mat={wall} uv={0.5} />
          <mesh position={[13, b + 1.9, 0.12]} rotation={[0, Math.PI, 0]} material={mats().nightWindow}>
            <planeGeometry args={[3, 2.2]} />
          </mesh>
          <Slab pos={[13, b + 0.9, -0.05]} size={[3.1, 0.06, 0.25]} mat={mats().walnut} />
        </>
      ) : (
        <Slab pos={[cx, b + h / 2, 0.05]} size={[W, h, 0.1]} mat={wall} uv={0.5} />
      )}
      {/* west wall: elevator doors, and either the door from the lobby
          (floor 00) or the landing window across the Seam (every other floor) */}
      <Slab pos={[TOWER.x0 - 0.05, b + h / 2, -10]} size={[0.1, h, 4]} mat={wall} uv={0.5} />
      <Slab pos={[TOWER.x0 - 0.05, b + h - 0.45, -7]} size={[0.1, 0.9, 2]} mat={wall} uv={0.5} />
      <Slab pos={[TOWER.x0 + 0.02, b + 1.5, -7.5]} size={[0.04, 2.9, 0.95]} mat={mats().brass} />
      <Slab pos={[TOWER.x0 + 0.02, b + 1.5, -6.5]} size={[0.04, 2.9, 0.95]} mat={mats().brass} />
      {level === 0 ? (
        <>
          <Slab pos={[TOWER.x0 - 0.05, b + h / 2, -4.6]} size={[0.1, h, 2.8]} mat={wall} uv={0.5} />
          <Slab pos={[TOWER.x0 - 0.05, b + h - 0.3, -2]} size={[0.1, 0.6, 2.4]} mat={wall} uv={0.5} />
          <Slab pos={[TOWER.x0 - 0.05, b + h / 2, -0.4]} size={[0.1, h, 0.8]} mat={wall} uv={0.5} />
        </>
      ) : (
        <>
          <Slab pos={[TOWER.x0 - 0.05, b + h / 2, -4.9]} size={[0.1, h, 2.2]} mat={wall} uv={0.5} />
          <Slab pos={[TOWER.x0 - 0.05, b + h / 2, -0.95]} size={[0.1, h, 1.9]} mat={wall} uv={0.5} />
          <Slab pos={[TOWER.x0 - 0.05, b + h - 0.45, -2.9]} size={[0.1, 0.9, 1.8]} mat={wall} uv={0.5} />
          <Slab pos={[TOWER.x0 - 0.05, b + 0.35, -2.9]} size={[0.1, 0.7, 1.8]} mat={wall} uv={0.5} />
          <Hot id="window-across" label="Window across the Seam — the Day Wing" onActivate={() => go("desk")} marker={[TOWER.x0 + 0.15, b + 3.05, -2.9]}>
            <mesh position={[TOWER.x0 - 0.02, b + 1.95, -2.9]} rotation={[0, Math.PI / 2, 0]} material={mats().dayWindow}>
              <planeGeometry args={[1.8, 2.3]} />
            </mesh>
          </Hot>
        </>
      )}
      {/* landing plaque */}
      <group position={[TOWER.x0 + 0.04, b + 2.35, -4.9]} rotation={[0, Math.PI / 2, 0]}>
        <Slab pos={[0, 0, 0]} size={[1.3, 0.62, 0.02]} mat={mats().plasterDark} edges={TAN} edgeOpacity={0.4} />
        <Label pos={[0, 0.17, 0.015]} size={0.16} font="serifItalic" color={TAN}>
          {roman}
        </Label>
        <Label pos={[0, -0.02, 0.015]} size={0.1} font="serif" color="#ede4d3">
          {title}
        </Label>
        {tagline && (
          <Label pos={[0, -0.16, 0.015]} size={0.035} font="serifItalic" color="#b48c6a" maxWidth={1.2} align="center">
            {tagline}
          </Label>
        )}
      </group>
      {/* a memory fragment pencilled on the landing wall */}
      <Label pos={[TOWER.x0 + 0.04, b + 1.15, -4.4]} rot={[0, Math.PI / 2, 0]} size={0.05} font="serifItalic" color="#8a7a65" opacity={0.75}>
        {frag}
      </Label>
      {children}
    </group>
  );
}

export const invisible = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
