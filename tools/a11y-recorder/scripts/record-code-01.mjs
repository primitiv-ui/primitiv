/*
 * Records CODE-01 inside a real VS Code.
 *
 * The section's claim is that the component becomes a file in your project that
 * you can open and change. An editor pane we draw ourselves is a picture of an
 * editor — the same trap the A11Y-01 pivot exists to avoid — so this drives an
 * actual VS Code (code-server) over an actual project:
 *
 *   - the integrated terminal runs the real `primitiv add button`, which really
 *     writes the files, on camera;
 *   - the file that opens is the one the command just wrote;
 *   - the edit is a real edit, saved to disk;
 *   - and the preview beside it is a page linked to THAT file, so the button
 *     grows because the declaration changed.
 *
 * Nothing is staged except the decision to type. Usage:
 *   node tools/a11y-recorder/scripts/record-code-01.mjs [--scale 2] [--fps 30]
 */
import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { encodableScale, encode, fitWindow, openFrame, startScreencast } from "./capture.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const REPO = join(ROOT, "..", "..");
const WORKSPACE = join(ROOT, "out", "code-01-workspace");
const OUT = join(ROOT, "out");
const USER_DATA = join(OUT, "code-01-user-data");

/** 16:10 at the full content width, per the brief. */
const FRAME = { width: 1200, height: 750 };

const CODE_SERVER = join(
  "/tmp/claude-0/-home-user/a15294b6-ece6-5f05-9b3d-0214ad17868e/scratchpad",
  "cs2/node_modules/code-server/out/node/entry.js",
);
const VITE = join(REPO, "packages", "react", "node_modules", ".bin", "vite");
const PREVIEW_URL = "http://127.0.0.1:5199/?scene=code-01-preview&theme=dark";
/* An ephemeral port, not a fixed one. A code-server left running from a failed
   take holds its port, and the browser then connects to THAT instance — a
   different workspace, a different user-data-dir, and a workbench that never
   matches what this script expects. It cost several runs before the EADDRINUSE
   line was spotted in the noise. Picking a free port each time makes the
   collision impossible rather than merely detected. */
const IDE_PORT = await freePort();

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => {
    if (!a.startsWith("--")) return [];
    // A flag with nothing after it, or with another flag after it, is `true` —
    // without the first case `--debug` at the end of the line parsed as
    // `undefined` and silently did nothing.
    const next = all[i + 1];
    return [[a.slice(2), next === undefined || next.startsWith("--") ? true : next]];
  }),
);
const fps = Number(args.fps ?? 30);
const scale = encodableScale(FRAME.width, FRAME.height, Number(args.scale ?? 2));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** A port nothing is listening on, asked of the OS rather than guessed. */
function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

/* `--debug` writes a screenshot after each stage. Every failure so far has been
   a focus or layout surprise inside VS Code, and those are invisible from an
   exception — the only way to see them is to look. */
let shotIndex = 0;
const debug = Boolean(args.debug);
/* Every VS Code failure so far has been invisible from its exception — a
   keystroke went to the shell, a widget was not open yet — so a failed wait
   always leaves a picture of the moment behind. */
async function expectVisible(selector, label, timeout = 20_000) {
  try {
    await page.waitForSelector(selector, { timeout });
  } catch (error) {
    await page.screenshot({ path: join(OUT, `code-01-failed-${label}.png`) });
    throw error;
  }
}

async function shot(page, label) {
  if (!debug) return;
  await page.screenshot({ path: join(OUT, `code-01-debug-${String(++shotIndex).padStart(2, "0")}-${label}.png`) });
}

async function waitFor(check, what, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return;
    await wait(250);
  }
  throw new Error(`timed out waiting for ${what}`);
}

/* ------------------------------------------------------------- servers ---- */

/* Some of what has to be off is a USER setting, not a workspace one — the chat
   panel's default visibility among them, which is why setting it in
   `.vscode/settings.json` alone left the panel on screen. */
await mkdir(join(USER_DATA, "User"), { recursive: true });
await writeFile(
  join(USER_DATA, "User", "settings.json"),
  JSON.stringify(
    {
      "workbench.colorTheme": "Default Dark Modern",
      "workbench.secondarySideBar.defaultVisibility": "hidden",
      "chat.commandCenter.enabled": false,
      "workbench.startupEditor": "none",
      "window.commandCenter": false,
      "workbench.layoutControl.enabled": false,
      "update.mode": "none",
      "telemetry.telemetryLevel": "off",
    },
    null,
    2,
  ) + "\n",
);

console.log("preparing the workspace…");
execFileSync("node", [join(HERE, "prepare-code-01-workspace.mjs")], { stdio: "inherit" });

// The dev server, not `preview`: the preview page links the workspace's
// stylesheet through vite's /@fs, and that file does not exist until the
// command in beat 1 writes it.
const preview = spawn(VITE, ["--config", join(ROOT, "vite.config.mjs"), "--port", "5199", "--strictPort"], {
  cwd: ROOT,
  stdio: "pipe",
});

const ide = spawn(
  "node",
  [
    CODE_SERVER,
    "--auth", "none",
    "--bind-addr", `127.0.0.1:${IDE_PORT}`,
    "--disable-telemetry",
    "--disable-update-check",
    "--disable-workspace-trust",
    "--user-data-dir", USER_DATA,
    "--extensions-dir", join(OUT, "code-01-extensions"),
    WORKSPACE,
  ],
  {
    stdio: "pipe",
    // The terminal in the recording runs the CLI we just built, so it has to be
    // on the PATH the IDE hands its shell.
    env: { ...process.env, PATH: `${join(REPO, "target", "release")}:${process.env.PATH}` },
  },
);
ide.stderr.on("data", (d) => process.stderr.write(`[code-server] ${d}`));

/* A code-server left running from an earlier take holds the port, and the
   browser then connects to THAT one — a different workspace, a different
   user-data-dir, and a workbench that never matches what this script expects.
   It cost several runs before the EADDRINUSE line was spotted in the noise, so
   it is now a hard failure with the cause named. */
/* Neither child is a daemon: a failed take used to leave both running, and the
   next run then talked to the previous one. */
const stopServers = () => {
  preview.kill();
  ide.kill();
};
process.on("exit", stopServers);
process.on("uncaughtException", (error) => {
  stopServers();
  throw error;
});

await waitFor(
  async () => {
    try {
      return (await fetch(`http://127.0.0.1:${IDE_PORT}/healthz`)).ok;
    } catch {
      return false;
    }
  },
  "code-server",
);
await waitFor(async () => {
  try {
    return (await fetch("http://127.0.0.1:5199/")).ok;
  } catch {
    return false;
  }
}, "the preview server");

/* -------------------------------------------------------------- record ---- */

const { browser, page } = await openFrame({ ...FRAME, scale });
const client = await page.context().newCDPSession(page);

await page.goto(`http://127.0.0.1:${IDE_PORT}/?folder=${encodeURIComponent(WORKSPACE)}`, {
  waitUntil: "domcontentloaded",
});
await fitWindow(page, client, FRAME);
await page.waitForSelector(".monaco-workbench", { timeout: 90_000 }).catch(async (error) => {
  await page.screenshot({ path: join(OUT, "code-01-debug-00-stuck.png") });
  throw error;
});
// The workbench paints before it is ready to accept commands; the explorer
// finishing its first render is the cheapest signal that it is.
await page.waitForSelector(".explorer-folders-view", { timeout: 90_000 });
await wait(3000);

/*
 * Quick-open and the command palette are the same widget, and driving them by
 * timing alone does not work: a take where the waits were a beat short typed
 * three commands into one box ("tightSimple Browser: Showhttp://…") and every
 * step after it went astray. So each interaction waits for the widget to be
 * ACTUALLY open before typing and ACTUALLY closed before moving on.
 */
async function quickInput(prefix, text, { delay = 12 } = {}) {
  await page.keyboard.press("Escape");
  await page.waitForSelector(".quick-input-widget", { state: "hidden", timeout: 10_000 }).catch(() => {});
  await page.keyboard.press(prefix);
  await page.waitForSelector(".quick-input-widget .quick-input-box input", { timeout: 10_000 });
  await wait(150);
  await page.keyboard.type(text, { delay });
  // The list re-filters asynchronously; pressing Enter into a stale list picks
  // whatever was highlighted a moment ago — or, if the list is still empty,
  // does nothing at all and the next step waits forever on a window that never
  // changed. So wait for a row, not for a duration.
  await page.waitForSelector(".quick-input-list .monaco-list-row", { timeout: 15_000 });
  await wait(350);
  await page.keyboard.press("Enter");
  await page.waitForSelector(".quick-input-widget", { state: "hidden", timeout: 10_000 }).catch(() => {});
  await wait(400);
}

/** Run a command through the palette, the way a person would. */
const palette = (command) => quickInput("Control+Shift+P", command);

/* This VS Code build opens a chat panel in the secondary side bar by default.
   It is not part of the claim and it takes a quarter of the width. The setting
   alone did not remove it, so the command does. */
/* The chat panel is a default of this build, and neither the setting nor the
   toggle command removed it — both were tried. Hiding the part outright is the
   same end state a person reaches by closing it, and it is the only thing that
   actually worked. */
await page.addStyleTag({ content: ".part.auxiliarybar { display: none !important; }" });
await wait(600);
/* The side bar has nothing to show yet and the editor needs the width. */
await page.keyboard.press("Control+B");
await wait(800);
await shot(page, "workbench");

/*
 * The order below is the brief's beat order, and it is also the only order that
 * WORKS. Opening the preview first looks tidier — the layout never moves — but
 * the Simple Browser is a webview iframe, and while it holds focus it swallows
 * every keystroke: the terminal beat typed into a web page and the take came
 * out with an empty prompt. Focus is therefore claimed explicitly before each
 * burst, and the preview arrives only once the typing into the terminal is done.
 */
const frames = await startScreencast(client);
await wait(700);

/* Beat 1 + 2 — the terminal writes the files. */
/* Keybinding, not palette. Every palette round-trip is ~2s of a reader watching
   a command being typed into a box, which is dead air in a seven-second beat —
   so the palette is used only where no keybinding exists (the Simple Browser). */
await page.keyboard.press("Control+Shift+Backquote");
await page.waitForSelector(".xterm-screen", { timeout: 20_000 }).catch(() => {});
await wait(900);
/* The integrated terminal needs `node-pty`, which is a native module the npm
   package does not ship. Without it VS Code opens an empty panel and the take
   would record a terminal that never echoes anything — so fail here rather than
   produce a video whose first two beats are silently missing. */
if (!(await page.$(".xterm-screen"))) {
  await browser.close();
  preview.kill();
  ide.kill();
  throw new Error("the integrated terminal did not start (node-pty missing?)");
}
await shot(page, "terminal");
await page.keyboard.type("primitiv add button", { delay: 45 });
await wait(500);
await shot(page, "typed");
await page.keyboard.press("Enter");
await waitFor(
  async () => existsSync(join(WORKSPACE, "src", "styles", "primitiv", "button", "styles.css")),
  "the copied stylesheet",
);
await wait(1100);
await shot(page, "ran");

/* Beat 3 — the file that was just written opens, and the preview comes up
   beside it.

   Focus leaves the terminal FIRST, and it has to be by palette: while the
   terminal has focus VS Code forwards Ctrl+P to the shell (bash reads it as
   previous-history), so quick-open never opened and the beat timed out with no
   error to explain itself. Ctrl+Shift+P is not forwarded, which is why the
   palette still reaches VS Code from inside a terminal. */
await page.keyboard.press("Control+1");
await wait(500);
/* The files landed a moment ago and VS Code's file index is not instant: a
   query issued too early returns an empty list, Enter does nothing, and the
   next wait times out on a window that never changed. */
await wait(1600);
await quickInput("Control+P", "styles.css", { delay: 30 });
await expectVisible(".editor-instance .monaco-editor", "file-open");
await wait(700);
await shot(page, "file-open");

// Split first so the browser lands beside the file rather than over it.
await page.keyboard.press("Control+Backslash");
await wait(700);
await palette("Simple Browser: Show");
// The URL prompt is the same widget again, already open and waiting.
await page.waitForSelector(".quick-input-widget .quick-input-box input", { timeout: 10_000 });
await wait(250);
await page.keyboard.type(PREVIEW_URL, { delay: 8 });
await wait(500);
await page.keyboard.press("Enter");
await wait(2000);
await shot(page, "preview");

/* Beat 4 — the edit. Focus has to be taken back from the webview first, or the
   keystrokes land in the preview page instead of the file. */
// Focus has to be taken back from the webview by keybinding, not by palette —
// a palette round-trip returns focus to whatever had it before.
await page.keyboard.press("Control+1");
await wait(900);
/*
 * Which line to edit is COMPUTED, and it has to be.
 *
 * The obvious target is the padding declaration in the base `.primitiv-button`
 * rule near the top of the file — and editing it does nothing, because the
 * default `md` size class re-declares the same custom property further down and
 * wins. A take that edited the base rule looked perfect and moved the preview
 * button by exactly zero pixels (measured: 262px wide before and after). The
 * declaration inside `.primitiv-button--md` is the one that governs.
 *
 * Finding it by search rather than by a hardcoded number also means a
 * regenerated stylesheet cannot silently point this beat at a comment.
 */
const stylesheetLines = readFileSync(
  join(WORKSPACE, "src", "styles", "primitiv", "button", "styles.css"),
  "utf8",
).split("\n");
const mdRule = stylesheetLines.findIndex((line) => line.includes(".primitiv-button--md {"));
const editLine =
  stylesheetLines.findIndex(
    (line, i) => i > mdRule && line.includes("--primitiv-button-padding-inline:"),
  ) + 1;
if (mdRule < 0 || editLine <= 0) {
  throw new Error("could not find the md padding declaration to edit");
}
await quickInput("Control+G", String(editLine));
await wait(600);
/* Ctrl+G leaves the cursor in column 1, so Shift+End selects exactly the line
   and nothing else. An earlier take used End then Shift+Home, which selects only
   to the first non-whitespace character — the typed replacement landed inside
   what was left and produced `ne: 2.5rem;; var(…)` and 33 problems. */
await page.keyboard.press("Shift+End");
await wait(700);
await shot(page, "selected");
await page.keyboard.type("  --primitiv-button-padding-inline: 2.5rem;", { delay: 55 });
// Back to column 1, so the frame ends on the declaration rather than on the
// tail of it.
await page.keyboard.press("Home");
await page.keyboard.press("Control+S");
await wait(1800);
await shot(page, "edited");

await client.send("Page.stopScreencast");
await wait(200);
await page.screenshot({ path: join(OUT, "code-01-still.png") });
await browser.close();
preview.kill();
ide.kill();

await mkdir(OUT, { recursive: true });
const { mp4, seconds } = await encode({
  frames,
  outDir: OUT,
  name: "code-01-desktop-dark",
  fps,
  keepFrames: Boolean(args["keep-frames"]),
});
console.log(
  `code-01: ${frames.length} frames over ${seconds.toFixed(2)}s at ${FRAME.width * scale}x${FRAME.height * scale}\n  ${mp4}`,
);
