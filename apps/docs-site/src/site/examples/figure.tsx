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
 * A figure as Elements markup (RFC 0033): `<figure>` with the position and size
 * classes, the media in its wrapper, and a classed `<figcaption>` with its
 * alignment. No behaviour, no script.
 */
const html = ({
  position = "below",
  size = "md",
  align = "start",
  src = "/chart.png",
  alt = "Quarterly growth",
  caption = "Figure 1. Quarterly growth.",
  attrs = "",
}: {
  position?: string;
  size?: string;
  align?: string;
  src?: string;
  alt?: string;
  caption?: string;
  attrs?: string;
} = {}) =>
  [
    `<figure class="primitiv-figure primitiv-figure--${position} primitiv-figure--${size}"${attrs}>`,
    `  <div class="primitiv-figure__media"><img src="${src}" alt="${alt}"></div>`,
    `  <figcaption class="primitiv-figure__caption primitiv-figure__caption--${align}">${caption}</figcaption>`,
    `</figure>`,
  ].join("\n");

/**
 * The preview's stand-in for the media: the docs have no `/chart.png`, so each
 * `<img>` becomes the same filled 16:9 box the React demo draws.
 */
const withPlaceholderMedia = (code: string) =>
  code.replace(
    /<img [^>]*>/g,
    '<div style="aspect-ratio:16/9;display:grid;place-content:center;background:linear-gradient(135deg,var(--primitiv-surface-raised),var(--primitiv-surface-sunken));color:var(--primitiv-content-secondary);border-radius:var(--primitiv-radii-8)">16 : 9 media</div>',
  );

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
      mode === "elements"
        ? html({
            position: values.captionPosition,
            size: values.size,
            align: values.align,
            attrs: ' style="max-width:22rem;margin-inline:auto"',
          })
        : [
        imports(mode),
        ``,
        `<Figure captionPosition="${values.captionPosition}" size="${values.size}">`,
        `  <Figure.Media>`,
        `    <img src="/chart.png" alt="Quarterly growth" />`,
        `  </Figure.Media>`,
        `  <Figure.Caption align="${values.align}">Figure 1. Quarterly growth.</Figure.Caption>`,
        `</Figure>`,
      ].join("\n"),
    elementsPreview: withPlaceholderMedia,
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
          elementsPreview={(_density, code) =>
            /* The example row centres its content, so the figure would shrink to
               its caption around a placeholder with no width of its own: give it
               the width the React demo gives it. */
            withPlaceholderMedia(code).replace(
              "<figure ",
              '<figure style="width: 14rem; max-width: 100%" ',
            )
          }
          elementsCaption="The position class places the `<figcaption>`: `primitiv-figure--below` (the default) and `primitiv-figure--above` sit it outside the media, while `primitiv-figure--overlay` floats it over the bottom of the media with a scrim — the hero-image treatment. A `primitiv-figure__caption--start`, `--center` or `--end` class aligns the caption within its row."
          caption="`captionPosition` places the `<figcaption>`: `below` (the default) and `above` sit it outside the media, while `overlay` floats it over the bottom of the media with a scrim — the hero-image treatment. `Figure.Caption` takes an `align` for left/centre/right within the row."
          code={(_density, mode) =>
            mode === "elements"
              ? html({ position: "overlay", src: "/cover.jpg", alt: "", align: "center", caption: "On the cover" })
              : [
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
                  /* `maxWidth` so the pair caps at the preview rather than the
                     viewport: at 320 the row is 214px and a 14rem figure was
                     clipped by the card. */
                  style={{ width: "14rem", maxWidth: "100%" }}
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
      code: (mode) =>
        mode === "elements"
          ? [
              `<figure class="primitiv-figure">`,
              `  <div class="primitiv-figure__media"></div>`,
              `  <figcaption class="primitiv-figure__caption"></figcaption>`,
              `</figure>`,
            ].join("\n")
          : [
          "<Figure>",
          "  <Figure.Media />",
          "  <Figure.Caption />",
          "</Figure>",
        ].join("\n"),
    },
  ],

  elements: {
    anatomyMeta:
      "Three parts: the `<figure>` carries the position and size classes; the `primitiv-figure__media` wrapper holds the embedded content and clips it to the figure's corner radius; the `<figcaption>` carries its own alignment class.",
    accessibility: [
      "Use a real `<figure>` and `<figcaption>`, so assistive tech associates the caption with its content — the caption is not just text that happens to sit nearby.",
      "The media inside still carries its own meaning: an `<img>` needs its `alt`, a chart its description. The `<figcaption>` names the figure; it does not replace the media's own alternative text.",
      "The overlay caption sits over the media with a scrim for contrast, but the association is structural (`figure`/`figcaption`), so it survives wherever the caption is placed.",
    ],
  },

  accessibility: [
    "Figure renders a real `<figure>` and `Figure.Caption` a real `<figcaption>`, so assistive tech associates the caption with its content — the caption is not just text that happens to sit nearby.",
    "The media inside still carries its own meaning: an `<img>` needs its `alt`, a chart its description. The `<figcaption>` names the figure, it does not replace the media's own alternative text.",
    "The `overlay` caption sits over the media with a scrim for contrast, but the association is structural (`figure`/`figcaption`), so it survives regardless of where the caption is placed.",
  ],
};
