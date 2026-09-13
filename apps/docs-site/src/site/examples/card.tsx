"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardMedia,
  CardTitle,
} from "@/components/card";
import { Button } from "@/components/button";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { ComponentSpec } from "./types";

type Layout = "vertical" | "horizontal" | "cover";
type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Elevation = "flat" | "raised";

const MEDIA = "/card-media-1.jpg";

/**
 * The import block. Card is registry-only, so there is no mode to switch — the
 * import is the copied file whichever way you read it. Two lines because every
 * example composes the Card parts and a `Button` for the footer.
 */
const imports = () =>
  [
    `import {`,
    `  Card, CardMedia, CardContent, CardHeader,`,
    `  CardTitle, CardDescription, CardFooter,`,
    `} from "@/components/ui/card";`,
    `import { Button } from "@/components/ui/button";`,
  ].join("\n");

/** A complete card, parameterised — the shape every example renders. */
function DemoCard({
  layout,
  size,
  elevation,
  inset,
  src = MEDIA,
}: {
  layout?: Layout;
  size?: Size;
  elevation?: Elevation;
  inset?: boolean;
  src?: string;
}) {
  const cover = layout === "cover";
  return (
    <Card
      layout={layout}
      size={size}
      elevation={elevation}
      style={cover ? { minBlockSize: "14rem" } : undefined}
    >
      <CardMedia inset={inset}>
        <img src={src} alt="" />
      </CardMedia>
      <CardContent>
        <CardHeader>
          {/* asChild → <h4> so the many live demo titles on this page nest
              under each example's own <h3> instead of cluttering the outline at
              the same level — the same knob you use to fit your own page. */}
          <CardTitle asChild>
            <h4>Winter light</h4>
          </CardTitle>
        </CardHeader>
        <CardDescription>First light over the Cairngorms, shot on a cold clear morning.</CardDescription>
        <CardFooter>
          <Button size="sm" variant="secondary">
            Share
          </Button>
          <Button size="sm">View</Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
}

/** The same card as snippet lines. `attrs` goes on the root; `inset` on media. */
const cardLines = ({ attrs = "", inset = false }: { attrs?: string; inset?: boolean } = {}) =>
  [
    `<Card${attrs}>`,
    `  <CardMedia${inset ? " inset" : ""}>`,
    `    <img src="/photo.jpg" alt="" />`,
    `  </CardMedia>`,
    `  <CardContent>`,
    `    <CardHeader>`,
    `      {/* asChild picks the heading level for your outline; a bare`,
    `          <CardTitle>…</CardTitle> renders an <h3>. */}`,
    `      <CardTitle asChild>`,
    `        <h4>Winter light</h4>`,
    `      </CardTitle>`,
    `    </CardHeader>`,
    `    <CardDescription>First light over the Cairngorms.</CardDescription>`,
    `    <CardFooter>`,
    `      <Button size="sm" variant="secondary">Share</Button>`,
    `      <Button size="sm">View</Button>`,
    `    </CardFooter>`,
    `  </CardContent>`,
    `</Card>`,
  ];

/**
 * Card's page content.
 *
 * A hand-authored 7-part composite (registry-only, no headless primitive). Three
 * things lead, all invisible from the props table:
 *
 * 1. **`CardContent` owns ALL the padding** and the gap between header,
 *    description and footer — those parts carry none of their own, so the card
 *    has one padding box rather than a seam at every region.
 * 2. **Media placement is `layout` × `CardMedia`**: `vertical` puts media on
 *    top, `horizontal` to the side, `cover` behind the content; `CardMedia`'s
 *    `inset` insets-and-rounds it versus bleeding flush to the border.
 * 3. **`cover` is a different beast** — the media sits behind the content with a
 *    legibility `scrim` (a pseudo-element, so it costs no DOM elsewhere) and its
 *    own `coverForeground*` text colours.
 */
export const cardSpec: ComponentSpec = {
  playground: {
    component: "Card",
    /* `scrim` only does anything under layout="cover", so it would be a dead
       toggle in the default vertical playground — shown in the Cover example
       instead. */
    excludeControls: ["scrim"],
    snippet: (values) =>
      [
        imports(),
        ``,
        ...cardLines({ attrs: ` layout="${values.layout}" size="${values.size}" elevation="${values.elevation}"` }),
      ].join("\n"),
    render: (values) => {
      const layout = values.layout as Layout;
      const width = layout === "horizontal" ? "30rem" : layout === "cover" ? "22rem" : "20rem";
      return (
        <div style={{ inlineSize: "100%", maxInlineSize: width }}>
          <DemoCard layout={layout} size={values.size as Size} elevation={values.elevation as Elevation} />
        </div>
      );
    },
  },

  anatomyMeta:
    "Seven parts, composed. `Card` is the frame (and owns `layout` / `size` / `elevation` / `scrim`); `CardMedia` is the optional image region; `CardContent` is the padded block that holds everything else — and it owns **all** the padding, so `CardHeader`, `CardDescription` and `CardFooter` add none of their own. `CardHeader` is a flex row (the title stretches, leading/trailing slots hug); `CardTitle` is an `<h3>` (`asChild` to fit the page's outline); `CardFooter` is the action row (`justify` aligns it). Media and content are always siblings — for `layout=\"cover\"` the CSS positions the media behind the content, no re-nesting.",

  anatomy: [
    {
      label: "Parts",
      code: () =>
        [
          `<Card>`,
          `  <CardMedia>{/* img / picture / video */}</CardMedia>`,
          `  <CardContent>`,
          `    <CardHeader>`,
          `      <CardTitle>Title</CardTitle>`,
          `    </CardHeader>`,
          `    <CardDescription>Body copy.</CardDescription>`,
          `    <CardFooter>{/* actions */}</CardFooter>`,
          `  </CardContent>`,
          `</Card>`,
        ].join("\n"),
    },
  ],

  examples: [
    {
      id: "structure",
      title: "A complete card (the anatomy in practice)",
      render: () => (
        <InteractiveExample
          caption="The full composition: an optional `CardMedia`, then a `CardContent` holding a `CardHeader` (with the `CardTitle`), a `CardDescription`, and a `CardFooter` of actions. `CardContent` supplies the padding and the vertical rhythm between those regions — deliberately, so there is one padding box and no doubled seam where regions meet. `CardTitle` renders an `<h3>`; use `asChild` on it to set the heading level that fits your page outline."
          code={() => [imports(), ``, ...cardLines()].join("\n")}
        >
          {() => (
            <div style={{ inlineSize: "100%", maxInlineSize: "20rem" }}>
              <DemoCard />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "layouts",
      title: "Layouts",
      render: () => (
        <InteractiveExample
          caption="`layout` decides where the media sits relative to the content: `&quot;vertical&quot;` (the default) stacks media on top, `&quot;horizontal&quot;` puts it to the side, and `&quot;cover&quot;` places it behind the content with a legibility scrim. Media and content are the same two siblings in every layout — only the CSS changes — so you switch presentation with one prop, not a different tree."
          code={() =>
            [
              imports(),
              ``,
              `<Card layout="vertical">...</Card>`,
              `<Card layout="horizontal">...</Card>`,
              `<Card layout="cover">...</Card>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", inlineSize: "100%" }}>
              <div style={{ maxInlineSize: "20rem" }}>
                <DemoCard layout="vertical" />
              </div>
              <div style={{ maxInlineSize: "30rem" }}>
                <DemoCard layout="horizontal" />
              </div>
              <div style={{ maxInlineSize: "22rem" }}>
                <DemoCard layout="cover" />
              </div>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "media-inset",
      title: "Media: flush or inset",
      render: () => (
        <InteractiveExample
          caption="`CardMedia`'s `inset` prop chooses how the image meets the frame. Flush (the default) bleeds the media to the border with square corners — the card's own `overflow: hidden` supplies the outer radius, and giving the media its own would round the inner seam into a visible notch. `inset` pulls the media in from the edge and rounds all four of its corners, for the more contained, panel-in-a-panel look."
          code={() =>
            [
              imports(),
              ``,
              `{/* flush (default) */}`,
              ...cardLines(),
              ``,
              `{/* inset + rounded */}`,
              ...cardLines({ inset: true }),
            ].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              <div style={{ inlineSize: "16rem" }}>
                <DemoCard />
              </div>
              <div style={{ inlineSize: "16rem" }}>
                <DemoCard inset />
              </div>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "cover-scrim",
      title: "Cover layout and the scrim",
      render: () => (
        <InteractiveExample
          caption="Under `layout=&quot;cover&quot;` the content sits over the media, and a `scrim` gradient keeps it legible against any photo — `&quot;soft&quot;`, `&quot;medium&quot;` (default) or `&quot;strong&quot;`. The scrim is a pseudo-element on the card, so it costs nothing in the other layouts. The text is `coverForegroundLight` / `coverForegroundDark` (both default `&quot;white&quot;`, the only two absolute non-theme-flipping tones) — set them per photo, since a bright image can need dark text regardless of the app's own light/dark mode."
          code={() =>
            [
              imports(),
              ``,
              `<Card layout="cover" scrim="strong" coverForegroundLight="white">`,
              `  <CardMedia><img src="/photo.jpg" alt="" /></CardMedia>`,
              `  <CardContent>`,
              `    <CardHeader>`,
              `      <CardTitle asChild><h4>Winter light</h4></CardTitle>`,
              `    </CardHeader>`,
              `    <CardDescription>First light over the Cairngorms.</CardDescription>`,
              `  </CardContent>`,
              `</Card>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              {(["soft", "medium", "strong"] as const).map((scrim) => (
                <div key={scrim} style={{ inlineSize: "14rem" }}>
                  <Card layout="cover" scrim={scrim} style={{ minBlockSize: "13rem" }}>
                    <CardMedia>
                      <img src={MEDIA} alt="" />
                    </CardMedia>
                    <CardContent>
                      <CardHeader>
                        <CardTitle asChild>
                          <h4>{scrim[0].toUpperCase() + scrim.slice(1)}</h4>
                        </CardTitle>
                      </CardHeader>
                      <CardDescription>Scrim strength {scrim}.</CardDescription>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "as-link",
      title: "The whole card as a link (asChild)",
      render: () => (
        <InteractiveExample
          caption="`asChild` on the root merges the card onto your own element, so the entire card can be a single link. Prefer this to putting an `<a>` around a `<div>` full of other controls: one card, one link, one focus stop. Do **not** then also put buttons or links inside it — nested interactive elements inside a link are invalid; a card that is itself a link should have no other controls (drop the footer actions)."
          code={() =>
            [
              imports(),
              ``,
              `<Card asChild layout="horizontal">`,
              `  <a href="/photos/winter-light">`,
              `    <CardMedia inset><img src="/photo.jpg" alt="" /></CardMedia>`,
              `    <CardContent>`,
              `      <CardHeader>`,
              `        <CardTitle asChild><h4>Winter light</h4></CardTitle>`,
              `      </CardHeader>`,
              `      <CardDescription>First light over the Cairngorms.</CardDescription>`,
              `    </CardContent>`,
              `  </a>`,
              `</Card>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ maxInlineSize: "30rem" }}>
              <Card asChild layout="horizontal">
                <a href="#winter-light" style={{ textDecoration: "none", color: "inherit" }}>
                  <CardMedia inset>
                    <img src={MEDIA} alt="" />
                  </CardMedia>
                  <CardContent>
                    <CardHeader>
                      <CardTitle asChild>
                        <h4>Winter light</h4>
                      </CardTitle>
                    </CardHeader>
                    <CardDescription>First light over the Cairngorms, shot on a cold clear morning.</CardDescription>
                  </CardContent>
                </a>
              </Card>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "**A card is a container, not a role.** By itself it is a `<div>` with no semantics — the meaning comes from what you put in it. `CardTitle` renders a real `<h3>`, so it lands in the document outline; use `asChild` on it to pick the level that fits (an `<h2>` in a section of cards, say) rather than leaving heading levels to jump.",
    "**Decide what the media announces.** A decorative photo takes `alt=\"\"` (as every example here does) so a screen reader skips it; a meaningful image gets a real `alt`. `CardMedia` does not force either — it is your `<img>`.",
    "**One card, one link — via `asChild` on the root.** Making the whole card a link is far better than an `<a>` wrapped around a grid of text and buttons. But a card that is itself a link must contain no other interactive elements: a `<button>` or second `<a>` inside a link is invalid and unusable by keyboard. Keep the footer actions for non-link cards.",
    "**Footer actions are real controls, so order them by importance.** `CardFooter`'s `justify` is visual only; the DOM order is the tab order, so put the primary action first in the markup even if it sits on the right visually.",
    "`layout` and `size` are presentational and change nothing in the accessibility tree — a `cover` card reads the same as a `vertical` one. The `scrim` and `coverForeground*` settings are about visual legibility, which is itself an accessibility concern: check the title's contrast against the actual photo, since the scrim only helps so much over a busy image.",
    "**`elevation` is decoration.** A raised card is not more important to assistive technology than a flat one; if a card is genuinely more significant, say so in its content, don't rely on the shadow.",
  ],
};
