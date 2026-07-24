#!/usr/bin/env node
/**
 * Bumps all published package versions in lockstep.
 *
 * Covers every location that must move together:
 *   - 11 package.json "version" fields
 *   - 4 jsr.json "version" fields
 *   - 5 optionalDependencies in npm/cli-wrapper/package.json
 *   - the JSR import-map range pinning @primitiv-ui/react to /core
 *
 * Usage:
 *   node scripts/bump-version.mjs 0.1.8
 *
 * Called by .github/workflows/release.yml; safe to run locally too.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  console.error("Error: provide a valid version, e.g. node scripts/bump-version.mjs 0.1.8");
  process.exit(1);
}

const PACKAGE_JSON_PATHS = [
  "packages/core/package.json",
  "packages/react/package.json",
  "packages/icons/package.json",
  "packages/tokens/package.json",
  "npm/cli-wrapper/package.json",
  "npm/cli-darwin-arm64/package.json",
  "npm/cli-darwin-x64/package.json",
  "npm/cli-linux-arm64-gnu/package.json",
  "npm/cli-linux-x64-gnu/package.json",
  "npm/cli-win32-x64/package.json",
  "npm/create-primitiv-ui/package.json",
];

const JSR_JSON_PATHS = [
  "packages/core/jsr.json",
  "packages/react/jsr.json",
  "packages/icons/jsr.json",
  "packages/tokens/jsr.json",
];

const CLI_OPTIONAL_DEP_NAMES = [
  "@primitiv-ui/cli-darwin-arm64",
  "@primitiv-ui/cli-darwin-x64",
  "@primitiv-ui/cli-linux-arm64-gnu",
  "@primitiv-ui/cli-linux-x64-gnu",
  "@primitiv-ui/cli-win32-x64",
];

function readJson(rel) {
  return JSON.parse(readFileSync(resolve(root, rel), "utf8"));
}

function writeJson(rel, obj) {
  writeFileSync(resolve(root, rel), JSON.stringify(obj, null, 2) + "\n");
}

function bump(rel, mutate) {
  const json = readJson(rel);
  const prev = json.version;
  mutate(json);
  writeJson(rel, json);
  console.log(`  ${rel}: ${prev} → ${json.version}`);
}

console.log(`\nBumping all packages to ${version}\n`);

for (const p of PACKAGE_JSON_PATHS) {
  bump(p, (j) => { j.version = version; });
}

for (const p of JSR_JSON_PATHS) {
  bump(p, (j) => { j.version = version; });
}

// optionalDependencies in the wrapper must match the platform package versions
const wrapperPath = "npm/cli-wrapper/package.json";
const wrapper = readJson(wrapperPath);
const prevDeps = { ...wrapper.optionalDependencies };
for (const name of CLI_OPTIONAL_DEP_NAMES) {
  if (name in wrapper.optionalDependencies) {
    wrapper.optionalDependencies[name] = version;
  }
}
writeJson(wrapperPath, wrapper);
const changed = CLI_OPTIONAL_DEP_NAMES.filter(
  (n) => prevDeps[n] !== version,
).length;
console.log(`  ${wrapperPath}: optionalDependencies (${changed} entries) → ${version}`);

// npm resolves @primitiv-ui/react -> /core through the `workspace:*` specifier,
// which pnpm rewrites at publish time. JSR has no workspace protocol, so the
// same edge is declared as an import-map range in jsr.json and must be moved
// here or a release ships a react that points at the previous core.
const reactJsrPath = "packages/react/jsr.json";
const reactJsr = readJson(reactJsrPath);
const prevRange = reactJsr.imports["@primitiv-ui/core"];
reactJsr.imports["@primitiv-ui/core"] = `jsr:@primitiv-ui/core@^${version}`;
writeJson(reactJsrPath, reactJsr);
console.log(`  ${reactJsrPath}: imports["@primitiv-ui/core"] ${prevRange} → ${reactJsr.imports["@primitiv-ui/core"]}`);

console.log(`\nDone. ${PACKAGE_JSON_PATHS.length + JSR_JSON_PATHS.length} version fields + ${CLI_OPTIONAL_DEP_NAMES.length} optionalDependencies + 1 JSR import range updated.\n`);
