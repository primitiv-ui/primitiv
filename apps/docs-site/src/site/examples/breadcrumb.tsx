"use client";

import { Fragment } from "react";

import { ChevronRight } from "@primitiv-ui/icons";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/breadcrumb";
import { importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import { glyph, withGlyphs } from "./glyphs";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const imports = (mode: Mode) =>
  importBlock({
    mode,
    component: "Breadcrumb",
    componentId: "breadcrumb",
    parts: ["List", "Item", "Link", "Page", "Separator", "Ellipsis"],
  });

const TRAIL = [
  { label: "Home", href: "#home" },
  { label: "Components", href: "#components" },
  { label: "Disclosure", href: "#disclosure" },
];

/** A full trail: ancestor links, manual separators, and the current Page. */
function Trail({ size, sep }: { size?: Size; sep?: "slash" | "chevron" }) {
  return (
    <Breadcrumb size={size}>
      <BreadcrumbList>
        {TRAIL.map((crumb) => (
          <Fragment key={crumb.href}>
            <BreadcrumbItem>
              <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>{sep === "chevron" ? <ChevronRight /> : undefined}</BreadcrumbSeparator>
          </Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** Snippet lines for a trail, mode-aware. */
const trailLines = (mode: Mode, { sep = "slash" }: { sep?: "slash" | "chevron" } = {}): string[] => {
  const p = partNamer(mode, "Breadcrumb");
  const separator =
    sep === "chevron" ? `<${p("Separator")}><ChevronRight /></${p("Separator")}>` : `<${p("Separator")} />`;
  return [
    `<${p("Root")}>`,
    `  <${p("List")}>`,
    `    <${p("Item")}><${p("Link")} href="/">Home</${p("Link")}></${p("Item")}>`,
    `    ${separator}`,
    `    <${p("Item")}><${p("Link")} href="/components">Components</${p("Link")}></${p("Item")}>`,
    `    ${separator}`,
    `    <${p("Item")}><${p("Page")}>Breadcrumb</${p("Page")}></${p("Item")}>`,
    `  </${p("List")}>`,
    `</${p("Root")}>`,
  ];
};

/**
 * Breadcrumb's page content.
 *
 * A `registry` compound and a WAI-ARIA breadcrumb: `Breadcrumb` is the `<nav>`
 * landmark around an ordered `Breadcrumb.List` (`<ol>`) of `Breadcrumb.Item`s.
 * Ancestor pages are `Breadcrumb.Link`s; the **current** page is a
 * `Breadcrumb.Page` (a `<span>`, not a link, carrying `aria-current="page"`).
 * Separators are your own `Breadcrumb.Separator`s between the items — decorative
 * (`aria-hidden`), so screen readers announce a clean list.
 *
 * Non-interactive beyond the links themselves, so no Keyboard section — a trail
 * is Tab-through links, which the platform already handles.
 */
const SEPARATOR = `<li class="primitiv-breadcrumb__separator" role="presentation" aria-hidden="true">/</li>`;
const CHEVRON = `<li class="primitiv-breadcrumb__separator" role="presentation" aria-hidden="true">${glyph("chevron-right")}</li>`;
const link = (href: string, label: string) =>
  `<li class="primitiv-breadcrumb__item"><a class="primitiv-breadcrumb__link" href="${href}">${label}</a></li>`;
const PAGE = `<li class="primitiv-breadcrumb__item"><span class="primitiv-breadcrumb__page" aria-current="page">Breadcrumb</span></li>`;
const ELLIPSIS = `<li class="primitiv-breadcrumb__item"><span class="primitiv-breadcrumb__ellipsis" role="presentation" aria-hidden="true">...</span></li>`;

/** A trail as Elements markup: a `<nav>` around an `<ol>`, separators hidden. */
const trailHtml = (crumbs: readonly string[], { size = "md", indent = "" } = {}) =>
  [
    `<nav class="primitiv-breadcrumb primitiv-breadcrumb--${size}" aria-label="Breadcrumb">`,
    `  <ol class="primitiv-breadcrumb__list">`,
    ...crumbs.map((c) => `    ${c}`),
    `  </ol>`,
    `</nav>`,
  ]
    .map((l) => indent + l)
    .join("\n");

const TRAIL_HTML = [link("/", "Home"), SEPARATOR, link("/components", "Components"), SEPARATOR, PAGE];

const fullWidth = (_density: unknown, code: string) => `<div style="inline-size: 100%">${withGlyphs(code)}</div>`;

export const breadcrumbSpec: ComponentSpec = {
  playground: {
    component: "Breadcrumb",
    fill: true,
    snippet: (values, mode) =>
      mode === "elements"
        ? trailHtml(TRAIL_HTML, { size: values.size })
        : [imports(mode), ``, ...trailLines(mode)].join("\n"),
    elementsPreview: (code) => fullWidth(null, code),
    render: (values) => (
      <div style={{ inlineSize: "100%" }}>
        <Trail size={values.size as Size} />
      </div>
    ),
  },

  anatomyMeta:
    "`Breadcrumb` is the `<nav>` landmark (label it if a page has more than one). Inside, a `Breadcrumb.List` is the `<ol>`, and each `Breadcrumb.Item` an `<li>`. Ancestor items hold a `Breadcrumb.Link`; the last holds a `Breadcrumb.Page` — a `<span>` with `aria-current=\"page\"`, deliberately not a link, since you can't navigate to where you already are. You place a `Breadcrumb.Separator` (default `/`) between items yourself; it is `aria-hidden`, so it never clutters the announced trail. `Breadcrumb.Ellipsis` stands in for a collapsed run — see `breadcrumb-overflow` for the interactive version.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => (mode === "elements" ? trailHtml(TRAIL_HTML) : trailLines(mode).join("\n")),
    },
  ],

  examples: [
    {
      id: "trail",
      title: "A breadcrumb trail",
      render: () => (
        <InteractiveExample
          elementsCaption={'The trail: a `<nav>` landmark around an `<ol>` of items. Every step but the last is a `__link`; the last is a `__page` — a `<span>` with `aria-current="page"`, **not a link**, since you are already there. The separators are their own hidden list items, so the trail is announced as a clean list of pages.'}
          elementsPreview={fullWidth}
          caption="The trail: a `<nav>` around an `<ol>` of items. Every step but the last is a `Breadcrumb.Link`; the last is a `Breadcrumb.Page`, which is **not a link** and carries `aria-current=&quot;page&quot;` — the reader is already there. Put a `Breadcrumb.Separator` between items; it defaults to `/` and is `aria-hidden`, so assistive technology hears “Home, Components, Disclosure, Breadcrumb”, not the slashes."
          code={(_density, mode) =>
            mode === "elements" ? trailHtml(TRAIL_HTML) : [imports(mode), ``, ...trailLines(mode)].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Trail />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "custom-separator",
      title: "Custom separator",
      render: () => (
        <InteractiveExample
          elementsCaption={'The separator is whatever you put in it — a `/`, or a chevron as here. It stays `role="presentation"` and `aria-hidden` whatever it holds, so the glyph is never read out.'}
          elementsPreview={fullWidth}
          caption="`Breadcrumb.Separator` defaults to a `/` glyph; pass `children` to replace it — a chevron is the common alternative. It stays `aria-hidden` whatever you put in it, so a decorative icon needs no extra ARIA. Keep it consistent across the whole trail."
          code={(_density, mode) =>
            mode === "elements"
              ? trailHtml([link("/", "Home"), CHEVRON, link("/components", "Components"), CHEVRON, PAGE])
              : [
              imports(mode),
              `import { ChevronRight } from "@primitiv-ui/icons";`,
              ``,
              ...trailLines(mode, { sep: "chevron" }),
            ].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Trail sep="chevron" />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "collapsed",
      title: "Collapsing a long trail",
      render: () => (
        <InteractiveExample
          elementsCaption={'A deep trail can collapse its middle behind a `__ellipsis` — a presentational `...` in place of the hidden crumbs. This one is **static**: the crumbs it stands for are gone from the page, for sight and keyboard alike. If they need to stay reachable, keep the full trail instead, or make the ellipsis a link to a page that lists them.'}
          elementsPreview={fullWidth}
          caption="A deep trail can collapse its middle behind a `Breadcrumb.Ellipsis` — a presentational `…` in place of the hidden crumbs. This one is **static**: it just shows the ellipsis. For an ellipsis that actually opens a menu of the hidden pages (and decides how many to keep at each end), reach for [BreadcrumbOverflow](/components/breadcrumb-overflow/), which composes this with a `Dropdown`."
          code={(_density, mode) => {
            if (mode === "elements") return trailHtml([link("/", "Home"), SEPARATOR, ELLIPSIS, SEPARATOR, PAGE]);
            const p = partNamer(mode, "Breadcrumb");
            return [
              imports(mode),
              ``,
              `<${p("Root")}>`,
              `  <${p("List")}>`,
              `    <${p("Item")}><${p("Link")} href="/">Home</${p("Link")}></${p("Item")}>`,
              `    <${p("Separator")} />`,
              `    <${p("Item")}><${p("Ellipsis")} /></${p("Item")}>`,
              `    <${p("Separator")} />`,
              `    <${p("Item")}><${p("Page")}>Breadcrumb</${p("Page")}></${p("Item")}>`,
              `  </${p("List")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#home">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbEllipsis />
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "routing",
      title: "Routing links (asChild)",
      elementsTitle: "Links that are not anchors",
      render: () => (
        <InteractiveExample
          elementsCaption={'The link class styles any element, so it goes straight onto whatever your stack renders for navigation — a server-rendered `<a>`, or an element an htmx attribute turns into a request. Keep it a real link where you can: an `<a href>` is what middle-click, “open in new tab” and crawlers understand.'}
          elementsPreview={fullWidth}
          caption="`Breadcrumb.Link` is a real `<a>` by default — right for plain hrefs. With a routing library, use `asChild` to merge the link styling onto your router's own `<Link>`, so navigation stays client-side without a full reload while the crumb still reads as a link. The current page stays a `Breadcrumb.Page`, never a router link."
          code={(_density, mode) => {
            if (mode === "elements")
              return trailHtml([
                `<li class="primitiv-breadcrumb__item"><a class="primitiv-breadcrumb__link" href="/components" hx-boost="true">Components</a></li>`,
                SEPARATOR,
                PAGE,
              ]);
            const p = partNamer(mode, "Breadcrumb");
            return [
              imports(mode),
              `import Link from "next/link";`,
              ``,
              `<${p("Item")}>`,
              `  <${p("Link")} asChild>`,
              `    <Link href="/components">Components</Link>`,
              `  </${p("Link")}>`,
              `</${p("Item")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <a href="#components">Components</a>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
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
          elementsCaption={'Five sizes, each rescaling again with the nearest `data-density` ancestor. A breadcrumb usually wants to be quiet — a small size under a page title.'}
          elementsPreview={(_density, code) => `<div style="display: flex; flex-direction: column; gap: 0.75rem; inline-size: 100%">${code.split("\n").slice(1, -1).map((l) => l.slice(2)).join("\n")}</div>`}
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor. A breadcrumb usually wants to be quiet — `xs`/`sm` under a page title — so the smaller end of the ramp is the common choice."
          code={(density, mode) =>
            mode === "elements"
              ? [
                  `<div data-density="${density}">`,
                  ...(["sm", "md", "lg"] as const).map((size) => trailHtml(TRAIL_HTML, { size, indent: "  " })),
                  `</div>`,
                ].join("\n")
              : [imports(mode), ``, `<div data-density="${density}">`, ...trailLines(mode).map((l) => `  ${l}`), `</div>`].join(
                  "\n",
                )
          }
        >
          {() => (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", inlineSize: "100%" }}>
              {(["sm", "md", "lg"] as const).map((size) => (
                <Trail key={size} size={size} />
              ))}
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "A trail of links back to the current page: `primitiv-breadcrumb` and a size on a `<nav>`, an `<ol>` list, a `__link` per ancestor, a `__page` for where you are, and `__separator` items between them.",
    anatomyMeta:
      "The `<nav>` is the landmark and the `<ol>` the ordered trail. Each step is a `__item`; ancestors hold a `__link`, the last holds the `__page` span with `aria-current=\"page\"`. Separators are their own hidden `<li>` elements, and a static `__ellipsis` can stand in for collapsed crumbs.",
    accessibility: [
      "**It's a `<nav>` landmark** — give it `aria-label=\"Breadcrumb\"` so it is distinguishable from the page's other navigation.",
      "**The current page is a `__page` span, not a link**, with `aria-current=\"page\"`: that is how assistive tech announces “you are here”.",
      "**Separators are decorative**: `role=\"presentation\"` and `aria-hidden=\"true\"` on each, so the trail is read as a clean list of pages.",
      "**The list is ordered.** An `<ol>`, because the trail has a meaningful sequence from root to current.",
      "**Collapsed crumbs must stay reachable** if they matter. A static ellipsis hides pages from sight and keyboard alike.",
    ],
  },

  accessibility: [
    "**It's a `<nav>` landmark.** `Breadcrumb` renders `<nav>`; if a page has more than one navigation landmark, give it a `label` (`aria-label=\"Breadcrumb\"`) so a screen reader can tell them apart.",
    "**The current page is a `Breadcrumb.Page`, not a link.** It is a `<span>` with `aria-current=\"page\"`, which is how assistive technology announces “you are here”. Making the last crumb a link that points at the current URL is the common mistake — you can't navigate to where you already are.",
    "**Separators are decorative and hidden.** `Breadcrumb.Separator` is `role=\"presentation\"` / `aria-hidden`, so the trail is announced as a clean list of pages without “slash” between each. Whatever glyph you pass stays hidden — no extra ARIA needed.",
    "**The list is ordered.** `Breadcrumb.List` is an `<ol>`, because a trail has a meaningful sequence (root → current); assistive technology conveys the order and position from the real list markup.",
    "**Collapsed crumbs must stay reachable.** A static `Breadcrumb.Ellipsis` hides pages from sight *and* from the keyboard. If the hidden crumbs need to be navigable, use [BreadcrumbOverflow](/components/breadcrumb-overflow/), whose ellipsis opens a real menu, rather than dropping them behind a bare glyph.",
  ],
};
