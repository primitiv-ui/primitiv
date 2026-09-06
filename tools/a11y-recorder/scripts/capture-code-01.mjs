/*
 * Captures the artefacts CODE-01 shows, by running the real CLI.
 *
 * The brief is explicit that the file and the output must be genuine — "do not
 * invent plausible-looking code, a developer will read it" — so nothing here is
 * transcribed. It builds `primitiv`, creates a throwaway project, runs `init`
 * and `add button`, and writes what came back to `src/generated/code-01.json`.
 * Re-run it whenever the CLI's output or the registry's button changes; the
 * scene reads the JSON and never carries a copy of its own.
 *
 * Usage: node tools/a11y-recorder/scripts/capture-code-01.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const REPO = join(ROOT, "..", "..");
const CLI = join(REPO, "target", "release", "primitiv");

/** The command beat 1 types. `npx` is what a reader would actually run. */
const COMMAND = "npx primitiv add button";

/** The stylesheet region beat 3 opens on, and the declaration beat 4 edits. */
const EXCERPT_FROM = "/* Per-component API";
const EDIT_TARGET = "--primitiv-button-padding-inline:";

console.log("building the CLI…");
execFileSync("cargo", ["build", "-p", "primitiv-cli", "--release"], { cwd: REPO, stdio: "inherit" });

const project = mkdtempSync(join(tmpdir(), "primitiv-code-01-"));
try {
  mkdirSync(join(project, "src"), { recursive: true });
  writeFileSync(
    join(project, "package.json"),
    JSON.stringify({ name: "app", private: true, type: "module" }, null, 2) + "\n",
  );
  execFileSync(CLI, ["init", "--yes"], { cwd: project, stdio: "pipe" });

  // Only `add`'s own stdout is captured. Its stderr is the package manager's,
  // and the illustration is not about installing anything.
  const output = execFileSync(CLI, ["add", "button"], { cwd: project, encoding: "utf8" });

  const stylesheet = readFileSync(
    join(project, "src", "styles", "primitiv", "button", "styles.css"),
    "utf8",
  );
  const lines = stylesheet.split("\n");
  const start = lines.findIndex((line) => line.includes(EXCERPT_FROM));
  if (start < 0) throw new Error(`the stylesheet no longer contains ${EXCERPT_FROM}`);
  // The pane holds about 22 lines at the rendered size. Starting at the
  // per-component API block puts the padding declaration in view without any
  // scrolling, which beat 4 needs.
  const excerpt = lines.slice(start, start + 22);
  const editLine = excerpt.findIndex((line) => line.includes(EDIT_TARGET));
  if (editLine < 0) throw new Error(`${EDIT_TARGET} is not inside the excerpt`);

  writeFileSync(
    join(ROOT, "src", "generated", "code-01.json"),
    JSON.stringify(
      {
        command: COMMAND,
        // Trailing blank lines would render as empty terminal rows.
        output: output.replace(/\n+$/, "").split("\n"),
        file: "src/styles/primitiv/button/styles.css",
        excerpt,
        editLine,
        // What beat 4 replaces the declaration's value with. A literal, because
        // the point of the beat is that this is a plain CSS file you can put a
        // plain value in — not another token to look up.
        editFrom: "var(--primitiv-framed-control-md-padding-inline)",
        editTo: "2.5rem",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`captured ${output.split("\n").length} output lines and ${excerpt.length} file lines`);
} finally {
  rmSync(project, { recursive: true, force: true });
}
