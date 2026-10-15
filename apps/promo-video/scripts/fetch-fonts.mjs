// Downloads the three families the token layer names (Khand, Asta Sans,
// JetBrains Mono) into public/fonts/, once. They are fetched rather than
// committed, and served locally so a render never depends on the network.
import fs from "node:fs";
import path from "node:path";

import { latinFaces } from "./fonts.mjs";

const DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "../public/fonts");
const SHEET = path.join(DIR, "fonts.css");
const URL_ =
  "https://fonts.googleapis.com/css2?family=Asta+Sans:wght@300..800" +
  "&family=JetBrains+Mono:wght@400;500;700&family=Khand:wght@300;400;500;600;700&display=block";
// Google serves woff2 (and the subset comments) only to a modern browser.
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

if (fs.existsSync(SHEET)) process.exit(0);

fs.mkdirSync(DIR, { recursive: true });
const css = await (await fetch(URL_, { headers: { "user-agent": UA } })).text();
const faces = latinFaces(css);
if (faces.length === 0) throw new Error("No latin @font-face rules in the Google Fonts response");
for (const face of faces) {
  const target = path.join(DIR, face.file);
  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, Buffer.from(await (await fetch(face.url)).arrayBuffer()));
  }
}
fs.writeFileSync(SHEET, faces.map((f) => f.css).join("\n"));
console.log(`fonts: ${faces.length} faces → public/fonts/`);
