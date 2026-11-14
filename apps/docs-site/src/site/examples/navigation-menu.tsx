"use client";

import type { CSSProperties } from "react";

import { ChevronDown, ChevronRight, Close, File } from "@primitiv-ui/icons";

import { Button } from "@/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  CollapsibleTriggerIcon,
} from "@/components/collapsible";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/drawer";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuLinkDescription,
  NavigationMenuLinkLeading,
  NavigationMenuLinkText,
  NavigationMenuLinkTitle,
  NavigationMenuLinkTrailing,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuTriggerIcon,
  NavigationMenuTriggerLabel,
  NavigationMenuViewport,
} from "@/components/navigation-menu";
import { importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import { glyph, withGlyphs } from "./glyphs";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Marker = "arrow" | "underline";

/**
 * Two columns of title + description rows — the shape the panel `placement`
 * lives for. Trimmed from the kitchen-sink's five-section mega-menu so the
 * whole nav fits the docs preview column.
 */
const CONCEPTS = [
  { title: "Tokens", description: "The three-tier token architecture" },
  { title: "Density & theming", description: "Four densities, light and dark" },
  { title: "Cascade layers", description: "How the CSS layers stack" },
  { title: "Elevation", description: "Shadow and depth hierarchy" },
];

/** A single-column panel — the default `content-columns` (1fr), no override. */
const RESOURCES = [
  { title: "GitHub", description: "Source, issues and discussions" },
  { title: "Releases", description: "Version history and changelog" },
  { title: "RFCs", description: "Design decisions, written down" },
];

/** The two-column track list, set as an inline custom property. */
const TWO_COLUMNS = {
  "--primitiv-navigation-menu-content-columns": "repeat(2, minmax(0, 1fr))",
} as CSSProperties;

/* ------------------------------------------------------------------ *
 * Live previews
 * ------------------------------------------------------------------ */

/** The reduced docs nav — two disclosures, two plain links, one marker. */
const NavPreview = ({
  size = "md",
  marker = "arrow",
}: {
  size?: Size;
  marker?: Marker;
}) => (
  <NavigationMenu size={size} aria-label="Docs">
    <NavigationMenuList>
      <NavigationMenuItem value="concepts">
        <NavigationMenuTrigger>
          <NavigationMenuTriggerLabel>Concepts</NavigationMenuTriggerLabel>
          <NavigationMenuTriggerIcon>
            <ChevronDown aria-hidden="true" />
          </NavigationMenuTriggerIcon>
        </NavigationMenuTrigger>
        <NavigationMenuContent forceMount style={TWO_COLUMNS}>
          {[CONCEPTS.slice(0, 2), CONCEPTS.slice(2)].map((column, i) => (
            <div key={i}>
              {column.map((row) => (
                <NavigationMenuLink key={row.title} placement="panel" href="#">
                  <NavigationMenuLinkText>
                    <NavigationMenuLinkTitle>{row.title}</NavigationMenuLinkTitle>
                    <NavigationMenuLinkDescription>
                      {row.description}
                    </NavigationMenuLinkDescription>
                  </NavigationMenuLinkText>
                </NavigationMenuLink>
              ))}
            </div>
          ))}
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem value="resources">
        <NavigationMenuTrigger>
          <NavigationMenuTriggerLabel>Resources</NavigationMenuTriggerLabel>
          <NavigationMenuTriggerIcon>
            <ChevronDown aria-hidden="true" />
          </NavigationMenuTriggerIcon>
        </NavigationMenuTrigger>
        <NavigationMenuContent forceMount>
          <div>
            {RESOURCES.map((row) => (
              <NavigationMenuLink key={row.title} placement="panel" href="#">
                <NavigationMenuLinkText>
                  <NavigationMenuLinkTitle>{row.title}</NavigationMenuLinkTitle>
                  <NavigationMenuLinkDescription>
                    {row.description}
                  </NavigationMenuLinkDescription>
                </NavigationMenuLinkText>
              </NavigationMenuLink>
            ))}
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>

      {/* Value-less Items are plain links, not disclosures. */}
      <NavigationMenuItem>
        <NavigationMenuLink href="#" active>
          Changelog
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink href="#">Figma</NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>

    <NavigationMenuIndicator forceMount marker={marker} />
    <NavigationMenuViewport forceMount />
  </NavigationMenu>
);

/** The composed mobile presentation — a Drawer + a Collapsible per section. */
const MOBILE_NAV = [
  { label: "Concepts", links: ["Tokens", "Density & theming", "Cascade layers"] },
  { label: "Resources", links: ["GitHub", "Releases", "RFCs"] },
];

const MobileNav = ({ size = "md" }: { size?: Size }) => (
  <Drawer>
    <DrawerTrigger asChild>
      <Button variant="secondary" size={size}>
        Open menu
      </Button>
    </DrawerTrigger>
    <DrawerPortal>
      <DrawerContent side="left" width={size}>
        <DrawerHeader>
          <DrawerTitle>Menu</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="sm" aria-label="Close">
              <Close aria-hidden="true" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <DrawerBody>
          {/* Root still renders the <nav> landmark and NavigationMenuLink reads
              its context; Collapsible replaces List / Item / Trigger / Viewport. */}
          <NavigationMenu size={size} aria-label="Docs (mobile)">
            {MOBILE_NAV.map((section) => (
              <Collapsible key={section.label} size={size} variant="plain">
                <CollapsibleTrigger>
                  {section.label}
                  <CollapsibleTriggerIcon>
                    <ChevronDown aria-hidden="true" />
                  </CollapsibleTriggerIcon>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {section.links.map((link) => (
                    <NavigationMenuLink key={link} placement="panel" href="#">
                      <NavigationMenuLinkText>
                        <NavigationMenuLinkTitle>{link}</NavigationMenuLinkTitle>
                      </NavigationMenuLinkText>
                    </NavigationMenuLink>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </NavigationMenu>
        </DrawerBody>
      </DrawerContent>
    </DrawerPortal>
  </Drawer>
);

/* ------------------------------------------------------------------ *
 * Snippet builders — mode-aware, styled composes the presentational
 * slots, headless uses your own markup in their place.
 * ------------------------------------------------------------------ */

const imports = (mode: Mode, parts: readonly string[], icons: readonly string[] = []) =>
  importBlock({ mode, component: "NavigationMenu", componentId: "navigation-menu", parts, icons });

/** A disclosure trigger — label + chevron. */
const triggerLines = (mode: Mode, label: string, indent = "    ") => {
  const p = partNamer(mode, "NavigationMenu");
  if (mode === "headless") {
    return [
      `${indent}<${p("Trigger")}>`,
      `${indent}  ${label}`,
      `${indent}  <ChevronDown aria-hidden="true" />`,
      `${indent}</${p("Trigger")}>`,
    ];
  }
  return [
    `${indent}<NavigationMenuTrigger>`,
    `${indent}  <NavigationMenuTriggerLabel>${label}</NavigationMenuTriggerLabel>`,
    `${indent}  <NavigationMenuTriggerIcon><ChevronDown aria-hidden="true" /></NavigationMenuTriggerIcon>`,
    `${indent}</NavigationMenuTrigger>`,
  ];
};

/** One panel row — a title and description. */
const panelRowLines = (
  mode: Mode,
  title: string,
  description: string,
  indent = "        ",
) => {
  const p = partNamer(mode, "NavigationMenu");
  if (mode === "headless") {
    return [
      `${indent}<${p("Link")} href="#">`,
      `${indent}  <span className="title">${title}</span>`,
      `${indent}  <span className="description">${description}</span>`,
      `${indent}</${p("Link")}>`,
    ];
  }
  return [
    `${indent}<NavigationMenuLink placement="panel" href="#">`,
    `${indent}  <NavigationMenuLinkText>`,
    `${indent}    <NavigationMenuLinkTitle>${title}</NavigationMenuLinkTitle>`,
    `${indent}    <NavigationMenuLinkDescription>${description}</NavigationMenuLinkDescription>`,
    `${indent}  </NavigationMenuLinkText>`,
    `${indent}</NavigationMenuLink>`,
  ];
};


/* ------------------------------------------------------------------ *
 * Elements markup (RFC 0033) — the `@primitiv-ui/web` custom elements in
 * the shape `primitiv add navigation-menu --styled` prints. The headless
 * tab is derived from it by stripping the classes.
 * ------------------------------------------------------------------ */

const N = "primitiv-navigation-menu";

/** One panel row as Elements markup: the `<a>` a link part decorates. */
const elementsRow = (
  title: string,
  description?: string,
  { leading, trailing, indent = "      " }: { leading?: string; trailing?: string; indent?: string } = {},
) =>
  [
    `${indent}<${N}-link>`,
    `${indent}  <a href="#" class="${N}__link ${N}__link--panel">` +
      (leading ? `<span class="${N}__link-leading" aria-hidden="true">${glyph(leading as "file")}</span>` : "") +
      `<span class="${N}__link-text"><span class="${N}__link-title">${title}</span>` +
      (description ? ` <span class="${N}__link-description">${description}</span>` : "") +
      `</span>` +
      (trailing ? `<span class="${N}__link-trailing" aria-hidden="true">${glyph(trailing as "file")}</span>` : "") +
      `</a>`,
    `${indent}</${N}-link>`,
  ];

/** A disclosure trigger as Elements markup: the `<button>` a trigger part decorates. */
const elementsTrigger = (value: string, label: string) => [
  `    <${N}-item value="${value}" class="${N}__item">`,
  `      <${N}-trigger>`,
  `        <button type="button" class="${N}__trigger"><span class="${N}__trigger-label">${label}</span><span class="${N}__trigger-icon" aria-hidden="true">${glyph("chevron-down")}</span></button>`,
  `      </${N}-trigger>`,
  `    </${N}-item>`,
];

/** A plain link entry: an item with no `value`. */
const elementsBarLink = (label: string, active = false) => [
  `    <${N}-item class="${N}__item">`,
  `      <${N}-link${active ? " active" : ""}>`,
  `        <a href="#" class="${N}__link ${N}__link--bar">${label}</a>`,
  `      </${N}-link>`,
  `    </${N}-item>`,
];

/**
 * The reduced docs nav as Elements markup, matching `NavPreview`: the panels
 * sit in the shared viewport, each naming its entry with `value`, which is
 * where React's panels project. Panels are `hidden` until opened; the viewport
 * and indicator are `force-mount`, so the stylesheet can fade them.
 */
const elementsNav = ({
  size = "md",
  marker = "arrow",
  rootAttrs = "",
  links = true,
  rows,
}: {
  size?: string;
  marker?: Marker;
  rootAttrs?: string;
  /** Include the two plain link entries. */
  links?: boolean;
  /** Replace both panels with one "Registry & CLI" panel of these rows. */
  rows?: string[];
} = {}) => {
  const panel = (value: string, body: string[], style = "") => [
    `      <${N}-content value="${value}" class="${N}__content"${style} hidden>`,
    ...body,
    `      </${N}-content>`,
  ];
  const column = (items: typeof CONCEPTS) => [
    `        <div>`,
    ...items.flatMap((row) => elementsRow(row.title, row.description, { indent: "          " })),
    `        </div>`,
  ];
  const panels = rows
    ? panel("registry", rows)
    : [
        ...panel(
          "concepts",
          [...column(CONCEPTS.slice(0, 2)), ...column(CONCEPTS.slice(2))],
          ` style="--primitiv-navigation-menu-content-columns: repeat(2, minmax(0, 1fr))"`,
        ),
        ...panel("resources", column(RESOURCES)),
      ];
  return [
    `<${N} class="${N} ${N}--${size}" role="navigation" aria-label="Docs"${rootAttrs}>`,
    `  <${N}-list class="${N}__list">`,
    ...(rows
      ? elementsTrigger("registry", "Registry &amp; CLI")
      : [...elementsTrigger("concepts", "Concepts"), ...elementsTrigger("resources", "Resources")]),
    ...(links ? [...elementsBarLink("Changelog", true), ...elementsBarLink("Figma")] : []),
    `  </${N}-list>`,
    `  <${N}-indicator class="${N}__indicator ${N}__indicator--${marker}" force-mount data-state="closed"></${N}-indicator>`,
    `  <${N}-viewport class="${N}__viewport" force-mount data-state="closed">`,
    `    <span class="${N}__viewport-clip">`,
    ...panels,
    `    </span>`,
    `  </${N}-viewport>`,
    `</${N}>`,
  ].join("\n");
};

/** The composed mobile nav as Elements markup: Modal (as a Drawer), Collapsible, and the nav's own links. */
const elementsMobile = () =>
  [
    `<primitiv-modal>`,
    `  <primitiv-modal-trigger>`,
    `    <button type="button" class="primitiv-button primitiv-button--secondary primitiv-button--md">Open menu</button>`,
    `  </primitiv-modal-trigger>`,
    `  <primitiv-modal-content>`,
    `    <dialog class="primitiv-drawer primitiv-drawer--md" data-side="left">`,
    `      <span class="primitiv-drawer__header">`,
    `        <primitiv-modal-title><h2 class="primitiv-drawer__title">Menu</h2></primitiv-modal-title>`,
    `        <primitiv-modal-close>`,
    `          <button type="button" class="primitiv-drawer__close" aria-label="Close">${glyph("close")}</button>`,
    `        </primitiv-modal-close>`,
    `      </span>`,
    `      <span class="primitiv-drawer__body">`,
    `        <${N} class="${N} ${N}--md" role="navigation" aria-label="Docs (mobile)">`,
    ...MOBILE_NAV.flatMap((section) => [
      `          <primitiv-collapsible class="primitiv-collapsible primitiv-collapsible--plain primitiv-collapsible--md">`,
      `            <primitiv-collapsible-trigger>`,
      `              <button type="button" class="primitiv-collapsible__trigger"><span class="primitiv-collapsible__trigger-label">${section.label}</span><primitiv-collapsible-trigger-icon class="primitiv-collapsible__trigger-icon">${glyph("chevron-down")}</primitiv-collapsible-trigger-icon></button>`,
      `            </primitiv-collapsible-trigger>`,
      `            <primitiv-collapsible-content class="primitiv-collapsible__content" hidden>`,
      `              <span class="primitiv-collapsible__content-inner"><span class="primitiv-collapsible__content-body">`,
      ...section.links.flatMap((link) => elementsRow(link, undefined, { indent: "                " })),
      `              </span></span>`,
      `            </primitiv-collapsible-content>`,
      `          </primitiv-collapsible>`,
    ]),
    `        </${N}>`,
    `      </span>`,
    `    </dialog>`,
    `  </primitiv-modal-content>`,
    `</primitiv-modal>`,
  ].join("\n");

const glyphPreview = (_density: unknown, code: string) => withGlyphs(code);

/* ------------------------------------------------------------------ *
 * The spec
 * ------------------------------------------------------------------ */

/**
 * NavigationMenu's page content.
 *
 * The desktop dropdown site nav — the ARIA APG **Disclosure Navigation Menu**,
 * not a menubar: every top-level entry stays tabbable, and an entry is a
 * disclosure only when its `Item` carries a `value` (omit it for a plain link).
 * Dual-surface with a styled-only split — the presentational slots
 * (`TriggerLabel`/`TriggerIcon`, and the panel-row `LinkText`/`LinkTitle`/
 * `LinkDescription`/`LinkLeading`/`LinkTrailing`) exist only in the copied
 * file, so the Headless tab shows your own markup in their place.
 *
 * It is the biggest of the overlay-ish components, so the previews are the
 * reduced docs nav (two disclosures, two plain links) rather than the full
 * five-section mega-menu — open a trigger to see the panel morph into the
 * shared Viewport.
 */
export const navigationMenuSpec: ComponentSpec = {
  playground: {
    component: "NavigationMenu",
    /* `placement` (on Link) and `marker` (on Indicator) are per-part structural
       choices, not a single global knob, so they are shown in their own examples
       rather than as playground controls; only `size` (the root modifier) drives
       the whole nav. */
    excludeControls: ["placement", "marker"],
    snippet: (values, mode) => {
      if (mode === "elements") return elementsNav({ size: values.size as Size });
      const p = partNamer(mode, "NavigationMenu");
      const size = values.size as Size;
      return [
        imports(mode, ["List", "Item", "Trigger", "Content", "Link", "Indicator", "Viewport"], ["ChevronDown"]),
        ``,
        `<${p("Root")} size="${size}" aria-label="Docs">`,
        `  <${p("List")}>`,
        `    <${p("Item")} value="concepts">`,
        ...triggerLines(mode, "Concepts", "      "),
        `      <${p("Content")} forceMount>`,
        ...panelRowLines(mode, "Tokens", "The three-tier token architecture", "        "),
        `        {/* ...more rows */}`,
        `      </${p("Content")}>`,
        `    </${p("Item")}>`,
        ``,
        `    {/* A value-less Item is a plain link, not a disclosure. */}`,
        `    <${p("Item")}>`,
        `      <${p("Link")} href="#" active>Changelog</${p("Link")}>`,
        `    </${p("Item")}>`,
        `  </${p("List")}>`,
        ``,
        `  <${p("Indicator")} forceMount />`,
        `  <${p("Viewport")} forceMount />`,
        `</${p("Root")}>`,
      ].join("\n");
    },
    elementsPreview: (code) => withGlyphs(code),
    fill: true,
    render: (values) => <NavPreview size={values.size as Size} />,
  },

  anatomyMeta:
    "Eight parts in `@primitiv-ui/react`: `Root` (the `<nav>`), `List`, `Item`, `Trigger`, `Content`, `Viewport`, `Indicator` and one `Link` (used both on the bar and inside a panel via its `placement` modifier). The copied file adds seven presentational slots — `TriggerLabel`/`TriggerIcon` on the trigger, and `LinkText`/`LinkTitle`/`LinkDescription`/`LinkLeading`/`LinkTrailing` inside a panel row — so under the Headless tab those are your own elements. `Content` projects into the shared `Viewport`, which is what lets the open panel morph into the next.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        const p = partNamer(mode, "NavigationMenu");
        if (mode === "elements") {
          return [
            `<${N} class="${N}">`,
            `  <${N}-list class="${N}__list">`,
            `    <${N}-item value="concepts" class="${N}__item">`,
            `      <${N}-trigger><button type="button" class="${N}__trigger">…</button></${N}-trigger>`,
            `    </${N}-item>`,
            `    <${N}-item class="${N}__item">`,
            `      <${N}-link><a href="#" class="${N}__link ${N}__link--bar">…</a></${N}-link>`,
            `    </${N}-item>`,
            `  </${N}-list>`,
            `  <${N}-indicator class="${N}__indicator"></${N}-indicator>`,
            `  <${N}-viewport class="${N}__viewport">`,
            `    <${N}-content value="concepts" class="${N}__content" hidden>`,
            `      <${N}-link><a href="#" class="${N}__link ${N}__link--panel">…</a></${N}-link>`,
            `    </${N}-content>`,
            `  </${N}-viewport>`,
            `</${N}>`,
          ].join("\n");
        }
        if (mode === "headless") {
          return [
            `<${p("Root")}>`,
            `  <${p("List")}>`,
            `    <${p("Item")} value="concepts">`,
            `      <${p("Trigger")}>{/* your label + icon */}</${p("Trigger")}>`,
            `      <${p("Content")}>{/* your panel */}</${p("Content")}>`,
            `    </${p("Item")}>`,
            `    <${p("Item")}>`,
            `      <${p("Link")} />          {/* a plain bar link */}`,
            `    </${p("Item")}>`,
            `  </${p("List")}>`,
            `  <${p("Indicator")} />`,
            `  <${p("Viewport")} />`,
            `</${p("Root")}>`,
            ``,
            `// TriggerLabel/TriggerIcon and the panel-row Link* parts are`,
            `// styled-surface only — in headless a trigger and a panel row`,
            `// are your own markup.`,
          ].join("\n");
        }
        return [
          `<NavigationMenu>`,
          `  <NavigationMenuList>`,
          `    <NavigationMenuItem value="concepts">`,
          `      <NavigationMenuTrigger>`,
          `        <NavigationMenuTriggerLabel />`,
          `        <NavigationMenuTriggerIcon />`,
          `      </NavigationMenuTrigger>`,
          `      <NavigationMenuContent>`,
          `        <NavigationMenuLink placement="panel">`,
          `          <NavigationMenuLinkLeading />   {/* optional */}`,
          `          <NavigationMenuLinkText>`,
          `            <NavigationMenuLinkTitle />`,
          `            <NavigationMenuLinkDescription />  {/* optional */}`,
          `          </NavigationMenuLinkText>`,
          `          <NavigationMenuLinkTrailing />  {/* optional */}`,
          `        </NavigationMenuLink>`,
          `      </NavigationMenuContent>`,
          `    </NavigationMenuItem>`,
          `    <NavigationMenuItem>`,
          `      <NavigationMenuLink />              {/* a plain bar link */}`,
          `    </NavigationMenuItem>`,
          `  </NavigationMenuList>`,
          `  <NavigationMenuIndicator />`,
          `  <NavigationMenuViewport />`,
          `</NavigationMenu>`,
        ].join("\n");
      },
    },
  ],

  keyboardMeta:
    "It is the APG **Disclosure Navigation Menu**, not a menubar — so every top-level entry stays tabbable (there is no roving tabstop to trap you on one). Hover-intent opens a panel after `delayDuration` and closes it after `closeDelay`; `openOnHover={false}` makes it click-only.",

  keyboard: [
    { keys: ["Tab", "Shift+Tab"], behaviour: "Move between the top-level entries — links and triggers alike are all tabbable." },
    { keys: ["Enter", "Space"], behaviour: "Toggle the focused trigger's panel; follow a focused link." },
    { keys: ["ArrowDown"], behaviour: "Open the focused trigger's panel and move into it (down the entries in a vertical menu)." },
    { keys: ["ArrowLeft", "ArrowRight"], behaviour: "Move between top-level triggers (the axis follows `orientation` and `dir`)." },
    { keys: ["Escape"], behaviour: "Close the open panel and return focus to its trigger." },
  ],

  examples: [
    {
      id: "disclosure-panels",
      title: "Disclosure entries and panels",
      render: () => (
        <InteractiveExample
          caption="Give an `Item` a `value` and it becomes a disclosure: its `Trigger` opens a `Content` panel, and every panel projects into the shared `Viewport` so the open one morphs into the next. **Hover or click a trigger** to open it. The panel's layout is yours — `Content` is a grid whose track list is one custom property (`--primitiv-navigation-menu-content-columns`, `1fr` by default), so Concepts here is two columns and Resources is one."
          elementsCaption="Give a `<primitiv-navigation-menu-item>` a `value` and it becomes a disclosure: the `<button>` in its `<primitiv-navigation-menu-trigger>` opens the `<primitiv-navigation-menu-content>` with the same `value`. Put every panel in the one `<primitiv-navigation-menu-viewport>` so the open one morphs into the next (a panel left in its item opens in place). **Hover or click a trigger** to open it. The panel's layout is yours: the styled content is a grid whose track list is one custom property, `--primitiv-navigation-menu-content-columns`, so Concepts here is two columns and Resources is one."
          elementsPreview={glyphPreview}
          code={(_density, mode) => {
            if (mode === "elements") return elementsNav({ links: false });
            const p = partNamer(mode, "NavigationMenu");
            return [
              imports(mode, ["List", "Item", "Trigger", "Content", "Link", "Indicator", "Viewport"], ["ChevronDown"]),
              ``,
              `<${p("Root")} aria-label="Docs">`,
              `  <${p("List")}>`,
              `    <${p("Item")} value="concepts">`,
              ...triggerLines(mode, "Concepts"),
              mode === "headless"
                ? `      <${p("Content")} forceMount style={{ "--primitiv-navigation-menu-content-columns": "repeat(2, minmax(0, 1fr))" }}>`
                : `      <NavigationMenuContent forceMount style={{ "--primitiv-navigation-menu-content-columns": "repeat(2, minmax(0, 1fr))" }}>`,
              `        <div>`,
              ...panelRowLines(mode, "Tokens", "The three-tier token architecture", "          "),
              `          {/* ...more rows */}`,
              `        </div>`,
              `      </${p("Content")}>`,
              `    </${p("Item")}>`,
              `  </${p("List")}>`,
              ``,
              `  <${p("Indicator")} forceMount />`,
              `  <${p("Viewport")} forceMount />`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <NavPreview />}
        </InteractiveExample>
      ),
    },
    {
      id: "plain-links",
      title: "Plain links and the active page",
      render: () => (
        <InteractiveExample
          caption="An `Item` with **no** `value` is a plain link, not a disclosure — no trigger, no panel — so a mega-menu and its ordinary links live in one list. Mark the current page with `active` on its `Link`: it sets `aria-current=&quot;page&quot;` and publishes `data-active` for styling. Putting a `Trigger` inside a value-less `Item` throws — that pairing is the whole disclosure-vs-link distinction."
          elementsCaption="A `<primitiv-navigation-menu-item>` with **no** `value` is a plain link entry, not a disclosure — no trigger, no panel — so a mega-menu and its ordinary links live in one list. Mark the current page with `active` on its `<primitiv-navigation-menu-link>`: the `<a>` inside gets `aria-current=&quot;page&quot;` and `data-active`. A trigger in an item with no `value` is reported once in the console and left alone."
          elementsPreview={glyphPreview}
          code={(_density, mode) => {
            if (mode === "elements") return elementsNav();
            const p = partNamer(mode, "NavigationMenu");
            return [
              imports(mode, ["List", "Item", "Link"]),
              ``,
              `<${p("Root")} aria-label="Docs">`,
              `  <${p("List")}>`,
              `    {/* ...disclosure items... */}`,
              ``,
              `    <${p("Item")}>`,
              `      <${p("Link")} href="/changelog" active>Changelog</${p("Link")}>`,
              `    </${p("Item")}>`,
              `    <${p("Item")}>`,
              `      <${p("Link")} href="/figma">Figma</${p("Link")}>`,
              `    </${p("Item")}>`,
              `  </${p("List")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <NavPreview />}
        </InteractiveExample>
      ),
    },
    {
      id: "row-slots",
      title: "Row slots",
      render: () => (
        <InteractiveExample
          caption="A panel row can carry more than a title. `NavigationMenuLinkLeading` holds a glyph before the text, `NavigationMenuLinkTrailing` one pinned to the inline-end edge, and the `NavigationMenuLinkDescription` is optional — drop it and the row collapses to a single line. Both slots are off until you render them. **Open the Registry panel** to see all three."
          elementsCaption="A panel row can carry more than a title. A `__link-leading` span holds a glyph before the text, a `__link-trailing` one pinned to the inline-end edge, and the `__link-description` is optional — drop it and the row collapses to a single line. **Open the Registry panel** to see all three."
          elementsPreview={glyphPreview}
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsNav({
                links: false,
                rows: [
                  ...elementsRow("Adding components", "primitiv add, and what it copies"),
                  ...elementsRow("The lockfile"),
                  ...elementsRow("With row slots", "Optional leading and trailing content", {
                    leading: "file",
                    trailing: "chevron-right",
                  }),
                ],
              });
            const p = partNamer(mode, "NavigationMenu");
            if (mode === "headless") {
              return [
                imports(mode, ["Link"]),
                ``,
                `<${p("Link")} href="#">`,
                `  {/* your own leading icon, title, description and trailing glyph */}`,
                `</${p("Link")}>`,
              ].join("\n");
            }
            return [
              imports(mode, ["Link", "LinkLeading", "LinkText", "LinkTitle", "LinkDescription", "LinkTrailing"], ["File", "ChevronRight"]),
              ``,
              `<NavigationMenuLink placement="panel" href="#">`,
              `  <NavigationMenuLinkLeading><File aria-hidden="true" /></NavigationMenuLinkLeading>`,
              `  <NavigationMenuLinkText>`,
              `    <NavigationMenuLinkTitle>With row slots</NavigationMenuLinkTitle>`,
              `    <NavigationMenuLinkDescription>Optional leading and trailing content</NavigationMenuLinkDescription>`,
              `  </NavigationMenuLinkText>`,
              `  <NavigationMenuLinkTrailing><ChevronRight aria-hidden="true" /></NavigationMenuLinkTrailing>`,
              `</NavigationMenuLink>`,
            ].join("\n");
          }}
        >
          {() => (
            <NavigationMenu aria-label="Docs">
              <NavigationMenuList>
                <NavigationMenuItem value="registry">
                  <NavigationMenuTrigger>
                    <NavigationMenuTriggerLabel>Registry &amp; CLI</NavigationMenuTriggerLabel>
                    <NavigationMenuTriggerIcon>
                      <ChevronDown aria-hidden="true" />
                    </NavigationMenuTriggerIcon>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent forceMount>
                    <div>
                      <NavigationMenuLink placement="panel" href="#">
                        <NavigationMenuLinkText>
                          <NavigationMenuLinkTitle>Adding components</NavigationMenuLinkTitle>
                          <NavigationMenuLinkDescription>
                            primitiv add, and what it copies
                          </NavigationMenuLinkDescription>
                        </NavigationMenuLinkText>
                      </NavigationMenuLink>
                      <NavigationMenuLink placement="panel" href="#">
                        <NavigationMenuLinkText>
                          <NavigationMenuLinkTitle>The lockfile</NavigationMenuLinkTitle>
                        </NavigationMenuLinkText>
                      </NavigationMenuLink>
                      <NavigationMenuLink placement="panel" href="#">
                        <NavigationMenuLinkLeading>
                          <File aria-hidden="true" />
                        </NavigationMenuLinkLeading>
                        <NavigationMenuLinkText>
                          <NavigationMenuLinkTitle>With row slots</NavigationMenuLinkTitle>
                          <NavigationMenuLinkDescription>
                            Optional leading and trailing content
                          </NavigationMenuLinkDescription>
                        </NavigationMenuLinkText>
                        <NavigationMenuLinkTrailing>
                          <ChevronRight aria-hidden="true" />
                        </NavigationMenuLinkTrailing>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
              <NavigationMenuIndicator forceMount />
              <NavigationMenuViewport forceMount />
            </NavigationMenu>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "indicator",
      title: "The open indicator",
      render: () => (
        <InteractiveExample
          caption="`NavigationMenuIndicator` marks the open trigger — it measures the trigger and tracks it as the open entry changes. `marker=&quot;arrow&quot;` (the default) points a rotated square up at the trigger from the panel's edge; `marker=&quot;underline&quot;` draws a rule beneath it instead. **Open a trigger** to see the underline slide between entries."
          elementsCaption="`<primitiv-navigation-menu-indicator>` marks the open trigger: the root measures that trigger and publishes its position and size on the indicator as `--primitiv-navigation-menu-indicator-position` / `-size`, re-measured on resize. The `__indicator--arrow` class (the default) points a rotated square up at the trigger from the panel's edge; `__indicator--underline` draws a rule beneath it instead. **Open a trigger** to see the underline slide between entries."
          elementsPreview={glyphPreview}
          code={(_density, mode) => {
            if (mode === "elements") return elementsNav({ marker: "underline" });
            const p = partNamer(mode, "NavigationMenu");
            return [
              imports(mode, ["Indicator"]),
              ``,
              `<${p("Indicator")} forceMount marker="underline" />`,
            ].join("\n");
          }}
        >
          {() => <NavPreview marker="underline" />}
        </InteractiveExample>
      ),
    },
    {
      id: "mobile",
      title: "Mobile: compose, don't adapt",
      render: () => (
        <InteractiveExample
          caption="There is no mobile *mode* — a five-trigger mega-menu has no sane small-screen fallback of its own. Instead compose the small-screen nav from a `Drawer` and a `Collapsible` per section, **reusing `NavigationMenuLink`** so the nav data and the active-state logic stay single-sourced across both presentations (RFC 0019 §4a). `NavigationMenu` still wraps it — it renders the `<nav>` landmark and `NavigationMenuLink` reads its context — while `Collapsible` replaces List / Item / Trigger / Viewport. **Open the menu** to see it."
          elementsCaption="There is no mobile *mode* — a five-trigger mega-menu has no sane small-screen fallback of its own. Compose the small-screen nav from the elements that already exist instead: a `<primitiv-modal>` dressed as a Drawer, a `<primitiv-collapsible>` per section, and the same `<primitiv-navigation-menu-link>` rows inside a `<primitiv-navigation-menu>` landmark, so `active` marks the current page in both presentations. Load `modal.js` and `collapsible.js` beside `navigation-menu.js`, and run `primitiv add drawer collapsible button --styled` for their stylesheets. **Open the menu** to see it."
          elementsPreview={glyphPreview}
          code={(_density, mode) => {
            if (mode === "elements") return elementsMobile();
            const p = partNamer(mode, "NavigationMenu");
            return [
              imports(mode, ["Link", "LinkText", "LinkTitle"]),
              `import { Drawer, DrawerTrigger, DrawerPortal, DrawerContent, DrawerBody } from "@/components/ui/drawer";`,
              `import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";`,
              ``,
              `<Drawer>`,
              `  <DrawerTrigger asChild><Button>Open menu</Button></DrawerTrigger>`,
              `  <DrawerPortal>`,
              `    <DrawerContent side="left">`,
              `      <DrawerBody>`,
              `        <${p("Root")} aria-label="Docs (mobile)">`,
              `          <Collapsible variant="plain">`,
              `            <CollapsibleTrigger>Concepts</CollapsibleTrigger>`,
              `            <CollapsibleContent>`,
              ...panelRowLines(mode, "Tokens", "", "              ").filter((l) => !l.includes("Description")),
              `            </CollapsibleContent>`,
              `          </Collapsible>`,
              `        </${p("Root")}>`,
              `      </DrawerBody>`,
              `    </DrawerContent>`,
              `  </DrawerPortal>`,
              `</Drawer>`,
            ].join("\n");
          }}
        >
          {() => <MobileNav />}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "A desktop site navigation: a bar of top-level entries, each a plain link or a trigger that discloses a panel, one panel open at a time. Eight custom elements over the WAI-ARIA Disclosure Navigation Menu pattern — not a menubar — with hover intent, a shared viewport the open panel morphs in, and an indicator that tracks the open trigger.",
    anatomyMeta:
      "Eight elements. `<primitiv-navigation-menu>` is the `navigation` landmark and holds the open entry in its `value`. An item's `value` makes it a disclosure: its `<primitiv-navigation-menu-trigger>` wraps the `<button>` you write, and the `<primitiv-navigation-menu-content>` with the same `value` is its panel — in the item, or in the shared `<primitiv-navigation-menu-viewport>`. A `<primitiv-navigation-menu-link>` wraps an `<a>`, on the bar or in a panel. The `__trigger-label`, `__trigger-icon` and `__link-*` spans are styling-only and drop out of the headless markup.",
    keyboardMeta:
      "It is the APG **Disclosure Navigation Menu**, not a menubar — every top-level entry stays tabbable, and the arrows only move focus. Hover opens a panel after `delay-duration` (200 ms) and leaving the nav closes it after `close-delay` (150 ms); `open-on-hover=\"false\"` makes it click-only.",
    keyboard: [
      { keys: ["Tab", "Shift+Tab"], behaviour: "Move between the top-level entries — the trigger `<button>`s and bar `<a>`s are all tabbable; a panel's links follow its trigger." },
      { keys: ["Enter", "Space"], behaviour: "Toggle the focused trigger's panel; follow a focused link." },
      { keys: ["ArrowDown"], behaviour: "Open the focused trigger's panel and move focus to its first link. With `orientation=\"vertical\"`, `ArrowRight` does this (`ArrowLeft` under `dir=\"rtl\"`) and the vertical arrows travel." },
      { keys: ["ArrowLeft", "ArrowRight"], behaviour: "Move between top-level entries, wrapping. They swap under right-to-left: set `dir=\"rtl\"` on the nav or any ancestor." },
      { keys: ["Home", "End"], behaviour: "Jump to the first / last top-level entry. Inside a panel they are left to the page." },
      { keys: ["Escape"], behaviour: "Close the open panel from anywhere in the nav and return focus to its trigger." },
    ],
    accessibility: [
      "It is the WAI-ARIA APG **Disclosure Navigation Menu**, deliberately **not** a menubar: every top-level entry stays in the tab order, which is the right model for links to pages. There are no `menu` or `menuitem` roles.",
      "The root is `role=\"navigation\"`, named \"Main\" unless you give it an `aria-label` or `aria-labelledby` — do, if the page has more than one nav. Write `role` and the name in your markup too, so the landmark exists before the script loads.",
      "Each trigger's `<button>` gets `aria-expanded`, `aria-controls` and `data-state`; each panel gets an id, `aria-labelledby` and `hidden` while closed. Write `hidden` on panels in your markup, so nothing shows before the script loads.",
      "An item's `value` is the whole disclosure-vs-link distinction. A trigger in an item with no `value`, or a part without exactly one element child, is reported once in the console and left alone — nothing throws, since a server-rendered page has no error boundary.",
      "`active` on a link sets `aria-current=\"page\"` and `data-active` on its `<a>`. Following any link closes the open panel.",
      "Escape works from anywhere inside the nav and hands focus back to the open trigger; focus leaving the nav closes the panel without moving focus. Hover intent is a convenience over that keyboard model, and every change fires a cancelable `primitiv-navigation-menu-change` first.",
      "There is no built-in mobile mode: compose the small-screen nav from the Modal and Collapsible elements, reusing the nav's links, rather than one tree hidden by breakpoint, which would put duplicate landmarks and ids in the accessibility tree.",
    ],
  },

  accessibility: [
    "It is the WAI-ARIA APG **Disclosure Navigation Menu**, deliberately **not** a menubar. Every top-level entry stays in the tab order (no roving tabstop), which is the right model for links-to-pages — a menubar's single tab stop suits an application menu of commands, not site navigation.",
    "An `Item`'s `value` is the whole disclosure-vs-link distinction: with a `value` it is a `Trigger` + `Content` disclosure, without one it is a plain link. A `Trigger` inside a value-less `Item` throws in development, so the mistake is caught at the source.",
    "`active` on a `Link` sets `aria-current=\"page\"` and publishes `data-active` for styling. Only you know whether a link points at the exact current URL, so `active` is yours to set.",
    "`Root` owns the single `Escape` handler and returns focus to the open trigger on close. Hover-intent (`delayDuration`/`closeDelay`) is a convenience over that keyboard model, not a replacement — the menu is fully operable from the keyboard with `openOnHover={false}` too.",
    "Give `Root` an `aria-label` (or `aria-labelledby`) so the `<nav>` landmark is named — a page with more than one nav needs each distinguished, and \"Main\" is the default.",
    "There is no built-in mobile mode: compose the small-screen nav from `Drawer` + `Collapsible`, reusing `NavigationMenuLink` so a single a11y tree serves each breakpoint rather than shipping duplicate landmarks hidden by CSS.",
  ],
};
