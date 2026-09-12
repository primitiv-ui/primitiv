#!/usr/bin/env node
/*
 * Lists the unresolved publication gates on the content pages.
 *
 *   pnpm gates
 *
 * §6.0.4 drew these into the Figma frames rather than leaving them in a doc, so
 * they travel with the page they constrain. They are addressed to whoever builds
 * the page, so the site renders them nowhere — which is exactly why they need a
 * command: an invisible gate that nobody can list is not a gate.
 *
 * The gates live in their own generated file rather than in the site's page
 * data: an unrendered gate block still ships in the serialized payload a client
 * component receives, so "do not ship this page" would sit in view-source of the
 * page it forbids. Nothing under src/site imports this file.
 *
 * Reporting only, exit 0. A gate that fails the build gets disabled the first
 * time it is inconvenient; the point is that a deploy is a deliberate act and
 * this is what you read before making one.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const gates = JSON.parse(
  readFileSync(resolve(here, "../src/content/gates.generated.json"), "utf8"),
);

if (gates.length === 0) {
  console.log("No open publication gates.");
} else {
  console.log(`${gates.length} open publication gate(s):\n`);
  for (const gate of gates) {
    const withheld = gate.withheld ? ` — withholding ${gate.withheld} block(s)` : "";
    console.log(`  ${gate.page}  [${gate.marker}]${withheld}`);
    console.log(`    ${gate.text}\n`);
  }
}
