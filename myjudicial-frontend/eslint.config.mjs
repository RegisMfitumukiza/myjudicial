import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Pre-existing debt downgraded to warnings (still visible in lint output)
    // so CI gates on correctness without blocking on legacy patterns.
    // TODO: fix occurrences and restore these to "error".
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  {
    files: ["src/types/**/*.d.ts"],
    rules: {
      // Ambient module declarations legitimately describe loosely-typed libs.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
