/*
 * The capture machinery both recordings share: launch a headless Chromium at an
 * exact frame size and device pixel ratio, screencast it losslessly, and encode
 * what came back at a constant rate.
 *
 * Two things here are hard-won and must not be "simplified":
 *
 * 1. `Page.startScreencast` IGNORES Playwright's viewport emulation. It captures
 *    the real compositor surface, so a page created with
 *    `{ viewport: WxH, deviceScaleFactor: 3 }` casts the untouched window at 1x
 *    — wrong size and wrong aspect. Resolution has to come from the window:
 *    `--force-device-scale-factor` plus `--window-size`, then converge
 *    `innerWidth`/`innerHeight` on the target with `Browser.setWindowBounds`,
 *    because new headless keeps some of the outer height for itself and that
 *    amount is a property of the browser build.
 *    `recordVideo` is not the alternative: it captures at the viewport's CSS
 *    size and cannot exceed 1x at all.
 * 2. The frame stream is VARIABLE-RATE — Chromium emits a frame only when
 *    something paints — so each frame's own duration goes into the concat list
 *    and the encoder resamples. Assume a fixed rate and the whole sequence runs
 *    fast and unevenly.
 */
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "/home/user/primitiv/node_modules/.pnpm/playwright@1.46.1/node_modules/playwright/index.mjs";

export const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
export const FFMPEG =
  "/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2";

/**
 * The smallest scale at or above `requested` whose output dimensions are both
 * even. h264 refuses an odd dimension, and padding or scaling to fix it would
 * either add a black hairline or stretch the frame by a pixel.
 */
export function encodableScale(width, height, requested) {
  let scale = requested;
  while ((width * scale) % 2 || (height * scale) % 2) scale += 1;
  return scale;
}

/** Launch a browser whose window renders exactly `width x height` at `scale`. */
export async function openFrame({ width, height, scale, args = [] }) {
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
      `--window-size=${width},${height}`,
      ...args,
    ],
  });
  const context = await browser.newContext({ viewport: null, reducedMotion: "no-preference" });
  const page = await context.newPage();
  return { browser, page };
}

/** Converge the window on an exact inner size. See note 1 above. */
export async function fitWindow(page, client, { width, height }) {
  const { windowId } = await client.send("Browser.getWindowForTarget");
  for (let attempt = 0; attempt < 8; attempt++) {
    const [w, h] = await page.evaluate(() => [innerWidth, innerHeight]);
    if (w === width && h === height) return;
    const { bounds } = await client.send("Browser.getWindowBounds", { windowId });
    await client.send("Browser.setWindowBounds", {
      windowId,
      bounds: { width: bounds.width + (width - w), height: bounds.height + (height - h) },
    });
    await page.waitForTimeout(150);
  }
  const [w, h] = await page.evaluate(() => [innerWidth, innerHeight]);
  throw new Error(`viewport settled at ${w}x${h}, wanted ${width}x${height}`);
}

/** Start a lossless screencast, collecting frames with their paint timestamps. */
export async function startScreencast(client) {
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
    // Generous caps: the surface is already the right size, and a tight cap
    // would silently downscale rather than fail.
    maxWidth: 8000,
    maxHeight: 8000,
    everyNthFrame: 1,
  });
  return frames;
}

function ffmpeg(argv) {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG, ["-hide_banner", "-loglevel", "error", ...argv], { stdio: "pipe" });
    let err = "";
    proc.stderr.on("data", (d) => (err += d));
    proc.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}\n${err}`)),
    );
  });
}

/** Write the frames out and encode them to MP4 at a constant `fps`. */
export async function encode({ frames, outDir, name, fps, keepFrames = false }) {
  if (frames.length < 2) throw new Error(`only ${frames.length} frames captured`);
  const framesDir = join(outDir, `${name}.frames`);
  await rm(framesDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });

  const list = [];
  for (const [i, frame] of frames.entries()) {
    const file = join(framesDir, `f${String(i).padStart(5, "0")}.png`);
    await writeFile(file, Buffer.from(frame.data, "base64"));
    // The last frame has no successor to measure against, so it holds for one
    // output frame rather than being dropped by the concat demuxer.
    const next = frames[i + 1];
    list.push(`file '${file}'\nduration ${(next ? next.t - frame.t : 1 / fps).toFixed(4)}`);
  }
  // The concat demuxer ignores the final entry's duration unless the file is
  // repeated, which is the documented way to make the last frame actually hold.
  list.push(`file '${join(framesDir, `f${String(frames.length - 1).padStart(5, "0")}.png`)}'`);
  const listPath = join(outDir, `${name}.concat.txt`);
  await writeFile(listPath, list.join("\n") + "\n");

  const mp4 = join(outDir, `${name}.mp4`);
  await ffmpeg([
    "-y", "-f", "concat", "-safe", "0", "-i", listPath,
    "-vf", `fps=${fps},format=yuv420p`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-movflags", "+faststart",
    mp4,
  ]);
  if (!keepFrames) await rm(framesDir, { recursive: true, force: true });
  return { mp4, seconds: frames.at(-1).t - frames[0].t };
}
