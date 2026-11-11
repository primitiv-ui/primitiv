"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";

import { Check } from "@primitiv-ui/icons";

import { Card, CardContent } from "@/components/card";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuItemIndicator,
  ContextMenuItemLabel,
  ContextMenuItemTrailing,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/context-menu";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const imports = (mode: Mode, parts: readonly string[]) =>
  importBlock({ mode, component: "ContextMenu", componentId: "context-menu", parts });

const CHECK =
  '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true"><path d="M21.057 5.904 10.05 19.111 2.939 12 4 10.94l5.95 5.949 9.954-11.946 1.153.961Z"/></svg>';

/** Elements markup for the rows inside a menu. */
const row = {
  item: (label: string, shortcut?: string) =>
    `<primitiv-context-menu-item><li class="primitiv-context-menu__item">` +
    (shortcut
      ? `<span class="primitiv-context-menu__item-label">${label}</span><span class="primitiv-context-menu__item-trailing">${shortcut}</span>`
      : label) +
    `</li></primitiv-context-menu-item>`,
  checkbox: (label: string, checked: boolean) =>
    `<primitiv-context-menu-checkbox-item${checked ? " checked" : ""}><li class="primitiv-context-menu__checkbox-item">` +
    `<primitiv-context-menu-item-indicator class="primitiv-context-menu__item-indicator">${CHECK}</primitiv-context-menu-item-indicator>${label}</li></primitiv-context-menu-checkbox-item>`,
  radio: (value: string, label: string) =>
    `<primitiv-context-menu-radio-item value="${value}"><li class="primitiv-context-menu__radio-item">` +
    `<primitiv-context-menu-item-indicator class="primitiv-context-menu__item-indicator">${CHECK}</primitiv-context-menu-item-indicator>${label}</li></primitiv-context-menu-radio-item>`,
  separator: `<primitiv-context-menu-separator class="primitiv-context-menu__separator"></primitiv-context-menu-separator>`,
  label: (text: string) => `<primitiv-context-menu-label class="primitiv-context-menu__label">${text}</primitiv-context-menu-label>`,
};

/**
 * One context menu as Elements markup (RFC 0033): the `@primitiv-ui/web`
 * custom elements, in the shape `primitiv add context-menu --surface elements`
 * prints. The trigger element IS the region — here a card, so the card's
 * classes sit on it — and the content element IS the menu, carrying
 * `popover="manual"` so it is hidden before the script loads. Nothing places
 * it by hand: the element publishes the pointer's position on the menu as
 * `--primitiv-context-menu-x` / `-y`, which the stylesheet reads.
 */
const elementsContextMenu = ({
  region,
  size = "md",
  disabled = false,
  rows,
}: {
  region: string;
  size?: string;
  disabled?: boolean;
  rows: string[];
}) =>
  [
    `<primitiv-context-menu>`,
    `  <primitiv-context-menu-trigger class="primitiv-card primitiv-card--vertical primitiv-card--lg primitiv-card--flat primitiv-card--scrim-medium" tabindex="0"${disabled ? " disabled" : ""}>`,
    `    <div class="primitiv-card__content">${region}</div>`,
    `  </primitiv-context-menu-trigger>`,
    `  <primitiv-context-menu-content class="primitiv-context-menu primitiv-context-menu--${size}" popover="manual">`,
    ...rows.map((r) => `    ${r}`),
    `  </primitiv-context-menu-content>`,
    `</primitiv-context-menu>`,
  ].join("\n");

const SUBMENU = [
  `<primitiv-context-menu-sub>`,
  `<primitiv-context-menu-sub-trigger><li class="primitiv-context-menu__sub-trigger">Move to…</li></primitiv-context-menu-sub-trigger>`,
  `<primitiv-context-menu-sub-content class="primitiv-context-menu primitiv-context-menu--md primitiv-context-menu--submenu" popover="auto">`,
  row.item("Project Atlas") + row.item("Project Beacon") + row.item("Project Cascade"),
  `</primitiv-context-menu-sub-content>`,
  `</primitiv-context-menu-sub>`,
].join("");

const group = (label: string, items: string[]) =>
  `<primitiv-context-menu-group class="primitiv-context-menu__group">${row.label(label)}${items.map((item) => row.item(item)).join("")}</primitiv-context-menu-group>`;

/* A submenu is anchor-positioned against its row: like Dropdown, it needs an
   explicit anchor-name ↔ position-anchor pair per instance. The root menu
   needs none — it opens at the pointer. */
const toAnchorName = (id: string) => `--sub${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
const anchorNameStyle = (n: string) => ({ anchorName: n }) as CSSProperties;
const positionAnchorStyle = (n: string) => ({ positionAnchor: n }) as CSSProperties;

/** A docs context menu: a card to right-click, with the menu passed as children. */
const DocsContextMenu = ({
  region,
  size,
  disabled,
  children,
}: {
  region: ReactNode;
  size?: Size;
  disabled?: boolean;
  children: ReactNode;
}) => (
  <ContextMenu>
    <ContextMenuTrigger asChild disabled={disabled} tabIndex={0}>
      <Card>
        <CardContent>{region}</CardContent>
      </Card>
    </ContextMenuTrigger>
    <ContextMenuContent size={size}>{children}</ContextMenuContent>
  </ContextMenu>
);

/** A submenu row wired to its panel by a unique anchor pair. */
const DocsSub = ({ label, children }: { label: string; children: ReactNode }) => {
  const anchor = toAnchorName(useId());
  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger style={anchorNameStyle(anchor)}>{label}</ContextMenuSubTrigger>
      <ContextMenuSubContent style={positionAnchorStyle(anchor)}>{children}</ContextMenuSubContent>
    </ContextMenuSub>
  );
};

/** The checkbox/radio example's live half — hooks can't be called from a render prop. */
const ChoicesMenu = () => {
  const [grid, setGrid] = useState(true);
  const [sort, setSort] = useState("name");
  return (
    <DocsContextMenu region="Right-click for view options">
      <ContextMenuLabel>View</ContextMenuLabel>
      <ContextMenuCheckboxItem checked={grid} onCheckedChange={(next) => setGrid(next === true)}>
        <ContextMenuItemIndicator>
          <Check size="100%" />
        </ContextMenuItemIndicator>
        Show grid
      </ContextMenuCheckboxItem>
      <ContextMenuSeparator />
      <ContextMenuLabel>Sort by</ContextMenuLabel>
      <ContextMenuRadioGroup value={sort} onValueChange={setSort}>
        {["name", "date", "size"].map((value) => (
          <ContextMenuRadioItem key={value} value={value}>
            <ContextMenuItemIndicator>
              <Check size="100%" />
            </ContextMenuItemIndicator>
            {value[0].toUpperCase() + value.slice(1)}
          </ContextMenuRadioItem>
        ))}
      </ContextMenuRadioGroup>
    </DocsContextMenu>
  );
};

/**
 * Context Menu's page content.
 *
 * Dropdown's menu, opened at the pointer: every example is a card to
 * right-click (or focus and press Shift+F10), because a pinned-open context
 * menu misrepresents the component. The root needs no anchor wiring — the
 * headless layer places it at the cursor — but a submenu is anchored to its
 * row, so the submenu example wires that pair.
 */
export const contextMenuSpec: ComponentSpec = {
  playground: {
    component: "ContextMenu",
    excludeControls: ["placement"],
    snippet: (values, mode) => {
      if (mode === "elements")
        return elementsContextMenu({
          region: "Right-click here",
          size: values.size,
          rows: [row.item("Cut"), row.item("Copy"), row.item("Paste"), row.separator, row.item("Delete")],
        });
      const p = partNamer(mode, "ContextMenu");
      const size = contractAttr({ mode, prop: "size", value: values.size });
      return [
        imports(mode, ["Trigger", "Content", "Item", "Separator"]),
        ``,
        `<${p("Root")}>`,
        `  <${p("Trigger")}>Right-click here</${p("Trigger")}>`,
        `  <${p("Content")}${size}>`,
        `    <${p("Item")}>Cut</${p("Item")}>`,
        `    <${p("Item")}>Copy</${p("Item")}>`,
        `    <${p("Item")}>Paste</${p("Item")}>`,
        `    <${p("Separator")} />`,
        `    <${p("Item")}>Delete</${p("Item")}>`,
        `  </${p("Content")}>`,
        `</${p("Root")}>`,
      ].join("\n");
    },
    render: (values) => (
      <DocsContextMenu region="Right-click here" size={values.size as Size}>
        <ContextMenuItem>Cut</ContextMenuItem>
        <ContextMenuItem>Copy</ContextMenuItem>
        <ContextMenuItem>Paste</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Delete</ContextMenuItem>
      </DocsContextMenu>
    ),
  },

  anatomyMeta:
    "`ContextMenu.Root` owns the open state and the pointer's position; `ContextMenu.Trigger` is the region a right-click opens it in (usually `asChild` over your own element); `ContextMenu.Content` is the menu, placed at the pointer. Inside it, the same rows as Dropdown: `ContextMenu.Item`, `ContextMenu.CheckboxItem` / `ContextMenu.RadioGroup` + `ContextMenu.RadioItem` with a `ContextMenu.ItemIndicator`, `ContextMenu.Label` + `ContextMenu.Group`, `ContextMenu.Separator`, and `ContextMenu.Sub` / `ContextMenu.SubTrigger` / `ContextMenu.SubContent` for a submenu.",
  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        if (mode === "elements")
          return [
            `<primitiv-context-menu>`,
            `  <primitiv-context-menu-trigger></primitiv-context-menu-trigger>`,
            `  <primitiv-context-menu-content popover="manual">`,
            `    <primitiv-context-menu-item><li></li></primitiv-context-menu-item>`,
            `    <primitiv-context-menu-separator></primitiv-context-menu-separator>`,
            `    <primitiv-context-menu-checkbox-item><li><primitiv-context-menu-item-indicator></primitiv-context-menu-item-indicator></li></primitiv-context-menu-checkbox-item>`,
            `    <primitiv-context-menu-sub>`,
            `      <primitiv-context-menu-sub-trigger><li></li></primitiv-context-menu-sub-trigger>`,
            `      <primitiv-context-menu-sub-content popover="auto"></primitiv-context-menu-sub-content>`,
            `    </primitiv-context-menu-sub>`,
            `  </primitiv-context-menu-content>`,
            `</primitiv-context-menu>`,
          ].join("\n");
        const p = partNamer(mode, "ContextMenu");
        return [
          `<${p("Root")}>`,
          `  <${p("Trigger")} />`,
          `  <${p("Content")}>`,
          `    <${p("Item")} />`,
          `    <${p("Separator")} />`,
          `    <${p("CheckboxItem")}><${p("ItemIndicator")} /></${p("CheckboxItem")}>`,
          `    <${p("Sub")}>`,
          `      <${p("SubTrigger")} />`,
          `      <${p("SubContent")} />`,
          `    </${p("Sub")}>`,
          `  </${p("Content")}>`,
          `</${p("Root")}>`,
        ].join("\n");
      },
    },
  ],

  keyboardMeta:
    "The browser raises the same `contextmenu` event for a right-click and for the keyboard's context-menu key (or Shift+F10) on a focused element, so a focusable region opens from the keyboard too. Once open it is the Menu pattern: roving focus, a single tab stop.",
  keyboard: [
    { keys: ["Shift", "F10"], behaviour: "Open the menu from the focused region (as does the context-menu key)." },
    { keys: ["ArrowDown", "ArrowUp"], behaviour: "Move focus to the next / previous enabled item, wrapping at the ends." },
    { keys: ["Home", "End"], behaviour: "First / last item." },
    { keys: ["Enter", "Space"], behaviour: "Choose the focused item." },
    { keys: ["ArrowRight"], behaviour: "Open the focused submenu (or, on `dir=\"rtl\"`, the mirror)." },
    { keys: ["ArrowLeft"], behaviour: "Close the current submenu and return to its row." },
    { keys: ["Escape"], behaviour: "Close the menu." },
  ],

  examples: [
    {
      id: "actions",
      title: "A menu of actions",
      render: () => (
        <InteractiveExample
          elementsCaption="**Right-click the card** — or focus it and press Shift+F10 — to open a menu of actions at the pointer. Choosing an item fires a cancelable `primitiv-context-menu-select` on it — listen for that to act — and closes the menu. Nothing places it by hand: the element publishes the pointer's position on the menu as `--primitiv-context-menu-x` / `-y`, and the stylesheet places it from them, flipping it off the far edge when there is not room."
          caption="**Right-click the card** — or focus it and press Shift+F10 — to open a menu of actions at the pointer. Each `ContextMenu.Item` runs its `onSelect` and closes the menu; `ContextMenu.ItemTrailing` holds a shortcut hint. The root needs no anchor: it is placed at the cursor, and flips off the far edge when there is not room."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsContextMenu({
                region: "Right-click this card",
                rows: [row.item("Cut", "⌘X"), row.item("Copy", "⌘C"), row.item("Paste", "⌘V"), row.separator, row.item("Delete")],
              });
            const p = partNamer(mode, "ContextMenu");
            return [
              imports(mode, ["Trigger", "Content", "Item", "Separator"]),
              ``,
              `<${p("Root")}>`,
              `  <${p("Trigger")} asChild>`,
              `    <div tabIndex={0}>Right-click here</div>`,
              `  </${p("Trigger")}>`,
              `  <${p("Content")}>`,
              `    <${p("Item")} onSelect={() => cut()}>Cut</${p("Item")}>`,
              `    <${p("Item")} onSelect={() => copy()}>Copy</${p("Item")}>`,
              `    <${p("Separator")} />`,
              `    <${p("Item")} onSelect={() => remove()}>Delete</${p("Item")}>`,
              `  </${p("Content")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <DocsContextMenu region="Right-click this card">
              {[
                ["Cut", "⌘X"],
                ["Copy", "⌘C"],
                ["Paste", "⌘V"],
              ].map(([label, shortcut]) => (
                <ContextMenuItem key={label}>
                  <ContextMenuItemLabel>{label}</ContextMenuItemLabel>
                  <ContextMenuItemTrailing>{shortcut}</ContextMenuItemTrailing>
                </ContextMenuItem>
              ))}
              <ContextMenuSeparator />
              <ContextMenuItem>Delete</ContextMenuItem>
            </DocsContextMenu>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "choices",
      title: "Checkbox and radio items",
      render: () => (
        <InteractiveExample
          elementsCaption="`<primitiv-context-menu-checkbox-item>` is a togglable row whose `checked` attribute is its state; `<primitiv-context-menu-radio-group>` holds a single choice in its `value`. Each fires a cancelable change first — `primitiv-context-menu-checked-change`, `primitiv-context-menu-value-change` — and the indicator inside shows only while its row is checked. Choosing one closes the menu; cancel its `primitiv-context-menu-select` to keep it open."
          caption="`ContextMenu.CheckboxItem` is a togglable row; `ContextMenu.RadioGroup` + `ContextMenu.RadioItem` a single choice. Each carries a `ContextMenu.ItemIndicator` that shows only while its row is checked. Choosing one closes the menu — call `preventDefault()` in its `onSelect` to keep it open."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsContextMenu({
                region: "Right-click for view options",
                rows: [
                  row.label("View"),
                  row.checkbox("Show grid", true),
                  row.separator,
                  row.label("Sort by"),
                  `<primitiv-context-menu-radio-group class="primitiv-context-menu__radio-group" value="name">` +
                    row.radio("name", "Name") +
                    row.radio("date", "Date") +
                    row.radio("size", "Size") +
                    `</primitiv-context-menu-radio-group>`,
                ],
              });
            const p = partNamer(mode, "ContextMenu");
            return [
              imports(mode, ["Content", "CheckboxItem", "RadioGroup", "RadioItem", "ItemIndicator", "Label", "Separator"]),
              ``,
              `<${p("CheckboxItem")} checked={grid} onCheckedChange={setGrid}>`,
              `  <${p("ItemIndicator")}><Check /></${p("ItemIndicator")}>`,
              `  Show grid`,
              `</${p("CheckboxItem")}>`,
              ``,
              `<${p("RadioGroup")} value={sort} onValueChange={setSort}>`,
              `  <${p("RadioItem")} value="name">`,
              `    <${p("ItemIndicator")}><Check /></${p("ItemIndicator")}>Name`,
              `  </${p("RadioItem")}>`,
              `</${p("RadioGroup")}>`,
            ].join("\n");
          }}
        >
          {() => <ChoicesMenu />}
        </InteractiveExample>
      ),
    },
    {
      id: "submenu",
      title: "A submenu",
      render: () => (
        <InteractiveExample
          elementsCaption="`<primitiv-context-menu-sub>` nests a second menu: its `<primitiv-context-menu-sub-trigger>` row opens the `<primitiv-context-menu-sub-content>` beside it on hover, a click or ArrowRight. The row is the submenu's implicit anchor, so — unlike the React version — it needs no anchor wiring; it closes with the menu."
          caption="`ContextMenu.Sub` nests a second menu: `ContextMenu.SubTrigger` is a row that opens `ContextMenu.SubContent` beside it on hover or ArrowRight. Unlike the root, a submenu is anchor-positioned against its row — wire a unique `anchor-name` on the SubTrigger and the matching `position-anchor` on the SubContent. It closes with the menu."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsContextMenu({
                region: "Right-click for a submenu",
                rows: [row.item("Rename"), SUBMENU, row.separator, row.item("Archive")],
              });
            const p = partNamer(mode, "ContextMenu");
            return [
              imports(mode, ["Content", "Item", "Sub", "SubTrigger", "SubContent"]),
              ``,
              `<${p("Sub")}>`,
              `  <${p("SubTrigger")} style={{ anchorName: "--move" }}>Move to…</${p("SubTrigger")}>`,
              `  <${p("SubContent")} style={{ positionAnchor: "--move" }}>`,
              `    <${p("Item")}>Project Atlas</${p("Item")}>`,
              `    <${p("Item")}>Project Beacon</${p("Item")}>`,
              `  </${p("SubContent")}>`,
              `</${p("Sub")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <DocsContextMenu region="Right-click for a submenu">
              <ContextMenuItem>Rename</ContextMenuItem>
              <DocsSub label="Move to…">
                <ContextMenuItem>Project Atlas</ContextMenuItem>
                <ContextMenuItem>Project Beacon</ContextMenuItem>
                <ContextMenuItem>Project Cascade</ContextMenuItem>
              </DocsSub>
              <ContextMenuSeparator />
              <ContextMenuItem>Archive</ContextMenuItem>
            </DocsContextMenu>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "groups",
      title: "Labelled groups",
      render: () => (
        <InteractiveExample
          elementsCaption="`<primitiv-context-menu-group>` with a `<primitiv-context-menu-label>` inside sections a long menu into named runs; the element gives the label an id and the group `aria-labelledby` it."
          caption="`ContextMenu.Group` with a `ContextMenu.Label` sections a long menu into named runs, and the label is wired as the group's accessible name."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsContextMenu({
                region: "Right-click for grouped actions",
                rows: [group("Edit", ["Cut", "Copy"]), row.separator, group("Share", ["Email", "Copy link"])],
              });
            const p = partNamer(mode, "ContextMenu");
            return [
              imports(mode, ["Content", "Group", "Label", "Item"]),
              ``,
              `<${p("Group")}>`,
              `  <${p("Label")}>Edit</${p("Label")}>`,
              `  <${p("Item")}>Cut</${p("Item")}>`,
              `  <${p("Item")}>Copy</${p("Item")}>`,
              `</${p("Group")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <DocsContextMenu region="Right-click for grouped actions">
              <ContextMenuGroup>
                <ContextMenuLabel>Edit</ContextMenuLabel>
                <ContextMenuItem>Cut</ContextMenuItem>
                <ContextMenuItem>Copy</ContextMenuItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuLabel>Share</ContextMenuLabel>
                <ContextMenuItem>Email</ContextMenuItem>
                <ContextMenuItem>Copy link</ContextMenuItem>
              </ContextMenuGroup>
            </DocsContextMenu>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "disabled",
      title: "A disabled region",
      render: () => (
        <InteractiveExample
          elementsCaption="`disabled` on `<primitiv-context-menu-trigger>` opens nothing on a right-click, and leaves the browser its own menu — for a region that only sometimes offers actions."
          caption="`disabled` on `ContextMenu.Trigger` opens nothing on a right-click, and leaves the browser its own menu — for a region that only sometimes offers actions."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsContextMenu({
                region: "Right-click: the browser's own menu",
                disabled: true,
                rows: [row.item("Never shown")],
              });
            const p = partNamer(mode, "ContextMenu");
            return [imports(mode, ["Trigger"]), ``, `<${p("Trigger")} disabled>…</${p("Trigger")}>`].join("\n");
          }}
        >
          {() => (
            <DocsContextMenu region="Right-click: the browser's own menu" disabled>
              <ContextMenuItem>Never shown</ContextMenuItem>
            </DocsContextMenu>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "Dropdown's menu, opened at the pointer: `<primitiv-context-menu>` opens its `popover=\"manual\"` menu on a right-click in its region — or the context-menu key on it — moves focus to the first item, runs the menu's keyboard and typeahead, and closes it on a chosen item, Escape or a press outside.",
    anatomyMeta:
      "Fourteen elements. `<primitiv-context-menu>` holds the state in its `open` attribute. `<primitiv-context-menu-trigger>` is the region itself — put your classes on it — and the content element is the menu, so the registry classes go on it. Every row wraps the `<li>` you write, which gets its menu role; groups, labels, separators and indicators are their own elements, and `<primitiv-context-menu-sub>` nests a submenu.",
    keyboardMeta:
      "The browser raises the same `contextmenu` event for a right-click and for the context-menu key or Shift+F10 on a focused element, so give the region `tabindex=\"0\"` and it opens from the keyboard too. Once open it is the Menu pattern: roving focus, a single tab stop.",
    keyboard: [
      { keys: ["Shift", "F10"], behaviour: "Open the menu from the focused region (as does the context-menu key)." },
      { keys: ["ArrowDown", "ArrowUp"], behaviour: "Move focus to the next / previous enabled item, wrapping at the ends." },
      { keys: ["Home", "End"], behaviour: "First / last item." },
      { keys: ["Enter", "Space"], behaviour: "Choose the focused item." },
      { keys: ["ArrowRight"], behaviour: "Open the focused submenu (ArrowLeft under `dir=\"rtl\"`)." },
      { keys: ["ArrowLeft"], behaviour: "Close the current submenu and return to its row (ArrowRight under `dir=\"rtl\"`)." },
      { keys: ["Escape"], behaviour: "Close the menu." },
    ],
    accessibility: [
      "A context menu is a shortcut, never the only way to an action: touch users may have no right-click, and nothing announces that one exists. Offer every action elsewhere too.",
      "Give the region `tabindex=\"0\"` so a keyboard user can open the menu with Shift+F10 or the context-menu key.",
      "The element gives the menu `role=\"menu\"` and each row its item role — `menuitem`, `menuitemcheckbox` with `aria-checked`, `menuitemradio` — on the element you write. Focus moves to the first item on open.",
      "The menu is a native `popover=\"manual\"` in the top layer; write `popover=\"manual\"` in your markup so it is hidden before the script loads. The element publishes the pointer's position as `--primitiv-context-menu-x` / `-y` — the one style it writes — for the stylesheet to place the menu by.",
      "Every user-driven change fires a cancelable event first: `primitiv-context-menu-change`, `-sub-change`, `-checked-change`, `-value-change`, and `primitiv-context-menu-select` as an item is chosen — `preventDefault()` keeps it as it was.",
    ],
  },

  accessibility: [
    "A context menu is a shortcut, never the only way to an action: touch users may have no right-click, and nothing on the page announces that one exists. Offer every action elsewhere too — a toolbar, a Dropdown, a row's own buttons.",
    "Make the region focusable (`tabIndex={0}`) so a keyboard user can open the menu with Shift+F10 or the context-menu key — the browser raises the same `contextmenu` event for both.",
    "It is the WAI-ARIA Menu pattern: the menu is a single tab stop with roving focus, focus moves to its first item on open, and Escape closes it.",
    "`ContextMenu.CheckboxItem` and `ContextMenu.RadioItem` carry the real `menuitemcheckbox` / `menuitemradio` roles and checked state, so their on/off is announced; the indicator is the visual half.",
    "The menu is a native `popover=\"manual\"` in the top layer, so it escapes `overflow: hidden` and `z-index` ancestors. Manual, not auto: the right-click's own release would light-dismiss an auto popover, so the component closes it on an outside press itself.",
  ],
};
