#!/usr/bin/env node
// Scoped mutation run: sets STRYKER_COMPONENT and invokes Stryker in
// packages/react. Backs the `mutate:component` package script.
//
//   pnpm --filter @primitiv-ui/react mutate:component Button
//   node scripts/mutate.mjs Button
import { spawnSync } from "node:child_process";
import { delimiter } from "node:path";
import { fileURLToPath } from "node:url";

const component = process.argv[2];
if (!component) {
  console.error("Usage: mutate:component <Component>  (e.g. Button)");
  process.exit(1);
}

const reactDir = fileURLToPath(new URL("../packages/react/", import.meta.url));
const binDir = fileURLToPath(
  new URL("../packages/react/node_modules/.bin", import.meta.url),
);

// Prepend the package's local .bin so `stryker` resolves whether this is run
// via pnpm (which already sets PATH) or directly with `node`.
const result = spawnSync("stryker", ["run"], {
  cwd: reactDir,
  stdio: "inherit",
  env: {
    ...process.env,
    STRYKER_COMPONENT: component,
    PATH: `${binDir}${delimiter}${process.env.PATH ?? ""}`,
  },
});

process.exit(result.status ?? 1);
