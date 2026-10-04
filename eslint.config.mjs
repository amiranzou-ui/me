import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The 3D scene is three.js driven imperatively from R3F's frame loop and
  // effects (mutating cameras, materials and lights in place is how R3F is
  // meant to be used, and none of it runs during render). The React Compiler
  // purity rules don't model that, so they are off for the scene only;
  // render-time mutations there are still avoided by convention.
  {
    files: ["src/world/scene/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
