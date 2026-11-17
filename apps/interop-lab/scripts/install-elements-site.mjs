// Installs Tabs, Accordion, Carousel, Collapsible, Modal, ConfirmDialog, Drawer, Popover, Tooltip, Dropdown, Context Menu, Toggle Group, Segmented Control, Radio Card, Checkbox Card, Slider, Breadcrumb Overflow, Split Button, Listbox, Select, Combobox, Navigation Menu, Tree, Stepper, Miller Columns, Data Table and Code Block with the real CLI into a plain HTML site, the way a consumer
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
for (const component of ["tabs", "accordion", "carousel", "collapsible", "modal", "confirm-dialog", "drawer", "popover", "tooltip", "dropdown", "context-menu", "toggle-group", "segmented-control", "radio-card", "checkbox-card", "slider", "breadcrumb-overflow", "split-button", "listbox", "select", "combobox", "navigation-menu", "tree", "stepper", "miller-columns", "data-table", "code-block"]) {
  const output = primitiv("add", component);
  const heading = `Example markup for ${component}:\n\n`;
  const start = output.indexOf(heading);
  if (start === -1) throw new Error(`add printed no example markup for ${component}:\n${output}`);
  // A composite also prints its dependencies' examples after its own: stop at
  // the next one.
  const rest = output.slice(start + heading.length);
  const next = rest.indexOf("\nExample markup for ");
  // Pasted exactly as printed: the indent is harmless in markup, and a <pre>'s
  // lines are printed without it, so stripping two spaces a line would eat code.
  const markup = next === -1 ? rest : rest.slice(0, next + 1);
  writeFileSync(`${site}/${component}.example.html`, markup);
  writeFileSync(`${site}/${component === "tabs" ? "add-output" : `add-${component}-output`}.txt`, output);
}
