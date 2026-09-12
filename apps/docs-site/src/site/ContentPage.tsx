"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { Alert } from "@/components/alert";
import { CodeBlock } from "@/components/code-block";
import { DescriptionList } from "@/components/description-list";
import { Divider } from "@/components/divider";
import { InlineCode } from "@/components/inline-code";
import { List } from "@/components/list";

import type { ContentBlock, ContentPage as Page } from "@/lib/content-pages";
import { ContentIllustration, hasIllustration } from "./ContentIllustration";

import "./content-page.css";

/**
 * Renders one prose page from its generated data.
 *
 * Every block form in `scripts/figma/docs-content-pages.js` has exactly one
 * rendering here, so a page's shape on the site and on the canvas come from the
 * same description. Where the Figma renderer draws an approximation of a
 * component, this uses the real one — `alert` and `code-block` are registry
 * components, `defs` is a real `<dl>`, and the copy control on a shell block is
 * a working button rather than an icon.
 *
 * The rhythm matches the Figma frames: a section is a `flow/section` (32px)
 * column, a `block` and a `defs` row are `flow/tight` (12px), and each `group`
 * carries whichever flow token its entry names. Those are the same
 * density-scaled tokens the canvas binds, which is why the page tightens with
 * `data-density` rather than needing a second set of breakpoints.
 */

/** `flow/tight` → `--primitiv-flow-tight`. The builder names them Figma-style. */
const flowVar = (token: string) => `var(--primitiv-${token.replace("/", "-")})`;

/**
 * Turns the code fragments listed alongside a paragraph into real chips.
 *
 * The builder carries them as a separate array rather than backticks in the
 * string (Figma has no inline markup — a chip there is a real `Inline Code`
 * instance among word nodes), so the same split has to happen here. Longest
 * first, because `primitiv add button` contains `button` and the shorter match
 * would otherwise cut the longer one in half.
 */
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const renderText = (text: string, fragments: readonly string[]): ReactNode => {
  if (fragments.length === 0) return text;
  const pattern = new RegExp(
    `(${[...fragments].sort((a, b) => b.length - a.length).map(escape).join("|")})`,
    "g",
  );
  return text
    .split(pattern)
    .filter((part) => part !== "")
    .map((part, i) =>
      fragments.includes(part) ? <InlineCode key={i}>{part}</InlineCode> : part,
    );
};

const Blocks = ({ blocks }: { blocks: readonly ContentBlock[] }) => (
  <>
    {blocks.map((block, i) => (
      <Block key={i} block={block} />
    ))}
  </>
);

const Block = ({ block }: { block: ContentBlock }) => {
  switch (block.kind) {
    case "h2":
      return <h2 className="docs-content-h2">{block.text}</h2>;
    case "h3":
      return <h3 className="docs-content-h3">{block.text}</h3>;
    case "h4":
      return <h4 className="docs-content-h4">{block.text}</h4>;

    case "p":
      return <p className="docs-content-p">{renderText(block.text, block.code)}</p>;

    /* An h4 and its paragraph, tight — the builder's `block` form. A real
       heading, not a bolded line: these are the sub-arguments of a section and
       a reader skimming the page should find them in the outline. */
    case "block":
      return (
        <div className="docs-content-tight">
          <h4 className="docs-content-h4">{block.heading}</h4>
          <p className="docs-content-p">{renderText(block.text, block.code)}</p>
        </div>
      );

    /* `header` is Figma's `Show Header` boolean, which on the canvas is a
       decorated top bar and here is what carries the copy control — so the
       shell transcripts a reader is meant to run are the ones with a copy
       button, and the illustrative snippets are not. `size="sm"` throughout:
       the design's blocks step down from body type, and a 632px column is not
       wide enough for md mono without wrapping the longer commands. */
    case "code":
      return (
        <CodeBlock
          className="docs-content-code"
          size="sm"
          language={block.language}
          code={block.code}
          showHeader={block.header}
          showLineNumbers={block.lineNumbers}
        />
      );

    /* Non-dismissible by design: every alert on these pages is standing
       context (a publication gate, a platform limitation), not something a
       reader clears. `onDismiss` omitted is what makes that so. */
    case "alert":
      return (
        <Alert
          className="docs-content-alert"
          tone={block.tone as "info" | "success" | "warning" | "danger"}
          size="sm"
        >
          {block.text}
        </Alert>
      );

    /* A real `<dl>`. The canvas draws a label over a body line, which is what
       a description list already is — and the term/description pairing is the
       content, so it belongs in the markup rather than in two styled spans.
       `Fragment` rather than a wrapper element per pair: the `stacked` layout
       spaces its rows with `> dt`/`> dd` child selectors, so a grouping `<div>`
       would silently drop the spacing. The pages' own two-tier rhythm (2px
       inside a pair, `flow/tight` between them) is re-pointed in
       content-page.css — the component's own stacked gap is uniform. */
    case "defs":
      return (
        <DescriptionList className="docs-content-defs" layout="stacked">
          {block.defs.map((def) => (
            <Fragment key={def.term}>
              <DescriptionList.Term>{def.term}</DescriptionList.Term>
              <DescriptionList.Details>{def.description}</DescriptionList.Details>
            </Fragment>
          ))}
        </DescriptionList>
      );

    /* CLI flags. A `<dl>` again rather than the builder's run of paragraphs:
       the flag is the term and the sentence describes it, and on the web the
       flag itself should be a code chip. */
    case "flags":
      return (
        <div className="docs-content-tight">
          <p className="docs-content-p">Useful flags:</p>
          <DescriptionList className="docs-content-defs" layout="stacked">
            {block.flags.map((f) => (
              <Fragment key={f.flag}>
                <DescriptionList.Term>
                  <InlineCode>{f.flag}</InlineCode>
                </DescriptionList.Term>
                <DescriptionList.Details>{f.description}</DescriptionList.Details>
              </Fragment>
            ))}
          </DescriptionList>
        </div>
      );

    /* Next-step links. A real list, so a screen reader announces how many there
       are; the arrow is drawn by the stylesheet rather than typed into the
       label, so it is not read out as "right arrow" on every one. */
    case "links":
      return (
        <List className="docs-content-links" marker={false} indent={false} size="md">
          {block.links.map((l) => (
            <List.Item key={l.href}>
              <Link className="docs-content-link" href={l.href}>
                {l.label}
              </Link>
            </List.Item>
          ))}
        </List>
      );

    /* The "where to go next" table at the end of Start Here — a link per row
       with a line of explanation, divided. The whole row is the target, so the
       description is inside the anchor: two adjacent links to the same place is
       the thing to avoid here. */
    case "doors":
      return (
        <div className="docs-content-doors">
          {block.doors.map((door, i) => (
            <div key={door.href}>
              {i > 0 && <Divider />}
              <Link className="docs-content-door" href={door.href}>
                <span className="docs-content-door-label">{door.label}</span>
                <span className="docs-content-door-description">{door.description}</span>
              </Link>
            </div>
          ))}
        </div>
      );

    case "group":
      return (
        <div className="docs-content-group" style={{ gap: flowVar(block.gap) }}>
          <Blocks blocks={block.blocks} />
        </div>
      );

    case "gap":
      return <ContentIllustration id={block.id} />;
  }
};

/**
 * A section's body, with any paired illustration row assembled.
 *
 * `pairs` names an illustration and how many of the blocks immediately above it
 * belong beside it. On all three pages that use one the pair is the whole
 * section body, but the data expresses it as "the last N", so that is what this
 * implements. Below 64rem the row is one column (content-page.css), matching
 * both the mobile Figma frames and the briefs' own notes.
 *
 * A pair whose illustration has not been exported yet renders as the plain
 * stack — a two-column row with one empty column would be worse than no row.
 */
const SectionBody = ({
  blocks,
  pairs,
}: {
  blocks: readonly ContentBlock[];
  pairs: Page["pairs"];
}) => {
  const last = blocks[blocks.length - 1];
  const pair = last?.kind === "gap" ? pairs.find((p) => p.id === last.id) : undefined;

  if (!pair || !hasIllustration(pair.id)) return <Blocks blocks={blocks} />;

  const split = blocks.length - 1 - pair.count;
  return (
    <>
      <Blocks blocks={blocks.slice(0, split)} />
      <div className="docs-content-pair">
        <div className="docs-content-pair-prose">
          <Blocks blocks={blocks.slice(split, blocks.length - 1)} />
        </div>
        <ContentIllustration id={pair.id} />
      </div>
    </>
  );
};

export const ContentPage = ({ page }: { page: Page }) => (
  <div className="docs-content-page">
    <header className="docs-content-head">
      <p className="docs-content-eyebrow">{page.eyebrow}</p>
      <div className="docs-content-tight">
        <h1 className="docs-content-title">{page.title}</h1>
        <p className="docs-content-lede">{page.lede}</p>
      </div>
      <Blocks blocks={page.head} />
    </header>

    {page.sections.map((section) => (
      <section
        className="docs-content-section"
        key={section.id}
        aria-labelledby={section.id}
      >
        <h2 className="docs-content-h2" id={section.id}>
          {section.title}
        </h2>
        <SectionBody blocks={section.blocks} pairs={page.pairs} />
      </section>
    ))}
  </div>
);
