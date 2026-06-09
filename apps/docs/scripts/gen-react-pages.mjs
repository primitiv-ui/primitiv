// Regenerates the React docs pages from source READMEs + workbench examples.
//
// Why generate instead of using live <!--@include-->: VitePress compiles every
// page through the Vue template compiler, so stray angle brackets in README
// *prose* (e.g. "Connected to: <page name>") are read as unclosed HTML tags and
// fail the build. Editing 38 consumer-facing READMEs to escape them would be
// invasive, so we inline a sanitized copy here instead. README content stays
// the single source of truth; CI runs this script before building, so pages are
// always fresh.
//
// Run with: pnpm --filter @primitiv-ui/docs gen:react
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const reactDir = resolve(here, "../react");

const { reactComponents, slugFor } = await import(
  pathToFileURL(resolve(here, "../.vitepress/components.mjs")).href
);

mkdirSync(reactDir, { recursive: true });

/**
 * Escape stray `<` in markdown prose so the Vue compiler doesn't treat it as a
 * tag, while leaving fenced code, inline code, and intentional <kbd> intact.
 */
function sanitize(markdown) {
  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      // Split out inline code spans (`...`) and only escape the prose pieces.
      return line
        .split(/(`[^`]*`)/)
        .map((part) =>
          part.startsWith("`")
            ? part
            : part.replace(/<(?!\/?kbd>)/g, "&lt;"),
        )
        .join("");
    })
    .join("\n");
}

function readReadme(relPath) {
  return sanitize(readFileSync(resolve(root, relPath), "utf8").trimEnd());
}

// Per-component pages: sanitized README + the workbench example source.
for (const { name } of reactComponents) {
  const slug = slugFor(name);
  const page = `---
title: ${name}
---

${readReadme(`packages/react/src/${name}/README.md`)}

## Workbench example

Open the interactive version in the [workbench](/workbench/#/${slug}). Its source:

<<< ../../../apps/workbench/src/pages/${name}Example/${name}Example.tsx
`;
  writeFileSync(resolve(reactDir, `${slug}.md`), page);
}

// Package pages sourced from their READMEs.
writeFileSync(
  resolve(reactDir, "icons.md"),
  `---\ntitle: Icons\n---\n\n${readReadme("packages/icons/README.md")}\n`,
);
writeFileSync(
  resolve(reactDir, "tokens.md"),
  `---\ntitle: Tokens\n---\n\n${readReadme("packages/tokens/README.md")}\n`,
);

// Grouped overview page, mirroring packages/react/README.md ordering.
const groups = [];
const byGroup = new Map();
for (const { name, group } of reactComponents) {
  if (!byGroup.has(group)) {
    byGroup.set(group, []);
    groups.push(group);
  }
  byGroup.get(group).push(name);
}
const overview = `---
title: React components
---

# React components

\`@primitiv-ui/react\` is a headless component library: accessible behaviour,
keyboard support and ARIA wiring with **zero styles shipped**. Bring your own
design system. Every component below has its own page (README + a runnable
workbench example).

${groups
  .map(
    (group) =>
      `## ${group}\n\n${byGroup
        .get(group)
        .map((n) => `- [${n}](/react/${slugFor(n)})`)
        .join("\n")}`,
  )
  .join("\n\n")}

## Packages

- [Icons](/react/icons) — \`@primitiv-ui/icons\`
- [Tokens](/react/tokens) — \`@primitiv-ui/tokens\`
`;
writeFileSync(resolve(reactDir, "index.md"), overview);

console.log(
  `Generated ${reactComponents.length} component pages + overview, icons, tokens.`,
);
