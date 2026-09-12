/*
 * Derives the home page's colour proof sheet from the engine's own dump.
 *
 *   node scripts/gen-palette-sheet.mjs           # write
 *   node scripts/gen-palette-sheet.mjs --check   # fail if the committed file is stale
 *
 * The sheet's entire claim is that the ENGINE chose the text colour on every
 * swatch, so nothing here may compute a colour. `docs/generated/
 * colour-01-swatch-sheet.json` is written by
 * `cargo run -p harmoni-core --features swatch-sheet --example swatch-sheet`,
 * which pairs every swatch through `get_best_foreground` — the same primitive
 * the generator and the neutral module call — and proves the method by
 * re-pairing all 100 generated swatches identically before it emits anything.
 * This script only selects and reshapes.
 *
 * It drops the five extra hues the dump carries (violet, magenta, lime, amber,
 * teal), which exist to show the engine's behaviour across the wheel and are not
 * part of the shipped palette; and it fails if a ramp it wants is missing, so a
 * regenerated dump cannot quietly shrink the sheet.
 *
 * `generated` rides along per ramp and is load-bearing: the 100-swatch CI
 * guarantee covers the five GENERATED ramps, and neutral comes from a different
 * part of the engine. Showing neutral is correct — it is where most interface
 * colour comes from — but a caption extending the guard to it would be false,
 * so the flag is in the data rather than in anyone's memory.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(here, "../../../docs/generated/colour-01-swatch-sheet.json");
const OUT = resolve(here, "../src/content/palette-sheet.generated.json");

/** Row order from the brief: neutral first, then the five generated ramps. */
const ORDER = ["neutral", "brand", "success", "warning", "danger", "info"];
const THEMES = ["light", "dark"];

const build = () => {
  const dump = JSON.parse(readFileSync(SOURCE, "utf8"));
  const sheet = {};

  for (const theme of THEMES) {
    sheet[theme] = ORDER.map((ramp) => {
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
        generated: row.generated,
        /* Hex and foreground only. No contrast figures: they would clutter a
           sheet whose power is being scannable at a glance, and the numbers
           belong in the prose below it. */
        steps: row.steps.map((s) => ({
          step: s.step,
          hex: s.hex,
          foreground: s.foreground,
        })),
      };
    });
  }

  return `${JSON.stringify(sheet, null, 2)}\n`;
};

const json = build();

if (process.argv.includes("--check")) {
  const committed = readFileSync(OUT, "utf8");
  if (committed !== json) {
    const digest = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12);
    console.error(
      `src/content/palette-sheet.generated.json is stale (committed ${digest(committed)}, ` +
        `generated ${digest(json)}).\nRun: pnpm gen:palette-sheet`,
    );
    process.exit(1);
  }
  console.log("palette sheet up to date");
} else {
  writeFileSync(OUT, json);
  console.log(`wrote ${OUT}`);
}
