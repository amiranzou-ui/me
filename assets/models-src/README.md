# Model sources

Drop Blender exports here as `<name>.glb` (metres, origin at the floor
contact point), then run `npm run assets:models`. Names the world already
has slots for:

| Name | Where it appears | Procedural stand-in today |
| --- | --- | --- |
| `armchair` | Listening Room | felt blocks |
| `fridge` | Night Kitchen | plaster box |

Add a slot anywhere in the world with `<ModelSlot name="…">…stand-in…</ModelSlot>`
(see `src/world/scene/kit/Model.tsx`). Project hero objects and 3D-floor
pieces don't need slots: set a project's or a 3D item's model path in the
Studio data and it is loaded directly.
