/*
 * Vendors the three Primitiv faces from Google Fonts into public/fonts/.
 *
 * The recorder runs a headless Chromium with no network access to
 * fonts.gstatic.com, and a font that swaps in halfway through a capture would
 * reflow the card mid-take. So the faces are fetched once, here, and served
 * first-party — the same reasoning `next/font` applies on the docs site.
 *
 * Idempotent: re-running overwrites, and the output is gitignored.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "public", "fonts");

// The exact request the kitchen-sink's <link> makes, so the recorder renders
// the same faces at the same weights the shipped apps do.
const CSS_URL =
  "https://fonts.googleapis.com/css2?family=Asta+Sans:wght@300..800" +
  "&family=JetBrains+Mono:wght@400;500;700" +
  "&family=Khand:wght@300;400;500;600;700&display=swap";

// Google serves woff2 only to a UA it recognises as supporting it.
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/131.0.0.0 Safari/537.36";

const css = await (await fetch(CSS_URL, { headers: { "User-Agent": UA } })).text();

await mkdir(OUT, { recursive: true });

const seen = new Map();
let n = 0;
const rewritten = await (async () => {
  let out = css;
  for (const m of css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)) {
    const url = m[1];
    if (!seen.has(url)) {
      const name = `f${String(n++).padStart(3, "0")}.woff2`;
      const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
      await writeFile(join(OUT, name), buf);
      seen.set(url, name);
    }
    out = out.replaceAll(url, `./${seen.get(url)}`);
  }
  return out;
})();

await writeFile(join(OUT, "fonts.css"), rewritten);
console.log(`vendored ${seen.size} faces -> ${OUT}`);
