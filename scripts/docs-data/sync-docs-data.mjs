#!/usr/bin/env node
/*
 * Regenerate EVERY component's docs-data, and copy it where the site reads it.
 *
 * Why this exists. The props tables, the CSS-variable list and the Data
 * attributes table are all rendered from `<id>.docs.json`, which is generated
 * from source — a hard constraint (docs-site-planning.md §1.5), because three
 * consumption modes × N components means hand-maintained tables drift silently.
 * But the generator was per-component and hand-run, and the files are committed
 * in TWO places (this directory, and the app's `src/docs-data/` which imports
 * them), so nothing said when a committed file fell behind its source.
 *
 * It fell behind: `tabs.docs.json` was committed by the Tabs stress-test pass
 * and then missed the extractor change that started carrying data-attribute
 * VALUES (105c445f), so the Tabs page would have rendered a Data attributes
 * table built from stale data — 67 lines of it. Found 2026-08-22 by running the
 * extractor before building the page, which is luck rather than a process.
 *
 * Same shape of fix as `token-drift.yml` for the token layers: regenerate, then
 * fail if the committed tree moved.
 *
 *   node scripts/docs-data/sync-docs-data.mjs           regenerate + copy
 *   node scripts/docs-data/sync-docs-data.mjs --check   fail if anything is stale
 *
 * `--check` regenerates in place and then asks git whether the tree changed, so
 * it cannot disagree with the real generator about what "current" means — the
 * one thing a reimplemented comparison would eventually get wrong. It restores
 * the tree afterwards, so a failing check leaves no edits behind.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { REGISTRY } from "./registry.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const APP_DIR = join(ROOT, "apps/docs-site/src/docs-data");
/* Pathspecs, deliberately narrow: the GENERATED JSON only. Pointing these at
   `scripts/docs-data/` wholesale would make any edit to the extractor itself
   look like staleness, so a PR improving the generator would fail its own
   check. git matches these globs, not the shell — `execFileSync` runs no shell. */
const TRACKED = [
  "scripts/docs-data/*.docs.json",
  "apps/docs-site/src/docs-data",
];

const check = process.argv.includes("--check");
const ids = Object.keys(REGISTRY);

const git = (...args) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });

/* A dirty tree before we start would be indistinguishable from staleness after,
   so say so rather than blaming the author's own work in progress. */
if (check) {
  const dirty = git("status", "--porcelain", "--", ...TRACKED).trim();
  if (dirty) {
    console.error(
      "✗ docs-data has uncommitted changes, so --check cannot tell staleness from\n" +
        "  work in progress. Commit or stash these first:\n" +
        dirty,
    );
    process.exit(1);
  }
}

if (!existsSync(APP_DIR)) mkdirSync(APP_DIR, { recursive: true });

for (const id of ids) {
  const run = spawnSync(
    process.execPath,
    [join(HERE, "extract-docs-data.mjs"), id],
    { cwd: ROOT, encoding: "utf8" },
  );
  if (run.status !== 0) {
    console.error(`✗ ${id}: extractor failed\n${run.stderr || run.stdout}`);
    process.exit(1);
  }
  const file = `${id}.docs.json`;
  copyFileSync(join(HERE, file), join(APP_DIR, file));
  if (!check) console.log(`✓ ${id} → ${file} (and the app copy)`);
}

if (!check) {
  console.log(`\n${ids.length} component(s) regenerated: ${ids.join(", ")}`);
  process.exit(0);
}

const drifted = git("status", "--porcelain", "--", ...TRACKED).trim();
if (!drifted) {
  console.log(
    `✓ docs-data is current for all ${ids.length} component(s): ${ids.join(", ")}`,
  );
  process.exit(0);
}

const diff = git("diff", "--stat", "--", ...TRACKED).trim();
/* Leave the tree as we found it — a check must not become a silent write. */
git("checkout", "--", ...TRACKED);

console.error(
  "✗ Committed docs-data is out of date with source:\n" +
    diff +
    "\n\nRun `node scripts/docs-data/sync-docs-data.mjs` and commit the result.\n" +
    "(The working tree has been restored, so nothing was changed here.)",
);
process.exit(1);
