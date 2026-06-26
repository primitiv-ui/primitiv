import { chromium } from "playwright";

const densities = ["dense", "comfortable", "spacious"];
// Route the headless browser through the agent proxy so Google Fonts load,
// matching what a real local machine sees (verification only).
const proxyServer = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--ignore-certificate-errors"],
  ...(proxyServer ? { proxy: { server: proxyServer, bypass: "localhost,127.0.0.1" } } : {}),
});
const page = await browser.newPage({
  viewport: { width: 1200, height: 900 },
  deviceScaleFactor: 2,
  ignoreHTTPSErrors: true,
});

for (const d of densities) {
  await page.goto("http://localhost:4599/", { waitUntil: "networkidle" });
  await page.selectOption("#density", d);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const file = `tmp-flow-harness/shot-${d}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log("wrote", file);
}

await browser.close();
