// Frame-accurate renderer: serves dist/, seeks the page to each frame's time
// (window.__seek), screenshots it, and pipes the PNGs into ffmpeg. Nothing in
// the page moves on wall-clock time, so every frame is reproducible.
//
//   node render.mjs stills 0 14.6 ...      → out/still-<t>.png
//   node render.mjs sheet 0 2 4 ...        → out/sheet.png (contact sheet, 4 across)
//   node render.mjs video [--jobs N]       → out/<video id>.mp4
//
// Every mode takes --video <id> (default: the app's DEFAULT_VIDEO). Canvas size
// and duration come from that video's VideoSpec, read off the page.
//
// Env: FPS (60), SCALE (2 → 2× the CSS canvas), NAME (output name),
// CHROMIUM_PATH (otherwise Playwright's own — `npx playwright install chromium`).
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import { chromium } from "playwright-core";

import { chunks } from "./scripts/chunks.mjs";

const SELF = new URL(import.meta.url).pathname;
const ROOT = path.dirname(SELF);
const DIST = path.join(ROOT, "dist");
const OUT = path.join(ROOT, "out");
const FPS = Number(process.env.FPS ?? 60);
const SCALE = Number(process.env.SCALE ?? 2);
fs.mkdirSync(OUT, { recursive: true });

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const run = (cmd, args) =>
  new Promise((resolve, reject) =>
    spawn(cmd, args, { stdio: "inherit" }).on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${path.basename(cmd)} exited ${code}`)),
    ),
  );

/** Serves dist/, opens the video, and (optionally) warms every scene up. */
const open = async ({ video = "", warm = true } = {}) => {
  if (!fs.existsSync(path.join(DIST, "index.html"))) throw new Error("No dist/ — run `pnpm build` first");
  const server = http.createServer((req, res) => {
    const file = path.join(DIST, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--font-render-hinting=none", "--force-color-profile=srgb"],
  });
  const page = await browser.newPage({ deviceScaleFactor: SCALE });
  page.on("pageerror", (e) => console.error("pageerror:", e.message));

  await page.goto(`http://127.0.0.1:${server.address().port}/index.html?video=${encodeURIComponent(video)}`);
  const spec = await page.evaluate(() => window.__video);
  if (!spec) throw new Error(`The page did not load a video (asked for "${video}") — see pageerror above`);
  await page.setViewportSize({ width: spec.width, height: spec.height });
  await page.evaluate(() => document.fonts.ready);
  const { duration } = spec;
  if (warm) {
    // Mount every scene once so images and fonts are decoded before capture.
    for (let t = 0; t < duration; t += 0.5) await page.evaluate((t) => window.__seek(t), t);
    await page.waitForFunction(() => [...document.images].every((i) => i.complete));
    await page.evaluate(() => document.fonts.ready);
  }

  const shoot = async (t) => {
    await page.evaluate((t) => window.__seek(t), t);
    return page.screenshot({ type: "png", animations: "disabled", caret: "hide" });
  };
  const close = async () => {
    await browser.close();
    server.close();
  };
  return { ...spec, shoot, close };
};

/** Encodes frames [from, to) into one MP4. */
const encode = async (shoot, from, to, file, label = "") => {
  const ff = spawn(
    "ffmpeg",
    [
      "-y", "-loglevel", "error",
      "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
      "-c:v", "libx264", "-preset", "slow", "-crf", "16",
      "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.2",
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
      "-movflags", "+faststart",
      file,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const started = Date.now();
  for (let f = from; f < to; f++) {
    const buf = await shoot(f / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if ((f - from) % 240 === 0) {
      const rate = (f - from + 1) / ((Date.now() - started) / 1000);
      console.log(`${label}frame ${f - from}/${to - from} (${rate.toFixed(1)} fps)`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("exit", r));
};

const args = process.argv.slice(2);
/** Removes `--name value` from args and returns the value. */
const flag = (name, fallback) => {
  const at = args.indexOf(name);
  return at === -1 ? fallback : args.splice(at, 2)[1];
};
const jobs = Number(flag("--jobs", 1));
const video = flag("--video", "");
const [mode = "stills", ...rest] = args;

if (mode === "video") {
  // Orchestrate: split on whole frames, render parts in parallel, join losslessly.
  const { id, duration, close } = await open({ video, warm: false });
  await close();
  const NAME = process.env.NAME ?? id;
  const parts = chunks(duration, jobs, FPS);
  const files = parts.map((_, i) => path.join(OUT, `${NAME}.part-${i}.mp4`));
  await Promise.all(
    parts.map((p, i) => run(process.execPath, [SELF, "frames", p.from, p.to, files[i], i, "--video", id])),
  );
  const list = path.join(OUT, `${NAME}.parts.txt`);
  fs.writeFileSync(list, files.map((f) => `file '${f}'`).join("\n"));
  await run("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", path.join(OUT, `${NAME}.mp4`)]);
  for (const f of [...files, list]) fs.unlinkSync(f);
  console.log(`wrote out/${NAME}.mp4 (${parts.at(-1).to} frames, ${parts.length} job${parts.length > 1 ? "s" : ""})`);
} else if (mode === "frames") {
  // One part of a `video` render (spawned by the orchestrator above).
  const [from, to, file, index] = rest;
  const page = await open({ video });
  await encode(page.shoot, Number(from), Number(to), file, `[part ${index}] `);
  await page.close();
} else if (mode === "stills" || mode === "sheet") {
  const page = await open({ video });
  const { width: w, height: h } = page;
  const times = rest.map(Number);
  const files = [];
  for (const t of times) {
    const f = path.join(OUT, `${mode === "sheet" ? "sheet-" : "still-"}${t.toFixed(2)}.png`);
    fs.writeFileSync(f, await page.shoot(t));
    files.push(f);
  }
  await page.close();
  if (mode === "sheet" && files.length > 0) {
    const cols = Math.min(4, files.length);
    const layout = files.map((_, i) => `${(i % cols) * w}_${Math.floor(i / cols) * h}`).join("|");
    const scaled = files.map((_, i) => `[${i}:v]scale=${w}:${h}[s${i}]`).join(";");
    const filter =
      files.length === 1
        ? `[0:v]scale=${w}:${h}`
        : `${scaled};${files.map((_, i) => `[s${i}]`).join("")}xstack=inputs=${files.length}:layout=${layout}:fill=black`;
    await run("ffmpeg", ["-y", "-loglevel", "error", ...files.flatMap((f) => ["-i", f]), "-filter_complex", filter, path.join(OUT, "sheet.png")]);
    for (const f of files) fs.unlinkSync(f);
    console.log("wrote out/sheet.png");
  }
} else {
  console.error(`Unknown mode "${mode}". Use stills | sheet | video [--jobs N].`);
  process.exit(1);
}
