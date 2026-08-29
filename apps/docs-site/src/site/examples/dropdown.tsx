"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";

import { Check } from "@primitiv-ui/icons";

import { Button } from "@/components/button";
import {
  Dropdown,
  DropdownCheckboxItem,
  DropdownContent,
  DropdownGroup,
  DropdownItem,
  DropdownItemIndicator,
  DropdownLabel,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownSeparator,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownSub,
  DropdownTrigger,
} from "@/components/dropdown";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const PARTS = ["Trigger", "Content", "Item", "Separator", "Label", "Group", "CheckboxItem", "RadioGroup", "RadioItem", "ItemIndicator", "Sub", "SubTrigger", "SubContent"] as const;

const imports = (mode: Mode, parts: readonly string[]) =>
  importBlock({ mode, component: "Dropdown", componentId: "dropdown", parts });

/* Like Popover, the menu opens via JS (native popover, no implicit anchor), so
   it needs an explicit anchor-name ↔ position-anchor pair per instance. */
const toAnchorName = (id: string) => `--menu${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
const anchorNameStyle = (n: string) => ({ anchorName: n }) as CSSProperties;
const positionAnchorStyle = (n: string) => ({ positionAnchor: n }) as CSSProperties;

/** A docs dropdown: anchor-wired, click-to-open, with the menu passed as children. */
const DocsDropdown = ({
  triggerLabel,
  size,
  buttonSize,
  children,
}: {
  triggerLabel: ReactNode;
  size?: Size;
  buttonSize?: Size;
  children: ReactNode;
}) => {
  const anchor = toAnchorName(useId());
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="secondary" size={buttonSize} style={anchorNameStyle(anchor)}>
          {triggerLabel}
        </Button>
      </DropdownTrigger>
      <DropdownContent size={size} style={positionAnchorStyle(anchor)}>
        {children}
      </DropdownContent>
    </Dropdown>
  );
};

/** The checkbox/radio example's live half — hooks can't be called from a render prop. */
const ChoicesMenu = () => {
  const [wrap, setWrap] = useState(true);
  const [theme, setTheme] = useState("system");
  return (
    <DocsDropdown triggerLabel="View options">
      <DropdownLabel>Editor</DropdownLabel>
      <DropdownCheckboxItem checked={wrap} onCheckedChange={setWrap}>
        <DropdownItemIndicator>
          <Check size="100%" />
        </DropdownItemIndicator>
        Word wrap
      </DropdownCheckboxItem>
      <DropdownSeparator />
      <DropdownLabel>Theme</DropdownLabel>
      <DropdownRadioGroup value={theme} onValueChange={setTheme}>
        {["system", "light", "dark"].map((t) => (
          <DropdownRadioItem key={t} value={t}>
            <DropdownItemIndicator>
              <Check size="100%" />
            </DropdownItemIndicator>
            {t[0].toUpperCase() + t.slice(1)}
          </DropdownRadioItem>
        ))}
      </DropdownRadioGroup>
    </DocsDropdown>
  );
};

/**
 * Dropdown's page content.
 *
 * A menu-button on the native Popover API — click to open, a roving-focus list
 * of rows (plain items, checkbox/radio items, submenus). Genuinely
 * click-to-open, and anchor-wired like Popover (a unique anchor-name ↔
 * position-anchor pair). `placement` is excluded from the playground.
 */
export const dropdownSpec: ComponentSpec = {
  playground: {
    component: "Dropdown",
    excludeControls: ["placement"],
    snippet: (values, mode) => {
      const p = partNamer(mode, "Dropdown");
      const size = contractAttr({ mode, prop: "size", value: values.size });
      return [
        imports(mode, ["Trigger", "Content", "Item", "Separator"]),
        ``,
        `<${p("Root")}>`,
        `  <${p("Trigger")} asChild>`,
        `    <button style={{ anchorName: "--menu" }}>Actions</button>`,
        `  </${p("Trigger")}>`,
        `  <${p("Content")}${size} style={{ positionAnchor: "--menu" }}>`,
        `    <${p("Item")}>Edit</${p("Item")}>`,
        `    <${p("Item")}>Duplicate</${p("Item")}>`,
        `    <${p("Separator")} />`,
        `    <${p("Item")}>Delete</${p("Item")}>`,
        `  </${p("Content")}>`,
        `</${p("Root")}>`,
      ].join("\n");
    },
    render: (values) => (
      <DocsDropdown triggerLabel="Actions" size={values.size as Size}>
        <DropdownItem>Edit</DropdownItem>
        <DropdownItem>Duplicate</DropdownItem>
        <DropdownSeparator />
        <DropdownItem>Delete</DropdownItem>
      </DocsDropdown>
    ),
  },

  anatomyMeta:
    "`Dropdown.Root` owns the open state; `Dropdown.Trigger` is the menu button; `Dropdown.Content` is the panel. Inside it: `Dropdown.Item` for actions, `Dropdown.CheckboxItem` / `Dropdown.RadioGroup` + `Dropdown.RadioItem` for toggles (each with a `Dropdown.ItemIndicator` for the check/dot), `Dropdown.Label` + `Dropdown.Group` to section it, `Dropdown.Separator` between runs, and `Dropdown.Sub` / `Dropdown.SubTrigger` / `Dropdown.SubContent` for a nested submenu. Positioning is CSS anchor positioning you wire (anchor-name ↔ position-anchor).",
  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        const p = partNamer(mode, "Dropdown");
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
    "The menu is a roving-focus list: it opens focused on the first item, and the arrow keys move between items (a single tab stop). It is the WAI-ARIA Menu pattern — a keyboard user does not Tab through every row.",
  keyboard: [
    { keys: ["Enter", "Space"], behaviour: "Open the menu from the trigger; activate the focused item." },
    { keys: ["ArrowDown", "ArrowUp"], behaviour: "Move focus to the next / previous item, wrapping at the ends." },
    { keys: ["ArrowRight"], behaviour: "Open the focused submenu (or, on `dir=\"rtl\"`, the mirror)." },
    { keys: ["ArrowLeft"], behaviour: "Close the current submenu and return to its trigger." },
    { keys: ["Home", "End"], behaviour: "First / last item." },
    { keys: ["Escape"], behaviour: "Close the menu and return focus to the trigger." },
  ],

  examples: [
    {
      id: "actions",
      title: "A menu of actions",
      render: () => (
        <InteractiveExample
          caption="**Click the trigger** to open a list of actions. Each `Dropdown.Item` runs its `onSelect` and closes the menu; `Dropdown.Separator` groups related runs. Add a leading icon or a trailing shortcut with `Dropdown.ItemLeading` / `Dropdown.ItemTrailing` inside the item."
          code={(_density, mode) => {
            const p = partNamer(mode, "Dropdown");
            return [
              imports(mode, ["Trigger", "Content", "Item", "Separator"]),
              ``,
              `<${p("Root")}>`,
              `  <${p("Trigger")} asChild>`,
              `    <button style={{ anchorName: "--menu" }}>Actions</button>`,
              `  </${p("Trigger")}>`,
              `  <${p("Content")} style={{ positionAnchor: "--menu" }}>`,
              `    <${p("Item")} onSelect={() => edit()}>Edit</${p("Item")}>`,
              `    <${p("Item")} onSelect={() => duplicate()}>Duplicate</${p("Item")}>`,
              `    <${p("Separator")} />`,
              `    <${p("Item")} onSelect={() => remove()}>Delete</${p("Item")}>`,
              `  </${p("Content")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <DocsDropdown triggerLabel="Actions">
              <DropdownItem>Edit</DropdownItem>
              <DropdownItem>Duplicate</DropdownItem>
              <DropdownItem>Move to…</DropdownItem>
              <DropdownSeparator />
              <DropdownItem>Delete</DropdownItem>
            </DocsDropdown>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "choices",
      title: "Checkbox and radio items",
      render: () => (
        <InteractiveExample
          caption="`Dropdown.CheckboxItem` is a togglable row (many can be on); `Dropdown.RadioGroup` + `Dropdown.RadioItem` is a single-choice set. Each carries a `Dropdown.ItemIndicator` that shows only when the row is selected — the check or dot in the gutter. Selecting one keeps the menu open for these, unlike a plain action."
          code={(_density, mode) => {
            const p = partNamer(mode, "Dropdown");
            return [
              imports(mode, ["Content", "CheckboxItem", "RadioGroup", "RadioItem", "ItemIndicator", "Label", "Separator"]),
              ``,
              `<${p("CheckboxItem")} checked={wrap} onCheckedChange={setWrap}>`,
              `  <${p("ItemIndicator")}><Check /></${p("ItemIndicator")}>`,
              `  Word wrap`,
              `</${p("CheckboxItem")}>`,
              ``,
              `<${p("RadioGroup")} value={theme} onValueChange={setTheme}>`,
              `  <${p("RadioItem")} value="light">`,
              `    <${p("ItemIndicator")}><Check /></${p("ItemIndicator")}>Light`,
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
          caption="`Dropdown.Sub` nests a second menu: `Dropdown.SubTrigger` is a row that opens `Dropdown.SubContent` to the side on hover or ArrowRight. A submenu is a real anchor-positioned menu of its own, so it flips when there is not room — use it to keep a long list of options tucked behind one row rather than sprawling."
          code={(_density, mode) => {
            const p = partNamer(mode, "Dropdown");
            return [
              imports(mode, ["Content", "Item", "Sub", "SubTrigger", "SubContent"]),
              ``,
              `<${p("Sub")}>`,
              `  <${p("SubTrigger")}>Move to…</${p("SubTrigger")}>`,
              `  <${p("SubContent")}>`,
              `    <${p("Item")}>Project A</${p("Item")}>`,
              `    <${p("Item")}>Project B</${p("Item")}>`,
              `  </${p("SubContent")}>`,
              `</${p("Sub")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <DocsDropdown triggerLabel="With a submenu">
              <DropdownItem>Rename</DropdownItem>
              <DropdownSub>
                <DropdownSubTrigger>Move to…</DropdownSubTrigger>
                <DropdownSubContent>
                  <DropdownItem>Project Atlas</DropdownItem>
                  <DropdownItem>Project Beacon</DropdownItem>
                  <DropdownItem>Project Cascade</DropdownItem>
                </DropdownSubContent>
              </DropdownSub>
              <DropdownSeparator />
              <DropdownItem>Archive</DropdownItem>
            </DocsDropdown>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "groups",
      title: "Labelled groups",
      render: () => (
        <InteractiveExample
          caption="`Dropdown.Group` with a `Dropdown.Label` sections a long menu into named runs, and the label is wired as the group's accessible name — so a screen reader announces which group each item belongs to, not just a flat list."
          code={(_density, mode) => {
            const p = partNamer(mode, "Dropdown");
            return [
              imports(mode, ["Content", "Group", "Label", "Item"]),
              ``,
              `<${p("Group")}>`,
              `  <${p("Label")}>Account</${p("Label")}>`,
              `  <${p("Item")}>Profile</${p("Item")}>`,
              `  <${p("Item")}>Billing</${p("Item")}>`,
              `</${p("Group")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <DocsDropdown triggerLabel="Account">
              <DropdownGroup>
                <DropdownLabel>Account</DropdownLabel>
                <DropdownItem>Profile</DropdownItem>
                <DropdownItem>Billing</DropdownItem>
              </DropdownGroup>
              <DropdownSeparator />
              <DropdownGroup>
                <DropdownLabel>Workspace</DropdownLabel>
                <DropdownItem>Members</DropdownItem>
                <DropdownItem>Settings</DropdownItem>
              </DropdownGroup>
            </DocsDropdown>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "It is the WAI-ARIA Menu pattern: the menu is a single tab stop with roving focus, so the arrow keys move between items and Tab leaves the whole menu — a keyboard user is not made to Tab through every row.",
    "The panel is a native `[popover]` in the top layer, so it escapes `overflow: hidden` and `z-index` ancestors, and light-dismisses on an outside click. Focus moves into the menu on open and back to the trigger on close.",
    "`Dropdown.CheckboxItem` and `Dropdown.RadioItem` carry the real `menuitemcheckbox`/`menuitemradio` roles and checked state, so their on/off is announced — the `Dropdown.ItemIndicator` is the visual half of a state assistive tech already conveys.",
    "`Dropdown.Label` names its `Dropdown.Group`, so items are announced within their section rather than as one long undifferentiated list.",
    "A `Dropdown.Item` supports `disabled`, which keeps the row focusable (so a screen-reader user learns it exists) while skipping it in activation — a disabled row that vanishes from the keyboard is one nobody discovers.",
  ],
};
