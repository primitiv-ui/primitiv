// Installs Tabs with the real CLI into a plain HTML site, the way a consumer
// would (RFC 0033 §8): `primitiv init`, then `primitiv add tabs`, in a folder
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
const output = primitiv("add", "tabs");

const heading = "Example markup for tabs:\n\n";
const start = output.indexOf(heading);
if (start === -1) throw new Error(`add printed no example markup for tabs:\n${output}`);
// The printed block is indented two spaces; the page gets it as written.
const markup = output
  .slice(start + heading.length)
  .split("\n")
  .map((line) => line.replace(/^ {2}/, ""))
  .join("\n");
writeFileSync(`${site}/tabs.example.html`, markup);
writeFileSync(`${site}/add-output.txt`, output);
