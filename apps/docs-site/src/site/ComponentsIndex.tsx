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
import { ALL_DOCS, CATEGORY_ORDER } from "@/lib/docs-data";
import { renderDoc } from "@/lib/render-doc";

import "./components-index.css";

/**
 * Stand-in artwork for a component card.
 *
 * **Temporary, and deliberately identical on every card.** The real set is
 * per-component and will be drawn in Figma — icon-like and symbolic, not
 * screenshots of live instances — and each one replaces this. Find them all by
 * searching `data-media-placeholder`.
 *
 * Inline SVG rather than an image file: nothing to 404, nothing binary in the
 * repo, and it inherits `currentColor` so it follows the theme without a second
 * asset for dark mode. `aria-hidden` because it carries no information the card
 * title does not already give — an announced "placeholder graphic" on every card
 * in the grid would be pure noise.
 *
 * It does NOT pick up the media region's hairline outline: that rule is scoped
 * to `:has(img, picture, video)`, which is right — the outline exists to stop a
 * pale-edged photo losing its edge, and this has no edge to lose.
 */
const CardMediaPlaceholder = () => (
  <svg
    className="docs-index-card-placeholder"
    data-media-placeholder
    viewBox="0 0 64 40"
    aria-hidden="true"
    focusable="false"
  >
    <rect x="14" y="9" width="36" height="22" rx="3" />
    <rect x="20" y="15" width="16" height="2.5" rx="1.25" />
    <rect x="20" y="21" width="24" height="2.5" rx="1.25" />
  </svg>
);

/**
 * The `/components` index.
 *
 * This is a page in its own right, not just a nav group, because it owns the
 * consumption-mode switch (docs-site-planning.md §1.4 marks the Components
 * section `[MODE-SCOPED — the switch lives here]`). A reader picks
 * headless/styled/Figma here and then drills into a component.
 *
 * The grid is driven by `ALL_DOCS`, so a new component appears here as soon as
 * its generated docs-data lands — there is no list to maintain in parallel.
 * Grouping works the same way: the heading comes from each component's
 * generated `category`, and `CATEGORY_ORDER` fixes the sequence, so there is no
 * per-component list here either.
 *
 * Empty groups are skipped rather than rendered as a heading over nothing —
 * which matters right now, when three components mean three of the ten groups
 * have anything in them.
 */
export const ComponentsIndex = () => (
  <>
    <h1 className="docs-index-title">Components</h1>
    <p className="docs-index-lede">
      Every component ships three ways: a headless primitive, a styled registry
      surface you own outright, and a Figma component set. Pick a component to
      see all three.
    </p>

    {CATEGORY_ORDER.map((category) => {
      const group = ALL_DOCS.filter((docs) => docs.category === category);
      if (group.length === 0) return null;

      return (
        <section className="docs-index-group" key={category}>
          {/* The heading is the group's accessible name, so the list below is
              announced as "Buttons" rather than as one undifferentiated run of
              links across every category. */}
          <h2 className="docs-index-group-title">{category}</h2>

          <ul className="docs-index-grid">
            {group.map((docs) => (
              <li key={docs.id}>
                {/* asChild makes the whole card the link, so the hit area is the
                    card rather than just the title text — and it stays a single
                    <a>, not a card containing a link, which would give
                    screen-reader users two overlapping targets. */}
                <Card asChild>
                  <Link
                    className="docs-index-card"
                    href={`/components/${docs.id}/`}
                  >
                    {/* Flush, not inset: the card's own overflow supplies the
                        outer radius, and an inset media would round the inner
                        seam against the content too. */}
                    <CardMedia>
                      <CardMediaPlaceholder />
                    </CardMedia>

                    {/* Header inside Content — Content owns all the padding. */}
                    <CardContent>
                      <CardHeader>
                        <CardTitle>{docs.displayName}</CardTitle>
                        {/* Badge ships no neutral tone
                            (success|warning|info|danger only), so "stable"
                            reads as success — accurate here. */}
                        <Badge tone="success" size="sm">
                          {docs.status}
                        </Badge>
                      </CardHeader>
                      <CardDescription className="docs-index-card-description">
                        {/* The WHOLE description, clamped to three lines in CSS
                            rather than cut to its first sentence in JS. Three
                            lines is more useful than one sentence, and the clamp
                            keeps every card the same height whatever the
                            generated prose does. The full text stays in the DOM,
                            so a screen reader gets all of it — which is the part
                            a tooltip would have taken away.

                            Rendered, not printed: generated descriptions carry
                            backticked code spans. */}
                        {renderDoc(docs.description, "sm")}
                      </CardDescription>
                    </CardContent>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      );
    })}
  </>
);
