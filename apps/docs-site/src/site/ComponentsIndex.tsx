"use client";

import Link from "next/link";

import { Badge } from "@/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardMedia,
  CardTitle,
} from "@/components/card";
import { Tag } from "@/components/tag";
import {
  CATEGORY_ORDER,
  ROSTER,
  categorySlug,
  type RosterEntry,
} from "@/lib/docs-data";
import { renderDoc } from "@/lib/render-doc";

import { CARD_MARKS, MARK_GRID, PLACEHOLDER_MARK } from "./card-marks";

import "./components-index.css";

/**
 * A component's mark, or the stand-in when it has not been drawn yet.
 *
 * The geometry lives in `card-marks.ts` and is shared with the Figma page
 * "Docs — Component Card Marks" — see that file for the two-rule visual
 * language (neutral stroke for chrome, primary fill for content) and for why
 * colour comes from tokens rather than `currentColor`.
 *
 * `aria-hidden` because the mark carries nothing the card title does not
 * already say; announcing "graphic" on every card in a 63-card grid is pure
 * noise.
 *
 * The remaining components keep the placeholder, so the grid stays complete
 * while the set is drawn in batches. Find those by searching
 * `data-media-placeholder`.
 */
const CardMediaMark = ({ id }: { id: string }) => {
  const shapes = CARD_MARKS[id];

  return (
    <svg
      className="docs-index-card-mark"
      data-media-placeholder={shapes ? undefined : ""}
      viewBox={`0 0 ${MARK_GRID.viewBox.width} ${MARK_GRID.viewBox.height}`}
      aria-hidden="true"
      focusable="false"
    >
      {(shapes ?? PLACEHOLDER_MARK).map((shape, i) =>
        shape.kind === "rect" ? (
          <rect
            key={i}
            x={shape.x}
            y={shape.y}
            width={shape.w}
            height={shape.h}
            rx={shape.r}
            className={shape.fill ? "docs-mark-content" : "docs-mark-chrome"}
          />
        ) : (
          <path key={i} d={shape.d} className="docs-mark-chrome" />
        ),
      )}
    </svg>
  );
};

/**
 * A card's inner content — identical whether or not the component has a page.
 *
 * Kept as one function so a documented and an undocumented card cannot drift
 * apart visually: the only difference between them is the wrapper (a `Link` vs a
 * plain `Card`) and the status pill.
 */
const CardBody = ({ entry }: { entry: RosterEntry }) => (
  <>
    {/* Flush, not inset: the card's own overflow supplies the outer radius, and
        an inset media would round the inner seam against the content too. */}
    <CardMedia>
      <CardMediaMark id={entry.id} />
    </CardMedia>

    {/* Header inside Content — Content owns all the padding. */}
    <CardContent>
      <CardHeader>
        <CardTitle>{entry.displayName}</CardTitle>
        {entry.documented ? (
          /* Badge ships no neutral tone (success|warning|info|danger only), so
             "stable" reads as success — accurate here. */
          <Badge tone="success" size="sm">
            stable
          </Badge>
        ) : (
          /* Tag, not Badge, precisely BECAUSE it has a neutral tone: "no page
             yet" is not a status of the component, and painting it success or
             warning would say something untrue about the component itself. */
          <Tag tone="neutral" size="sm">
            Docs soon
          </Tag>
        )}
      </CardHeader>
      <CardDescription className="docs-index-card-description">
        {/* The WHOLE description, clamped to three lines in CSS rather than cut
            to its first sentence in JS. Three lines is more useful than one
            sentence, and the clamp keeps every card the same height whatever the
            generated prose does. The full text stays in the DOM, so a screen
            reader gets all of it — which is the part a tooltip would have taken
            away.

            Rendered, not printed: descriptions carry backticked code spans. */}
        {renderDoc(entry.description, "sm")}
      </CardDescription>
    </CardContent>
  </>
);

/**
 * The `/components` index.
 *
 * This is a page in its own right, not just a nav group, because it owns the
 * consumption-mode switch (docs-site-planning.md §1.4 marks the Components
 * section `[MODE-SCOPED — the switch lives here]`). A reader picks
 * headless/styled/Figma here and then drills into a component.
 *
 * **It lists the WHOLE library, not just the documented components.** All 63
 * registry components appear, grouped, with the 60 that have no page yet
 * rendered as inert cards — because the page's proportions can only be judged
 * with every group populated, and because it is the honest answer to "what does
 * Primitiv ship". Both halves come from generated data (`ROSTER`), so a new
 * component appears here the moment it is in `registry.json`, and it starts
 * linking the moment it has docs-data.
 */
export const ComponentsIndex = () => (
  <>
    <h1 className="docs-index-title">Components</h1>
    <p className="docs-index-lede">
      Every component ships three ways: a headless primitive, a styled registry
      surface you own outright, and a Figma component set. Pick a component to
      see all three — pages marked <em>Docs soon</em> are on their way.
    </p>

    {CATEGORY_ORDER.map((category) => {
      const group = ROSTER.filter((entry) => entry.category === category);
      /* Never expected now that the roster covers the whole registry, but a
         heading over an empty grid is worse than a missing heading. */
      if (group.length === 0) return null;

      return (
        <section className="docs-index-group" key={category}>
          {/* The id is the TOC rail's anchor; the heading is the group's
              accessible name, so the list below is announced as "Buttons"
              rather than as one undifferentiated run of links. */}
          <h2 className="docs-index-group-title" id={categorySlug(category)}>
            {category}
          </h2>

          <ul className="docs-index-grid">
            {group.map((entry) => (
              <li key={entry.id}>
                {entry.documented ? (
                  /* asChild makes the whole card the link, so the hit area is
                     the card rather than just the title text — and it stays a
                     single <a>, not a card containing a link, which would give
                     screen-reader users two overlapping targets. */
                  <Card asChild>
                    <Link
                      className="docs-index-card"
                      href={`/components/${entry.id}/`}
                    >
                      <CardBody entry={entry} />
                    </Link>
                  </Card>
                ) : (
                  /* No link, no button, no `aria-disabled`: there is nothing to
                     interact with, so the card is static content. Marking it
                     disabled would announce an interactive element that isn't
                     there. */
                  <Card className="docs-index-card docs-index-card--inert">
                    <CardBody entry={entry} />
                  </Card>
                )}
              </li>
            ))}
          </ul>
        </section>
      );
    })}
  </>
);
