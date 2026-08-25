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
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stripInternalRefs } from "./strip-internal-refs.mjs";

import { CATEGORIES, DISPLAY_NAME_OVERRIDES, REGISTRY } from "./registry.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const APP_DIR = join(ROOT, "apps/docs-site/src/docs-data");
/* Pathspecs, deliberately narrow: the GENERATED JSON only. Pointing these at
   `scripts/docs-data/` wholesale would make any edit to the extractor itself
   look like staleness, so a PR improving the generator would fail its own
   check. git matches these globs, not the shell — `execFileSync` runs no shell. */
const TRACKED = [
  "scripts/docs-data/*.docs.json",
  "scripts/docs-data/roster.json",
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

/*
 * The ROSTER: every registry component, not only the documented ones.
 *
 * The /components index shows the whole library so the shape of the page can be
 * judged as a whole, with a card per component and the undocumented ones inert.
 * That list cannot come from the docs-data (which by definition covers only what
 * is documented), so it is built here from `registry.json` plus each component's
 * own `contract.json` description — real prose on every card rather than filler,
 * and nothing extra to hand-maintain but the category map.
 */
const registry = JSON.parse(
  readFileSync(join(ROOT, "registry/registry.json"), "utf8"),
);
const registryIds = Object.keys(registry.components).sort();

/* Fail loudly on either kind of rot: a component with no category would vanish
   from the page, and a category for a component that no longer exists is a lie
   that survives until someone reads the file. */
const unmapped = registryIds.filter((id) => !CATEGORIES[id]);
const stale = Object.keys(CATEGORIES).filter((id) => !registryIds.includes(id));
if (unmapped.length || stale.length) {
  console.error(
    "✗ scripts/docs-data/registry.mjs CATEGORIES is out of step with registry.json:" +
      (unmapped.length ? `\n  no category for: ${unmapped.join(", ")}` : "") +
      (stale.length ? `\n  category for a component that no longer exists: ${stale.join(", ")}` : ""),
  );
  process.exit(1);
}

const titleCase = (id) =>
  id
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const roster = registryIds.map((id) => {
  const contract = JSON.parse(
    readFileSync(join(ROOT, `registry/components/${id}/contract.json`), "utf8"),
  );
  return {
    id,
    displayName: DISPLAY_NAME_OVERRIDES[id] ?? titleCase(id),
    category: CATEGORIES[id],
    description: stripInternalRefs(contract.description ?? ""),
    /* Whether a docs PAGE exists — i.e. whether this id has an extractor entry.
       The index links these and leaves the rest inert. */
    documented: Object.hasOwn(REGISTRY, id),
  };
});

const rosterJson = JSON.stringify(roster, null, 2) + "\n";
writeFileSync(join(HERE, "roster.json"), rosterJson);
writeFileSync(join(APP_DIR, "roster.json"), rosterJson);
if (!check) {
  const documented = roster.filter((r) => r.documented).length;
  console.log(
    `✓ roster → roster.json (${roster.length} components, ${documented} documented)`,
  );
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
