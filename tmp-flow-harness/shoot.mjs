import { chromium } from "playwright";

const densities = ["dense", "comfortable", "spacious"];
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });

for (const d of densities) {
  await page.goto("http://localhost:4599/", { waitUntil: "networkidle" });
  await page.selectOption("#density", d);
  await page.waitForTimeout(150);
  const file = `tmp-flow-harness/shot-${d}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log("wrote", file);
}

await browser.close();
