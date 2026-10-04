#!/usr/bin/env node
/**
 * Blender → GLB pipeline (design doc §28).
 *
 *   1. In Blender, model one kit piece per file (turntable, armchair, bay
 *      easel, picture frame…) at real-world scale in metres, origin at the
 *      floor contact point, and export it as glTF Binary (.glb) into
 *      assets/models-src/<name>.glb. Bake lighting into the base colour if
 *      you want it; the world adds only a few live lamps.
 *   2. Run:  npm run assets:models
 *   3. Each model is optimised into public/world/models/<name>.glb —
 *      deduplicated, welded, meshopt-compressed geometry, textures resized
 *      to ≤1024px and converted to KTX2 (Basis Universal) when `toktx` is
 *      installed, WebP otherwise — and listed in manifest.json.
 *   4. Any <ModelSlot name="<name>"> in the world now renders the model
 *      instead of its procedural stand-in. No code change needed.
 *
 * Optional per-model settings: assets/models-src/<name>.json → { "scale": 1 }
 */
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const src = join(root, "assets/models-src");
const out = join(root, "public/world/models");
const basisOut = join(root, "public/world/basis");
mkdirSync(out, { recursive: true });
mkdirSync(basisOut, { recursive: true });

// the KTX2 transcoder the browser needs to read compressed textures
const basisSrc = join(root, "node_modules/three/examples/jsm/libs/basis");
for (const f of ["basis_transcoder.js", "basis_transcoder.wasm"]) cpSync(join(basisSrc, f), join(basisOut, f));

const hasToktx = spawnSync("toktx", ["--version"]).status === 0;
const cli = join(root, "node_modules/.bin/gltf-transform");
const files = existsSync(src) ? readdirSync(src).filter((f) => f.endsWith(".glb") || f.endsWith(".gltf")) : [];
const manifest = {};

for (const f of files) {
  const name = basename(f).replace(/\.(glb|gltf)$/, "");
  const input = join(src, f);
  const tmp = join(out, `${name}.tmp.glb`);
  const target = join(out, `${name}.glb`);
  console.log(`▸ ${name}`);
  execFileSync(cli, ["optimize", input, tmp, "--compress", "meshopt", "--texture-compress", hasToktx ? "false" : "webp", "--texture-size", "1024", "--simplify", "false"], { stdio: "inherit" });
  if (hasToktx) {
    execFileSync(cli, ["etc1s", tmp, target, "--quality", "128"], { stdio: "inherit" });
  } else {
    cpSync(tmp, target);
  }
  spawnSync("rm", ["-f", tmp]);
  const settings = existsSync(join(src, `${name}.json`)) ? JSON.parse(readFileSync(join(src, `${name}.json`), "utf8")) : {};
  manifest[name] = { file: `${name}.glb`, ...settings };
  console.log(`  ${(statSync(input).size / 1024).toFixed(0)} KB → ${(statSync(target).size / 1024).toFixed(0)} KB`);
}

writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`\n${files.length} model(s) → public/world/models/manifest.json${hasToktx ? "" : "  (install KTX-Software's toktx for KTX2 textures; WebP used instead)"}`);
