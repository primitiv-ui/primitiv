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
          code={(_density, mode) => {
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
          caption="An `Item` with **no** `value` is a plain link, not a disclosure — no trigger, no panel — so a mega-menu and its ordinary links live in one list. Mark the current page with `active` on its `Link`: it publishes `data-active` for styling and does not change the a11y tree (the page's own `aria-current` is yours to set). Putting a `Trigger` inside a value-less `Item` throws — that pairing is the whole disclosure-vs-link distinction."
          code={(_density, mode) => {
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
          code={(_density, mode) => {
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
          code={(_density, mode) => {
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
          code={(_density, mode) => {
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

  accessibility: [
    "It is the WAI-ARIA APG **Disclosure Navigation Menu**, deliberately **not** a menubar. Every top-level entry stays in the tab order (no roving tabstop), which is the right model for links-to-pages — a menubar's single tab stop suits an application menu of commands, not site navigation.",
    "An `Item`'s `value` is the whole disclosure-vs-link distinction: with a `value` it is a `Trigger` + `Content` disclosure, without one it is a plain link. A `Trigger` inside a value-less `Item` throws in development, so the mistake is caught at the source.",
    "`active` on a `Link` publishes `data-active` for styling but does not set `aria-current` — the semantic current-page marker is yours to add (`aria-current=\"page\"`), because only you know whether the link points at the exact current URL.",
    "`Root` owns the single `Escape` handler and returns focus to the open trigger on close. Hover-intent (`delayDuration`/`closeDelay`) is a convenience over that keyboard model, not a replacement — the menu is fully operable from the keyboard with `openOnHover={false}` too.",
    "Give `Root` an `aria-label` (or `aria-labelledby`) so the `<nav>` landmark is named — a page with more than one nav needs each distinguished, and \"Main\" is the default.",
    "There is no built-in mobile mode: compose the small-screen nav from `Drawer` + `Collapsible`, reusing `NavigationMenuLink` so a single a11y tree serves each breakpoint rather than shipping duplicate landmarks hidden by CSS.",
  ],
};
