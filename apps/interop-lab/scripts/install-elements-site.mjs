// Installs Tabs, Accordion and Collapsible with the real CLI into a plain HTML site, the way a consumer
// would (RFC 0033 §8): `primitiv init`, then `primitiv add` for each, in a folder
// with no package.json. The styled page then links what was copied and renders
// the markup `add` printed, so the lab tests the CLI's output, not a copy of it.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const site = fileURLToPath(new URL("../styled-site/", import.meta.url));
const manifest = fileURLToPath(new URL("../../../Cargo.toml", import.meta.url));

const primitiv = (...args) =>
  execFileSync("cargo", ["run", "--quiet", "--manifest-path", manifest, "-p", "primitiv-cli", "--", ...args], {
    cwd: site,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

rmSync(site, { recursive: true, force: true });
mkdirSync(site, { recursive: true });
// Styled: elements are headless unless styling is asked for at init.
primitiv("init", "--yes", "--styles");
for (const component of ["tabs", "accordion", "collapsible"]) {
  const output = primitiv("add", component);
  const heading = `Example markup for ${component}:\n\n`;
  const start = output.indexOf(heading);
  if (start === -1) throw new Error(`add printed no example markup for ${component}:\n${output}`);
  // The printed block is indented two spaces; the page gets it as written.
  const markup = output
    .slice(start + heading.length)
    .split("\n")
    .map((line) => line.replace(/^ {2}/, ""))
    .join("\n");
  writeFileSync(`${site}/${component}.example.html`, markup);
  writeFileSync(`${site}/${component === "tabs" ? "add-output" : `add-${component}-output`}.txt`, output);
}
