"use client";

import type { CSSProperties } from "react";

import { Box } from "@/components/box";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

/**
 * The Box import.
 *
 * Box is registry-only (RFC 0022): there is no `@primitiv-ui/react` primitive
 * behind it, so `registryOnly` makes the import the copied path in both modes —
 * naming `@primitiv-ui/react` under Headless would point at a symbol that does
 * not exist there.
 */
const imports = (mode: Mode) =>
  importBlock({ mode, component: "Box", componentId: "box", registryOnly: true });

/* A demonstrative author style — Box itself paints nothing (it ships only
   `box-sizing: border-box`), so the preview supplies a dashed outline and
   padding to make the otherwise-invisible element visible. Kept as a constant
   so the snippet below stays in exact parity with what renders. */
const demoBox: CSSProperties = {
  padding: "var(--primitiv-space-space-16)",
  border: "1px dashed var(--primitiv-border-default)",
  borderRadius: "var(--primitiv-radii-8)",
};

/* The token-scoping example: re-point a design token on the Box, and every
   descendant that resolves it picks up the new value. */
const scopedToken = {
  "--primitiv-space-space-16": "2.5rem",
} as CSSProperties;
const scopedChild: CSSProperties = {
  padding: "var(--primitiv-space-space-16)",
  background: "var(--primitiv-surface-raised)",
  borderRadius: "var(--primitiv-radii-8)",
};

/**
 * Box's page content.
 *
 * The escape hatch, and deliberately the sparsest page in the set: no modifiers,
 * no custom properties, no keyboard model, no anatomy — a single bare element
 * whose only prop is `asChild`. What the examples carry is the *why*: it exists
 * so a one-off style, a scoped token, or a semantic element has somewhere to
 * land that is not a raw `<div>`.
 */
export const boxSpec: ComponentSpec = {
  playground: {
    component: "Box",
    fill: true,
    /* No controls: Box has no modifiers to vary. The preview is a Box carrying
       an author style so it is visible; the custom snippet shows that same
       style, since the generated `<Box />` would render nothing on screen. */
    snippet: (_values, mode) =>
      [
        imports(mode),
        ``,
        `<Box`,
        `  style={{`,
        `    padding: "var(--primitiv-space-space-16)",`,
        `    border: "1px dashed var(--primitiv-border-default)",`,
        `    borderRadius: "var(--primitiv-radii-8)",`,
        `  }}`,
        `>`,
        `  A plain box you style yourself`,
        `</Box>`,
      ].join("\n"),
    render: () => <Box style={demoBox}>A plain box you style yourself</Box>,
  },

  examples: [
    {
      id: "as-child",
      title: "As your own element",
      render: () => (
        <InteractiveExample
          caption={"`asChild` renders the child element instead of a wrapping `<div>`, merging Box onto it. Reach for it when the wrapper should carry meaning — a `<section>`, `<article>` or `<nav>` — so you get a real landmark rather than an anonymous `<div>` that adds nothing to the accessibility tree."}
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<Box asChild>`,
              `  <section aria-label="Account summary">{/* ... */}</section>`,
              `</Box>`,
            ].join("\n")
          }
        >
          {() => (
            <Box asChild>
              <section aria-label="Account summary" style={demoBox}>
                A real &lt;section&gt; landmark
              </section>
            </Box>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "scoping-a-token",
      title: "Scoping a design token",
      render: () => (
        <InteractiveExample
          caption={"Because a design token is a CSS custom property, setting one on a `Box` re-points it for everything inside — the token cascades, so descendants that resolve `--primitiv-space-space-16` inherit the new value here without prop-drilling. This is the canonical Box use: a subtree-scoped override with somewhere to attach it that is not a raw `<div>`."}
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<Box style={{ "--primitiv-space-space-16": "2.5rem" }}>`,
              `  {/* Descendants resolving the token pick up the scoped value. */}`,
              `  <article style={{ padding: "var(--primitiv-space-space-16)" }}>`,
              `    {/* ... */}`,
              `  </article>`,
              `</Box>`,
            ].join("\n")
          }
        >
          {() => (
            <Box style={scopedToken}>
              <article style={scopedChild}>
                Padded by the token this Box re-points.
              </article>
            </Box>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "Box renders a plain `<div>` with no role, label or semantics of its own — correct for a pure styling wrapper, which should be invisible to assistive tech.",
    "When the wrapper *should* mean something, use `asChild` to render a real element (`<section>`, `<nav>`, `<article>`) rather than nesting a bare `<div>`: a landmark a screen-reader user can navigate to beats an anonymous box.",
    "Any `role` or `aria-*` you pass forwards to the rendered element — Box adds none of its own, so it never fights or duplicates the semantics you give it.",
  ],
};
