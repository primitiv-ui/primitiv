/*
 * Derives the home page's engine-backed sections from the engine's own dumps.
 *
 *   node scripts/gen-engine-data.mjs           # write
 *   node scripts/gen-engine-data.mjs --check   # fail if a committed file is stale
 *
 * Three sections on the home page make claims about what the engine does, and
 * none of them may compute a colour here. `docs/generated/*.json` is written by
 *
 *   cargo run -p harmoni-core --features swatch-sheet --example swatch-sheet
 *
 * which pairs every swatch through `get_best_foreground`, places the drifted
 * team colours in OkLCH off the brand seed, and measures the hue spans — and it
 * proves its own method before emitting anything (see §6.0.20 of
 * docs/docs-site-content-plan.md). This script only selects and reshapes.
 *
 * One script rather than one per dataset: they share the same source directory,
 * the same staleness question and the same rule about not computing anything.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const from = (name) => resolve(here, `../../../docs/generated/${name}`);
const to = (name) => resolve(here, `../src/content/${name}`);

const read = (name) => JSON.parse(readFileSync(from(name), "utf8"));

/* ── The colour proof sheet (§2.5, brief COLOUR-01) ───────────────────────── */

/** Row order from the brief: neutral first, then the five generated ramps. */
const RAMPS = ["neutral", "brand", "success", "warning", "danger", "info"];

const paletteSheet = () => {
  const dump = read("colour-01-swatch-sheet.json");
  const sheet = {};

  for (const theme of ["light", "dark"]) {
    sheet[theme] = RAMPS.map((ramp) => {
      const row = dump.ramps.find((r) => r.ramp === ramp && r.theme === theme);
      if (!row) {
        throw new Error(
          `The engine dump has no ${ramp}/${theme} row. Regenerate it with\n` +
            `  cargo run -p harmoni-core --features swatch-sheet --example swatch-sheet`,
        );
      }
      if (!row.shipped) {
        throw new Error(`${ramp} is not a shipped ramp — it must not appear in the sheet`);
      }
      return {
        ramp,
        /* Load-bearing: the 100-swatch CI guard covers the GENERATED ramps, and
           neutral comes from a different part of the engine. Showing neutral is
           correct; a caption extending the guard to it would be false, so the
           scope rides in the data rather than in anyone's memory. */
        generated: row.generated,
        /* Hex and foreground only — no contrast figures. They would clutter a
           sheet whose power is being scannable, and the numbers belong in the
           prose below it. */
        steps: row.steps.map((s) => ({
          step: s.step,
          hex: s.hex,
          foreground: s.foreground,
        })),
      };
    });
  }
  return sheet;
};

/* ── Three teams' buttons (§2.3, brief PROBLEM-01) ────────────────────────── */

/**
 * The drift is a MEASURED number, which is the whole point of the brief: its
 * craft note asks for differences "right at the edge of perceptible", and its
 * `must-not` forbids exaggerating them. The engine places each colour in OkLCH
 * off the brand seed and reports the pairwise Oklab ΔE, with a target band of
 * 0.02–0.04. So the widest pair travels with the data and the page can state
 * it, rather than the subtlety being anyone's judgement.
 *
 * Geometry comes across as plain numbers because that is what it is — deltas
 * off `framed-control/md` at comfortable (height 40, radius 8, padding 16),
 * which is exactly how three teams' hand-tuned buttons differ.
 */
const teamButtons = () => {
  const dump = read("problem-01-team-buttons.json");
  if (dump.buttons.length !== 3) {
    throw new Error(`PROBLEM-01 expects three teams, found ${dump.buttons.length}`);
  }
  const deltas = dump.pairwise.map((p) => p.oklabDeltaE);
  const widest = Math.max(...deltas);
  if (widest > 0.04) {
    throw new Error(
      `The widest pair is ΔE ${widest.toFixed(4)}, above the brief's 0.04 ceiling — ` +
        `the buttons would read as obviously different, which the brief forbids ` +
        `("a reader who thinks 'no team would ship that' has stopped believing").`,
    );
  }
  return {
    buttons: dump.buttons.map((b) => ({
      team: b.team,
      hex: b.hex,
      height: b.height,
      radius: b.radius,
      paddingInline: b.paddingInline,
      labelWeight: b.labelWeight,
    })),
    widestDeltaE: Math.round(widest * 10000) / 10000,
  };
};

const OUTPUTS = [
  ["palette-sheet.generated.json", paletteSheet],
  ["team-buttons.generated.json", teamButtons],
];

const built = OUTPUTS.map(([name, build]) => [name, `${JSON.stringify(build(), null, 2)}\n`]);

if (process.argv.includes("--check")) {
  let stale = false;
  for (const [name, json] of built) {
    const committed = readFileSync(to(name), "utf8");
    if (committed !== json) {
      const digest = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12);
      console.error(
        `src/content/${name} is stale (committed ${digest(committed)}, generated ${digest(json)}).`,
      );
      stale = true;
    }
  }
  if (stale) {
    console.error("Run: pnpm gen:engine-data");
    process.exit(1);
  }
  console.log(`engine data up to date (${built.length} files)`);
} else {
  for (const [name, json] of built) {
    writeFileSync(to(name), json);
    console.log(`wrote src/content/${name}`);
  }
}
