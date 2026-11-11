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
          caption="**Right-click the card** — or focus it and press Shift+F10 — to open a menu of actions at the pointer. Each `ContextMenu.Item` runs its `onSelect` and closes the menu; `ContextMenu.ItemTrailing` holds a shortcut hint. The root needs no anchor: it is placed at the cursor, and flips off the far edge when there is not room."
          code={(_density, mode) => {
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
          caption="`ContextMenu.CheckboxItem` is a togglable row; `ContextMenu.RadioGroup` + `ContextMenu.RadioItem` a single choice. Each carries a `ContextMenu.ItemIndicator` that shows only while its row is checked. Choosing one closes the menu — call `preventDefault()` in its `onSelect` to keep it open."
          code={(_density, mode) => {
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
          caption="`ContextMenu.Sub` nests a second menu: `ContextMenu.SubTrigger` is a row that opens `ContextMenu.SubContent` beside it on hover or ArrowRight. Unlike the root, a submenu is anchor-positioned against its row — wire a unique `anchor-name` on the SubTrigger and the matching `position-anchor` on the SubContent. It closes with the menu."
          code={(_density, mode) => {
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
          caption="`ContextMenu.Group` with a `ContextMenu.Label` sections a long menu into named runs, and the label is wired as the group's accessible name."
          code={(_density, mode) => {
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
          caption="`disabled` on `ContextMenu.Trigger` opens nothing on a right-click, and leaves the browser its own menu — for a region that only sometimes offers actions."
          code={(_density, mode) => {
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

  accessibility: [
    "A context menu is a shortcut, never the only way to an action: touch users may have no right-click, and nothing on the page announces that one exists. Offer every action elsewhere too — a toolbar, a Dropdown, a row's own buttons.",
    "Make the region focusable (`tabIndex={0}`) so a keyboard user can open the menu with Shift+F10 or the context-menu key — the browser raises the same `contextmenu` event for both.",
    "It is the WAI-ARIA Menu pattern: the menu is a single tab stop with roving focus, focus moves to its first item on open, and Escape closes it.",
    "`ContextMenu.CheckboxItem` and `ContextMenu.RadioItem` carry the real `menuitemcheckbox` / `menuitemradio` roles and checked state, so their on/off is announced; the indicator is the visual half.",
    "The menu is a native `popover=\"manual\"` in the top layer, so it escapes `overflow: hidden` and `z-index` ancestors. Manual, not auto: the right-click's own release would light-dismiss an auto popover, so the component closes it on an outside press itself.",
  ],
};
