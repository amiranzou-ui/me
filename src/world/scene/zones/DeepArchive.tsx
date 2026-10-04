"use client";

import { levelY } from "../../layout";
import { LOGBOOK, REJECTED, RETIRED } from "../../history";
import { mats, TAN } from "../kit/materials";
import { Bulb, Hot, Label, Slab } from "../kit/primitives";

/**
 * The Deep Archive (design doc §22): the building's past, underground.
 * Reached by holding the lobby's 00 button. Every item here is from the
 * project's real history (its git log): earlier versions of the site, the
 * homepage drafts that were tried and reverted, retired placeholder text.
 */
export default function DeepArchive() {
  const b = levelY(-1);
  return (
    <group>
      <Slab pos={[9, b - 0.05, -6]} size={[14, 0.1, 12]} mat={mats().concrete} uv={0.6} />
      <Slab pos={[9, b + 3.3, -6]} size={[14, 0.1, 12]} mat={mats().concrete} />
      <Slab pos={[9, b + 1.6, -12.05]} size={[14, 3.3, 0.1]} mat={mats().concrete} />
      <Slab pos={[16.05, b + 1.6, -6]} size={[0.1, 3.3, 12]} mat={mats().concrete} />
      <Slab pos={[9, b + 1.6, 0.05]} size={[14, 3.3, 0.1]} mat={mats().concrete} />
      <Slab pos={[1.95, b + 1.6, -10]} size={[0.1, 3.3, 4]} mat={mats().concrete} />
      <Slab pos={[1.95, b + 1.6, -2.5]} size={[0.1, 3.3, 5]} mat={mats().concrete} />

      {/* metal shelving with archive boxes */}
      {[0, 1, 2].map((shelf) => (
        <group key={shelf} position={[5 + shelf * 3.4, b, -11.4]}>
          {[0.35, 1.05, 1.75, 2.45].map((y) => (
            <Slab key={y} pos={[0, y, 0]} size={[3, 0.04, 0.9]} mat={mats().steel} />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <Slab key={i} pos={[-1.2 + (i % 4) * 0.8, 0.55 + Math.floor(i / 4) * 0.7, 0]} size={[0.6, 0.36, 0.7]} mat={mats().board} edges={TAN} edgeOpacity={0.15} />
          ))}
        </group>
      ))}

      {/* the old monitor: the logbook */}
      <Hot id="logbook" label="The building's logbook" marker={[13.4, b + 1.75, -6]}>
        <Slab pos={[13.4, b + 0.4, -6]} size={[1.2, 0.8, 0.8]} mat={mats().steel} />
        <Slab pos={[13.4, b + 1.15, -6.1]} size={[0.9, 0.7, 0.7]} mat={mats().board} />
        <mesh position={[13.4, b + 1.15, -5.74]}>
          <planeGeometry args={[0.72, 0.52]} />
          <meshBasicMaterial color="#1c1a14" toneMapped={false} />
        </mesh>
        {LOGBOOK.slice(-7).map((l, i) => (
          <Label key={l.date + l.text} pos={[13.07, b + 1.36 - i * 0.07, -5.73]} size={0.022} font="type" color="#d9b97a" anchorX="left" maxWidth={0.66}>
            {`${l.date}  ${l.text}`}
          </Label>
        ))}
      </Hot>

      {/* rejected drafts: framed proofs, each with a pencil "no" */}
      {REJECTED.map((r, i) => (
        <group key={r.title} position={[4.6 + i * 1.8, b + 1.7, -0.12]} rotation={[0, Math.PI, 0]}>
          <Slab pos={[0, 0, 0]} size={[1.3, 0.9, 0.03]} mat={mats().ink} />
          <Slab pos={[0, 0, 0.018]} size={[1.18, 0.78, 0.004]} mat={mats().paper} />
          <Label pos={[0, 0.18, 0.022]} size={0.06} font="serif" color="#2b2119" maxWidth={1.05} align="center">
            {r.title}
          </Label>
          <Label pos={[0, 0.0, 0.022]} size={0.03} font="sans" color="#6b5f4e" maxWidth={1.05} align="center">
            {r.date}
          </Label>
          <Label pos={[0.3, -0.22, 0.022]} size={0.14} font="serifItalic" color="#9d4e24">
            no
          </Label>
        </group>
      ))}

      {/* retired captions on a shelf of cards */}
      {RETIRED.map((t, i) => (
        <group key={t} position={[15.95, b + 1.8 - i * 0.24, -3 - (i % 2) * 0.4]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh material={mats().paper}>
            <planeGeometry args={[0.9, 0.18]} />
          </mesh>
          <Label pos={[0, 0, 0.002]} size={0.04} font="type" color="#2b2119">
            {t}
          </Label>
        </group>
      ))}
      <Label pos={[15.94, b + 2.35, -3.2]} rot={[0, -Math.PI / 2, 0]} size={0.045} font="sans" color={TAN} spacing={0.3}>
        RETIRED CAPTIONS
      </Label>

      <Bulb id="deep-bulb" pos={[9, b + 2.7, -6]} intensity={5} distance={9} />
    </group>
  );
}
