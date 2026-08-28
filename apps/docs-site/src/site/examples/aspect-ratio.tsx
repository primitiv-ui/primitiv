"use client";

import type { CSSProperties } from "react";

import { AspectRatio } from "@/components/aspect-ratio";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Ratio = "1/1" | "4/3" | "3/2" | "16/9" | "21/9" | "3/4" | "2/3" | "9/16";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "AspectRatio", componentId: "aspect-ratio", registryOnly: true });

/* A filled, labelled box so the ratio is legible on its own — normally the child
   is an <img>/<video> that fills the frame. A fixed width so the HEIGHT is what
   the ratio changes; the box is centred in the preview. */
const frameBase: CSSProperties = {
  inlineSize: "16rem",
  display: "grid",
  /* `place-content`, not `place-items`: the box's single implicit row is
     auto-sized, so it sits at the top unless the TRACK is centred in the box. */
  placeContent: "center",
  background: "var(--primitiv-surface-raised)",
  border: "var(--primitiv-border-width-1) solid var(--primitiv-border-subtle)",
  borderRadius: "var(--primitiv-radii-8)",
  color: "var(--primitiv-content-secondary)",
  overflow: "hidden",
};

/* The custom-ratio example overrides the one custom property the modifier
   classes set. A cast, because a CSS custom property is not in `CSSProperties`. */
const customRatioFrame = {
  ...frameBase,
  inlineSize: "22rem",
  "--primitiv-aspect-ratio": "5 / 2",
} as CSSProperties;

/**
 * AspectRatio's page content.
 *
 * Registry-only, one modifier (`ratio`). It constrains its box to a
 * width-to-height ratio, so the child — usually an image or video — keeps its
 * shape as the column resizes. The playground fixes the width so the ratio is
 * what changes the height; the examples cover the curated presets and the
 * custom-ratio escape hatch.
 */
export const aspectRatioSpec: ComponentSpec = {
  playground: {
    component: "AspectRatio",
    snippet: (values, mode) =>
      [
        imports(mode),
        ``,
        `<AspectRatio ratio="${values.ratio}">`,
        `  <img src="/cover.jpg" alt="" />`,
        `</AspectRatio>`,
      ].join("\n"),
    render: (values) => (
      <AspectRatio ratio={values.ratio as Ratio} style={frameBase}>
        {values.ratio}
      </AspectRatio>
    ),
  },

  examples: [
    {
      id: "media",
      title: "Framing media",
      render: () => (
        <InteractiveExample
          caption={"The usual job: wrap an image or video so it holds a shape while the column around it resizes — no layout shift as it loads, because the box already has its height. `16/9` for video, `1/1` for an avatar or thumbnail. The child fills the frame; give an `<img>` `object-fit: cover` so it crops rather than distorts."}
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<AspectRatio ratio="16/9">`,
              `  <img`,
              `    src="/cover.jpg"`,
              `    alt="Team offsite"`,
              `    style={{ inlineSize: "100%", blockSize: "100%", objectFit: "cover" }}`,
              `  />`,
              `</AspectRatio>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ ...frameBase, inlineSize: "20rem" }}>
              <AspectRatio ratio="16/9" style={{ ...frameBase, inlineSize: "100%" }}>
                16 / 9
              </AspectRatio>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "presets",
      title: "Portrait and landscape",
      render: () => (
        <InteractiveExample
          caption={"The presets come in both orientations — `4/3`, `3/2`, `16/9`, `21/9` landscape and their inverses `3/4`, `2/3`, `9/16` portrait — so a card grid can hold a consistent shape whichever way the source is oriented. They are a closed set of modifier classes, which is what keeps them correct in server-rendered markup with no inline style."}
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<AspectRatio ratio="1/1">{/* square */}</AspectRatio>`,
              `<AspectRatio ratio="4/3">{/* classic landscape */}</AspectRatio>`,
              `<AspectRatio ratio="9/16">{/* portrait / stories */}</AspectRatio>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              {(["1/1", "4/3", "9/16"] as const).map((r) => (
                <AspectRatio
                  key={r}
                  ratio={r}
                  style={{ ...frameBase, inlineSize: "7rem" }}
                >
                  {r}
                </AspectRatio>
              ))}
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "custom",
      title: "A custom ratio",
      render: () => (
        <InteractiveExample
          caption={"The presets are the common cases, not a limit. For a bespoke ratio, set `--primitiv-aspect-ratio` in your own stylesheet — the modifier classes only ever set that one custom property, so overriding it is the supported escape hatch rather than a fork."}
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `{/* 5 : 2 banner — override the one custom property. */}`,
              `<AspectRatio style={{ "--primitiv-aspect-ratio": "5 / 2" }}>`,
              `  <img src="/banner.jpg" alt="" />`,
              `</AspectRatio>`,
            ].join("\n")
          }
        >
          {() => <AspectRatio style={customRatioFrame}>5 / 2</AspectRatio>}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "AspectRatio is a plain `<div>` with no semantics of its own — it shapes the box, and the child inside it carries the meaning. An image inside still needs its own `alt`.",
    "It prevents layout shift: because the box reserves its height from the ratio before the image loads, the content below it does not jump — a real accessibility win for anyone who has started reading when the image arrives.",
    "Nothing here is interactive or focusable; it is a presentational wrapper, so it adds no keyboard or ARIA surface of its own.",
  ],
};
