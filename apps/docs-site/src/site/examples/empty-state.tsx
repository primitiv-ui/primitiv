"use client";

import { Button } from "@/components/button";
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateMedia,
  EmptyStateTitle,
} from "@/components/empty-state";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import { glyph, withGlyphs } from "./glyphs";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: readonly Size[] = ["xs", "sm", "md", "lg", "xl"];

/*
 * Imports for the parts an example ACTUALLY renders.
 *
 * Not a fixed list: four of the five examples used to import `Media` and
 * `Actions` they never rendered, which is the one thing a snippet beside a live
 * example must never do — a reader copying it pulls in symbols the code does not
 * use, and the block stops being a readout of what is on screen.
 */
const imports = (mode: Mode, parts: readonly string[] = ["Media", "Title", "Description", "Actions"]) =>
  importBlock({ mode, component: "EmptyState", componentId: "empty-state", parts: [...parts] });
const buttonImports = (mode: Mode) => importBlock({ mode, component: "Button", componentId: "button" });

/** A magnifying glass, inlined so the examples pull in no icon package. */
const SearchGlyph = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M15.5 15.5 20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * The tree, per mode.
 *
 * A rename and nothing more — the copied file mirrors the headless compound part
 * for part, which is exactly what lets the Title be promoted to a real heading
 * with `asChild`. Only the Root differs in what it ACCEPTS (`orientation` and
 * `size` are the copied surface's), not in what it renders.
 */
const treeLines = (
  mode: Mode,
  {
    attrs = "",
    media = true,
    description = true,
    actions = true,
    title = "No results found",
    indent = "",
  }: {
    attrs?: string;
    media?: boolean;
    description?: boolean;
    actions?: boolean;
    title?: string;
    indent?: string;
  } = {},
) => {
  const p = partNamer(mode, "EmptyState");
  return [
    `${indent}<${p("Root")}${attrs}>`,
    ...(media ? [`${indent}  <${p("Media")}><SearchIcon /></${p("Media")}>`] : []),
    `${indent}  <${p("Title")}>${title}</${p("Title")}>`,
    ...(description
      ? [`${indent}  <${p("Description")}>Try adjusting your filters.</${p("Description")}>`]
      : []),
    ...(actions
      ? [
          `${indent}  <${p("Actions")}>`,
          `${indent}    <Button variant="secondary">Clear filters</Button>`,
          `${indent}  </${p("Actions")}>`,
        ]
      : []),
    `${indent}</${p("Root")}>`,
  ];
};

/**
 * EmptyState's page content.
 *
 * Two facts lead, both invisible from the props table.
 *
 * The Root is a **`role="status"` live region**, which is right when the empty
 * state replaces content that has just disappeared (a search returning nothing)
 * and wrong when it was there on load — hence `role={undefined}`, which the
 * primitive's own JSDoc documents as the opt-out and which no props table can
 * suggest.
 *
 * And the Title is a `<p>`, not a heading. That is deliberate for a live region,
 * but it means a page relying on the empty state as its main message has to
 * promote it with `asChild` — the single most useful thing `asChild` does here,
 * and the reason this is a compound of parts rather than a `title` prop.
 */
/** An empty state as Elements markup — the same optional parts as `treeLines`. */
const stateHtml = ({
  orientation = "vertical",
  size = "md",
  live = true,
  media = true,
  description = true,
  actions = true,
  title = "No results found",
  heading,
}: {
  orientation?: string;
  size?: string;
  live?: boolean;
  media?: boolean;
  description?: boolean;
  actions?: boolean;
  title?: string;
  heading?: string;
} = {}) =>
  [
    `<div class="primitiv-empty-state primitiv-empty-state--${orientation} primitiv-empty-state--${size}"${live ? ` role="status"` : ""}>`,
    ...(media ? [`  <div class="primitiv-empty-state__media" aria-hidden="true">${glyph("search")}</div>`] : []),
    heading
      ? `  <${heading} class="primitiv-empty-state__title">${title}</${heading}>`
      : `  <p class="primitiv-empty-state__title">${title}</p>`,
    ...(description ? [`  <p class="primitiv-empty-state__description">Try adjusting your filters.</p>`] : []),
    ...(actions
      ? [
          `  <div class="primitiv-empty-state__actions">`,
          `    <button type="button" class="primitiv-button primitiv-button--secondary primitiv-button--${size}"><span class="primitiv-button__label">Clear filters</span></button>`,
          `  </div>`,
        ]
      : []),
    `</div>`,
  ].join("\n");

/**
 * The Elements preview: each empty state in the same sized region the React
 * previews give it (an empty state centres in its box and has no height of its
 * own), comments dropped, glyphs filled in. Blocks are separated by a blank line.
 */
const inRegions = (code: string, row = false) => {
  const regions = code
    .split("\n\n")
    .map((block) => block.replace(/^<!--.*-->\n/, ""))
    .map((block) => `<div class="docs-empty-state-region">${withGlyphs(block)}</div>`)
    .join("");
  return `<div class="${row ? "docs-empty-state-row" : "docs-example-stack"}">${regions}</div>`;
};

export const emptyStateSpec: ComponentSpec = {
  playground: {
    component: "EmptyState",
    fill: true,
    /* Hand-written: the controls belong to the Root, but the interesting content
       is four child parts the generated childless `toJsx` would omit entirely. */
    snippet: (values, mode) =>
      mode === "elements"
        ? stateHtml({ orientation: values.orientation, size: values.size })
        : [
        imports(mode),
        buttonImports(mode),
        ``,
        ...treeLines(mode, {
          attrs:
            `${contractAttr({ mode, prop: "orientation", value: values.orientation })}` +
            `${contractAttr({ mode, prop: "size", value: values.size })}`,
        }),
      ].join("\n"),
    elementsPreview: (code) => inRegions(code),
    render: (values) => (
      <div className="docs-empty-state-region">
        <EmptyState
          orientation={values.orientation as "vertical" | "horizontal"}
          size={values.size as Size}
        >
          <EmptyStateMedia>
            <SearchGlyph />
          </EmptyStateMedia>
          <EmptyStateTitle>No results found</EmptyStateTitle>
          <EmptyStateDescription>Try adjusting your filters.</EmptyStateDescription>
          <EmptyStateActions>
            <Button variant="secondary">Clear filters</Button>
          </EmptyStateActions>
        </EmptyState>
      </div>
    ),
  },

  anatomyMeta:
    "Five parts, the same five in both modes — the copied file mirrors the headless compound rather than flattening it into props, which is what makes `asChild` on the Title possible. Only the Root's accepted props differ: `orientation` and `size` belong to the copied surface. Every part is optional except the Root; drop the Media for a text-only state, or the Actions when there is nothing to recover to. The root carries **no padding of its own** and centres itself in whatever box you give it, because padding is the container's job — the dashed regions in these examples are the page's, not the component's.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => (mode === "elements" ? stateHtml() : treeLines(mode).join("\n")),
    },
  ],

  examples: [
    {
      id: "live-region",
      title: "It announces itself (the headline)",
      render: () => (
        <InteractiveExample
          elementsCaption={'Write `role="status"` on the root and it becomes a **polite** live region: when it replaces content that has just vanished — a search that returned nothing — the message is announced. Leave the role off when the state is there on page load: nothing changed, so there is nothing to announce.'}
          elementsPreview={(_density, code) => inRegions(code)}
          caption="The Root is `role=&quot;status&quot;` — a **polite** live region, so when it replaces content that has just vanished (a search that returned nothing, a filter that excluded everything) a screen reader announces it once the user is idle rather than interrupting. That is the case it is built for. It is the wrong behaviour when the empty state was on the page at load: there is no change to announce, and a live region that arrives already-populated is unreliable anyway. Pass `role={undefined}` to opt out — the primitive's own JSDoc documents this, and it is why `role` is a plain forwarded attribute rather than something the component locks down."
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  `<!-- Replaced content that vanished: announce it. -->\n${stateHtml()}`,
                  `<!-- Present on load: nothing changed, so no role. -->\n${stateHtml({ live: false, media: false, description: false, actions: false, title: "No messages" })}`,
                ].join("\n\n")
              : [
              imports(mode, ["Media", "Title", "Description", "Actions"]),
              buttonImports(mode),
              ``,
              `{/* Replaced content that vanished — announce it. */}`,
              ...treeLines(mode),
              ``,
              `{/* Present on load — nothing changed, so nothing to announce. */}`,
              ...treeLines(mode, {
                attrs: ` role={undefined}`,
                media: false,
                description: false,
                actions: false,
                title: "No messages",
              }),
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <div className="docs-empty-state-region">
                <EmptyState>
                  <EmptyStateMedia>
                    <SearchGlyph />
                  </EmptyStateMedia>
                  <EmptyStateTitle>No results found</EmptyStateTitle>
                  <EmptyStateDescription>Try adjusting your filters.</EmptyStateDescription>
                  <EmptyStateActions>
                    <Button variant="secondary">Clear filters</Button>
                  </EmptyStateActions>
                </EmptyState>
              </div>
              <div className="docs-empty-state-region docs-empty-state-region--short">
                <EmptyState role={undefined}>
                  <EmptyStateTitle>No messages</EmptyStateTitle>
                </EmptyState>
              </div>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "heading",
      title: "Promoting the title to a heading",
      render: () => (
        <InteractiveExample
          elementsCaption={"The title class goes on any element. A `<p>` is right inside a live region — the whole state is announced as a status. When the empty state is the page's main content and not a live region, put the class on a heading instead, so it lands in the document outline."}
          elementsPreview={(_density, code) => inRegions(code)}
          caption="`EmptyState.Title` renders a `<p>`. That is right for a live region — the whole state is announced as a status, and a heading inside one adds an outline entry for something transient — but wrong when the empty state IS the page's main content, where it should be a real heading so heading navigation reaches it. `asChild` swaps the element and keeps the styling, which is the single most useful thing it does here, and the reason this is a compound of parts rather than a `title` prop: a prop could set the text but never the tag. Pick the LEVEL from the surrounding outline rather than reaching for `<h1>` — the demo below uses `<h4>` because it sits under this page's `<h3>`; an empty state filling a whole route would be `<h1>` or `<h2>`. Pair it with `role={undefined}` — if the state is the page's main content, it was there on load and has nothing to announce."
          code={(_density, mode) => {
            if (mode === "elements")
              return stateHtml({ live: false, media: false, actions: false, title: "No projects yet", heading: "h4" }).replace(
                "Try adjusting your filters.",
                "Create one to get started.",
              );
            const p = partNamer(mode, "EmptyState");
            return [
              imports(mode, ["Title", "Description"]),
              ``,
              `<${p("Root")} role={undefined}>`,
              `  <${p("Title")} asChild>`,
              `    <h4>No projects yet</h4>`,
              `  </${p("Title")}>`,
              `  <${p("Description")}>Create one to get started.</${p("Description")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div className="docs-empty-state-region">
              <EmptyState role={undefined}>
                <EmptyStateTitle asChild>
                  <h4>No projects yet</h4>
                </EmptyStateTitle>
                <EmptyStateDescription>Create one to get started.</EmptyStateDescription>
              </EmptyState>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "orientation",
      title: "Orientation",
      render: () => (
        <InteractiveExample
          elementsCaption={'`primitiv-empty-state--vertical` stacks the media above centred text — the canonical full-region empty state. `--horizontal` puts the media beside inline-start-aligned text, for a shorter region such as a panel or a table body.'}
          elementsPreview={(_density, code) => inRegions(code)}
          caption="`vertical` stacks the media above centred text — the canonical full-region empty state. `horizontal` puts the media beside inline-start-aligned text, which is the shape that fits an inline or compact region: a narrow panel, a card, a table's empty body. Note that the text alignment changes with it, not just the axis; a horizontal state with centred text reads as a mistake, so the two travel together. Both are shown here because the difference is the point."
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  `<!-- vertical: media above centred text -->\n${stateHtml({ actions: false })}`,
                  `<!-- horizontal: media beside inline-start-aligned text -->\n${stateHtml({ orientation: "horizontal", actions: false })}`,
                ].join("\n\n")
              : [
              imports(mode, ["Media", "Title", "Description"]),
              ``,
              `{/* vertical (the default) — media above centred text */}`,
              ...treeLines(mode, {
                attrs: contractAttr({ mode, prop: "orientation", value: "vertical" }),
                actions: false,
              }),
              ``,
              `{/* horizontal — media beside inline-start-aligned text */}`,
              ...treeLines(mode, {
                attrs: contractAttr({ mode, prop: "orientation", value: "horizontal" }),
                actions: false,
              }),
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <p className="docs-example-caption">
                <code>vertical</code>
              </p>
              <div className="docs-empty-state-region">
                <EmptyState orientation="vertical">
                  <EmptyStateMedia>
                    <SearchGlyph />
                  </EmptyStateMedia>
                  <EmptyStateTitle>No results found</EmptyStateTitle>
                  <EmptyStateDescription>Try adjusting your filters.</EmptyStateDescription>
                </EmptyState>
              </div>
              <p className="docs-example-caption">
                <code>horizontal</code>
              </p>
              <div className="docs-empty-state-region docs-empty-state-region--short">
                <EmptyState orientation="horizontal">
                  <EmptyStateMedia>
                    <SearchGlyph />
                  </EmptyStateMedia>
                  <EmptyStateTitle>No results found</EmptyStateTitle>
                  <EmptyStateDescription>Try adjusting your filters.</EmptyStateDescription>
                </EmptyState>
              </div>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "parts-are-optional",
      title: "Only the Root is required",
      render: () => (
        <InteractiveExample
          elementsCaption={'Every part below the root is optional, so the same classes cover a full illustrated region and a single line of text. Keep a title and a way forward when you can: an empty state that says what happened and offers the next step does more than one that only reports it.'}
          elementsPreview={(_density, code) => inRegions(code)}
          caption="Every part below the Root is optional, so the same component covers a full illustrated region and a single line of text. Two judgement calls worth making deliberately. Drop the Media when the region is too short to give an icon room — a glyph squeezed into 40px of height reads as a bug, not as art. And drop the Actions when there is genuinely nothing to recover to: an empty state whose only button reloads the page is worse than one that simply says what happened."
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  `<!-- everything: a full illustrated region -->\n${stateHtml()}`,
                  `<!-- text only: no media, no actions -->\n${stateHtml({ media: false, actions: false })}`,
                ].join("\n\n")
              : [
              imports(mode, ["Media", "Title", "Description", "Actions"]),
              buttonImports(mode),
              ``,
              `{/* everything — a full illustrated region */}`,
              ...treeLines(mode),
              ``,
              `{/* text only — no media, no actions */}`,
              ...treeLines(mode, { media: false, actions: false }),
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <p className="docs-example-caption">everything</p>
              <div className="docs-empty-state-region">
                <EmptyState>
                  <EmptyStateMedia>
                    <SearchGlyph />
                  </EmptyStateMedia>
                  <EmptyStateTitle>No results found</EmptyStateTitle>
                  <EmptyStateDescription>Try adjusting your filters.</EmptyStateDescription>
                  <EmptyStateActions>
                    <Button variant="secondary">Clear filters</Button>
                  </EmptyStateActions>
                </EmptyState>
              </div>
              <p className="docs-example-caption">title and description only</p>
              <div className="docs-empty-state-region docs-empty-state-region--short">
                <EmptyState>
                  <EmptyStateTitle>No results found</EmptyStateTitle>
                  <EmptyStateDescription>Try adjusting your filters.</EmptyStateDescription>
                </EmptyState>
              </div>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "sizes",
      title: "Sizes and density",
      render: () => (
        <InteractiveExample
          elementsCaption={'Five sizes, each rescaling again with the nearest `data-density` ancestor. The size modifier moves the media, both type ramps and the gaps together; give the action button the matching size.'}
          elementsPreview={(_density, code) => inRegions(code.split("\n").slice(1, -1).map((l) => l.slice(2)).join("\n"), true)}
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor. Size moves the media, both type ramps and the gaps together. Pick it from the region the state fills rather than from the message's importance — an `xl` empty state inside a small card is the most common way this component goes wrong."
          code={(density, mode) =>
            mode === "elements"
              ? [
                  `<div data-density="${density}">`,
                  SIZES.map((size) => stateHtml({ size, title: size.toUpperCase() }))
                    .join("\n\n")
                    .split("\n")
                    .map((l) => (l ? `  ${l}` : l))
                    .join("\n"),
                  `</div>`,
                ].join("\n")
              : [
              imports(mode),
              buttonImports(mode),
              ``,
              `<div data-density="${density}">`,
              ...SIZES.flatMap((s) =>
                treeLines(mode, {
                  attrs: contractAttr({ mode, prop: "size", value: s }),
                  title: s.toUpperCase(),
                  indent: "  ",
                }),
              ),
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            /* A ROW, not five stacked full-width regions: stacked, this section
               ran to about 40rem and put every size a screen apart, which is the
               one comparison the example exists to make. */
            <div className="docs-empty-state-row">
              {SIZES.map((size) => (
                <div className="docs-empty-state-region" key={size}>
                  {/* The FULL anatomy at every size — the media, both type ramps
                      and the actions button all move, so a ramp shown as icon +
                      one word hides most of what `size` does. */}
                  <EmptyState size={size}>
                    <EmptyStateMedia>
                      <SearchGlyph />
                    </EmptyStateMedia>
                    <EmptyStateTitle>{size.toUpperCase()}</EmptyStateTitle>
                    <EmptyStateDescription>Try adjusting your filters.</EmptyStateDescription>
                    <EmptyStateActions>
                      <Button size={size} variant="secondary">
                        Clear filters
                      </Button>
                    </EmptyStateActions>
                  </EmptyState>
                </div>
              ))}
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "A placeholder for a region with nothing to show: `primitiv-empty-state` with an orientation and a size, then optional `__media`, `__title`, `__description` and `__actions` parts. Add `role=\"status\"` when it replaces content that just vanished.",
    anatomyMeta:
      "Five parts, and only the root is required. `__media` holds a decorative glyph or illustration (hidden from assistive tech), `__title` and `__description` carry the message, and `__actions` the recovery controls.",
    accessibility: [
      "Write `role=\"status\"` on the root when the empty state **replaces** content — a search that returned nothing. It is a polite live region, announced when the user is idle.",
      "Leave the role off when the state is there on page load. Nothing changed, so there is nothing to announce, and a live region rendered already-populated is announced unreliably.",
      "A `<p>` title adds nothing to the document outline — right inside a live region. When the empty state is the page's main content, put the title class on a heading.",
      "The media is decorative: `aria-hidden=\"true\"` on it. The message is the title and description, not the picture.",
      "Actions are ordinary controls in document order. Put the primary recovery first.",
      "The empty state centres in the box it is given and has no height of its own, so give its region one.",
    ],
  },

  accessibility: [
    "The Root is `role=\"status\"` — a **polite** live region, announced when the user is idle rather than interrupting. That suits an empty state that replaces content which just disappeared. Compare `Alert`, which is assertive and interrupts: if the message is urgent, that is the component, not this one.",
    "**Opt out with `role={undefined}` when the state was there on load.** There is no change to announce, and a live region rendered already-populated is unreliably announced anyway — so the role buys nothing and risks a stray announcement. This is the one prop most empty states should be passing and almost none do.",
    "`EmptyState.Title` is a `<p>`, not a heading, so it adds nothing to the document outline. Deliberate inside a live region; wrong when the empty state is the page's main content. Promote it with `asChild` in that case, and drop the role at the same time. Choose the level from the outline it lands in, not from the component: a heading that skips a level is as much of a problem for heading navigation as no heading at all.",
    "`EmptyState.Media` is decorative. Whatever you put inside should be `aria-hidden` (or an `<svg>` with no accessible name) — the message is the Title and Description, and an icon that announces \"magnifying glass\" before them just delays it.",
    "Actions are ordinary focusable controls in document order, so they are reached by Tab like anything else. Put the primary recovery first: it is both the reading order and the tab order, and a screen-reader user hears the announcement then tabs straight into it.",
    "Say what happened and what to do. \"No results found\" plus \"Try adjusting your filters\" is two sentences doing two jobs; a bare \"Nothing here\" leaves a user who cannot see the surrounding UI with no idea whether something failed or they simply have no data yet.",
    "The component has no padding of its own and centres in the box it is given, so an empty state in a region with no height collapses to nothing. That is a layout bug rather than an accessibility one, but it presents as a live region announcing content nobody can see.",
  ],
};
