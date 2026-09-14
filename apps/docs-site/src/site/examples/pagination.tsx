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
export const paginationSpec: ComponentSpec = {
  playground: {
    component: "Pagination",
    fill: true,
    snippet: (values) =>
      values.variant === "compact"
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
      code: () =>
        [
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
          caption="The default: a row of page cells between prev/next chevrons, driven by `usePagination`. The hook returns `items` — a mix of `page` and `gap` entries — so a long range collapses behind a `PaginationEllipsis` whose menu lists the hidden pages (this demo is 10 pages; click the `…`). `isActive` on the current `PaginationLink` is what sets `aria-current=&quot;page&quot;`; disable the chevrons from `canPrevious` / `canNext`."
          code={() =>
            [
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
          caption="`variant=&quot;compact&quot;` drops the number cells for a `PaginationStatus` readout between the chevrons — for narrow containers, and the intended default in a data-table footer. Same hook, less chrome: you show `Page {page} of {pageCount}` instead of every cell."
          code={() =>
            [
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
          caption="Two optional slots wrap the list: `PaginationSummary` before it for a “showing X–Y of N” line (from the hook's `startIndex` / `endIndex`), and `PaginationTrailing` after it for a jump-to control — a native `Select` here, so far pages are one action away rather than many clicks. Omit either and nothing renders."
          code={() =>
            [
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
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor — the same `framed-control/*` scale the chevrons and cells share with Button and Input, so a pagination row lines up with the controls around it."
          code={(density) =>
            [
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

  accessibility: [
    "**It is a `<nav>` landmark — name it.** `Pagination` renders a `<nav>` and needs a `label` (`aria-label`), since a page can have more than one navigation landmark; “Search results” or “Table pages” distinguishes them in a screen reader's landmark list.",
    "**The current page is marked with `aria-current`, not just colour.** `isActive` on a `PaginationLink` sets `aria-current=\"page\"`, which is how assistive technology announces which page you are on — the highlight alone is invisible to it.",
    "**Prev/next carry their own names and disabled state.** `PaginationPrevious` / `PaginationNext` are icon-only, so they set an `aria-label` (`Go to previous page`) themselves; wire `disabled` from `canPrevious` / `canNext` so the first/last page can't be over-stepped.",
    "**The ellipsis is a real menu, not decoration.** `PaginationEllipsis` opens a `dropdown` of the collapsed pages (`PaginationMenuItem`s), so every page stays reachable by keyboard — a bare “…” glyph would strand the hidden pages.",
    "**Links or buttons?** These are `button`-based controls driving client state, not `<a href>`s — right for a SPA. If each page is a real URL, render `PaginationLink` `asChild` around your router's link so they are genuine, right-clickable links.",
    "**The state is the hook's, the arithmetic is too.** `usePagination` clamps out-of-range requests and computes the truncated range, so you don't hand-roll off-by-one page maths that a keyboard or screen-reader user then trips over.",
  ],
};
