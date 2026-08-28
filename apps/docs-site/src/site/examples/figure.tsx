"use client";

import type { CSSProperties } from "react";

import { Figure } from "@/components/figure";
import { importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type CaptionPosition = "below" | "above" | "overlay";
type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Align = "start" | "center" | "end";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Figure", componentId: "figure", registryOnly: true });

/* A stand-in for the media — normally an <img>/<video>. A filled box with a
   fixed ratio so the caption positions read clearly. */
const media: CSSProperties = {
  aspectRatio: "16 / 9",
  display: "grid",
  placeContent: "center",
  background:
    "linear-gradient(135deg, var(--primitiv-surface-raised), var(--primitiv-surface-sunken))",
  color: "var(--primitiv-content-secondary)",
  borderRadius: "var(--primitiv-radii-8)",
};
const Media = () => <div style={media}>16 : 9 media</div>;

/**
 * Figure's page content.
 *
 * Registry-only. A `<figure>`/`<figcaption>` pairing that wraps self-contained
 * content (an image, chart, code listing) with a caption. `captionPosition`
 * places the caption below, above, or as an overlay; `size` scales it, and
 * `Figure.Caption` takes an `align`.
 */
export const figureSpec: ComponentSpec = {
  playground: {
    component: "Figure",
    fill: true,
    snippet: (values, mode) =>
      [
        imports(mode),
        ``,
        `<Figure captionPosition="${values.captionPosition}" size="${values.size}">`,
        `  <Figure.Media>`,
        `    <img src="/chart.png" alt="Quarterly growth" />`,
        `  </Figure.Media>`,
        `  <Figure.Caption align="${values.align}">Figure 1. Quarterly growth.</Figure.Caption>`,
        `</Figure>`,
      ].join("\n"),
    render: (values) => (
      <Figure
        captionPosition={values.captionPosition as CaptionPosition}
        size={values.size as Size}
        style={{ width: "100%", maxWidth: "22rem", marginInline: "auto" }}
      >
        <Figure.Media>
          <Media />
        </Figure.Media>
        <Figure.Caption align={values.align as Align}>
          Figure 1. A placeholder image.
        </Figure.Caption>
      </Figure>
    ),
  },

  examples: [
    {
      id: "caption-position",
      title: "Caption position",
      render: () => (
        <InteractiveExample
          caption="`captionPosition` places the `<figcaption>`: `below` (the default) and `above` sit it outside the media, while `overlay` floats it over the bottom of the media with a scrim — the hero-image treatment. `Figure.Caption` takes an `align` for left/centre/right within the row."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<Figure captionPosition="overlay">`,
              `  <Figure.Media>`,
              `    <img src="/cover.jpg" alt="" />`,
              `  </Figure.Media>`,
              `  <Figure.Caption align="center">On the cover</Figure.Caption>`,
              `</Figure>`,
            ].join("\n")
          }
        >
          {() => (
            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {(["below", "overlay"] as const).map((pos) => (
                <Figure
                  key={pos}
                  captionPosition={pos}
                  size="sm"
                  style={{ width: "14rem" }}
                >
                  <Figure.Media>
                    <Media />
                  </Figure.Media>
                  <Figure.Caption>captionPosition="{pos}"</Figure.Caption>
                </Figure>
              ))}
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  anatomyMeta:
    "Three parts: `Figure` renders the `<figure>` and owns `captionPosition`/`size`; `Figure.Media` wraps the embedded content; `Figure.Caption` renders the `<figcaption>` (with its own `align`).",
  anatomy: [
    {
      label: "Parts",
      code: () =>
        [
          "<Figure>",
          "  <Figure.Media />",
          "  <Figure.Caption />",
          "</Figure>",
        ].join("\n"),
    },
  ],

  accessibility: [
    "Figure renders a real `<figure>` and `Figure.Caption` a real `<figcaption>`, so assistive tech associates the caption with its content — the caption is not just text that happens to sit nearby.",
    "The media inside still carries its own meaning: an `<img>` needs its `alt`, a chart its description. The `<figcaption>` names the figure, it does not replace the media's own alternative text.",
    "The `overlay` caption sits over the media with a scrim for contrast, but the association is structural (`figure`/`figcaption`), so it survives regardless of where the caption is placed.",
  ],
};
