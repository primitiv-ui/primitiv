"use client";

import type { CSSProperties, ReactNode } from "react";

import { Spacer } from "@/components/spacer";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Spacer", componentId: "spacer", registryOnly: true });

/* A bordered flex row so the Spacer's effect — pushing its siblings to the two
   ends — is legible. Demo chrome; the snippets show a plain flex `<div>`. */
const bar: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  width: "100%",
  padding: "var(--primitiv-space-space-8) var(--primitiv-space-space-12)",
  border: "var(--primitiv-border-width-1) solid var(--primitiv-border-subtle)",
  borderRadius: "var(--primitiv-radii-8)",
};
const chip: CSSProperties = {
  padding: "var(--primitiv-space-space-4) var(--primitiv-space-space-8)",
  background: "var(--primitiv-surface-raised)",
  borderRadius: "var(--primitiv-radii-8)",
  color: "var(--primitiv-content-secondary)",
  whiteSpace: "nowrap",
};
const Chip = ({ children }: { children: ReactNode }) => (
  <div style={chip}>{children}</div>
);

/**
 * Spacer's page content.
 *
 * Registry-only and prop-less — a `flex: 1 0 0` blank element, so there is
 * nothing to configure and the playground has no controls. Its whole job is
 * shown by composition: drop one between flex siblings and it eats the free
 * space, pushing them apart.
 */
export const spacerSpec: ComponentSpec = {
  playground: {
    component: "Spacer",
    fill: true,
    snippet: (_values, mode) =>
      [
        imports(mode),
        ``,
        `<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>`,
        `  <strong>Members</strong>`,
        `  <Spacer />`,
        `  <button>Invite</button>`,
        `</div>`,
      ].join("\n"),
    render: () => (
      <div style={bar}>
        <strong style={{ color: "var(--primitiv-content-primary)" }}>Members</strong>
        <Spacer />
        <Chip>Invite</Chip>
      </div>
    ),
  },

  examples: [
    {
      id: "push-apart",
      title: "Push two groups apart",
      render: () => (
        <InteractiveExample
          caption={"The core use: one `Spacer` between two groups in a flex row soaks up all the free space, so the first group sits at the start and the second at the end. It is `flex: 1 0 0` — a blank, flexible element — which is exactly what a `justify=\"between\"` cannot do once you have *three* groups that should not spread evenly."}
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>`,
              `  <strong>Project Atlas</strong>`,
              `  <Spacer />`,
              `  <button>Share</button>`,
              `  <button>Settings</button>`,
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={bar}>
              <strong style={{ color: "var(--primitiv-content-primary)" }}>
                Project Atlas
              </strong>
              <Spacer />
              <Chip>Share</Chip>
              <Chip>Settings</Chip>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "distribute",
      title: "Isolate the middle group",
      render: () => (
        <InteractiveExample
          caption={"Two Spacers, one on each side of a group, centre that group while the outer items stay pinned to the edges — a navbar with a brand on the left, nav in the middle, and actions on the right. Equal `Spacer`s share the leftover space equally, which `justify` alone cannot express when the groups are different widths."}
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>`,
              `  <strong>Primitiv</strong>`,
              `  <Spacer />`,
              `  <nav>Docs · Components</nav>`,
              `  <Spacer />`,
              `  <button>Sign in</button>`,
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={bar}>
              <strong style={{ color: "var(--primitiv-content-primary)" }}>
                Primitiv
              </strong>
              <Spacer />
              <Chip>Docs · Components</Chip>
              <Spacer />
              <Chip>Sign in</Chip>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "Spacer defaults to `aria-hidden=\"true\"` — it is a blank layout element with no content, so it is correctly absent from the accessibility tree. Pass `aria-hidden={false}` only if you have given it a role and content, which is not its intended use.",
    "It carries no focusable behaviour and no semantics: it is a spacing device, so a screen reader passes straight over it to the real controls on either side.",
    "It only does anything inside a flex container — `flex: 1 0 0` needs a flex parent to grow into. In a block or grid context it collapses to nothing, which is a layout no-op rather than an accessibility problem.",
  ],
};
