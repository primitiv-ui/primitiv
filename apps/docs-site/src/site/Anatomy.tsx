"use client";

import { CodeBlock } from "@/components/code-block";

/*
 * Same undeclared dependency `InstallTabs` documents: `code-block` styles its
 * tabs with the TABS component's classes but imports only its own sheet.
 * Registry-bugs §3.
 */
import "@/styles/primitiv/tabs/styles.css";

/**
 * The "Anatomy" section's body — the part tree, one tab per render path.
 *
 * A tabbed block rather than two stacked ones, per the Figma frame. The tabs are
 * doing real work here: the two trees are meant to be COMPARED (five of Select's
 * nine parts render nothing under `native`), and a comparison reads better when
 * the alternative occupies the same space than when it sits 300px further down.
 *
 * Single-path components pass one entry and get a plain block with no tablist,
 * because a tablist with one tab is a control that cannot do anything.
 */
export const Anatomy = ({
  paths,
}: {
  paths: readonly { readonly label: string; readonly code: string }[];
}) => {
  if (paths.length === 1) {
    return <CodeBlock code={paths[0].code} language="tsx" size="sm" />;
  }

  return (
    <CodeBlock.Tabs size="sm" defaultValue={paths[0].label}>
      <CodeBlock.Header>
        {/* `label` (not `ariaLabelledBy`) — the section's own h2 says "Anatomy",
            which names the section rather than what these tabs switch. */}
        <CodeBlock.List label="Render path">
          {paths.map((p) => (
            <CodeBlock.Trigger key={p.label} value={p.label}>
              {p.label}
            </CodeBlock.Trigger>
          ))}
        </CodeBlock.List>
        <CodeBlock.Copy />
      </CodeBlock.Header>

      {paths.map((p) => (
        <CodeBlock.Content
          key={p.label}
          value={p.label}
          language="tsx"
          code={p.code}
        />
      ))}
    </CodeBlock.Tabs>
  );
};
