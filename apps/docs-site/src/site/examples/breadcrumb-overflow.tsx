"use client";

import { BreadcrumbLink, BreadcrumbPage } from "@/components/breadcrumb";
import { BreadcrumbOverflow } from "@/components/breadcrumb-overflow";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const CRUMBS = [
  { label: "Home", href: "#home" },
  { label: "Library", href: "#library" },
  { label: "Fiction", href: "#fiction" },
  { label: "Mystery", href: "#mystery" },
];

const imports = () => `import { BreadcrumbOverflow } from "@/components/ui/breadcrumb-overflow";
import { BreadcrumbLink, BreadcrumbPage } from "@/components/ui/breadcrumb";`;

/** The crumb children — flat BreadcrumbLink/BreadcrumbPage, the current page last. */
function crumbChildren() {
  return [
    ...CRUMBS.map((c) => (
      <BreadcrumbLink key={c.href} href={c.href}>
        {c.label}
      </BreadcrumbLink>
    )),
    <BreadcrumbPage key="current">Neuromancer</BreadcrumbPage>,
  ];
}

/** Snippet lines for the crumb children. */
const crumbLines = (indent = "  ") =>
  [
    ...CRUMBS.map((c) => `${indent}<BreadcrumbLink href="${c.href}">${c.label}</BreadcrumbLink>`),
    `${indent}<BreadcrumbPage>Neuromancer</BreadcrumbPage>`,
  ];

/**
 * BreadcrumbOverflow's page content.
 *
 * A pre-arranged `Breadcrumb` that collapses its middle entries behind an
 * overflow menu once the trail has more crumbs than `keepStart + keepEnd` can
 * show; below that threshold it renders every crumb, exactly like a plain
 * `Breadcrumb`. It composes the registry `breadcrumb` and `dropdown` — the
 * ellipsis opens a real menu of the hidden crumbs.
 *
 * Registry-only and hand-authored: you pass the crumbs as flat `BreadcrumbLink`
 * / `BreadcrumbPage` children (no data array — same refusal to own a data model
 * as NavigationMenu), and it wraps, separates and collapses them for you. It is
 * NOT a plain `Breadcrumb` variant — reach for it when a trail can grow past
 * the width you have.
 */
export const breadcrumbOverflowSpec: ComponentSpec = {
  playground: {
    component: "BreadcrumbOverflow",
    fill: true,
    controls: [
      {
        name: "keepStart",
        options: ["1", "2"],
        defaultValue: "1",
        description: "How many crumbs to keep at the **start** before the ellipsis.",
      },
      {
        name: "keepEnd",
        options: ["1", "2"],
        defaultValue: "1",
        description: "How many crumbs to keep at the **end** (including the current page).",
      },
      {
        name: "size",
        options: ["xs", "sm", "md", "lg", "xl"],
        defaultValue: "md",
        description: "Matches `Breadcrumb`'s size, and sizes the overflow trigger and menu.",
      },
    ],
    snippet: (values) =>
      [
        imports(),
        ``,
        `<BreadcrumbOverflow keepStart={${values.keepStart}} keepEnd={${values.keepEnd}} size="${values.size}">`,
        ...crumbLines(),
        `</BreadcrumbOverflow>`,
      ].join("\n"),
    render: (values) => (
      <div style={{ inlineSize: "100%" }}>
        <BreadcrumbOverflow
          keepStart={Number(values.keepStart)}
          keepEnd={Number(values.keepEnd)}
          size={values.size as Size}
        >
          {crumbChildren()}
        </BreadcrumbOverflow>
      </div>
    ),
  },

  examples: [
    {
      id: "collapsing",
      title: "Collapsing a long trail",
      render: () => (
        <InteractiveExample
          caption="Pass the crumbs as flat `BreadcrumbLink`s ending in a `BreadcrumbPage`, and BreadcrumbOverflow keeps `keepStart` at the front and `keepEnd` at the back, folding the middle behind an ellipsis. **Click the `…`** — it opens a real menu of the hidden crumbs (a `Dropdown`), so nothing is lost. The anchor wiring is handled for you: it derives a unique `anchor-name` from `useId()`, so two of these on one page don't collide."
          code={() =>
            [
              imports(),
              ``,
              `<BreadcrumbOverflow keepStart={1} keepEnd={1}>`,
              ...crumbLines(),
              `</BreadcrumbOverflow>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <BreadcrumbOverflow keepStart={1} keepEnd={1}>
                {crumbChildren()}
              </BreadcrumbOverflow>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "keep",
      title: "keepStart and keepEnd",
      render: () => (
        <InteractiveExample
          caption="`keepStart` / `keepEnd` are separate axes, not a single `maxVisible`, so you choose how many crumbs anchor each end independently — keep two at the front (`Home / Library / … / Neuromancer`) when the top of the hierarchy is the useful context, or two at the back when the leaf's neighbours are. The middle collapses only when more than one crumb would be hidden; otherwise every crumb shows."
          code={() =>
            [
              imports(),
              ``,
              `<BreadcrumbOverflow keepStart={2} keepEnd={1}>`,
              ...crumbLines(),
              `</BreadcrumbOverflow>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <BreadcrumbOverflow keepStart={2} keepEnd={1}>
                {crumbChildren()}
              </BreadcrumbOverflow>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "below-threshold",
      title: "Below the threshold",
      render: () => (
        <InteractiveExample
          caption="When the trail fits — `keepStart + keepEnd` covers it, with at most one crumb that would be hidden — nothing collapses and no menu appears: it renders every crumb exactly like a plain `Breadcrumb`. So you can wire BreadcrumbOverflow up unconditionally and it only reaches for the ellipsis when the trail actually outgrows the space."
          code={() =>
            [
              imports(),
              ``,
              `{/* three crumbs, keepStart 1 + keepEnd 1 → nothing to collapse */}`,
              `<BreadcrumbOverflow keepStart={1} keepEnd={1}>`,
              `  <BreadcrumbLink href="#home">Home</BreadcrumbLink>`,
              `  <BreadcrumbLink href="#library">Library</BreadcrumbLink>`,
              `  <BreadcrumbPage>Neuromancer</BreadcrumbPage>`,
              `</BreadcrumbOverflow>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <BreadcrumbOverflow keepStart={1} keepEnd={1}>
                <BreadcrumbLink href="#home">Home</BreadcrumbLink>
                <BreadcrumbLink href="#library">Library</BreadcrumbLink>
                <BreadcrumbPage>Neuromancer</BreadcrumbPage>
              </BreadcrumbOverflow>
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
          caption="`size` matches `Breadcrumb`'s own scale and also sizes the overflow trigger and its menu, so the whole trail stays consistent. Each size rescales again with the nearest `data-density` ancestor."
          code={(density) =>
            [
              imports(),
              ``,
              `<div data-density="${density}">`,
              `  <BreadcrumbOverflow size="sm" keepStart={1} keepEnd={1}>{/* … */}</BreadcrumbOverflow>`,
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", inlineSize: "100%" }}>
              {(["sm", "md", "lg"] as const).map((size) => (
                <BreadcrumbOverflow key={size} size={size} keepStart={1} keepEnd={1}>
                  {crumbChildren()}
                </BreadcrumbOverflow>
              ))}
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  keyboardMeta:
    "The only interactive part beyond the crumb links is the overflow trigger — the `…` button, which opens a `Dropdown` of the hidden crumbs. Its keyboard model is the Dropdown's.",
  keyboard: [
    { keys: ["Enter"], behaviour: "Open the overflow menu when the `…` trigger is focused." },
    { keys: ["Space"], behaviour: "Also opens the overflow menu — it is a real `<button>`." },
    {
      keys: ["ArrowDown", "ArrowUp"],
      behaviour: "Move between the hidden crumbs once the menu is open (the Dropdown's roving focus).",
    },
    { keys: ["Escape"], behaviour: "Close the menu and return focus to the `…` trigger." },
  ],

  accessibility: [
    "**The hidden crumbs stay reachable.** Unlike a bare `Breadcrumb.Ellipsis` (a decorative `…`), BreadcrumbOverflow's ellipsis is a real menu button opening a `Dropdown` of the collapsed crumbs — so every ancestor page is still navigable by keyboard and screen reader, not just by sight.",
    "**Name the overflow trigger.** It is icon-only, so pass `menuLabel` (e.g. `Show 3 hidden pages`) for a name that says what the `…` does; a bare ellipsis announces nothing useful.",
    "**It is still a breadcrumb `<nav>`.** The same landmark and `aria-current=\"page\"` current-page rules as `Breadcrumb` apply — the last child should be a `BreadcrumbPage`, not a link.",
    "**Two on a page won't collide.** Anchor positioning needs a unique `anchor-name` per instance; BreadcrumbOverflow derives its own from `useId()`, so you can render several without the menus fighting over one anchor — no wiring needed on your part.",
    "**Your crumb elements pass through untouched.** The hidden ones are re-rendered inside the menu as-is, so an `href`, click handler or `asChild` router link on a `BreadcrumbLink` keeps working whether it shows in the trail or the overflow menu.",
  ],
};
