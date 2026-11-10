"use client";

import { usePagination } from "@primitiv-ui/react";

import {
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationMenuItem,
  PaginationNext,
  PaginationPrevious,
  PaginationStatus,
  PaginationSummary,
  PaginationTrailing,
} from "@/components/pagination";
import { Select, SelectItem } from "@/components/select";
import { InteractiveExample } from "@/site/InteractiveExample";
import { glyph, withGlyphs } from "./glyphs";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Variant = "numbered" | "compact";

const imports = () =>
  [
    `import { usePagination } from "@primitiv-ui/react";`,
    `import {`,
    `  Pagination, PaginationList, PaginationItem, PaginationLink,`,
    `  PaginationPrevious, PaginationNext, PaginationEllipsis, PaginationMenuItem,`,
    `} from "@/components/ui/pagination";`,
  ].join("\n");

type PaginationState = ReturnType<typeof usePagination>;

/**
 * The numbered cells, prev/next and ellipsis menu — a PURE renderer of one
 * `usePagination` result. It takes the state as props rather than owning its
 * own hook, so a demo that also has a summary or a jump-to control drives ALL
 * of them from a single source (two `usePagination` instances would drift —
 * jumping via the Select would move the summary but not the cells).
 */
function NumberedList({ page, items, setPage, next, previous, canPrevious, canNext }: PaginationState) {
  return (
    <PaginationList>
      <PaginationItem>
        <PaginationPrevious disabled={!canPrevious} onClick={previous} />
      </PaginationItem>
      {items.map((item, i) =>
        item.type === "page" ? (
          <PaginationItem key={`p-${item.page}`}>
            <PaginationLink isActive={item.page === page} onClick={() => setPage(item.page)}>
              {item.page}
            </PaginationLink>
          </PaginationItem>
        ) : (
          <PaginationItem key={`g-${i}`}>
            <PaginationEllipsis>
              {item.pages.map((hidden) => (
                <PaginationMenuItem key={hidden} onSelect={() => setPage(hidden)}>
                  {hidden}
                </PaginationMenuItem>
              ))}
            </PaginationEllipsis>
          </PaginationItem>
        ),
      )}
      <PaginationItem>
        <PaginationNext disabled={!canNext} onClick={next} />
      </PaginationItem>
    </PaginationList>
  );
}

/** Compact list — also a pure renderer of one `usePagination` result. */
function CompactList({ page, pageCount, next, previous, canPrevious, canNext }: PaginationState) {
  return (
    <PaginationList>
      <PaginationItem>
        <PaginationPrevious disabled={!canPrevious} onClick={previous} />
      </PaginationItem>
      <PaginationItem>
        <PaginationStatus>
          Page {page} of {pageCount}
        </PaginationStatus>
      </PaginationItem>
      <PaginationItem>
        <PaginationNext disabled={!canNext} onClick={next} />
      </PaginationItem>
    </PaginationList>
  );
}

/** Numbered demo that owns one hook — for the Numbered and Sizes examples. */
function NumberedDemo({ size, totalItems = 97, label = "Search results" }: { size?: Size; totalItems?: number; label?: string }) {
  const pg = usePagination({ totalItems, pageSize: 10 });
  return (
    <Pagination size={size} label={label}>
      <NumberedList {...pg} />
    </Pagination>
  );
}

/** Compact demo that owns one hook. */
function CompactDemo() {
  const pg = usePagination({ totalItems: 97, pageSize: 10 });
  return (
    <Pagination variant="compact" label="Results">
      <CompactList {...pg} />
    </Pagination>
  );
}

function PlaygroundPagination({ variant, size }: { variant: Variant; size: Size }) {
  const pg = usePagination({ totalItems: 50, pageSize: 10 });
  return (
    <Pagination variant={variant} size={size} label="Results">
      {variant === "compact" ? <CompactList {...pg} /> : <NumberedList {...pg} />}
    </Pagination>
  );
}

function SummaryJumpDemo() {
  // ONE hook drives the summary, the cells AND the jump-to Select — so jumping
  // moves everything in lockstep.
  const pg = usePagination({ totalItems: 97, pageSize: 10 });
  return (
    <Pagination label="Results">
      <PaginationSummary>
        Showing {pg.startIndex + 1}–{pg.endIndex} of 97
      </PaginationSummary>
      <NumberedList {...pg} />
      <PaginationTrailing>
        {/* flex-shrink:0 so the docs preview's min-inline-size:0 release can't
            squeeze the label to nothing beside the Select. */}
        <span className="docs-example-caption" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
          Go to
        </span>
        <Select
          native
          size="sm"
          value={String(pg.page)}
          onValueChange={(v) => pg.setPage(Number(v))}
          aria-label="Go to page"
        >
          {Array.from({ length: pg.pageCount }, (_, i) => (
            <SelectItem key={i} value={String(i + 1)}>
              {i + 1}
            </SelectItem>
          ))}
        </Select>
      </PaginationTrailing>
    </Pagination>
  );
}

/**
 * Pagination's page content.
 *
 * A registry-only compound: you compose the row from parts, and the headless
 * `usePagination` hook supplies the page state and the truncated range (`items`,
 * a mix of `page` and `gap` entries). That split is the point — the hook works
 * against any data source, and the styled row knows nothing about where the
 * pages came from. It composes `button` and `dropdown` (the ellipsis menu).
 *
 * Registry-only, so its snippets are the copied parts whichever mode you read;
 * `usePagination` comes from `@primitiv-ui/react` in every case.
 */
/**
 * Pagination as Elements markup: every page a real link, rendered by the server
 * for the current page. The window is fixed here (page 3 of 10) — the page
 * computes it, as `usePagination` does in React.
 */
const paginationHtml = ({
  size = "md",
  variant = "numbered",
  label = "Results",
  summary = false,
  jump = false,
  indent = "",
}: {
  size?: string;
  variant?: string;
  label?: string;
  summary?: boolean;
  jump?: boolean;
  indent?: string;
} = {}) => {
  const button = (kind: string, extra: string) => `class="${extra} primitiv-button primitiv-button--${kind} primitiv-button--${size}"`;
  const nav = (dir: "previous" | "next", page: number) =>
    `<li class="primitiv-pagination__cell"><a ${button("ghost", "primitiv-pagination__nav")} href="?page=${page}" aria-label="Go to ${dir} page">${glyph(dir === "previous" ? "chevron-left" : "chevron-right")}</a></li>`;
  const page = (n: number) =>
    n === 3
      ? `<li class="primitiv-pagination__cell"><a ${button("primary", "primitiv-pagination__item")} href="?page=3" aria-current="page"><span class="primitiv-button__label">3</span></a></li>`
      : `<li class="primitiv-pagination__cell"><a ${button("secondary", "primitiv-pagination__item")} href="?page=${n}"><span class="primitiv-button__label">${n}</span></a></li>`;
  const cells =
    variant === "compact"
      ? [nav("previous", 2), `<li class="primitiv-pagination__cell"><span class="primitiv-pagination__status">Page 3 of 10</span></li>`, nav("next", 4)]
      : [
          nav("previous", 2),
          ...[1, 2, 3, 4, 5].map(page),
          `<li class="primitiv-pagination__cell"><span class="primitiv-pagination__ellipsis" aria-hidden="true">...</span></li>`,
          page(10),
          nav("next", 4),
        ];
  return [
    `<nav class="primitiv-pagination primitiv-pagination--${variant} primitiv-pagination--${size}" aria-label="${label}">`,
    ...(summary ? [`  <span class="primitiv-pagination__summary">Showing 21–30 of 97</span>`] : []),
    `  <ul class="primitiv-pagination__controls">`,
    ...cells.map((c) => `    ${c}`),
    `  </ul>`,
    ...(jump
      ? [
          `  <span class="primitiv-pagination__trailing">`,
          `    <form method="get" style="display: flex; align-items: center; gap: 0.5rem">`,
          `      <label for="jump">Go to</label>`,
          `      <select id="jump" name="page">${Array.from({ length: 10 }, (_, i) => `<option${i === 2 ? " selected" : ""}>${i + 1}</option>`).join("")}</select>`,
          `      <button type="submit" class="primitiv-button primitiv-button--secondary primitiv-button--sm"><span class="primitiv-button__label">Go</span></button>`,
          `    </form>`,
          `  </span>`,
        ]
      : []),
    `</nav>`,
  ]
    .map((l) => indent + l)
    .join("\n");
};

const fullWidth = (_density: unknown, code: string) => `<div style="inline-size: 100%">${withGlyphs(code)}</div>`;

export const paginationSpec: ComponentSpec = {
  playground: {
    component: "Pagination",
    fill: true,
    snippet: (values, mode) =>
      mode === "elements"
        ? paginationHtml({ size: values.size, variant: values.variant })
        : values.variant === "compact"
        ? [
            imports(),
            ``,
            `const { page, pageCount, next, previous, canPrevious, canNext } =`,
            `  usePagination({ totalItems, pageSize: 10 });`,
            ``,
            `<Pagination variant="compact" size="${values.size}" label="Results">`,
            `  <PaginationList>`,
            `    <PaginationItem><PaginationPrevious disabled={!canPrevious} onClick={previous} /></PaginationItem>`,
            `    <PaginationItem><PaginationStatus>Page {page} of {pageCount}</PaginationStatus></PaginationItem>`,
            `    <PaginationItem><PaginationNext disabled={!canNext} onClick={next} /></PaginationItem>`,
            `  </PaginationList>`,
            `</Pagination>`,
          ].join("\n")
        : [
            imports(),
            ``,
            `const { page, items, setPage, next, previous, canPrevious, canNext } =`,
            `  usePagination({ totalItems, pageSize: 10 });`,
            ``,
            `<Pagination size="${values.size}" label="Results">`,
            `  <PaginationList>`,
            `    <PaginationItem><PaginationPrevious disabled={!canPrevious} onClick={previous} /></PaginationItem>`,
            `    {items.map((item) =>`,
            `      item.type === "page" ? (`,
            `        <PaginationItem key={item.page}>`,
            `          <PaginationLink isActive={item.page === page} onClick={() => setPage(item.page)}>`,
            `            {item.page}`,
            `          </PaginationLink>`,
            `        </PaginationItem>`,
            `      ) : (/* an ellipsis menu of the hidden pages */)`,
            `    )}`,
            `    <PaginationItem><PaginationNext disabled={!canNext} onClick={next} /></PaginationItem>`,
            `  </PaginationList>`,
            `</Pagination>`,
          ].join("\n"),
    elementsPreview: (code) => fullWidth(null, code),
    render: (values) => (
      <div style={{ inlineSize: "100%" }}>
        <PlaygroundPagination variant={values.variant as Variant} size={values.size as Size} />
      </div>
    ),
  },

  anatomyMeta:
    "`Pagination` is the `<nav>` landmark (name it with `label`, and give it `variant` / `size`). Inside, a `PaginationList` (`<ul>`) holds `PaginationItem` (`<li>`) cells: `PaginationPrevious` / `PaginationNext` chevrons, `PaginationLink`s for the pages (`isActive` sets `aria-current`), and a `PaginationEllipsis` whose children are `PaginationMenuItem`s — the dropdown of collapsed pages. The compact variant swaps the number cells for a `PaginationStatus` readout. `PaginationSummary` (before the list) and `PaginationTrailing` (after) are optional slots for a “showing X–Y” line and a jump-to control. The page state itself is the `usePagination` hook's, not the markup's.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) =>
        mode === "elements"
          ? [
              `<nav class="primitiv-pagination" aria-label="Results">`,
              `  <span class="primitiv-pagination__summary">…</span>          <!-- optional -->`,
              `  <ul class="primitiv-pagination__controls">`,
              `    <li class="primitiv-pagination__cell"><a class="primitiv-pagination__nav primitiv-button">…</a></li>`,
              `    <li class="primitiv-pagination__cell"><a class="primitiv-pagination__item primitiv-button" aria-current="page">1</a></li>`,
              `    <li class="primitiv-pagination__cell"><span class="primitiv-pagination__ellipsis">...</span></li>`,
              `  </ul>`,
              `  <span class="primitiv-pagination__trailing">…</span>        <!-- optional -->`,
              `</nav>`,
            ].join("\n")
          : [
          `<Pagination label="Results">`,
          `  <PaginationSummary>…</PaginationSummary>          {/* optional */}`,
          `  <PaginationList>`,
          `    <PaginationItem><PaginationPrevious /></PaginationItem>`,
          `    <PaginationItem><PaginationLink isActive>1</PaginationLink></PaginationItem>`,
          `    <PaginationItem>`,
          `      <PaginationEllipsis><PaginationMenuItem>…</PaginationMenuItem></PaginationEllipsis>`,
          `    </PaginationItem>`,
          `    <PaginationItem><PaginationNext /></PaginationItem>`,
          `  </PaginationList>`,
          `  <PaginationTrailing>…</PaginationTrailing>        {/* optional */}`,
          `</Pagination>`,
        ].join("\n"),
    },
  ],

  examples: [
    {
      id: "numbered",
      title: "Numbered pages",
      render: () => (
        <InteractiveExample
          elementsCaption={'The default: a row of page cells between previous and next chevrons, each a real link to its page — the server renders the window around the current one. The cells are Button\'s classes on an `<a>`; adding pagination installs Button with it. The current page is marked with `aria-current="page"` as well as the primary fill, and the gap is a static `...` hidden from assistive tech.'}
          elementsPreview={fullWidth}
          caption="The default: a row of page cells between prev/next chevrons, driven by `usePagination`. The hook returns `items` — a mix of `page` and `gap` entries — so a long range collapses behind a `PaginationEllipsis` whose menu lists the hidden pages (this demo is 10 pages; click the `…`). `isActive` on the current `PaginationLink` is what sets `aria-current=&quot;page&quot;`; disable the chevrons from `canPrevious` / `canNext`."
          code={(_density, mode) =>
            mode === "elements"
              ? paginationHtml({ label: "Search results" })
              : [
              imports(),
              ``,
              `const { page, items, setPage, next, previous, canPrevious, canNext } =`,
              `  usePagination({ totalItems: rows.length, pageSize: 10 });`,
              ``,
              `<Pagination label="Search results">`,
              `  <PaginationList>`,
              `    <PaginationItem><PaginationPrevious disabled={!canPrevious} onClick={previous} /></PaginationItem>`,
              `    {items.map((item, i) =>`,
              `      item.type === "page" ? (`,
              `        <PaginationItem key={\`p-\${item.page}\`}>`,
              `          <PaginationLink isActive={item.page === page} onClick={() => setPage(item.page)}>`,
              `            {item.page}`,
              `          </PaginationLink>`,
              `        </PaginationItem>`,
              `      ) : (`,
              `        <PaginationItem key={\`g-\${i}\`}>`,
              `          <PaginationEllipsis>`,
              `            {item.pages.map((h) => (`,
              `              <PaginationMenuItem key={h} onSelect={() => setPage(h)}>{h}</PaginationMenuItem>`,
              `            ))}`,
              `          </PaginationEllipsis>`,
              `        </PaginationItem>`,
              `      ),`,
              `    )}`,
              `    <PaginationItem><PaginationNext disabled={!canNext} onClick={next} /></PaginationItem>`,
              `  </PaginationList>`,
              `</Pagination>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <NumberedDemo label="Search results" />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "compact",
      title: "Compact",
      render: () => (
        <InteractiveExample
          elementsCaption={'`primitiv-pagination--compact` drops the number cells for a `__status` readout between the chevrons — for narrow containers, where a row of numbers would not fit.'}
          elementsPreview={fullWidth}
          caption="`variant=&quot;compact&quot;` drops the number cells for a `PaginationStatus` readout between the chevrons — for narrow containers, and the intended default in a data-table footer. Same hook, less chrome: you show `Page {page} of {pageCount}` instead of every cell."
          code={(_density, mode) =>
            mode === "elements"
              ? paginationHtml({ variant: "compact" })
              : [
              imports(),
              ``,
              `const { page, pageCount, next, previous, canPrevious, canNext } =`,
              `  usePagination({ totalItems: rows.length, pageSize: 10 });`,
              ``,
              `<Pagination variant="compact" label="Results">`,
              `  <PaginationList>`,
              `    <PaginationItem><PaginationPrevious disabled={!canPrevious} onClick={previous} /></PaginationItem>`,
              `    <PaginationItem><PaginationStatus>Page {page} of {pageCount}</PaginationStatus></PaginationItem>`,
              `    <PaginationItem><PaginationNext disabled={!canNext} onClick={next} /></PaginationItem>`,
              `  </PaginationList>`,
              `</Pagination>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <CompactDemo />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "summary-jump",
      title: "Summary and jump-to",
      render: () => (
        <InteractiveExample
          elementsCaption={'Two optional slots wrap the list: a `__summary` before it for a “showing X–Y of N” line, and a `__trailing` slot after it — here a small GET form that jumps straight to a page, with no script at all.'}
          elementsPreview={fullWidth}
          caption="Two optional slots wrap the list: `PaginationSummary` before it for a “showing X–Y of N” line (from the hook's `startIndex` / `endIndex`), and `PaginationTrailing` after it for a jump-to control — a native `Select` here, so far pages are one action away rather than many clicks. Omit either and nothing renders."
          code={(_density, mode) =>
            mode === "elements"
              ? paginationHtml({ summary: true, jump: true })
              : [
              imports(),
              `import { Select, SelectItem } from "@/components/ui/select";`,
              ``,
              `<Pagination label="Results">`,
              `  <PaginationSummary>Showing {startIndex + 1}–{endIndex} of {total}</PaginationSummary>`,
              `  <PaginationList>{/* … prev / pages / next … */}</PaginationList>`,
              `  <PaginationTrailing>`,
              `    <span>Go to</span>`,
              `    <Select native value={String(page)} onValueChange={(v) => setPage(Number(v))} aria-label="Go to page">`,
              `      {pages.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}`,
              `    </Select>`,
              `  </PaginationTrailing>`,
              `</Pagination>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <SummaryJumpDemo />
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
          elementsCaption={"Five sizes, each rescaling again with the nearest `data-density` ancestor. Give the cells' Button classes the same size as the pagination, so they stay square."}
          elementsPreview={(_density, code) => `<div style="display: flex; flex-direction: column; gap: 1rem; inline-size: 100%">${withGlyphs(code.split("\n").slice(1, -1).map((l) => l.slice(2)).join("\n"))}</div>`}
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor — the same `framed-control/*` scale the chevrons and cells share with Button and Input, so a pagination row lines up with the controls around it."
          code={(density, mode) =>
            mode === "elements"
              ? [
                  `<div data-density="${density}">`,
                  ...(["sm", "md", "lg"] as const).map((size) => paginationHtml({ size, label: `Results ${size}`, indent: "  " })),
                  `</div>`,
                ].join("\n")
              : [
              imports(),
              ``,
              `<div data-density="${density}">`,
              `  <Pagination size="sm" label="Results">{/* … */}</Pagination>`,
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", inlineSize: "100%" }}>
              {(["sm", "md", "lg"] as const).map((size) => (
                <NumberedDemo key={size} size={size} totalItems={30} label={`Results ${size}`} />
              ))}
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "Links between pages of results: `primitiv-pagination` with a variant and a size on a `<nav>`, a `__controls` list of `__cell` items, and Button's classes on each page link. Optional `__summary` and `__trailing` slots sit either side.",
    anatomyMeta:
      "The `<nav>` is the landmark; `__controls` is the `<ul>` and each `__cell` an `<li>`. Page links carry `__item` plus Button's classes, the chevrons `__nav`, the gap a static `__ellipsis`, and the compact readout `__status`.",
    accessibility: [
      "**It is a `<nav>` landmark — name it** with `aria-label`, since a page can have more than one navigation landmark.",
      "**Mark the current page with `aria-current=\"page\"`**, not only the primary fill — that is how assistive tech announces where you are.",
      "**The chevrons are icon-only**, so each needs an `aria-label` (“Go to next page”).",
      "**The ellipsis is decoration here**: `aria-hidden=\"true\"`. The pages it stands for are still reachable through the neighbouring links and the jump form.",
      "**Use links when each page is a URL.** `<a href=\"?page=3\">` gives you back/forward, bookmarking and crawling for free.",
    ],
  },

  accessibility: [
    "**It is a `<nav>` landmark — name it.** `Pagination` renders a `<nav>` and needs a `label` (`aria-label`), since a page can have more than one navigation landmark; “Search results” or “Table pages” distinguishes them in a screen reader's landmark list.",
    "**The current page is marked with `aria-current`, not just colour.** `isActive` on a `PaginationLink` sets `aria-current=\"page\"`, which is how assistive technology announces which page you are on — the highlight alone is invisible to it.",
    "**Prev/next carry their own names and disabled state.** `PaginationPrevious` / `PaginationNext` are icon-only, so they set an `aria-label` (`Go to previous page`) themselves; wire `disabled` from `canPrevious` / `canNext` so the first/last page can't be over-stepped.",
    "**The ellipsis is a real menu, not decoration.** `PaginationEllipsis` opens a `dropdown` of the collapsed pages (`PaginationMenuItem`s), so every page stays reachable by keyboard — a bare “…” glyph would strand the hidden pages.",
    "**Links or buttons?** These are `button`-based controls driving client state, not `<a href>`s — right for a SPA. If each page is a real URL, render `PaginationLink` `asChild` around your router's link so they are genuine, right-clickable links.",
    "**The state is the hook's, the arithmetic is too.** `usePagination` clamps out-of-range requests and computes the truncated range, so you don't hand-roll off-by-one page maths that a keyboard or screen-reader user then trips over.",
  ],
};
