#!/usr/bin/env node
/*
 * Audit every registry contract's `dataAttributes` against what the headless
 * source actually emits.
 *
 * Written after Select's turned out to be wrong in two ways at once (2026-08-23):
 * all seven attributes were declared on the ROOT, with the real owner written
 * into the `when` prose ("on the value part"), and `Select.Item`'s own
 * `data-disabled` was not declared at all. Both only surfaced because the docs
 * page started grouping attributes by part — before that, one flat table made
 * any misattribution invisible.
 *
 * So this asks the three questions that would have caught it, for all 63:
 *
 *   1. UNDECLARED — the source sets `data-foo` but no contract entry mentions it.
 *      A gap in the docs, and the reason a reader cannot style a state.
 *   2. ORPHANED — the contract declares `data-foo` that no source sets. Either
 *      stale after a refactor, or a typo, and it documents something untrue.
 *   3. MISATTRIBUTED (heuristic) — a root-level entry whose `when` text names
 *      another part. That phrasing is the tell that the author knew the part was
 *      wrong and compensated in prose, which is exactly what Select did.
 *
 * Heuristic, deliberately: proving which ELEMENT receives an attribute needs
 * real dataflow analysis, since a primitive spreads props through hooks and
 * `asChild`. This reads the source for `"data-foo":` / `data-foo=` occurrences
 * and compares SETS. It is a smoke alarm, not a type system — it finds the
 * classes of error we have actually hit, and says so rather than implying
 * completeness.
 *
 *   node scripts/docs-data/audit-data-attributes.mjs
 *   node scripts/docs-data/audit-data-attributes.mjs --quiet   only problems
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const quiet = process.argv.includes("--quiet");

const registry = JSON.parse(
  readFileSync(join(ROOT, "registry/registry.json"), "utf8"),
);

/** kebab registry id → the PascalCase directory in packages/react/src. */
const headlessDir = (id) =>
  id
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");

/** Every `data-*` attribute NAME a source tree sets. */
const emittedBy = (dir) => {
  const found = new Set();
  if (!existsSync(dir)) return null;
  const walk = (d) => {
    for (const entry of readdirSync(d)) {
      const p = join(d, entry);
      if (statSync(p).isDirectory()) {
        if (entry === "__tests__") continue;
        walk(p);
        continue;
      }
      if (!/\.tsx?$/.test(entry) || /\.test\./.test(entry)) continue;
      const src = readFileSync(p, "utf8");
      /* Assignment shapes only — a bare mention in a comment or a README is not
         an emission, and counting those was the first version's mistake. */
      for (const m of src.matchAll(/"(data-[a-z-]+)":/g)) found.add(m[1]);
      for (const m of src.matchAll(/\sdata-([a-z-]+)=/g)) found.add(`data-${m[1]}`);
      /* Imperative form: a hook or effect stamping the attribute on a ref. */
      for (const m of src.matchAll(/setAttribute\(\s*["'`](data-[a-z-]+)/g)) found.add(m[1]);
    }
  };
  walk(dir);
  return found;
};

/** Contract entries as `{ name, part, when }`, root included. */
const declaredIn = (contract) => {
  const rows = (contract.dataAttributes || []).map((d) => ({
    ...d,
    part: contract.root?.component ?? "root",
    isRoot: true,
  }));
  for (const sub of contract.subcomponents || []) {
    for (const d of sub.dataAttributes || []) {
      rows.push({ ...d, part: sub.component ?? sub.name, isRoot: false });
    }
  }
  return rows;
};

/* A root entry whose `when` prose names a part is the Select smell. */
const PART_WORDS = /\b(on the|native)\b.*\b(part|root|option|item|trigger|value|indicator|panel|content|list)\b/i;

let problems = 0;
const lines = [];

for (const id of Object.keys(registry.components).sort()) {
  const contractPath = join(ROOT, `registry/components/${id}/contract.json`);
  if (!existsSync(contractPath)) continue;
  const contract = JSON.parse(readFileSync(contractPath, "utf8"));
  const declared = declaredIn(contract);
  const declaredNames = new Set(declared.map((d) => d.name));

  /* BOTH sources. A data attribute can come from the headless primitive or from
     the registry wrapper — Collapsible computes `data-clamped` in its own .tsx,
     which the first version of this script missed and reported as an orphan. */
  const fromHeadless = emittedBy(join(ROOT, "packages/react/src", headlessDir(id)));
  const fromRegistry = emittedBy(join(ROOT, `registry/components/${id}`));
  const emitted =
    fromHeadless === null && fromRegistry === null
      ? null
      : new Set([...(fromHeadless ?? []), ...(fromRegistry ?? [])]);
  /* No headless directory: a hand-authored, primitive-less registry leaf (badge,
     kbd, prose…). Nothing to compare against, so undeclared/orphan cannot be
     judged — say that rather than reporting a clean bill. */
  const dataOnly = emitted === null;

  const undeclared = dataOnly
    ? []
    : [...emitted].filter((n) => !declaredNames.has(n));
  /* An attribute the component's own stylesheet targets is real even if no
     source sets it — `data-popover-open` is added by the browser's Popover API,
     and calling that an orphan was this script's own bug, not the contract's. */
  const stylePath = join(ROOT, `registry/components/${id}/styles.css`);
  const styleSrc = existsSync(stylePath) ? readFileSync(stylePath, "utf8") : "";
  const styled = new Set(
    [...styleSrc.matchAll(/\[(data-[a-z-]+)/g)].map((m) => m[1]),
  );
  const orphaned = dataOnly
    ? []
    : [...declaredNames].filter(
        (n) => n.startsWith("data-") && !emitted.has(n) && !styled.has(n),
      );
  const misattributed = declared.filter(
    (d) => d.isRoot && PART_WORDS.test(d.when ?? ""),
  );

  const bad = undeclared.length + orphaned.length + misattributed.length;
  problems += bad;
  if (!bad && quiet) continue;

  const note = dataOnly ? "  (no headless source — registry-only)" : "";
  lines.push(`${bad ? "✗" : "✓"} ${id}${note}`);
  if (undeclared.length) lines.push(`    undeclared in the contract: ${undeclared.join(", ")}`);
  if (orphaned.length) lines.push(`    declared but never emitted: ${orphaned.join(", ")}`);
  for (const d of misattributed) {
    lines.push(`    on the root but the prose names another part: ${d.name} — "${d.when}"`);
  }
}

console.log(lines.join("\n"));
console.log(
  problems === 0
    ? "\n✓ no data-attribute problems found"
    : `\n✗ ${problems} data-attribute problem(s) — see above`,
);
process.exit(problems === 0 ? 0 : 1);
