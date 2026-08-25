"use client";

// `code-block` reuses the Tabs COMPONENT's `.primitiv-tabs__*` classes for the
// look, and used to leave loading that sheet to whoever imported it — so this
// file carried an explicit `tabs/styles.css` import. `code-block.tsx` now
// declares that dependency itself (`import "./tabs"`), so the workaround is gone.
import { CodeBlock } from "@/components/code-block";

const MANAGERS = [
  { value: "npm", run: "npm i", exec: "npx" },
  { value: "pnpm", run: "pnpm add", exec: "pnpm dlx" },
  { value: "yarn", run: "yarn add", exec: "yarn dlx" },
  { value: "bun", run: "bun add", exec: "bunx" },
] as const;

/**
 * The npm/pnpm/yarn/bun install block from the design.
 *
 * Composed from `CodeBlock`'s compound parts rather than four separate blocks:
 * `CodeBlock.Tabs` wraps the headless `Tabs` primitive, so tab behaviour
 * (roving focus, arrow keys, the WAI-ARIA tablist roles) comes for free, and a
 * single `CodeBlock.Copy` copies whichever panel is active.
 *
 * `kind` decides which command shape each manager gets — installing a package
 * and one-off-executing a binary are different commands per manager (`npm i` vs
 * `npx`, `pnpm add` vs `pnpm dlx`), which is exactly the sort of detail a
 * hand-written block gets wrong for three of the four.
 */
export const InstallTabs = ({
  kind,
  target,
}: {
  kind: "install" | "exec";
  target: string;
}) => (
  <CodeBlock.Tabs size="sm" defaultValue="npm">
    <CodeBlock.Header>
      {/* A tablist must be named — CodeBlock.List enforces `label` XOR
          `ariaLabelledBy` in its type, so this cannot be forgotten. */}
      <CodeBlock.List label="Package manager">
        {MANAGERS.map((m) => (
          <CodeBlock.Trigger key={m.value} value={m.value}>
            {m.value}
          </CodeBlock.Trigger>
        ))}
      </CodeBlock.List>
      <CodeBlock.Copy />
    </CodeBlock.Header>

    {MANAGERS.map((m) => (
      <CodeBlock.Content
        key={m.value}
        value={m.value}
        language="bash"
        code={`${kind === "install" ? m.run : m.exec} ${target}`}
      />
    ))}
  </CodeBlock.Tabs>
);
