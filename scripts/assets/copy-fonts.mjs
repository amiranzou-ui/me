#!/usr/bin/env node
/**
 * The 3D world sets its signage in the site's own faces. The text engine
 * (troika, via drei <Text>) reads WOFF, not WOFF2, so the faces are copied
 * from @fontsource into public/fonts. Run after changing font packages:
 *   npm run assets:fonts
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const fs = join(root, "node_modules/@fontsource");
const out = join(root, "public/fonts");
mkdirSync(out, { recursive: true });
const faces = [
  ["cormorant-garamond/files/cormorant-garamond-latin-300-normal.woff", "cormorant-300.woff"],
  ["cormorant-garamond/files/cormorant-garamond-latin-300-italic.woff", "cormorant-300-italic.woff"],
  ["cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff", "cormorant-400.woff"],
  ["inter/files/inter-latin-300-normal.woff", "inter-300.woff"],
  ["inter/files/inter-latin-500-normal.woff", "inter-500.woff"],
  ["special-elite/files/special-elite-latin-400-normal.woff", "special-elite.woff"],
];
for (const [from, to] of faces) copyFileSync(join(fs, from), join(out, to));
console.log(`${faces.length} faces → public/fonts`);
