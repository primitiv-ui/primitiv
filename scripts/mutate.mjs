#!/usr/bin/env node
// Scoped mutation run: sets STRYKER_COMPONENT and invokes Stryker in the target
// package. Backs the `mutate:component` package script in both
// packages/react and packages/core.
//
//   pnpm --filter @primitiv-ui/react mutate:component Button
//   pnpm --filter @primitiv-ui/core  mutate:component Button
//   node scripts/mutate.mjs Button            # defaults to packages/react
//   node scripts/mutate.mjs Button core       # packages/core
import { spawnSync } from "node:child_process";
import { delimiter, sep } from "node:path";
import { fileURLToPath } from "node:url";

const component = process.argv[2];

// A component's logic is split across packages — the framework-agnostic half in
// core, the adapter half in react — and each half carries its own 100% gate, so
// the runner needs to know which one to mutate. Run through a package script
// (`pnpm --filter @primitiv-ui/core mutate:component Button`) the cwd already
// says which; an explicit second argument covers a direct `node` invocation
// from anywhere else.
const packagesDir = fileURLToPath(new URL("../packages/", import.meta.url));
const cwdPackage = process.cwd().startsWith(packagesDir)
  ? process.cwd().slice(packagesDir.length).split(sep)[0]
  : undefined;
const pkg = process.argv[3] ?? cwdPackage ?? "react";

if (!component) {
  console.error(
    "Usage: mutate:component <Component> [package]  (e.g. Button, or Button core)",
  );
  process.exit(1);
}

const packageDir = fileURLToPath(
  new URL(`../packages/${pkg}/`, import.meta.url),
);
const binDir = fileURLToPath(
  new URL(`../packages/${pkg}/node_modules/.bin`, import.meta.url),
);

// Prepend the package's local .bin so `stryker` resolves whether this is run
// via pnpm (which already sets PATH) or directly with `node`.
const result = spawnSync("stryker", ["run"], {
  cwd: packageDir,
  stdio: "inherit",
  env: {
    ...process.env,
    STRYKER_COMPONENT: component,
    PATH: `${binDir}${delimiter}${process.env.PATH ?? ""}`,
  },
});

process.exit(result.status ?? 1);
