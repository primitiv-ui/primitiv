"use client";

import { BreadcrumbLink, BreadcrumbPage } from "@/components/breadcrumb";
import { BreadcrumbOverflow } from "@/components/breadcrumb-overflow";
import { indent } from "@/lib/playground";
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

type Crumb = { label: string; href?: string };

const TRAIL: readonly Crumb[] = [...CRUMBS, { label: "Neuromancer" }];

/** A crumb in the trail: a link, or the current page. */
const crumbHtml = ({ label, href }: Crumb) =>
  href
    ? `<a class="primitiv-breadcrumb__link" href="${href}">${label}</a>`
    : `<span class="primitiv-breadcrumb__page" aria-current="page">${label}</span>`;

const SEPARATOR = `<li class="primitiv-breadcrumb__separator" role="presentation" aria-hidden="true">/</li>`;

/**
 * The trail as Elements markup (RFC 0033). Breadcrumb Overflow has no element
 * of its own: it is the Breadcrumb's plain markup with a `<primitiv-dropdown>`
 * in the collapsed crumb, the same composition React renders — so the hidden
 * crumbs are the menu's items, each decorating its own link. It collapses by
 * the React component's rule: only when more than one crumb would be hidden.
 */
const elementsTrail = ({
  keepStart = 1,
  keepEnd = 1,
  size = "md",
  crumbs = TRAIL,
}: { keepStart?: number; keepEnd?: number; size?: string; crumbs?: readonly Crumb[] } = {}) => {
  const collapse = crumbs.length - keepStart - keepEnd > 1;
  const leading = collapse ? crumbs.slice(0, keepStart) : [];
  const hidden = collapse ? crumbs.slice(keepStart, crumbs.length - keepEnd) : [];
  const trailing = collapse ? crumbs.slice(crumbs.length - keepEnd) : crumbs;
  const item = (crumb: Crumb) => `<li class="primitiv-breadcrumb__item">${crumbHtml(crumb)}</li>`;
  const overflow = [
    `<li class="primitiv-breadcrumb__item">`,
    `  <primitiv-dropdown>`,
    `    <primitiv-dropdown-trigger>`,
    `      <button type="button" class="primitiv-breadcrumb-overflow__trigger" aria-label="Show hidden pages"><span class="primitiv-breadcrumb__ellipsis" role="presentation" aria-hidden="true">...</span></button>`,
    `    </primitiv-dropdown-trigger>`,
    `    <primitiv-dropdown-content class="primitiv-dropdown primitiv-dropdown--${size} primitiv-dropdown--bottom-start" popover="auto">`,
    ...hidden.map(
      (crumb) =>
        `      <primitiv-dropdown-item><a class="primitiv-breadcrumb__link primitiv-dropdown__item" href="${crumb.href}">${crumb.label}</a></primitiv-dropdown-item>`,
    ),
    `    </primitiv-dropdown-content>`,
    `  </primitiv-dropdown>`,
    `</li>`,
  ].join("\n");
  const entries = [...leading.map(item), ...(collapse ? [overflow] : []), ...trailing.map(item)];
  return [
    `<nav aria-label="Breadcrumb" class="primitiv-breadcrumb primitiv-breadcrumb--${size} primitiv-breadcrumb-overflow">`,
    `  <ol class="primitiv-breadcrumb__list">`,
    ...entries.flatMap((entry, index) => [...(index > 0 ? [`    ${SEPARATOR}`] : []), indent(entry, "    ")]),
    `  </ol>`,
    `</nav>`,
  ].join("\n");
};

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
    snippet: (values, mode) =>
      mode === "elements"
        ? elementsTrail({ keepStart: Number(values.keepStart), keepEnd: Number(values.keepEnd), size: values.size })
        : [
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
          caption="Pass the crumbs as flat `BreadcrumbLink`s ending in a `BreadcrumbPage`, and BreadcrumbOverflow keeps `keepStart` at the front and `keepEnd` at the back, folding the middle behind an ellipsis. **Click the `...`** — it opens a real menu of the hidden crumbs (a `Dropdown`), so nothing is lost. The anchor wiring is handled for you: it derives a unique `anchor-name` from `useId()`, so two of these on one page don't collide."
          elementsCaption="There is no Breadcrumb Overflow element: write the Breadcrumb's markup with the collapsed crumbs inside a `<primitiv-dropdown>` in their place, and load Dropdown's script. **Click the `...`** — it opens a real menu of the hidden crumbs, each `<a>` decorated as a menu item, so nothing is lost. The menu opens anchored to its trigger with no `anchor-name` to wire, so two trails on one page never collide. You choose what to collapse when you render the page; the markup holds no rule of its own."
          code={(_density, mode) =>
            mode === "elements"
              ? elementsTrail()
              : [
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
      elementsTitle: "Choosing what to keep",
      render: () => (
        <InteractiveExample
          caption="`keepStart` / `keepEnd` are separate axes, not a single `maxVisible`, so you choose how many crumbs anchor each end independently — keep two at the front (`Home / Library / ... / Neuromancer`) when the top of the hierarchy is the useful context, or two at the back when the leaf's neighbours are. The middle collapses only when more than one crumb would be hidden; otherwise every crumb shows."
          elementsCaption="How many crumbs anchor each end is your call when you render the trail — keep two at the front (`Home / Library / ... / Neuromancer`) when the top of the hierarchy is the useful context, or two at the back when the leaf's neighbours are. Only the crumbs you move into the menu are hidden; collapse only when more than one would be, since a menu of one saves no space."
          code={(_density, mode) =>
            mode === "elements"
              ? elementsTrail({ keepStart: 2 })
              : [
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
          elementsCaption="When the trail fits there is nothing to collapse: render the plain Breadcrumb markup, with no dropdown at all. Dropdown's script can stay on the page; it upgrades nothing until a trail needs a menu."
          code={(_density, mode) =>
            mode === "elements"
              ? elementsTrail({ crumbs: [CRUMBS[0], CRUMBS[1], { label: "Neuromancer" }] })
              : [
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
          elementsCaption="The `primitiv-breadcrumb--sm` ... `--xl` class sizes the trail and the trigger, and the matching `primitiv-dropdown--` size class sizes the menu, so keep the two in step. Each size rescales again with the nearest `data-density` ancestor."
          elementsPreview={(density) =>
            [
              `<div data-density="${density}" class="primitiv-stack primitiv-stack--column primitiv-stack--gap-sm primitiv-stack--align-stretch primitiv-stack--nowrap primitiv-stack--justify-start">`,
              ...(["sm", "md", "lg"] as const).map((size) => indent(elementsTrail({ size }))),
              `</div>`,
            ].join("\n")
          }
          code={(density, mode) =>
            mode === "elements"
              ? [`<div data-density="${density}">`, indent(elementsTrail({ size: "sm" })), `</div>`].join("\n")
              : [
              imports(),
              ``,
              `<div data-density="${density}">`,
              `  <BreadcrumbOverflow size="sm" keepStart={1} keepEnd={1}>{/* ... */}</BreadcrumbOverflow>`,
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

  elements: {
    description:
      "A breadcrumb trail whose middle crumbs fold behind a `...` menu. There is no element of its own: it is the Breadcrumb's markup with a `<primitiv-dropdown>` in the collapsed crumb, so load Dropdown's script, and each hidden crumb's link becomes a menu item. Nothing folds by itself here, unlike React's `keepStart` and `keepEnd`: your server chooses which crumbs stay in the trail and writes the rest into the menu.",
    anatomyMeta:
      "Breadcrumb's `<nav>`, `<ol>`, items and separators, written as plain markup, with one crumb holding a `<primitiv-dropdown>`: its `<primitiv-dropdown-trigger>` wraps the `...` `<button class=\"primitiv-breadcrumb-overflow__trigger\">`, and its `<primitiv-dropdown-content>` holds one `<primitiv-dropdown-item>` per hidden crumb, each wrapping that crumb's own `<a>`. The menu is anchored to the trigger by the element, with no `anchor-name` to wire.",
    keyboardMeta:
      "The only interactive part beyond the crumb links is the `...` trigger, which opens a Dropdown of the hidden crumbs. Its keyboard model is the Dropdown's.",
    keyboard: [
      { keys: ["Enter", "Space"], behaviour: "Open the overflow menu when the `...` trigger is focused." },
      { keys: ["ArrowDown", "ArrowUp"], behaviour: "Move between the hidden crumbs once the menu is open." },
      { keys: ["Enter"], behaviour: "Follow the focused crumb's link." },
      { keys: ["Escape"], behaviour: "Close the menu and return focus to the `...` trigger." },
    ],
    accessibility: [
      "**The hidden crumbs stay reachable.** The `...` is a real menu button opening a Dropdown of the collapsed crumbs, so every ancestor page is still navigable by keyboard and screen reader — unlike Breadcrumb's decorative ellipsis.",
      "**Name the trigger.** It shows only `...`, so give the `<button>` an `aria-label` that says what it does, such as `Show 3 hidden pages`.",
      "**It is still a breadcrumb `<nav>`.** Name it, and mark the last crumb as the current page with `aria-current=\"page\"` on a non-link.",
      "Each hidden crumb's `<a>` keeps its `href`, so following it from the menu is ordinary navigation — a server-rendered site needs no script beyond Dropdown's.",
    ],
  },

  keyboardMeta:
    "The only interactive part beyond the crumb links is the overflow trigger — the `...` button, which opens a `Dropdown` of the hidden crumbs. Its keyboard model is the Dropdown's.",
  keyboard: [
    { keys: ["Enter"], behaviour: "Open the overflow menu when the `...` trigger is focused." },
    { keys: ["Space"], behaviour: "Also opens the overflow menu — it is a real `<button>`." },
    {
      keys: ["ArrowDown", "ArrowUp"],
      behaviour: "Move between the hidden crumbs once the menu is open (the Dropdown's roving focus).",
    },
    { keys: ["Escape"], behaviour: "Close the menu and return focus to the `...` trigger." },
  ],

  accessibility: [
    "**The hidden crumbs stay reachable.** Unlike a bare `Breadcrumb.Ellipsis` (a decorative `...`), BreadcrumbOverflow's ellipsis is a real menu button opening a `Dropdown` of the collapsed crumbs — so every ancestor page is still navigable by keyboard and screen reader, not just by sight.",
    "**Name the overflow trigger.** It is icon-only, so pass `menuLabel` (e.g. `Show 3 hidden pages`) for a name that says what the `...` does; a bare ellipsis announces nothing useful.",
    "**It is still a breadcrumb `<nav>`.** The same landmark and `aria-current=\"page\"` current-page rules as `Breadcrumb` apply — the last child should be a `BreadcrumbPage`, not a link.",
    "**Two on a page won't collide.** Anchor positioning needs a unique `anchor-name` per instance; BreadcrumbOverflow derives its own from `useId()`, so you can render several without the menus fighting over one anchor — no wiring needed on your part.",
    "**Your crumb elements pass through untouched.** The hidden ones are re-rendered inside the menu as-is, so an `href`, click handler or `asChild` router link on a `BreadcrumbLink` keeps working whether it shows in the trail or the overflow menu.",
  ],
};
