"use client";

import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
  AccordionTriggerIcon,
} from "@/components/accordion";
import { ChevronDown } from "@primitiv-ui/icons";

import { Badge } from "@/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardMedia,
  CardTitle,
} from "@/components/card";
import { InlineCode } from "@/components/inline-code";
import { Tag } from "@/components/tag";
import {
  CATEGORY_ORDER,
  ROSTER,
  categorySlug,
  type RosterEntry,
} from "@/lib/docs-data";
import { cardSummary } from "@/lib/card-summary";
import { renderDoc } from "@/lib/render-doc";

import { Shell } from "./Shell";
import { type Framework, useFramework, useStyle } from "./preferences";

import { useCompactIndex } from "./use-compact-index";

import { CARD_MARKS, MARK_GRID, PLACEHOLDER_MARK, type MarkRole } from "./card-marks";

import "./components-index.css";
import { humanName } from "@/lib/human-name";
import { cssOnlyFor, listedFor } from "@/lib/nav";

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
/**
 * The classes for one shape.
 *
 * Fill and stroke are named SEPARATELY rather than as one combined role,
 * because Button's pointer needs both at once — a white fill with a neutral
 * edge, since it crosses the button's boundary and has to read on the fill and
 * on the page behind it. Omitting either paints `none`, so a shape never
 * inherits a paint it did not ask for.
 */
const markClass = ({
  fill,
  stroke,
  dash,
}: {
  fill?: MarkRole;
  stroke?: MarkRole;
  dash?: boolean;
}) =>
  [
    "docs-mark",
    `docs-mark-fill-${fill ?? "none"}`,
    `docs-mark-stroke-${stroke ?? "none"}`,
    dash ? "docs-mark-dashed" : null,
  ]
    .filter(Boolean)
    .join(" ");

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
            className={markClass({
              fill: shape.fill,
              /* A rect outlines itself unless it is filled — but it may ask
                 for both, which is what lets an avatar mask its neighbour. */
              stroke: shape.stroke ?? (shape.fill ? undefined : "chrome"),
              dash: shape.dash,
            })}
          />
        ) : (
          <path
            key={i}
            d={shape.d}
            className={markClass({ fill: shape.fill, stroke: shape.stroke ?? "chrome" })}
          />
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
const CardBody = ({ entry, cssOnly }: { entry: RosterEntry; cssOnly: boolean }) => (
  <>
    {/* Flush, not inset: the card's own overflow supplies the outer radius, and
        an inset media would round the inner seam against the content too. */}
    <CardMedia>
      <CardMediaMark id={entry.id} />
    </CardMedia>

    {/* Header inside Content — Content owns all the padding. */}
    <CardContent>
      <CardHeader>
        <CardTitle>{humanName(entry.displayName)}</CardTitle>
        {cssOnly && (
          /* Neutral like "Docs soon": having no script is not a status. */
          /* xs, not sm: Tag's sm stands taller than Badge's sm beside it. */
          <Tag tone="neutral" size="xs">
            CSS only
          </Tag>
        )}
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
        {/* Shortened HERE rather than by CSS. The clamp used to append the
            browser's own ellipsis; with that gone (see components-index.css)
            a clamp alone cuts mid-sentence with nothing to say it was cut, and
            no CSS can add a conditional marker — a fade or mask would blur the
            short descriptions that are already complete. `cardSummary` only
            marks a card it actually truncated.

            The FULL text still reaches assistive tech, which is the part that
            must not be traded away: truncating for sighted readers is a layout
            decision, not an information one. The visible half is aria-hidden so
            the description is not announced twice.

            Rendered, not printed: descriptions carry backticked code spans. */}
        <span aria-hidden="true">
          {renderDoc(cardSummary(entry.description), "sm")}
        </span>
        {/* Rendered, not raw: a screen reader would otherwise read the
            backticks around every code span aloud. */}
        <span className="docs-visually-hidden">
          {renderDoc(entry.description, "sm")}
        </span>
      </CardDescription>
    </CardContent>
  </>
);

/**
 * One category's cards.
 *
 * `compact` switches the cards to Card's own `horizontal` layout — the mark
 * beside the text rather than a 16/9 band above it. On a 375px phone that takes
 * a card from ~333px tall to ~140px, which is the difference between 34 screens
 * of scroll for the full index and about a third of that. It is Card's own
 * supported layout, not a docs-side override of its internals.
 */
const CategoryGrid = ({
  group,
  compact,
}: {
  group: readonly RosterEntry[];
  compact: boolean;
}) => {
  const [framework] = useFramework();
  return (
  <ul className="docs-index-grid" data-compact={compact ? "" : undefined}>
    {group.map((entry) => (
      <li key={entry.id}>
        {entry.documented ? (
          /* asChild makes the whole card the link, so the hit area is
             the card rather than just the title text — and it stays a
             single <a>, not a card containing a link, which would give
             screen-reader users two overlapping targets. */
          <Card asChild layout={compact ? "horizontal" : "vertical"}>
            <Link className="docs-index-card" href={`/components/${entry.id}/`}>
              <CardBody entry={entry} cssOnly={cssOnlyFor(entry, framework)} />
            </Link>
          </Card>
        ) : (
          /* No link, no button, no `aria-disabled`: there is nothing to
             interact with, so the card is static content. Marking it
             disabled would announce an interactive element that isn't
             there. */
          <Card
            className="docs-index-card docs-index-card--inert"
            layout={compact ? "horizontal" : "vertical"}
          >
            <CardBody entry={entry} cssOnly={cssOnlyFor(entry, framework)} />
          </Card>
        )}
      </li>
    ))}
  </ul>
  );
};

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
/**
 * The categories and their components for a framework and style (see
 * `listedFor`): React is the whole library; Elements lists the components with
 * an elements surface, so a category without one drops out, heading and TOC
 * entry together.
 */
const groupsFor = (framework: Framework) =>
  CATEGORY_ORDER.map((category) => ({
    category,
    group: ROSTER.filter(
      (entry) => entry.category === category && listedFor(entry, framework),
    ),
  })).filter(({ group }) => group.length > 0);

/**
 * The /components page: the index and its TOC rail, both from one list.
 *
 * A client component because the list follows the mode switch, which lives in
 * the browser. Building the rail here rather than in the route keeps the rail
 * and the headings from disagreeing about which categories exist.
 */
export const ComponentsIndexPage = () => {
  const [framework] = useFramework();
  const toc = groupsFor(framework).map(({ category }) => ({
    id: categorySlug(category),
    title: category,
  }));
  return (
    <Shell toc={toc}>
      <ComponentsIndex />
    </Shell>
  );
};

export const ComponentsIndex = () => {
  const compact = useCompactIndex();
  const [framework] = useFramework();
  const [style] = useStyle();
  const groups = groupsFor(framework);

  return (
    <>
      <h1 className="docs-index-title">Components</h1>
      {framework === "react" ? (
        <p className="docs-index-lede">
          The React library, complete: every component as a headless primitive
          and as a styled registry surface you own outright. Pick a component
          to see both — pages marked <em>Docs soon</em> are on their way.
        </p>
      ) : style === "headless" ? (
        <p className="docs-index-lede">
          The behaviour and accessibility, without Primitiv&rsquo;s CSS, in plain
          HTML or any framework: custom elements from{" "}
          <InlineCode size="md">@primitiv-ui/web</InlineCode>, and accessible
          markup patterns for the components marked <em>CSS only</em>, which
          need no script at all. More are on their way; switch to React for the
          whole library.
        </p>
      ) : (
        <p className="docs-index-lede">
          Elements with Primitiv&rsquo;s styling: the custom elements from{" "}
          <InlineCode size="md">@primitiv-ui/web</InlineCode> and plain markup
          carrying the registry&rsquo;s classes, for the components that are
          styling alone. They work in plain HTML or any framework. More are on
          their way; switch to React for the whole library.
        </p>
      )}

      {compact ? (
        /*
         * Ten categories, 63 components: on a phone the flat index is about 34
         * screens of scrolling, which is not browsable. The categories become
         * an Accordion — the library's own disclosure, rather than a bespoke
         * one — opening at roughly a screen with the first category expanded.
         *
         * `multiple` so opening Forms does not close Layout: this is an index
         * to browse, not a set of alternatives, and auto-collapsing what you
         * just read is the wrong model for it.
         *
         * The heading ids stay on the triggers so the TOC rail's anchors keep
         * working; jumping to a collapsed category still lands on its heading.
         */
        <Accordion multiple defaultValue={groups[0]?.category}>
          {groups.map(({ category, group }) => (
            <AccordionItem key={category} value={category}>
              <AccordionHeader>
                <AccordionTrigger id={categorySlug(category)}>
                  {category}
                  <AccordionTriggerIcon>
                    <ChevronDown aria-hidden="true" />
                  </AccordionTriggerIcon>
                </AccordionTrigger>
              </AccordionHeader>
              <AccordionContent>
                <CategoryGrid group={group} compact />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        groups.map(({ category, group }) => (
          <section className="docs-index-group" key={category}>
            {/* The id is the TOC rail's anchor; the heading is the group's
                accessible name, so the list below is announced as "Buttons"
                rather than as one undifferentiated run of links. */}
            <h2 className="docs-index-group-title" id={categorySlug(category)}>
              {category}
            </h2>

            <CategoryGrid group={group} compact={false} />
          </section>
        ))
      )}
    </>
  );
};
