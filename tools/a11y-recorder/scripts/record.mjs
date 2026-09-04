/*
 * Records A11Y-01 by driving the real components in a real browser.
 *
 * The whole point of building this instead of animating it in Figma: what comes
 * out is the source code running. The focus rings are the components' own, at
 * their own geometry; the Select's keyboard model is whatever the Select
 * actually implements; the key cap reacts to key events the browser dispatched.
 * Nothing is choreographed except the pauses between key presses.
 *
 * Capture is CDP `Page.startScreencast` in **png**, not Playwright's
 * `recordVideo`. Two reasons: recordVideo captures at the viewport's CSS size
 * and ignores `deviceScaleFactor`, so it cannot exceed 1x; and its VP8 output is
 * lossy before we ever reach the encoder. The screencast hands back lossless
 * frames at the device resolution, with paint timestamps, which is what makes a
 * 3x master possible.
 *
 * Chromium only emits a screencast frame when something paints, so the frame
 * stream is variable-rate. Each frame's own duration is written into an ffmpeg
 * concat list and the encoder resamples to a constant rate — that is what keeps
 * the on-screen timing identical to the timing the driver actually performed.
 *
 * Usage:
 *   node scripts/record.mjs [--theme light|dark] [--density comfortable|...]
 *                           [--scale 3] [--fps 30] [--out <dir>] [--keep-frames]
 */
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/home/user/primitiv/node_modules/.pnpm/playwright@1.46.1/node_modules/playwright/index.mjs";
import { SEQUENCE, pressName } from "./sequence.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

/* The illustration frame, exactly — `.stage` is sized to match, so the capture
   needs no crop and the focus rings sit where the layout puts them. */
const FRAME = { width: 560, height: 420 };

const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const FFMPEG =
  "/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2";
const VITE = join(ROOT, "..", "..", "packages", "react", "node_modules", ".bin", "vite");

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) =>
    a.startsWith("--") ? [[a.slice(2), all[i + 1]?.startsWith("--") ? true : all[i + 1]]] : [],
  ),
);
const theme = args.theme ?? "light";
const density = args.density ?? "comfortable";
const scale = Number(args.scale ?? 3);
const fps = Number(args.fps ?? 30);
const outDir = args.out ?? join(ROOT, "out");
const name = `a11y-01-${theme}-${density}`;

const run = (cmd, argv, opts = {}) => spawn(cmd, argv, { stdio: "pipe", ...opts });

/** Waits for the preview server to answer, so recording never races the build. */
async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`preview server never came up at ${url}`);
}

/** ffmpeg, promisified, failing loudly with its own stderr rather than a code. */
function ffmpeg(argv) {
  return new Promise((resolve, reject) => {
    const proc = run(FFMPEG, ["-hide_banner", "-loglevel", "error", ...argv]);
    let err = "";
    proc.stderr.on("data", (d) => (err += d));
    proc.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}\n${err}`)),
    );
  });
}

/* ---------------------------------------------------------------- build ---- */

console.log("building…");
await new Promise((resolve, reject) => {
  const proc = run(VITE, ["build", "--config", join(ROOT, "vite.config.mjs")], { cwd: ROOT });
  let log = "";
  proc.stdout.on("data", (d) => (log += d));
  proc.stderr.on("data", (d) => (log += d));
  proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(log))));
});

/* A production build, not the dev server: the dev client can paint an error
   overlay over the scene, and a recording that silently contains one is worse
   than a build that fails. */
const preview = run(
  VITE,
  ["preview", "--config", join(ROOT, "vite.config.mjs"), "--port", "5198", "--strictPort"],
  { cwd: ROOT },
);
const url = `http://127.0.0.1:5198/?theme=${theme}&density=${density}`;
await waitForServer("http://127.0.0.1:5198/");

/* --------------------------------------------------------------- record ---- */

const framesDir = join(outDir, `${name}.frames`);
await rm(framesDir, { recursive: true, force: true });
await mkdir(framesDir, { recursive: true });

/* Resolution comes from the WINDOW, not from Playwright's viewport emulation.
   `Page.startScreencast` captures the real compositor surface, so it ignores
   `Emulation.setDeviceMetricsOverride` entirely: a page created with
   `{ viewport: 560x420, deviceScaleFactor: 3 }` casts 560x333 frames — the
   untouched window, at 1x, and the wrong aspect into the bargain. Forcing the
   device scale factor as a launch flag and sizing the window instead is what
   actually produces a 1680x1260 master. */
const browser = await chromium.launch({
  executablePath: CHROME,
  // Playwright 1.46 asks for `--headless=old`, which this Chromium removed, so
  // headless is requested by flag instead of by option.
  headless: false,
  args: [
    "--headless=new",
    "--no-sandbox",
    "--force-color-profile=srgb",
    "--hide-scrollbars",
    `--force-device-scale-factor=${scale}`,
    `--window-size=${FRAME.width},${FRAME.height}`,
  ],
});
const context = await browser.newContext({ viewport: null, reducedMotion: "no-preference" });
const page = await context.newPage();

const failures = [];
page.on("pageerror", (e) => failures.push(String(e)));
page.on("console", (m) => m.type() === "error" && failures.push(m.text()));

await page.goto(url, { waitUntil: "networkidle" });

const client = await page.context().newCDPSession(page);

/* `--window-size` is the OUTER window, and even new headless keeps some of it
   for itself (87px of height here), so the viewport arrives short. Converge on
   the exact frame rather than hardcoding the difference — it is a property of
   the browser build, not of this scene. */
const { windowId } = await client.send("Browser.getWindowForTarget");
for (let attempt = 0; attempt < 8; attempt++) {
  const [w, h] = await page.evaluate(() => [innerWidth, innerHeight]);
  if (w === FRAME.width && h === FRAME.height) break;
  const { bounds } = await client.send("Browser.getWindowBounds", { windowId });
  await client.send("Browser.setWindowBounds", {
    windowId,
    bounds: { width: bounds.width + (FRAME.width - w), height: bounds.height + (FRAME.height - h) },
  });
  await page.waitForTimeout(150);
}
const viewport = await page.evaluate(() => [innerWidth, innerHeight, devicePixelRatio]);
if (viewport[0] !== FRAME.width || viewport[1] !== FRAME.height) {
  throw new Error(`viewport settled at ${viewport[0]}x${viewport[1]}, wanted ${FRAME.width}x${FRAME.height}`);
}

await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
const frames = [];
client.on("Page.screencastFrame", async ({ data, sessionId, metadata }) => {
  frames.push({ t: metadata.timestamp, data });
  try {
    await client.send("Page.screencastFrameAck", { sessionId });
  } catch {
    /* the cast was stopped between frame and ack */
  }
});
await client.send("Page.startScreencast", {
  format: "png",
  // Generous caps: the surface is already the right size, and a tight cap here
  // would silently downscale rather than fail.
  maxWidth: 4000,
  maxHeight: 4000,
  everyNthFrame: 1,
});

const log = [];
for (const step of SEQUENCE) {
  if (step.action === "key") await page.keyboard.press(pressName(step.key));
  if (step.action === "type") {
    for (const ch of step.text) {
      await page.keyboard.press(ch === " " ? "Space" : ch);
      await page.waitForTimeout(step.perChar);
    }
  }
  await page.waitForTimeout(step.hold);
  // Recorded per step so the run itself proves the sequence did what it says:
  // a take where Tab landed somewhere unexpected shows up in the table rather
  // than in the video.
  log.push({
    ...step,
    focus: await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return "(none)";
      const label =
        el.getAttribute("aria-label") ??
        el.closest("label")?.textContent ??
        document.querySelector(`label[for="${el.id}"]`)?.textContent ??
        el.textContent ??
        "";
      return `${el.tagName.toLowerCase()} "${label.trim().slice(0, 28)}"`;
    }),
  });
}

await client.send("Page.stopScreencast");
await page.waitForTimeout(200);

if (failures.length) {
  await browser.close();
  preview.kill();
  throw new Error(`page reported errors, refusing to publish a broken take:\n${failures.join("\n")}`);
}

/* A still for `prefers-reduced-motion`: the last frame of the sequence, at the
   same resolution, so the static fallback is the same image the video ends on. */
await page.screenshot({ path: join(outDir, `${name}-still.png`) });
await browser.close();
preview.kill();

/* --------------------------------------------------------------- encode ---- */

if (frames.length < 2) throw new Error(`only ${frames.length} frames captured`);

const list = [];
for (const [i, frame] of frames.entries()) {
  const file = join(framesDir, `f${String(i).padStart(5, "0")}.png`);
  await writeFile(file, Buffer.from(frame.data, "base64"));
  // The last frame has no successor to measure against, so it holds for one
  // output frame rather than being dropped by the concat demuxer.
  const next = frames[i + 1];
  const duration = next ? next.t - frame.t : 1 / fps;
  list.push(`file '${file}'\nduration ${duration.toFixed(4)}`);
}
// The concat demuxer ignores the final entry's duration unless the file is
// repeated, which is the documented way to make the last frame actually hold.
list.push(`file '${join(framesDir, `f${String(frames.length - 1).padStart(5, "0")}.png`)}'`);
const listPath = join(outDir, `${name}.concat.txt`);
await writeFile(listPath, list.join("\n") + "\n");

const mp4 = join(outDir, `${name}.mp4`);
const webm = join(outDir, `${name}.webm`);

await ffmpeg([
  "-y", "-f", "concat", "-safe", "0", "-i", listPath,
  "-vf", `fps=${fps},format=yuv420p`,
  "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-movflags", "+faststart",
  mp4,
]);
await ffmpeg([
  "-y", "-f", "concat", "-safe", "0", "-i", listPath,
  "-vf", `fps=${fps}`,
  "-c:v", "libvpx-vp9", "-crf", "28", "-b:v", "0", "-row-mt", "1",
  webm,
]);

if (!args["keep-frames"]) await rm(framesDir, { recursive: true, force: true });

const seconds = frames.at(-1).t - frames[0].t;
console.log(
  `${name}: ${frames.length} frames over ${seconds.toFixed(2)}s ` +
    `at ${FRAME.width * scale}x${FRAME.height * scale}\n  ${mp4}\n  ${webm}`,
);
console.table(log.map(({ action, key, text, note, focus }) => ({ action, key, text, note, focus })));
