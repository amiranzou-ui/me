/**
 * Per-frame values shared between scene systems without React re-renders:
 * whether the camera is travelling, the pointer's hit point (for the
 * tower's pointer glow), the elevator car's height, and so on.
 */
export const rig = {
  moving: false,
  pointer: [0, -100, 0] as [number, number, number],
  coarse: false,
  flickerId: null as string | null,
  carY: 0,
  suppressClick: false,
};
