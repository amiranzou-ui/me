"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { go, runAction } from "../../actions";
import { useWorld } from "../../store";
import { engine } from "../../audio/engine";
import {
  PATTERN_SURFACES,
  STAIR,
  hangGallery,
  hangPosters,
  levelY,
  seeded,
  stairHeight,
  tapeKitchen,
  type Vec3,
} from "../../layout";
import { textureSrc, type WorldCategory, type WorldContent, type WorldItem } from "../../content";
import { mats, INK, TAN, ACCENT, MOOD_COLORS, MOOD_ROOMS } from "../kit/materials";
import { Bulb, Hot, Label, LampLight, Pendant, Print, Slab, useActive } from "../kit/primitives";
import { useTex } from "../kit/useTexture";
import { TowerShell, invisible } from "./TowerShell";
import { WallClock } from "./Clock";
import { GlbModel, ModelSlot } from "../kit/Model";

/**
 * A tower floor: the shared shell plus the room kit its category asks for
 * (design doc §12–§15). Everything inside is placed from data — a new print
 * uploaded in the Studio is hung on the next free wall slot.
 */
export default function TowerFloor({ content, category }: { content: WorldContent; category: WorldCategory }) {
  const access = useWorld((s) => s.access);
  const locked = useWorld((s) => s.lockedItems);
  const closed = category.locked && access !== "friend";
  const items = category.locked ? (locked[category.slug] ?? []) : (content.items[category.slug] ?? []);
  const level = category.floor;
  const finish = category.room === "unfinished" ? "concrete" : category.room === "stair" || category.room === "listening" ? "brick" : "plaster";
  return (
    <TowerShell level={level} finish={finish} roman={category.roman} title={category.label} tagline={category.tagline} frontWindow={category.room !== "kitchen" || !closed}>
      {closed ? (
        <ClosedDoor level={level} category={category} />
      ) : category.room === "gallery" ? (
        <Gallery level={level} items={items} slug={category.slug} />
      ) : category.room === "stair" ? (
        <PosterStair level={level} items={items} slug={category.slug} />
      ) : category.room === "pattern" ? (
        <PatternRoom level={level} items={items} slug={category.slug} />
      ) : category.room === "listening" ? (
        <ListeningRoom level={level} content={content} />
      ) : category.room === "kitchen" ? (
        <Kitchen level={level} items={items} />
      ) : (
        <Unfinished level={level} items={items} slug={category.slug} />
      )}
    </TowerShell>
  );
}

const NONE: WorldItem[] = [];

const openImage = (slug: string, index: number) => runAction({ type: "open", sheet: { kind: "image", set: `chapter:${slug}`, index } });

// ── A closed floor: privacy shown, never disguised ──────────────────────
function ClosedDoor({ level, category }: { level: number; category: WorldCategory }) {
  const b = levelY(level);
  return (
    <group>
      <Slab pos={[8.6, b + 1.95, -6]} size={[0.12, 3.9, 12]} mat={mats().plasterNight} />
      <Hot id="closed-door" label={`${category.label} — friends only. Come back with the word.`} onActivate={() => runAction({ type: "open", sheet: { kind: "threshold" } })} marker={[8.45, b + 2.5, -6]}>
        <Slab pos={[8.52, b + 1.1, -6]} size={[0.1, 2.2, 1.0]} mat={mats().walnut} edges={TAN} edgeOpacity={0.35} />
        <mesh position={[8.45, b + 1.3, -5.62]} material={mats().brass}>
          <sphereGeometry args={[0.04, 8, 6]} />
        </mesh>
        <Slab pos={[8.45, b + 1.55, -6.1]} size={[0.01, 0.22, 0.3]} mat={mats().paper} />
        <Label pos={[8.44, b + 1.6, -6.1]} rot={[0, -Math.PI / 2, 0]} size={0.03} font="serifItalic" color={INK} maxWidth={0.26} align="center">
          {"friends only.\ncome back with the word."}
        </Label>
      </Hot>
      {/* light under the door, and the sounds behind it */}
      <mesh position={[8.44, b + 0.012, -6]} rotation={[-Math.PI / 2, 0, 0]} material={mats().leak}>
        <planeGeometry args={[0.4, 1.0]} />
      </mesh>
      <LampLight id={`closed-${category.slug}`} pos={[8.3, b + 0.3, -6]} color="#f2c98a" intensity={1.6} distance={3} />
      <Bulb id={`landing-${category.slug}`} pos={[5.6, b + 3.2, -4.5]} intensity={2.5} distance={6} />
    </group>
  );
}

// ── Floor I: the Print Gallery ──────────────────────────────────────────
function Gallery({ level, items, slug }: { level: number; items: WorldItem[]; slug: string }) {
  const b = levelY(level);
  const hung = useMemo(() => hangGallery(items, level), [items, level]);
  const access = useWorld((s) => s.access);
  const rolls = new Set(hung.map((h) => h.roll));
  return (
    <group>
      {hung.map((h) => (
        <Print
          key={h.item.id}
          id={`print-${h.item.id}`}
          label={h.item.caption || `Print ${h.index + 1}`}
          img={h.item.img}
          pos={h.pos}
          rotY={h.rotY}
          w={h.w}
          h={h.h}
          tilt={h.tilt}
          caption={h.item.caption}
          onActivate={() => openImage(slug, h.index)}
        />
      ))}
      {[...rolls].filter((r) => r > 1).map((r, i) => (
        <group key={r}>
          <Slab pos={[10.6, b + 1.5, -4.2 - i * 2.6]} size={[7.8, 2.4, 0.08]} mat={mats().plasterNight} edges={TAN} edgeOpacity={0.2} />
          <Label pos={[6.6, b + 2.85, -4.15 - i * 2.6]} size={0.08} font="sans" color={TAN} anchorX="left" spacing={0.3}>
            {`ROLL ${String(r).padStart(2, "0")}`}
          </Label>
        </group>
      ))}
      <LightTable items={items} slug={slug} level={level} />
      <Label pos={[4.25, b + 3.2, -11.88]} size={0.06} font="sans" color={TAN} anchorX="left" spacing={0.3}>
        ROLL 01
      </Label>
      {/* the Darkroom door at the back, red safelight above it */}
      <Hot id="darkroom-door" label={access === "friend" ? "The Darkroom" : "The Darkroom — do not open"} onActivate={() => (access === "friend" ? go("darkroom") : runAction({ type: "open", sheet: { kind: "threshold" } }))} marker={[15.85, b + 2.6, -0.9]}>
        <Slab pos={[15.9, b + 1.05, -0.9]} size={[0.06, 2.1, 0.8]} mat={mats().walnut} />
        <mesh position={[15.86, b + 2.3, -0.9]} rotation={[0, -Math.PI / 2, 0]} material={mats().safelight}>
          <planeGeometry args={[0.24, 0.1]} />
        </mesh>
        <mesh position={[15.85, b + 0.012, -0.9]} rotation={[-Math.PI / 2, 0, 0]} material={mats().safelight}>
          <planeGeometry args={[0.3, 0.7]} />
        </mesh>
      </Hot>
      <Label pos={[15.84, b + 1.6, -0.9]} rot={[0, -Math.PI / 2, 0]} size={0.035} font="serifItalic" color="#b48c6a">
        do not open
      </Label>
      <DarkroomLine level={level} />
      <Pendant id="gallery-pendant-a" pos={[8, b + 3.6, -6]} intensity={2.4} distance={8} />
    </group>
  );
}

function LightTable({ items, slug, level }: { items: WorldItem[]; slug: string; level: number }) {
  const b = levelY(level);
  const cols = 6;
  return (
    <group position={[5.6, b, -6]}>
      <Slab pos={[0, 0.88, 0]} size={[1.6, 0.06, 1.0]} mat={mats().lampCold} />
      <Slab pos={[0, 0.44, 0]} size={[1.5, 0.82, 0.9]} mat={mats().walnut} edges={TAN} edgeOpacity={0.2} />
      {items.slice(0, 36).map((it, i) => (
        <Transparency key={it.id} item={it} pos={[-0.65 + (i % cols) * 0.26, 0.915, -0.36 + Math.floor(i / cols) * 0.18]} onClick={() => openImage(slug, i)} />
      ))}
      <LampLight id="light-table" pos={[5.6, b + 1.2, -6]} color="#eef1f0" intensity={1.2} distance={2.5} />
      <Label pos={[0, 0.92, 0.48]} rot={[-Math.PI / 2, 0, 0]} size={0.035} font="sans" color="#6b5f4e" spacing={0.25}>
        CONTACT SHEET
      </Label>
    </group>
  );
}

function Transparency({ item, pos, onClick }: { item: WorldItem; pos: Vec3; onClick: () => void }) {
  const tex = useTex(item.img ? textureSrc(item.img, 640) : null);
  const id = `print-${item.id}`;
  const active = useActive(id);
  const aspect = item.img ? item.img.width / item.img.height : 1.33;
  const w = 0.2;
  return (
    <Hot id={id} label={item.caption || "Contact sheet frame"} onActivate={onClick}>
      <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, w / aspect]} />
        <meshBasicMaterial map={tex} color={active ? "#ffffff" : "#d9d4cc"} toneMapped={false} />
      </mesh>
    </Hot>
  );
}

function DarkroomLine({ level }: { level: number }) {
  const darkroom = useWorld((s) => s.lockedItems.darkroom);
  const locked = darkroom ?? NONE;
  const stationId = useWorld((s) => s.stationId);
  const b = levelY(level);
  if (stationId !== "darkroom") return null;
  return (
    <group>
      <LampLight id="safelight" pos={[15.2, b + 2.4, -0.9]} color="#a8341c" intensity={3} distance={4} />
      {locked.length === 0 ? (
        <Label pos={[15.6, b + 1.6, -0.4]} rot={[0, -Math.PI * 0.8, 0]} size={0.05} font="serifItalic" color="#d07a5a">
          nothing drying tonight.
        </Label>
      ) : (
        locked.slice(0, 6).map((it, i) => (
          <Print key={it.id} id={`dark-${it.id}`} label={it.caption ?? "A print, drying"} img={it.img} pos={[15.3 - i * 0.5, b + 1.8, -0.35]} rotY={Math.PI} w={0.4} h={0.3} frame="none" pictureLight={false} onActivate={() => runAction({ type: "open", sheet: { kind: "image", set: "darkroom", index: i } })} />
        ))
      )}
    </group>
  );
}

// ── Floor II: the Poster Stair ──────────────────────────────────────────
function PosterStair({ level, items, slug }: { level: number; items: WorldItem[]; slug: string }) {
  const b = levelY(level);
  const hung = useMemo(() => hangPosters(items, level), [items, level]);
  const steps = 16;
  const run = (STAIR.x1 - STAIR.x0) / steps;
  return (
    <group>
      {Array.from({ length: steps }, (_, i) => {
        const x = STAIR.x0 + (i + 0.5) * run;
        const top = stairHeight(STAIR.x0 + (i + 1) * run);
        return <Slab key={i} pos={[x, b + top / 2, -10.6]} size={[run + 0.01, Math.max(0.02, top), 1.0]} mat={mats().walnut} edges={TAN} edgeOpacity={0.18} />;
      })}
      <Slab pos={[15.1, b + STAIR.rise / 2, -10.6]} size={[1.8, STAIR.rise, 1.0]} mat={mats().walnut} />
      <Label pos={[15.1, b + STAIR.rise + 0.9, -11.88]} size={0.05} font="serifItalic" color="#b48c6a">
        life taught me something.
      </Label>
      {hung.map((h) => (
        <Print key={h.item.id} id={`poster-${h.item.id}`} label={h.item.caption || `Poster ${h.index + 1}`} img={h.item.img} pos={h.pos} w={h.w} h={h.h} frame="black" caption={h.item.caption} onActivate={() => openImage(slug, h.index)} />
      ))}
      {/* the flat-file chest at the foot of the stair: versions live here */}
      <Hot id="flat-file" label="Flat-file chest — versions" onActivate={() => runAction({ type: "open", sheet: { kind: "image", set: `chapter:${slug}`, index: 0 } })} marker={[4.4, b + 1.3, -7.2]}>
        <Slab pos={[4.4, b + 0.5, -7.6]} size={[1.4, 1.0, 1.0]} mat={mats().oak} edges={INK} edgeOpacity={0.35} />
        {[0, 1, 2, 3].map((i) => (
          <Slab key={i} pos={[4.4, b + 0.18 + i * 0.22, -7.08]} size={[1.25, 0.16, 0.02]} mat={mats().walnut} />
        ))}
        <Label pos={[4.4, b + 1.02, -7.6]} rot={[-Math.PI / 2, 0, 0]} size={0.05} font="type" color="#2b2119">
          versions
        </Label>
      </Hot>
      <Pendant id="stair-pendant" pos={[9, b + 3.6, -9]} intensity={4} distance={9} />
      <LampLight id="stair-top" pos={[14, b + 3.2, -10.5]} intensity={2.5} distance={6} />
    </group>
  );
}

// ── Floor III: the Pattern Room ─────────────────────────────────────────
function PatternRoom({ level, items, slug }: { level: number; items: WorldItem[]; slug: string }) {
  const b = levelY(level);
  const selected = useWorld((s) => s.pattern);
  const pick = items.length ? items[Math.min(selected, items.length - 1)] : null;
  return (
    <group>
      {items.length > 0 &&
        PATTERN_SURFACES.map((surface, i) => {
          const item = items[i % items.length];
          return <PatternSurface key={surface} surface={surface} item={item} index={i % items.length} level={level} />;
        })}
      {pick && (
        <group position={[9, b, -6.5]}>
          <Slab pos={[-0.38, 0.85, 0]} size={[0.035, 1.7, 0.035]} rot={[0.14, 0, 0.07]} mat={mats().walnut} />
          <Slab pos={[0.38, 0.85, 0]} size={[0.035, 1.7, 0.035]} rot={[0.14, 0, -0.07]} mat={mats().walnut} />
          <Slab pos={[0, 0.72, 0.03]} size={[1.0, 0.04, 0.09]} mat={mats().walnut} />
          <Print id={`pattern-view-${pick.id}`} label={`${pick.caption ?? "Graphic"} — look closely`} img={pick.img} pos={[9, b + 1.25, -6.42]} w={0.9} h={pick.img ? 0.9 / (pick.img.width / pick.img.height) : 0.9} frame="oak" pictureLight={false} dim={false} onActivate={() => openImage(slug, Math.min(selected, items.length - 1))} />
        </group>
      )}
      <Label pos={[7.2, b + 0.006, -3.6]} rot={[-Math.PI / 2, 0, 0.05]} size={0.09} font="serifItalic" color="#8a7a65">
        spent a whole afternoon on the grid spacing.
      </Label>
      <Pendant id="pattern-pendant" pos={[9, b + 3.6, -6]} intensity={5} distance={9} />
    </group>
  );
}

function PatternSurface({ surface, item, index, level }: { surface: (typeof PATTERN_SURFACES)[number]; item: WorldItem; index: number; level: number }) {
  const b = levelY(level);
  const quality = useWorld((s) => s.quality);
  const base = useTex(item.img ? textureSrc(item.img, quality === "light" ? 640 : 1080) : null);
  const tex = useMemo(() => {
    if (!base) return null;
    const t = base.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    const a = item.img ? item.img.width / item.img.height : 1;
    t.repeat.set(surface === "ceiling" ? 4 : 5, (surface === "ceiling" ? 4 : 5) / a / 2.4);
    t.needsUpdate = true;
    return t;
  }, [base, surface, item.img]);
  useEffect(() => () => tex?.dispose(), [tex]);
  const id = `pattern-${item.id}`;
  const active = useActive(id);
  const place: { pos: Vec3; rot: Vec3; size: [number, number] } =
    surface === "back"
      ? { pos: [9.2, b + 1.95, -11.94], rot: [0, 0, 0], size: [13.4, 3.85] }
      : surface === "east"
        ? { pos: [15.94, b + 1.95, -6], rot: [0, -Math.PI / 2, 0], size: [11.8, 3.85] }
        : surface === "front"
          ? { pos: [7, b + 1.95, -0.06], rot: [0, Math.PI, 0], size: [9.6, 3.85] }
          : { pos: [9, b + 3.88, -6], rot: [Math.PI / 2, 0, 0], size: [13.6, 11.8] };
  return (
    <Hot id={id} label={`${item.caption ?? "Graphic"} — set it on the easel`} onActivate={() => runAction({ type: "pattern", index })}>
      <mesh position={place.pos} rotation={place.rot}>
        <planeGeometry args={place.size} />
        <meshStandardMaterial map={tex} color={active ? "#fff3e4" : "#cfc6b8"} roughness={0.9} />
      </mesh>
    </Hot>
  );
}

// ── Floor IV: the Listening Room ────────────────────────────────────────
export const TURNTABLE_POS = (level: number): Vec3 => [11.4, levelY(level) + 0.95, -9.4];

function ListeningRoom({ level, content }: { level: number; content: WorldContent }) {
  const b = levelY(level);
  const trackIndex = useWorld((s) => s.trackIndex);
  const playing = useWorld((s) => s.playing);
  const mood = useWorld((s) => s.mood);
  const track = content.tracks[trackIndex];
  const moodKey = mood ?? (playing ? track?.mood[0] : null) ?? "english";
  const lampColor = MOOD_COLORS[moodKey] ?? "#c4b49a";
  const room = mood ? MOOD_ROOMS[mood]?.room : (track?.room ?? MOOD_ROOMS[moodKey]?.room ?? "Listening Room");
  useEffect(() => {
    engine.setMusicPosition(TURNTABLE_POS(level));
  }, [level]);
  const filtered = content.tracks.map((t, i) => ({ t, i })).filter(({ t }) => !mood || t.mood.includes(mood));

  return (
    <group>
      {/* rug, armchair, cabinet */}
      <mesh position={[10, b + 0.006, -7]} rotation={[-Math.PI / 2, 0, 0]} material={mats().rug}>
        <planeGeometry args={[5, 3.6]} />
      </mesh>
      <group position={[13.6, b, -7.2]} rotation={[0, -0.9, 0]}>
        <ModelSlot name="armchair">
          <Slab pos={[0, 0.25, 0]} size={[0.95, 0.5, 0.9]} mat={mats().felt} />
          <Slab pos={[0, 0.7, -0.38]} size={[0.95, 0.75, 0.16]} mat={mats().felt} />
          <Slab pos={[-0.43, 0.45, 0]} size={[0.12, 0.4, 0.9]} mat={mats().felt} />
          <Slab pos={[0.43, 0.45, 0]} size={[0.12, 0.4, 0.9]} mat={mats().felt} />
        </ModelSlot>
      </group>
      <Slab pos={[11.4, b + 0.38, -9.6]} size={[2.2, 0.76, 0.75]} mat={mats().walnut} edges={TAN} edgeOpacity={0.2} />
      <Turntable level={level} playing={playing} />
      {/* the lamp, coloured by the playing record's mood */}
      <group position={[13.1, b + 0.76, -9.6]}>
        <Slab pos={[0, 0.3, 0]} size={[0.025, 0.6, 0.025]} mat={mats().brass} />
        <mesh position={[0, 0.66, 0]}>
          <coneGeometry args={[0.18, 0.22, 20, 1, true]} />
          <meshStandardMaterial color={lampColor} side={THREE.DoubleSide} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.6, 0]} material={mats().lampGlow}>
          <sphereGeometry args={[0.04, 8, 6]} />
        </mesh>
      </group>
      <LampLight id="listening-lamp" pos={[13.1, b + 1.3, -9.4]} color={lampColor} intensity={6} distance={6} />
      {/* the crate of records */}
      <Crate level={level} content={content} filtered={filtered} />
      {/* mood plaques on the cabinet edge */}
      {Object.keys(MOOD_COLORS).map((m, i) => (
        <MoodPlaque key={m} mood={m} pos={[10.45 + i * 0.32, b + 0.6, -9.215]} />
      ))}
      <Label pos={[11.4, b + 2.5, -11.9]} size={0.26} font="serifItalic" color={TAN} opacity={0.6}>
        {room ?? "Listening Room"}
      </Label>
      <Label pos={[11.4, b + 2.2, -11.9]} size={0.07} font="serifItalic" color="#b48c6a">
        {mood ? MOOD_ROOMS[mood]?.desc : "Every song is a room. You choose which one to enter."}
      </Label>
      {moodKey === "arabic" && <Oud pos={[8.6, b + 1.9, -11.88]} />}
      <MoodWindow level={level} color={moodKey === "jazz" || moodKey === "quiet" ? "#3a4a6a" : null} />
      <NowPlayingCard level={level} title={track?.title ?? "Untitled Recording"} artist={track?.artist ?? ""} note={track?.note ?? "A memory left on the turntable."} />
      <Whispers level={level} playing={playing} />
      <WallClock pos={[15.9, b + 2.2, -4]} rotY={-Math.PI / 2} radius={0.22} label="your time" />
      <Label pos={[3.0, b + 2.4, -7.6]} rot={[0, Math.PI / 2, 0]} size={0.045} font="serifItalic" color="#b48c6a">
        For nights that only make sense at low volume.
      </Label>
    </group>
  );
}

function Turntable({ level, playing }: { level: number; playing: boolean }) {
  const b = levelY(level);
  const disc = useRef<THREE.Group>(null);
  const arm = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const sweep = useRef(0);
  const reduced = useWorld((s) => s.reducedMotion);
  useFrame((_, dt) => {
    spin.current += ((playing ? 3.46 : 0) - spin.current) * Math.min(1, dt * 1.2);
    if (disc.current && !reduced) disc.current.rotation.y -= spin.current * dt;
    if (playing) sweep.current = Math.min(1, sweep.current + dt / 90);
    else sweep.current = 0;
    if (arm.current) {
      const want = playing ? -0.35 - sweep.current * 0.3 : 0.55;
      arm.current.rotation.y += (want - arm.current.rotation.y) * Math.min(1, dt * 1.5);
    }
  });
  return (
    <group position={[11.4, b + 0.77, -9.55]}>
      <Hot id="turntable" label={playing ? "The record — pause" : "The record — play"} marker={[0, 0.3, 0.2]}>
        <Slab pos={[0, 0.04, 0]} size={[0.62, 0.08, 0.46]} mat={mats().walnut} edges={TAN} edgeOpacity={0.3} />
        <group ref={disc} position={[-0.06, 0.1, 0]}>
          <mesh material={mats().vinyl}>
            <cylinderGeometry args={[0.17, 0.17, 0.006, 48]} />
          </mesh>
          <mesh position={[0, 0.0035, 0]} material={mats().accent}>
            <cylinderGeometry args={[0.055, 0.055, 0.001, 32]} />
          </mesh>
          <mesh position={[0.1, 0.004, 0]} material={mats().tape}>
            <boxGeometry args={[0.02, 0.001, 0.004]} />
          </mesh>
        </group>
        <group ref={arm} position={[0.21, 0.12, -0.15]}>
          <Slab pos={[-0.08, 0, 0.1]} size={[0.012, 0.012, 0.26]} rot={[0, -0.6, 0]} mat={mats().brass} />
          <mesh material={mats().brass}>
            <cylinderGeometry args={[0.02, 0.02, 0.04, 12]} />
          </mesh>
        </group>
      </Hot>
      <Label pos={[0.22, 0.081, 0.19]} rot={[-Math.PI / 2, 0, 0]} size={0.018} font="sans" color={playing ? ACCENT : "#8a7a65"} spacing={0.2}>
        33 RPM
      </Label>
    </group>
  );
}

function Crate({ level, content, filtered }: { level: number; content: WorldContent; filtered: { t: WorldContent["tracks"][number]; i: number }[] }) {
  const b = levelY(level);
  const [front, setFront] = useState(0);
  const trackIndex = useWorld((s) => s.trackIndex);
  return (
    <group position={[9.4, b, -9.3]}>
      <Slab pos={[0, 0.2, 0]} size={[0.5, 0.4, 0.9]} mat={mats().oak} edges={INK} edgeOpacity={0.3} />
      <mesh
        position={[0, 0.45, 0]}
        material={invisible}
        onWheel={(e) => {
          e.stopPropagation();
          setFront((f) => (f + (e.deltaY > 0 ? 1 : -1) + filtered.length) % Math.max(1, filtered.length));
        }}
      >
        <boxGeometry args={[0.6, 0.6, 1]} />
      </mesh>
      {filtered.map(({ t, i }, k) => {
        const lean = k === front ? -0.35 : 0.08;
        const color = MOOD_COLORS[t.mood[0] ?? "english"] ?? "#c4b49a";
        return (
          <Hot key={t.id} id={`sleeve-${t.id}`} label={`${t.title}${t.artist ? ` — ${t.artist}` : ""}`} marker={[0, 0.72, 0.38 - k * 0.06]}>
            <group position={[0, 0.34, 0.36 - k * 0.07]} rotation={[lean, 0, 0]}>
              <mesh position={[0, 0.14, 0]}>
                <boxGeometry args={[0.31, 0.31, 0.006]} />
                <meshStandardMaterial color={i === trackIndex ? "#f2e6cc" : color} roughness={0.9} />
              </mesh>
              {k === front && (
                <>
                  <Label pos={[0, 0.2, 0.005]} size={0.022} font="type" color="#2b2119" maxWidth={0.27} align="center">
                    {t.title}
                  </Label>
                  <Label pos={[0, 0.1, 0.005]} size={0.014} font="serifItalic" color="#2b2119" maxWidth={0.27} align="center">
                    {t.fragment ?? ""}
                  </Label>
                </>
              )}
            </group>
          </Hot>
        );
      })}
      {filtered.length === 0 && (
        <Label pos={[0, 0.5, 0]} size={0.03} font="serifItalic" color={TAN}>
          no recordings in this room yet.
        </Label>
      )}
      <Label pos={[0, 0.405, 0.46]} size={0.022} font="sans" color="#2b2119" spacing={0.2}>
        {`${content.tracks.length} RECORDINGS`}
      </Label>
    </group>
  );
}

function MoodPlaque({ mood, pos }: { mood: string; pos: Vec3 }) {
  const current = useWorld((s) => s.mood);
  const id = `mood-${mood}`;
  const active = useActive(id) || current === mood;
  return (
    <Hot id={id} label={`Mood: ${MOOD_ROOMS[mood]?.room ?? mood}`}>
      <Slab pos={pos} size={[0.28, 0.08, 0.01]} mat={active ? mats().brass : mats().brassDark} />
      <Label pos={[pos[0], pos[1], pos[2] + 0.007]} size={0.026} font="sans" color={active ? "#2b2119" : "#d6c7a8"} spacing={0.1}>
        {mood.toUpperCase()}
      </Label>
    </Hot>
  );
}

function Oud({ pos }: { pos: Vec3 }) {
  return (
    <group position={pos} rotation={[0, 0, 0.5]}>
      <mesh scale={[1, 1.25, 0.45]} material={mats().walnut}>
        <sphereGeometry args={[0.3, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <Slab pos={[0, 0.5, 0.05]} size={[0.08, 0.7, 0.04]} mat={mats().walnut} />
    </group>
  );
}

function MoodWindow({ level, color }: { level: number; color: string | null }) {
  const b = levelY(level);
  if (!color) return null;
  return (
    <mesh position={[13, b + 1.9, 0.0]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[3, 2.2]} />
      <meshBasicMaterial color={color} transparent opacity={0.35} toneMapped={false} />
    </mesh>
  );
}

function NowPlayingCard({ level, title, artist, note }: { level: number; title: string; artist: string; note: string }) {
  const b = levelY(level);
  return (
    <group position={[12.55, b + 0.78, -9.35]} rotation={[-0.25, -0.2, 0]}>
      <Slab pos={[0, 0.06, 0]} size={[0.34, 0.2, 0.004]} mat={mats().paper} />
      <Label pos={[-0.15, 0.13, 0.004]} size={0.014} font="type" color="#9d4e24" anchorX="left" spacing={0.15}>
        NOW PLAYING
      </Label>
      <Label pos={[-0.15, 0.1, 0.004]} size={0.022} font="type" color="#2b2119" anchorX="left" anchorY="top" maxWidth={0.3}>
        {title}
      </Label>
      <Label pos={[-0.15, 0.04, 0.004]} size={0.013} font="serifItalic" color="#6b5f4e" anchorX="left" anchorY="top" maxWidth={0.3}>
        {[artist, note].filter(Boolean).join(" — ")}
      </Label>
    </group>
  );
}

const PRESENCE = ["i didn't skip this one", "this felt different back then", "i remember where i was", "some things don't need words", "still not sure why this stayed", "yeah. that.", "it was playing when —", "i kept this one"];

function Whispers({ level, playing }: { level: number; playing: boolean }) {
  const b = levelY(level);
  const [line, setLine] = useState<string | null>(null);
  useEffect(() => {
    if (!playing) return;
    let i = Math.floor(Math.random() * PRESENCE.length);
    let hide: ReturnType<typeof setTimeout>;
    const tick = () => {
      setLine(PRESENCE[i++ % PRESENCE.length]);
      hide = setTimeout(() => setLine(null), 4800);
    };
    const id = setInterval(tick, 13000 + Math.random() * 10000);
    return () => {
      clearInterval(id);
      clearTimeout(hide);
      setLine(null);
    };
  }, [playing]);
  if (!line) return null;
  return (
    <Label pos={[14.2, b + 1.9, -11.88]} size={0.06} font="serifItalic" color="#b48c6a" opacity={0.85}>
      {line}
    </Label>
  );
}

// ── Floor V: the Night Kitchen ──────────────────────────────────────────
function Kitchen({ level, items }: { level: number; items: WorldItem[] }) {
  const b = levelY(level);
  const taped = useMemo(() => tapeKitchen(items, level), [items, level]);
  return (
    <group>
      {/* tiles, counter, stove, fridge, table */}
      <mesh position={[9.5, b + 1.75, -11.93]}>
        <planeGeometry args={[9, 1.4]} />
        <meshStandardMaterial color="#d9d2c4" roughness={0.6} />
      </mesh>
      <Slab pos={[9.5, b + 0.45, -11.6]} size={[9, 0.9, 0.62]} mat={mats().walnut} edges={TAN} edgeOpacity={0.2} />
      <Slab pos={[9.5, b + 0.92, -11.6]} size={[9.1, 0.04, 0.66]} mat={mats().concrete} />
      <Slab pos={[7.2, b + 0.95, -11.6]} size={[0.6, 0.03, 0.5]} mat={mats().steel} />
      <group position={[14.6, b, -10.4]}>
        <ModelSlot name="fridge">
          <Slab pos={[0, 0.95, 0]} size={[0.8, 1.9, 0.75]} mat={mats().plaster} edges={INK} edgeOpacity={0.3} />
          <Slab pos={[-0.3, 1.2, 0.39]} size={[0.03, 0.4, 0.03]} mat={mats().steel} />
        </ModelSlot>
      </group>
      <Slab pos={[8, b + 0.74, -5.5]} size={[1.0, 0.04, 0.8]} mat={mats().oak} />
      <Slab pos={[8, b + 0.36, -5.5]} size={[0.06, 0.72, 0.06]} mat={mats().walnut} />
      {taped.map((t) => (
        <TapedPrint key={t.item.id} t={t} />
      ))}
      <Bulb id="kitchen-bulb" pos={[9.5, b + 3.0, -8.5]} intensity={5} distance={8} />
      <LampLight id="fridge-light" pos={[14.6, b + 1.2, -9.4]} color="#e7f0f2" intensity={1.2} distance={2.5} />
    </group>
  );
}

function TapedPrint({ t }: { t: ReturnType<typeof tapeKitchen>[number] }) {
  const id = `taped-${t.item.id}`;
  return (
    <group>
      <Print
        id={id}
        label={t.item.hover ?? t.item.caption ?? "A print"}
        img={t.item.img}
        pos={t.pos}
        w={t.w}
        h={t.h}
        tilt={t.tilt}
        frame="none"
        pictureLight={false}
        onActivate={() => runAction({ type: "open", sheet: { kind: "cooking", index: t.index } })}
      />
      <group position={[t.pos[0], t.pos[1] - t.h / 2 - 0.04, t.pos[2] + 0.006]} rotation={[0, 0, t.tilt * 0.6]}>
        <mesh material={mats().tape}>
          <planeGeometry args={[Math.max(0.36, t.w), 0.07]} />
        </mesh>
        <Label pos={[0, 0, 0.002]} size={0.022} font="serifItalic" color="#2b2119" maxWidth={Math.max(0.34, t.w)} align="center" direction="auto">
          {t.item.hover ?? ""}
        </Label>
      </group>
    </group>
  );
}

// ── Floor VI: the Unfinished Floor ──────────────────────────────────────
function Unfinished({ level, items, slug }: { level: number; items: WorldItem[]; slug: string }) {
  const b = levelY(level);
  const lines = ["well... I'm trying to do something here.", "the vertices are not cooperating.", "Blender crashed 4 times today. we move.", "my MacBook has no fan. it just silently judges me.", "— coming soon™ (probably)"];
  const wire = useMemo(() => new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.5, 0.5, 0.5)), new THREE.LineBasicMaterial({ color: "#c4622d" })), []);
  const pencilWall = useMemo(() => new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5, 3.6, 0.01)), new THREE.LineBasicMaterial({ color: "#9aa0a6", transparent: true, opacity: 0.5 })), []);
  const cube = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (cube.current) cube.current.rotation.y += dt * 0.15;
  });
  return (
    <group>
      {/* walls that exist only as pencil outlines */}
      <primitive object={pencilWall} position={[11, b + 1.85, -4]} rotation={[0, Math.PI / 2, 0]} />
      {[5, 9, 13].map((x) => (
        <Slab key={x} pos={[x, b + 1.95, -8]} size={[0.25, 3.9, 0.25]} mat={mats().steel} />
      ))}
      <mesh position={[13, b + 1.9, -0.25]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3.2, 2.4]} />
        <meshStandardMaterial color="#dfe5e6" transparent opacity={0.28} roughness={0.2} />
      </mesh>
      {/* folding table, laptop, wire cube */}
      <Slab pos={[9, b + 0.72, -6]} size={[1.4, 0.04, 0.7]} mat={mats().board} />
      <Slab pos={[9, b + 0.36, -6]} size={[0.04, 0.72, 0.6]} rot={[0, 0, 0.5]} mat={mats().steel} />
      <Hot id="laptop" label="The laptop — how the building was made" marker={[9.1, b + 1.15, -5.9]}>
        <Slab pos={[9.1, b + 0.75, -5.95]} size={[0.5, 0.02, 0.34]} mat={mats().steel} />
        <group position={[9.1, b + 0.92, -6.12]} rotation={[-0.2, 0, 0]}>
          <Slab pos={[0, 0, 0]} size={[0.5, 0.32, 0.015]} mat={mats().steel} />
          <mesh position={[0, 0, 0.009]}>
            <planeGeometry args={[0.46, 0.28]} />
            <meshBasicMaterial color="#3b3d40" toneMapped={false} />
          </mesh>
          <Label pos={[-0.21, 0.11, 0.011]} size={0.016} font="sans" color="#c9cdd1" anchorX="left">
            {"blender — building.blend"}
          </Label>
          <Label pos={[-0.21, -0.1, 0.011]} size={0.014} font="sans" color="#e8a26c" anchorX="left">
            {"1 object selected · cube"}
          </Label>
        </group>
      </Hot>
      <group ref={cube} position={[10.3, b + 1.05, -6]}>
        <primitive object={wire} />
      </group>
      {/* chalk on the concrete */}
      {lines.map((l, i) => (
        <Label key={i} pos={[4.0, b + 2.8 - i * 0.28, -11.9]} size={0.11} font="serifItalic" color="#e9e7e2" anchorX="left" opacity={0.85}>
          {l}
        </Label>
      ))}
      {/* the corkboard: the site's making-of, leading down */}
      <Hot id="corkboard" label="Corkboard — rejected drafts" marker={[15.85, b + 2.6, -6]}>
        <Slab pos={[15.93, b + 1.8, -6]} size={[0.04, 1.2, 1.8]} mat={mats().cork} />
        {["retro anime home — no", "retro soul — no", "art deco skyline — no", "editorial archive — no", "ghost imagery — no"].map((t, i) => (
          <group key={t} position={[15.9, b + 2.2 - i * 0.2, -6.5 + (i % 2) * 0.6]} rotation={[0, -Math.PI / 2, (seeded(t) - 0.5) * 0.2]}>
            <mesh material={mats().paper}>
              <planeGeometry args={[0.55, 0.13]} />
            </mesh>
            <Label pos={[0, 0, 0.002]} size={0.03} font="type" color="#2b2119">
              {t}
            </Label>
          </group>
        ))}
      </Hot>
      {/* models as they arrive: one plinth per 3D item */}
      {items.map((it, i) => (
        <ModelPlinth key={it.id} item={it} pos={[6 + i * 1.6, b, -10]} onOpen={() => runAction({ type: "open", sheet: { kind: "image", set: `chapter:${slug}`, index: i } })} />
      ))}
      <Bulb id="work-lamp" pos={[8.5, b + 2.6, -5]} cold intensity={7} distance={9} color="#eef3f6" />
    </group>
  );
}

function ModelPlinth({ item, pos, onOpen }: { item: WorldItem; pos: Vec3; onOpen: () => void }) {
  return (
    <group position={pos}>
      <Slab pos={[0, 0.45, 0]} size={[0.8, 0.9, 0.8]} mat={mats().concrete} />
      <Hot id={`model-${item.id}`} label={item.caption ?? "A model"} onActivate={onOpen} marker={[0, 1.8, 0.3]}>
        {item.modelPath ? (
          <group position={[0, 0.9, 0]}>
            <GlbModel path={item.modelPath} />
          </group>
        ) : (
          <Print id={`model-print-${item.id}`} label={item.caption ?? "A render"} img={item.img} pos={[0, 1.3, 0]} w={0.6} h={0.45} frame="none" pictureLight={false} dim={false} onActivate={onOpen} />
        )}
      </Hot>
    </group>
  );
}
