// Type-level tests for @primitiv-ui/web/svelte. Svelte markup has no
// expect-error comment, so this runs svelte-check once and reads its machine
// output: every file under src/svelte-types/invalid must report at least one
// error, and nothing else may report any.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const invalidDir = join("src", "svelte-types", "invalid");
const expected = readdirSync(invalidDir).map((name) => join(invalidDir, name));

const run = spawnSync(
  "npx",
  ["svelte-check", "--tsconfig", "./tsconfig.svelte.json", "--output", "machine", "--fail-on-warnings"],
  { encoding: "utf8" },
);
const errors = run.stdout
  .split("\n")
  .map((line) => line.split(" "))
  .filter(([, kind]) => kind === "ERROR" || kind === "WARNING")
  .map(([, kind, file, ...rest]) => ({ kind, file: JSON.parse(file), message: rest.join(" ") }));

const failures = [];
for (const file of expected) {
  if (!errors.some((error) => error.file === file)) failures.push(`${file}: expected a type error, got none`);
}
for (const error of errors) {
  if (!expected.includes(error.file)) failures.push(`${error.file}: ${error.kind} ${error.message}`);
}
if (!run.stdout.includes("COMPLETED")) failures.push(`svelte-check did not complete:\n${run.stdout}${run.stderr}`);

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`svelte typings: ${expected.length} expected errors, no others`);
