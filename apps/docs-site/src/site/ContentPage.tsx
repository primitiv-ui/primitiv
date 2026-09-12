"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { Alert } from "@/components/alert";
import { CodeBlock } from "@/components/code-block";
import { DescriptionList } from "@/components/description-list";
import { Divider } from "@/components/divider";
import { InlineCode } from "@/components/inline-code";
import { List } from "@/components/list";
import { Prose } from "@/components/prose";

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
 * **The rhythm is `Prose`, not a reconstruction of it.** The builder encodes
 * spacing as a right-nested chain of `flow · region` / `· section` / `· tight`
 * auto-layout frames, and it has to: Figma has ONE `itemSpacing` per frame,
 * while the rhythm the design system actually ships is a rule per sibling PAIR
 * (RFC 0016's owl, `registry/components/prose/styles.css`). That nesting is a
 * faithful transcription of the owl *into a tool that cannot express it* — so
 * transcribing it back into CSS flex gaps, which is what this file did first,
 * reproduces the workaround instead of the thing it was working around. The
 * visible cost was flat rhythm: a section's `h2` sat the same 32px from its own
 * first sentence as two paragraphs sat from each other, so every heading
 * floated between its neighbours instead of binding to the body it introduces.
 * `scripts/figma/apply-flow-rhythm.js` fixed exactly this on the home frames
 * and was never run over the content-page frames.
 *
 * So a run of blocks is wrapped in one `<Prose>` and the owl decides every gap.
 * It reproduces the builder's `flow/section` groups *identically* — `p + h4` is
 * `flow/section`, `h4 + p` is `flow/tight`, which is what those wrappers were
 * hand-building — and improves its `flow/normal` groups, where a real `h3` was
 * flattened into paragraph rhythm and now gets its asymmetry back.
 *
 * **Illustrations stay OUTSIDE the flow**, which is the Stack/Prose split
 * settled in `apply-flow-rhythm.js`: a section is a stack holding Prose runs
 * and illustrations as siblings, never one Prose containing the artwork. Under
 * a single Prose a 460px panel would sit `flow/normal` off the paragraph above
 * it, carrying the same weight as a paragraph break. So a `gap` breaks the run
 * and takes `stack/gap-xl` instead.
 *
 * Both families are density-scaled Context tokens, so the page still tightens
 * with `data-density` rather than needing a second set of breakpoints.
 */

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

/**
 * The block forms that survive flattening — everything the owl spaces directly.
 *
 * `group` and `block` are the builder's two *grouping* forms, and both exist
 * only because Figma needed a frame to hold a gap. Neither reaches the DOM:
 * `flatten` expands them, so the owl sees one flat run of real elements and
 * derives the same rhythm from the element types themselves.
 */
type FlatBlock = Exclude<ContentBlock, { kind: "group" } | { kind: "block" }>;

const flatten = (blocks: readonly ContentBlock[]): FlatBlock[] =>
  blocks.flatMap((b): FlatBlock[] =>
    b.kind === "group"
      ? flatten(b.blocks)
      : b.kind === "block"
        ? [
            { kind: "h4", text: b.heading },
            { kind: "p", text: b.text, code: b.code },
          ]
        : [b],
  );

/**
 * An illustration is out of flow (see the Stack/Prose split above) — but only
 * once it EXISTS. `ContentIllustration` renders nothing for an id whose four
 * PNGs have not been exported yet, and a break around nothing would still cost
 * a `stack/gap-xl` where the owl wanted `flow/normal`: an invisible node
 * silently widening a real gap. All ten ids are unexported today, so this is
 * the live path rather than a hedge.
 */
const breaksFlow = (block: FlatBlock) => block.kind === "gap" && hasIllustration(block.id);

/**
 * A section body as the stack actually renders: alternating `Prose` runs and
 * out-of-flow blocks, in source order.
 *
 * `lead` is the section's own `h2`, which the generator hoists out of the block
 * list. It has to be rendered INSIDE the first Prose rather than above it: the
 * owl only spaces siblings, so a heading in its own container has no
 * relationship to the sentence it introduces and falls back to the section
 * stack's gap — which is the flat rhythm this whole change is undoing. When the
 * body opens with an illustration (or has no blocks at all) the lead still gets
 * a run of its own, so the heading is never dropped.
 */
const Flow = ({ blocks, lead }: { blocks: readonly ContentBlock[]; lead?: ReactNode }) => {
  const runs: { flow: boolean; blocks: FlatBlock[] }[] = [];
  for (const block of flatten(blocks)) {
    const flow = !breaksFlow(block);
    const open = runs[runs.length - 1];
    if (open && open.flow && flow) open.blocks.push(block);
    else runs.push({ flow, blocks: [block] });
  }
  if (lead && !runs[0]?.flow) runs.unshift({ flow: true, blocks: [] });

  return (
    <>
      {runs.map((run, i) =>
        run.flow ? (
          <Prose key={i}>
            {i === 0 ? lead : null}
            {run.blocks.map((block, j) => (
              <Block key={j} block={block} />
            ))}
          </Prose>
        ) : (
          run.blocks.map((block, j) => <Block key={`${i}-${j}`} block={block} />)
        ),
      )}
    </>
  );
};

const Block = ({ block }: { block: FlatBlock }) => {
  switch (block.kind) {
    case "h2":
      return <h2 className="docs-content-h2">{block.text}</h2>;
    case "h3":
      return <h3 className="docs-content-h3">{block.text}</h3>;

    /* The builder's `block` form lands here after flattening: a real heading,
       not a bolded line. These are the sub-arguments of a section and a reader
       skimming the page should find them in the outline. The owl gives it
       `flow/section` above and `flow/tight` below with no wrapper. */
    case "h4":
      return <h4 className="docs-content-h4">{block.text}</h4>;

    case "p":
      return <p className="docs-content-p">{renderText(block.text, block.code)}</p>;

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
       flag itself should be a code chip.

       The ONE grouping wrapper kept, deliberately: "Useful flags:" is a lead-in
       that belongs to the list, and the owl has no `p + dl` binding rule to
       express that with — `flow/tight` here is the same judgement the builder's
       own `flags` frame made. A nested container also stops the rhythm leaking,
       so the `<dl>`'s own two-tier row spacing stands. */
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
 * implements — and the count is over the BUILDER's blocks, so the split has to
 * happen before `flatten` expands the grouping forms. Below 64rem the row is one
 * column (content-page.css), matching both the mobile Figma frames and the
 * briefs' own notes.
 *
 * A pair whose illustration has not been exported yet renders as the plain
 * stack — a two-column row with one empty column would be worse than no row.
 */
const SectionBody = ({
  blocks,
  pairs,
  lead,
}: {
  blocks: readonly ContentBlock[];
  pairs: Page["pairs"];
  lead: ReactNode;
}) => {
  const last = blocks[blocks.length - 1];
  const pair = last?.kind === "gap" ? pairs.find((p) => p.id === last.id) : undefined;

  if (!pair || !hasIllustration(pair.id)) return <Flow blocks={blocks} lead={lead} />;

  const split = blocks.length - 1 - pair.count;
  return (
    <>
      <Flow blocks={blocks.slice(0, split)} lead={lead} />
      <div className="docs-content-pair">
        <div className="docs-content-pair-prose">
          <Flow blocks={blocks.slice(split, blocks.length - 1)} />
        </div>
        <ContentIllustration id={pair.id} />
      </div>
    </>
  );
};

export const ContentPage = ({ page }: { page: Page }) => (
  <div className="docs-content-page">
    {/*
     * The masthead is NOT a flow run, and that is a decision rather than an
     * oversight: eyebrow / title / lede is a fixed three-part header whose
     * geometry was read off the canvas, and the owl would put `flow/region`
     * (48) between the eyebrow and the h1 — right for an overline introducing a
     * section on a long page, far too much air inside a page title. The `head`
     * blocks below it ARE prose and get the owl.
     */}
    <header className="docs-content-head">
      <p className="docs-content-eyebrow">{page.eyebrow}</p>
      <div className="docs-content-tight">
        <h1 className="docs-content-title">{page.title}</h1>
        <p className="docs-content-lede">{page.lede}</p>
      </div>
      <Flow blocks={page.head} />
    </header>

    {page.sections.map((section) => (
      <section
        className="docs-content-section"
        key={section.id}
        aria-labelledby={section.id}
      >
        <SectionBody
          blocks={section.blocks}
          pairs={page.pairs}
          lead={
            <h2 className="docs-content-h2" id={section.id}>
              {section.title}
            </h2>
          }
        />
      </section>
    ))}
  </div>
);
