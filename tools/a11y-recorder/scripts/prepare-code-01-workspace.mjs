/*
 * Builds the workspace CODE-01 is recorded in.
 *
 * The recording happens inside a real VS Code (code-server), so the "project"
 * on screen has to be a real project: `primitiv init` has already run, and
 * `add button` deliberately has NOT — the command in the integrated terminal is
 * what writes the files, on camera. Nothing in the frame is staged except the
 * fact that someone decided to type.
 *
 * It also builds the live preview the editor sits beside: a page that imports
 * the WORKSPACE's copy of `button/styles.css`, so beat 4's edit is what makes
 * the button grow. Not a mock-up that happens to change at the same moment.
 *
 * Usage: node tools/a11y-recorder/scripts/prepare-code-01-workspace.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const REPO = join(ROOT, "..", "..");
const CLI = join(REPO, "target", "release", "primitiv");

/** Rebuilt each run so the terminal shows the CLI as it is now, not as it was. */
export const WORKSPACE = join(ROOT, "out", "code-01-workspace");

console.log("building the CLI…");
execFileSync("cargo", ["build", "-p", "primitiv-cli", "--release"], { cwd: REPO, stdio: "inherit" });

rmSync(WORKSPACE, { recursive: true, force: true });
mkdirSync(join(WORKSPACE, "src"), { recursive: true });

writeFileSync(
  join(WORKSPACE, "package.json"),
  JSON.stringify(
    { name: "acme-app", private: true, version: "0.1.0", type: "module" },
    null,
    2,
  ) + "\n",
);

// A little real code, so the explorer is not an empty tree and the project
// reads as one someone is actually working in.
writeFileSync(
  join(WORKSPACE, "src", "App.tsx"),
  `import { Button } from "./components/button";\n\nexport function App() {\n  return <Button variant="primary">Create account</Button>;\n}\n`,
);

console.log("running primitiv init…");
execFileSync(CLI, ["init", "--yes"], { cwd: WORKSPACE, stdio: "pipe" });

/*
 * The packages `add` will ensure are installed FIRST, deliberately.
 *
 * `add` still runs its install step on camera — nothing is stubbed — but
 * against a project that already has its dependencies it completes in a moment
 * instead of stalling the recording for ten seconds on a cold npm fetch. That
 * is also the honest case: a project someone is adding a component to is a
 * project that already has node_modules.
 */
console.log("pre-installing the workspace's dependencies…");
execFileSync(
  "npm",
  ["install", "--silent", "@primitiv-ui/react", "class-variance-authority", "react", "react-dom"],
  { cwd: WORKSPACE, stdio: "pipe" },
);

// VS Code settings that only affect presentation: a readable font at the
// delivered size, and the chrome trimmed to what a reader needs to recognise
// the app. The theme is left at the shipped default — dressing VS Code up in
// Primitiv's colours would be the recreation trap in reverse.
mkdirSync(join(WORKSPACE, ".vscode"), { recursive: true });
writeFileSync(
  join(WORKSPACE, ".vscode", "settings.json"),
  JSON.stringify(
    {
      /* Dark only. A terminal and an editor are dark surfaces in nearly every
         real setup, and a light-mode IDE reads as a screenshot of a
         configuration almost nobody uses. */
      "workbench.colorTheme": "Default Dark Modern",
      "editor.fontSize": 15,
      "editor.lineHeight": 1.6,
      "editor.minimap.enabled": false,
      "editor.renderWhitespace": "none",
      "editor.cursorBlinking": "solid",
      "editor.stickyScroll.enabled": false,
      /* Wrapping was tried and made it worse: at this width every line broke
         two or three times and the file became unreadable. The fix for the
         sideways scroll is a wider editor — fewer panes — not wrapping. */
      "editor.wordWrap": "off",
      "breadcrumbs.enabled": false,
      "terminal.integrated.fontSize": 14,
      /* A bare shell with a short prompt. `--norc` is what lets PS1 come from
         the environment, and without it the frame shows this tool's own
         absolute path instead of a project someone might plausibly be in. */
      "terminal.integrated.profiles.linux": {
        demo: { path: "bash", args: ["--norc", "--noprofile"], env: { PS1: "~/acme-app $ " } },
      },
      "terminal.integrated.defaultProfile.linux": "demo",
      "terminal.integrated.shellIntegration.enabled": false,
      "workbench.startupEditor": "none",
      "workbench.tips.enabled": false,
      "explorer.compactFolders": false,
      "window.commandCenter": false,
      "workbench.layoutControl.enabled": false,
      /* The chat panel is a default of this VS Code build and has nothing to do
         with the claim being made. */
      "chat.commandCenter.enabled": false,
      "workbench.secondarySideBar.defaultVisibility": "hidden",
      /* 1200px has to hold an editor, a terminal and a live preview. The
         activity bar is the first thing to go: it is recognisable chrome, but
         it is chrome nobody needs to see to believe this is VS Code. */
      "workbench.activityBar.location": "hidden",
      "files.exclude": { "**/node_modules": true, "**/package-lock.json": true },
    },
    null,
    2,
  ) + "\n",
);

console.log(`workspace ready: ${WORKSPACE}`);
