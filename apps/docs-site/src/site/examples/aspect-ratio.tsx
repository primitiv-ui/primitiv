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
   the ratio changes; the box is centred in the preview.
   `maxInlineSize` caps that fixed width at the column: the preview is ~284px on
   a phone, so 16rem fits but the 20rem and 22rem overrides below did not, and
   the demo overflowed its card. Capping changes nothing on desktop. */
const frameBase: CSSProperties = {
  inlineSize: "16rem",
  maxInlineSize: "100%",
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

/** The preview's labelled frame, as an HTML style value. */
const FRAME_STYLE =
  "inline-size: 16rem; max-inline-size: 100%; display: grid; place-content: center; background: var(--primitiv-surface-raised); border: var(--primitiv-border-width-1) solid var(--primitiv-border-subtle); border-radius: var(--primitiv-radii-8); color: var(--primitiv-content-secondary); overflow: hidden";

const ratioClass = (ratio: string) => `primitiv-aspect-ratio--${ratio.replace("/", "-")}`;

/** A frame around one image, the way the copied markup reads. */
const ratioHtml = (ratio: string | null, img: string, style = "") =>
  [
    `<div class="primitiv-aspect-ratio${ratio ? ` ${ratioClass(ratio)}` : ""}"${style ? ` style="${style}"` : ""}>`,
    `  <div class="primitiv-aspect-ratio__content">${img}</div>`,
    `</div>`,
  ].join("\n");

/**
 * The preview has no images to show, so each frame's `<img>` becomes the label
 * the React preview prints, and the frame gets the demo chrome. `width`
 * overrides the frame's inline size.
 */
const elementsDemo = (code: string, width?: string) =>
  code
    .replace(/<img[^>]*>/g, (_img) => "")
    .replace(
      /<div class="primitiv-aspect-ratio( primitiv-aspect-ratio--(\d+)-(\d+))?"( style="([^"]*)")?>\n  <div class="primitiv-aspect-ratio__content"><\/div>/g,
      (_m, cls = "", a?: string, b?: string, _s?: string, own = "") =>
        `<div class="primitiv-aspect-ratio${cls}" style="${FRAME_STYLE}${width ? `; inline-size: ${width}` : ""}${own ? `; ${own}` : ""}">\n  <div class="primitiv-aspect-ratio__content" style="display: grid; place-content: center">${a ? `${a} / ${b}` : "5 / 2"}</div>`,
    );

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
      mode === "elements"
        ? ratioHtml(values.ratio, `<img src="cover.jpg" alt="">`)
        : [
        imports(mode),
        ``,
        `<AspectRatio ratio="${values.ratio}">`,
        `  <img src="/cover.jpg" alt="" />`,
        `</AspectRatio>`,
      ].join("\n"),
    elementsPreview: (code) => elementsDemo(code),
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
          elementsCaption={"The usual job: wrap an image or video so it holds a shape while the column around it resizes — no layout shift as it loads, because the box already has its height. `--16-9` for video, `--1-1` for an avatar or thumbnail. The `__content` wrapper fills the frame; give an `<img>` `object-fit: cover` so it crops rather than distorts."}
          elementsPreview={(_density, code) => elementsDemo(code, "20rem")}
          code={(_density, mode) =>
            mode === "elements"
              ? ratioHtml(
                  "16/9",
                  `<img src="cover.jpg" alt="Team offsite" style="inline-size: 100%; block-size: 100%; object-fit: cover">`,
                )
              : [
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
          elementsCaption={"The presets come in both orientations — `4-3`, `3-2`, `16-9`, `21-9` landscape and their inverses `3-4`, `2-3`, `9-16` portrait — so a card grid can hold a consistent shape whichever way the source is oriented. They are a closed set of modifier classes, so they need no inline style."}
          elementsPreview={(_density, code) =>
            `<div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start">${elementsDemo(code, "7rem")}</div>`
          }
          code={(_density, mode) =>
            mode === "elements"
              ? ["1/1", "4/3", "9/16"]
                  .map((r) => ratioHtml(r, `<img src="photo.jpg" alt="">`))
                  .join("\n")
              : [
              imports(mode),
              ``,
              `<AspectRatio ratio="1/1">{/* square */}</AspectRatio>`,
              `<AspectRatio ratio="4/3">{/* classic landscape */}</AspectRatio>`,
              `<AspectRatio ratio="9/16">{/* portrait / stories */}</AspectRatio>`,
            ].join("\n")
          }
        >
          {() => (
            /* `flexWrap`, or the three 7rem frames run 368px wide in a 284px
               preview. They are being compared side by side, and a wrapped row
               still compares them. */
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                alignItems: "flex-start",
              }}
            >
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
          elementsCaption={"The presets are the common cases, not a limit. For a bespoke ratio, set `--primitiv-aspect-ratio` yourself — the modifier classes only ever set that one custom property, so overriding it is the supported escape hatch rather than a fork."}
          elementsPreview={(_density, code) => elementsDemo(code, "22rem")}
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  `<!-- 5 : 2 banner — override the one custom property. -->`,
                  ratioHtml(null, `<img src="banner.jpg" alt="">`, "--primitiv-aspect-ratio: 5 / 2"),
                ].join("\n")
              : [
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

  elements: {
    description:
      "A box held to a width-to-height ratio: `primitiv-aspect-ratio`, a ratio modifier, and a `primitiv-aspect-ratio__content` wrapper that fills it — usually around an `<img>` or `<video>`.",
    accessibility: [
      "The classes add no semantics — they shape the box, and the child inside carries the meaning. An image inside still needs its own `alt`.",
      "It prevents layout shift: the box reserves its height from the ratio before the image loads, so the content below does not jump.",
      "Nothing here is interactive or focusable, so it adds no keyboard or ARIA surface of its own.",
    ],
  },

  accessibility: [
    "AspectRatio is a plain `<div>` with no semantics of its own — it shapes the box, and the child inside it carries the meaning. An image inside still needs its own `alt`.",
    "It prevents layout shift: because the box reserves its height from the ratio before the image loads, the content below it does not jump — a real accessibility win for anyone who has started reading when the image arrives.",
    "Nothing here is interactive or focusable; it is a presentational wrapper, so it adds no keyboard or ARIA surface of its own.",
  ],
};
