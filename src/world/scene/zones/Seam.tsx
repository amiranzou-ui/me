"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { go, leave } from "../../actions";
import { useWorld } from "../../store";
import { SEAM, towerLevels, levelY } from "../../layout";
import type { WorldContent } from "../../content";
import { mats, INK, TAN } from "../kit/materials";
import { Bulb, Hot, Label, LampLight, Pendant, Slab, useActive } from "../kit/primitives";
import { rig } from "../rigState";
import { WallClock } from "./Clock";

/**
 * The Seam (design doc §7): the Threshold Lobby at floor 00, the glass
 * shaft, the elevator. Dusk light — the one place both temperatures meet.
 */
export default function Seam({ content }: { content: WorldContent }) {
  const { roof } = towerLevels(content);
  const access = useWorld((s) => s.access);
  const owner = useWorld((s) => s.owner);
  const top = levelY(roof) + 3;
  const floors = [...content.categories].sort((a, b) => a.floor - b.floor);
  const L = SEAM.lobby;
  const wall = mats().plaster;
  const doorOpen = access !== null;

  return (
    <group>
      {/* floor, ceiling */}
      <Slab pos={[-1, -0.05, -6]} size={[6, 0.1, 12]} mat={mats().terrazzo} uv={0.6} />
      <Slab pos={[-1, 5.55, -6]} size={[6, 0.1, 12]} mat={mats().plasterDusk} />
      {/* back wall */}
      <Slab pos={[-1, 2.75, L.z0 - 0.05]} size={[6, 5.5, 0.1]} mat={wall} edges={INK} edgeOpacity={0.25} />
      {/* west wall with the archway into the Day Wing (opening z −10 … −4) */}
      <Slab pos={[L.x0 - 0.05, 2.75, -11]} size={[0.1, 5.5, 2]} mat={wall} />
      <Slab pos={[L.x0 - 0.05, 2.75, -2]} size={[0.1, 5.5, 4]} mat={wall} />
      <Slab pos={[L.x0 - 0.05, 4.6, -7]} size={[0.1, 1.8, 6]} mat={wall} />
      <Hot id="archway" label="Archway — Day Wing (Matrix)" marker={[L.x0 + 0.1, 3.0, -7]}>
        <mesh position={[L.x0 - 0.02, 1.85, -7]} rotation={[0, Math.PI / 2, 0]} material={invisible}>
          <planeGeometry args={[6, 3.7]} />
        </mesh>
      </Hot>
      {/* east wall with the tower door (opening z −3.2 … −0.8) */}
      <Slab pos={[L.x1 + 0.05, 2.75, -7.6]} size={[0.1, 5.5, 8.8]} mat={wall} />
      <Slab pos={[L.x1 + 0.05, 4.4, -2]} size={[0.1, 2.2, 2.4]} mat={wall} />
      <Slab pos={[L.x1 + 0.05, 2.75, -0.4]} size={[0.1, 5.5, 0.8]} mat={wall} />
      <TowerDoor open={doorOpen} />
      {/* front wall with the door out (opening x −1 … 1) */}
      <Slab pos={[-2.5, 2.75, 0.05]} size={[3, 5.5, 0.1]} mat={wall} />
      <Slab pos={[1.5, 2.75, 0.05]} size={[1, 5.5, 0.1]} mat={wall} />
      <Slab pos={[0, 4.25, 0.05]} size={[2, 2.5, 0.1]} mat={wall} />
      <Hot id="front-door-out" label="Step outside" marker={[0, 3.2, -0.1]}>
        <mesh position={[0, 1.5, 0.0]} rotation={[0, Math.PI, 0]} material={mats().leak}>
          <planeGeometry args={[2, 3]} />
        </mesh>
      </Hot>

      {/* the brass diamond: floor 00 */}
      <mesh position={[-0.5, 0.004, -3.2]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} material={mats().brass}>
        <planeGeometry args={[0.42, 0.42]} />
      </mesh>
      <Label pos={[-0.5, 0.008, -2.72]} rot={[-Math.PI / 2, 0, 0]} size={0.07} font="sans" color="#7a6038" spacing={0.3}>
        00
      </Label>

      {/* the shaft: glass from the Deep Archive to the roof */}
      <mesh position={[0, (top - 4) / 2, -7]} material={mats().glass}>
        <boxGeometry args={[2.4, top + 4, 4]} />
      </mesh>
      <SeamLight top={top} />
      <ElevatorDoors />
      <ElevatorCar roof={roof} />

      {/* the dial above the doors + the visitor's clock */}
      <Hot
        id="elevator"
        label="Elevator"
        marker={[0, 3.4, -4.85]}
        onLongPress={() => {
          useWorld.getState().discover("below");
          go("below");
        }}
        longMs={2000}
      >
        <Dial y={3.0} />
      </Hot>
      <WallClock pos={[-2.3, 3.6, L.z0 + 0.02]} radius={0.32} label="your time" />

      {/* the building directory */}
      <Directory floors={floors} />

      {owner && (
        <Hot id="private" label="Private — the Studio" onActivate={() => leave("/studio")} marker={[1.2, 2.5, L.z0 + 0.2]}>
          <Slab pos={[1.2, 1.1, L.z0 + 0.06]} size={[0.9, 2.2, 0.06]} mat={mats().walnut} edges={TAN} edgeOpacity={0.3} />
          <Label pos={[1.2, 1.9, L.z0 + 0.1]} size={0.08} font="sans" color="#e8dcc6" spacing={0.25}>
            PRIVATE
          </Label>
        </Hot>
      )}

      <Pendant id="lobby-pendant" pos={[-0.8, 4.4, -2.6]} intensity={8} distance={10} color="#ffd59c" />
      <LampLight id="lobby-day-spill" pos={[-3.4, 2.6, -7]} color="#fff4e2" intensity={6} distance={7} />
      <LampLight id="lobby-tower-spill" pos={[1.6, 1.0, -2]} color="#f2c98a" intensity={2} distance={4} />
      <LampLight id="lobby-shaft" pos={[0, 2.5, -7]} color="#f2ddb8" intensity={2} distance={5} shaft />
    </group>
  );
}

const invisible = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

function TowerDoor({ open }: { open: boolean }) {
  const active = useActive("tower-door");
  return (
    <group position={[2.05, 0, -2]}>
      <Hot id="tower-door" label="Tower door — Memory Archive (Human)" marker={[-0.2, 3.15, 0]}>
        <group rotation={[0, open ? -1.1 : 0, 0]} position={[0, 0, -1.2]}>
          <Slab pos={[-0.05, 1.65, 1.2]} size={[0.09, 3.3, 2.4]} mat={mats().walnut} edges={TAN} edgeOpacity={active ? 0.6 : 0.25} />
          <Label pos={[-0.11, 2.55, 1.2]} rot={[0, -Math.PI / 2, 0]} size={0.07} font="sans" color="#e8dcc6" spacing={0.35}>
            MEMORY ARCHIVE
          </Label>
          <Label pos={[-0.11, 2.2, 1.2]} rot={[0, -Math.PI / 2, 0]} size={0.16} font="serifItalic" color="#e8dcc6">
            before you enter —
          </Label>
          <mesh position={[-0.12, 1.3, 2.1]} material={mats().brass}>
            <sphereGeometry args={[0.05, 10, 8]} />
          </mesh>
        </group>
      </Hot>
      {/* warm light under the closed door, the tower's presence */}
      <mesh position={[-0.06, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats().leak}>
        <planeGeometry args={[0.5, 2.3]} />
      </mesh>
    </group>
  );
}

function SeamLight({ top }: { top: number }) {
  const col = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    if (!col.current) return;
    // the light leans toward a visitor standing near it (the old divider's bend)
    const d = camera.position.x;
    const near = Math.max(0, 1 - Math.abs(camera.position.z + 7) / 8) * Math.max(0, 1 - Math.abs(d) / 5);
    const want = THREE.MathUtils.clamp(d, -1, 1) * 0.35 * near;
    col.current.position.x += (want - col.current.position.x) * 0.05;
  });
  return (
    <mesh ref={col} position={[0, (top - 4) / 2, -8.7]}>
      <boxGeometry args={[0.05, top + 4, 0.05]} />
      <meshBasicMaterial color="#efe0c4" toneMapped={false} />
    </mesh>
  );
}

function ElevatorDoors() {
  return (
    <group position={[0, 0, -4.95]}>
      <Slab pos={[-0.47, 1.25, 0]} size={[0.92, 2.5, 0.05]} mat={mats().brass} edges={INK} edgeOpacity={0.4} />
      <Slab pos={[0.47, 1.25, 0]} size={[0.92, 2.5, 0.05]} mat={mats().brass} edges={INK} edgeOpacity={0.4} />
      <Slab pos={[0, 2.58, 0]} size={[2.2, 0.12, 0.08]} mat={mats().brassDark} />
    </group>
  );
}

function Dial({ y }: { y: number }) {
  const needle = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!needle.current) return;
    const lvl = rig.carY / 4;
    needle.current.rotation.z = Math.PI / 2 - THREE.MathUtils.clamp((lvl + 1) / 9, 0, 1) * Math.PI;
  });
  return (
    <group position={[0, y, -4.9]}>
      <mesh material={mats().brassDark}>
        <circleGeometry args={[0.32, 32, 0, Math.PI]} />
      </mesh>
      <group ref={needle}>
        <mesh position={[0, 0.13, 0.01]} material={mats().ink}>
          <boxGeometry args={[0.012, 0.26, 0.004]} />
        </mesh>
      </group>
      <Label pos={[-0.3, -0.06, 0.01]} size={0.05} font="sans" color="#2b2119">
        −1
      </Label>
      <Label pos={[0, 0.36, 0.01]} size={0.05} font="sans" color="#2b2119">
        IV
      </Label>
      <Label pos={[0.3, -0.06, 0.01]} size={0.05} font="sans" color="#2b2119">
        R
      </Label>
    </group>
  );
}

function ElevatorCar({ roof }: { roof: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.position.y = rig.carY;
  });
  void roof;
  return (
    <group ref={g}>
      <Slab pos={[0, 0.02, -7]} size={[2.2, 0.06, 3.8]} mat={mats().walnut} />
      <Slab pos={[0, 2.5, -7]} size={[2.2, 0.06, 3.8]} mat={mats().brassDark} />
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-1.08, 1.25, -8.8 + i * 0.45]} material={mats().brass}>
          <cylinderGeometry args={[0.012, 0.012, 2.45, 5]} />
        </mesh>
      ))}
      <Bulb id="car-bulb" pos={[0, 2.2, -7]} intensity={2.4} distance={4} />
      <Label pos={[-1.04, 2.2, -7]} rot={[0, Math.PI / 2, 0]} size={0.06} font="sans" color="#c4b49a" spacing={0.3}>
        MEMORY ARCHIVE · LIFT
      </Label>
      <Label pos={[-1.04, 1.95, -7]} rot={[0, Math.PI / 2, 0]} size={0.07} font="serifItalic" color="#c4b49a" maxWidth={2.6} align="center">
        {"2:14 AM — stayed on repeat for 11 days"}
      </Label>
    </group>
  );
}

function Directory({ floors }: { floors: WorldContent["categories"] }) {
  const x = SEAM.lobby.x0 + 0.06;
  const rot: [number, number, number] = [0, Math.PI / 2, 0];
  const day: [string, string][] = [
    ["desk", "Front Desk"],
    ["work", "Workshop"],
    ["skills", "Type Case"],
    ["records", "Records Room"],
    ["thinking", "Plan Room"],
    ["origin", "School Desk"],
  ];
  return (
    <group>
      <Slab pos={[x, 2.05, -2.2]} size={[0.04, 2.1, 2.7]} mat={mats().plasterDark} edges={TAN} edgeOpacity={0.5} />
      <Label pos={[x + 0.04, 2.92, -1.0]} rot={rot} size={0.06} font="sans" color={TAN} anchorX="left" spacing={0.3}>
        DAY WING
      </Label>
      <Label pos={[x + 0.04, 2.92, -2.4]} rot={rot} size={0.06} font="sans" color={TAN} anchorX="left" spacing={0.3}>
        NIGHT TOWER
      </Label>
      {day.map(([id, label], i) => (
        <Hot key={id} id={`dirday-${id}`} label={label} onActivate={() => go(id)}>
          <Label pos={[x + 0.04, 2.66 - i * 0.2, -1.0]} rot={rot} size={0.1} font="serif" color="#ede4d3" anchorX="left">
            {label}
          </Label>
        </Hot>
      ))}
      {floors.map((c, i) => (
        <Hot key={c.slug} id={`dir-${c.slug}`} label={`Chapter ${c.roman} — ${c.label}`}>
          <Label pos={[x + 0.04, 2.66 - i * 0.2, -2.4]} rot={rot} size={0.1} font="serif" color="#ede4d3" anchorX="left">
            {`${c.roman}   ${c.label}`}
          </Label>
        </Hot>
      ))}
      <Hot id="dir-roof" label="Roof Study">
        <Label pos={[x + 0.04, 2.66 - floors.length * 0.2, -2.4]} rot={rot} size={0.1} font="serif" color="#ede4d3" anchorX="left">
          {"R   Roof Study"}
        </Label>
      </Hot>
    </group>
  );
}
