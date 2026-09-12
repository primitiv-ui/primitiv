/*
 * Measures the content-page illustrations and writes their manifest.
 *
 *   node scripts/gen-illustrations.mjs           # write
 *   node scripts/gen-illustrations.mjs --check   # fail if the committed file is stale
 *   node scripts/gen-illustrations.mjs --report  # what is present, what is missing
 *
 * Why measured rather than declared: every one of these ten has a brief that
 * states a ratio, and three of them were built at a different size — the briefs'
 * ratios were written before the content existed and the content won (§6.0.5,
 * §6.0.6, §6.0.8 of docs/docs-site-content-plan.md). A number typed in here
 * would be the fourth opinion about each image's shape. The PNG's own IHDR is
 * the only one that cannot be wrong, and reading it needs no dependency: the
 * header is a fixed 8-byte signature then a length, "IHDR", and two big-endian
 * 32-bit integers.
 *
 * The ratio is scale-independent, so it does not matter whether the export is
 * 1x or 2x — which is deliberate, because the site sizes these to the column
 * and only needs the aspect to reserve the box before the file loads.
 *
 * An id appears in the manifest only when ALL FOUR of its files are present
 * (desktop and mobile, light and dark). A half-landed illustration renders
 * nothing rather than a broken theme or a broken breakpoint.
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ART = resolve(here, "../public/illustrations");
const OUT = resolve(here, "../src/content/illustrations.generated.json");

/**
 * The ten content-page illustrations, in page order.
 *
 * The ids are the brief ids the Figma frames carry, so a file name and a canvas
 * frame can be matched by eye. Lowercased for the file name, matching the
 * home page's `a11y-01-*` and `figma-01-*` assets.
 */
export const IDS = [
  "START-01",
  "FAMILY-01",
  "TOKENS-01",
  "DENSITY-C01",
  "DENSITY-C02",
  "COMPOSE-01",
  "A11Y-C01",
  "CLI-01",
  "FIGMA-P01",
  "FIGMA-P02",
];

const BREAKPOINTS = ["desktop", "mobile"];
const THEMES = ["light", "dark"];

/** `START-01` + desktop + dark → `start-01-desktop-dark.png`. */
export const fileName = (id, breakpoint, theme) =>
  `${id.toLowerCase()}-${breakpoint}-${theme}.png`;

const PNG_SIGNATURE = "89504e470d0a1a0a";

/** Intrinsic pixel size, straight off the PNG header. */
const pngSize = (path) => {
  const buf = readFileSync(path);
  if (buf.subarray(0, 8).toString("hex") !== PNG_SIGNATURE) {
    throw new Error(`${path} is not a PNG`);
  }
  if (buf.subarray(12, 16).toString("latin1") !== "IHDR") {
    throw new Error(`${path} has no IHDR where one must be`);
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
};

const build = () => {
  const present = new Set(readdirSync(ART));
  const manifest = {};
  const missing = [];

  for (const id of IDS) {
    const wanted = BREAKPOINTS.flatMap((b) => THEMES.map((t) => [b, t]));
    const absent = wanted.filter(([b, t]) => !present.has(fileName(id, b, t)));
    if (absent.length > 0) {
      missing.push({ id, absent: absent.map(([b, t]) => fileName(id, b, t)) });
      continue;
    }

    const entry = {};
    for (const breakpoint of BREAKPOINTS) {
      const sizes = THEMES.map((t) => pngSize(resolve(ART, fileName(id, breakpoint, t))));
      /* The twins are clones with the Intent pin flipped (§6.0.10), so a size
         difference between them means one was exported at a different scale or
         from a stale frame — worth failing on rather than picking one. */
      if (sizes[0].width !== sizes[1].width || sizes[0].height !== sizes[1].height) {
        throw new Error(
          `${id} ${breakpoint}: light is ${sizes[0].width}×${sizes[0].height} but ` +
            `dark is ${sizes[1].width}×${sizes[1].height}. The twins are clones of ` +
            `one frame, so they must export at the same size.`,
        );
      }
      entry[breakpoint] = `${sizes[0].width} / ${sizes[0].height}`;
    }
    manifest[id] = entry;
  }

  return { json: `${JSON.stringify(manifest, null, 2)}\n`, missing, manifest };
};

const { json, missing, manifest } = build();

if (process.argv.includes("--report")) {
  const done = Object.keys(manifest);
  console.log(`${done.length} of ${IDS.length} illustrations present.\n`);
  if (done.length > 0) {
    for (const id of done) {
      console.log(`  ✓ ${id.padEnd(12)} desktop ${manifest[id].desktop} · mobile ${manifest[id].mobile}`);
    }
    console.log("");
  }
  for (const { id, absent } of missing) {
    console.log(`  · ${id} — needs ${absent.length} file(s):`);
    for (const f of absent) console.log(`      ${f}`);
  }
  if (missing.length > 0) {
    console.log(
      `\nExport each frame from the Figma page "Docs Site — Content illustrations"\n` +
        `into apps/docs-site/public/illustrations/ under the names above.`,
    );
  }
} else if (process.argv.includes("--check")) {
  const committed = readFileSync(OUT, "utf8");
  if (committed !== json) {
    const digest = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12);
    console.error(
      `src/content/illustrations.generated.json is stale (committed ${digest(committed)}, ` +
        `generated ${digest(json)}).\nRun: pnpm gen:illustrations`,
    );
    process.exit(1);
  }
  console.log(`illustrations up to date (${Object.keys(manifest).length}/${IDS.length} present)`);
} else {
  writeFileSync(OUT, json);
  console.log(`wrote ${OUT} — ${Object.keys(manifest).length}/${IDS.length} present`);
}
