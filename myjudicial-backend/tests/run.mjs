/* Minimal test discovery runner.
 *
 * `node --test tests/` cannot discover *.test.ts files on Node 20 (type
 * stripping / .ts glob support landed in Node 22). This script walks
 * tests/** for *.test.* files and forwards them to the built-in runner,
 * so newly added test files are picked up automatically.
 */
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const testsDir = join(root, "tests");

const TEST_PATTERN = /\.test\.(ts|mts|cts|js|mjs|cjs)$/;

function findTestFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === "helpers" || entry.name === "node_modules") continue;
      out.push(...findTestFiles(join(dir, entry.name)));
    } else if (TEST_PATTERN.test(entry.name)) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

const files = findTestFiles(testsDir);

if (files.length === 0) {
  console.error(`No test files found under ${testsDir}`);
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...files],
  { stdio: "inherit", cwd: root }
);

process.exit(result.status ?? 1);
