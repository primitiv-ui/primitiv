// Minimal CDP driver: launches headless Chrome, opens a URL, evaluates JS, prints the result.
// Usage: node cdp.mjs <url> <path-to-expression-file> [waitMs]
import { spawn } from "node:child_process";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.argv[2];
const expression = readFileSync(process.argv[3], "utf8");
const waitMs = Number(process.argv[4] ?? 4000);
const port = 9400 + (process.pid % 200);

const profile = mkdtempSync(join(tmpdir(), "cdp-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
  "--disable-extensions", "--hide-scrollbars",
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  "--window-size=1200,900", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function browserWs() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return (await res.json()).webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error("Chrome DevTools endpoint never came up on port " + port);
}

let id = 0;
function rpc(ws, method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const myId = ++id;
    const onMsg = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== myId) return;
      ws.removeEventListener("message", onMsg);
      msg.error ? reject(new Error(method + ": " + JSON.stringify(msg.error))) : resolve(msg.result);
    };
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({ id: myId, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

try {
  const ws = new WebSocket(await browserWs());
  await new Promise((r, j) => { ws.addEventListener("open", r); ws.addEventListener("error", j); });

  const { targetId } = await rpc(ws, "Target.createTarget", { url: "about:blank" });
  const { sessionId } = await rpc(ws, "Target.attachToTarget", { targetId, flatten: true });

  await rpc(ws, "Page.enable", {}, sessionId);
  await rpc(ws, "Runtime.enable", {}, sessionId);
  await rpc(ws, "Page.navigate", { url }, sessionId);
  await sleep(waitMs); // let the SPA mount + fonts settle

  const out = await rpc(ws, "Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId);
  if (out.exceptionDetails) {
    console.error("PAGE EXCEPTION:", JSON.stringify(out.exceptionDetails.exception ?? out.exceptionDetails, null, 2));
    process.exitCode = 1;
  } else {
    const v = out.result.value;
    console.log(typeof v === "string" ? v : JSON.stringify(v, null, 2));
  }
  ws.close();
} finally {
  chrome.kill("SIGKILL");
}
