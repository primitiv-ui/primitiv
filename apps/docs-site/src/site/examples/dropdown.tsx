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

/** A registry Button as Elements markup, with the label span the React wrapper adds. */
const button = (label: string, size = "md") =>
  `<button type="button" class="primitiv-button primitiv-button--secondary primitiv-button--${size}"><span class="primitiv-button__label">${label}</span></button>`;

const CHECK =
  '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true"><path d="M21.057 5.904 10.05 19.111 2.939 12 4 10.94l5.95 5.949 9.954-11.946 1.153.961Z"/></svg>';

/** Elements markup for the rows inside a menu. */
const row = {
  item: (label: string) =>
    `<primitiv-dropdown-item><div class="primitiv-dropdown__item">${label}</div></primitiv-dropdown-item>`,
  checkbox: (label: string, checked: boolean) =>
    `<primitiv-dropdown-checkbox-item${checked ? " checked" : ""}><div class="primitiv-dropdown__checkbox-item">` +
    `<primitiv-dropdown-item-indicator class="primitiv-dropdown__item-indicator">${CHECK}</primitiv-dropdown-item-indicator>${label}</div></primitiv-dropdown-checkbox-item>`,
  radio: (value: string, label: string) =>
    `<primitiv-dropdown-radio-item value="${value}"><div class="primitiv-dropdown__radio-item">` +
    `<primitiv-dropdown-item-indicator class="primitiv-dropdown__item-indicator">${CHECK}</primitiv-dropdown-item-indicator>${label}</div></primitiv-dropdown-radio-item>`,
  separator: `<primitiv-dropdown-separator class="primitiv-dropdown__separator"></primitiv-dropdown-separator>`,
  label: (text: string) => `<primitiv-dropdown-label class="primitiv-dropdown__label">${text}</primitiv-dropdown-label>`,
};

/**
 * One dropdown as Elements markup (RFC 0033): the `@primitiv-ui/web` custom
 * elements, in the shape `primitiv add dropdown --surface elements` prints.
 * The root holds the state in `open`; the trigger and each row wrap the
 * element the consumer writes, the content element IS the menu (so the
 * registry classes sit on it), and it carries `popover="auto"` so it is hidden
 * before the script loads. There is no anchor wiring: the element shows the
 * menu with its trigger as source, which makes the trigger its implicit anchor.
 */
const elementsDropdown = ({ trigger, size = "md", rows }: { trigger: string; size?: string; rows: string[] }) =>
  [
    `<primitiv-dropdown>`,
    `  <primitiv-dropdown-trigger>`,
    `    ${button(trigger)}`,
    `  </primitiv-dropdown-trigger>`,
    `  <primitiv-dropdown-content class="primitiv-dropdown primitiv-dropdown--${size} primitiv-dropdown--bottom-start" popover="auto">`,
    ...rows.map((r) => `    ${r}`),
    `  </primitiv-dropdown-content>`,
    `</primitiv-dropdown>`,
  ].join("\n");

const SUBMENU = [
  `<primitiv-dropdown-sub>`,
  `<primitiv-dropdown-sub-trigger><div class="primitiv-dropdown__sub-trigger">Move to...</div></primitiv-dropdown-sub-trigger>`,
  `<primitiv-dropdown-sub-content class="primitiv-dropdown primitiv-dropdown--md primitiv-dropdown--submenu" popover="auto">`,
  row.item("Project Atlas") + row.item("Project Beacon") + row.item("Project Cascade"),
  `</primitiv-dropdown-sub-content>`,
  `</primitiv-dropdown-sub>`,
].join("");

const group = (label: string, items: string[]) =>
  `<primitiv-dropdown-group class="primitiv-dropdown__group">${row.label(label)}${items.map(row.item).join("")}</primitiv-dropdown-group>`;

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
      if (mode === "elements")
        return elementsDropdown({
          trigger: "Actions",
          size: values.size,
          rows: [row.item("Edit"), row.item("Duplicate"), row.separator, row.item("Delete")],
        });
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
        if (mode === "elements")
          return [
            `<primitiv-dropdown>`,
            `  <primitiv-dropdown-trigger><button type="button"></button></primitiv-dropdown-trigger>`,
            `  <primitiv-dropdown-content popover="auto">`,
            `    <primitiv-dropdown-item><div></div></primitiv-dropdown-item>`,
            `    <primitiv-dropdown-separator></primitiv-dropdown-separator>`,
            `    <primitiv-dropdown-checkbox-item><div><primitiv-dropdown-item-indicator></primitiv-dropdown-item-indicator></div></primitiv-dropdown-checkbox-item>`,
            `    <primitiv-dropdown-sub>`,
            `      <primitiv-dropdown-sub-trigger><div></div></primitiv-dropdown-sub-trigger>`,
            `      <primitiv-dropdown-sub-content popover="auto"></primitiv-dropdown-sub-content>`,
            `    </primitiv-dropdown-sub>`,
            `  </primitiv-dropdown-content>`,
            `</primitiv-dropdown>`,
          ].join("\n");
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
          elementsCaption="**Click the trigger** to open a list of actions. Choosing an item fires a cancelable `primitiv-dropdown-select` on it — listen for that to act — and closes the menu; `<primitiv-dropdown-separator>` groups related runs. Nothing places it by hand: the element shows the menu with its trigger as the source, which makes the trigger its implicit anchor."
          caption="**Click the trigger** to open a list of actions. Each `Dropdown.Item` runs its `onSelect` and closes the menu; `Dropdown.Separator` groups related runs. Add a leading icon or a trailing shortcut with `Dropdown.ItemLeading` / `Dropdown.ItemTrailing` inside the item."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsDropdown({
                trigger: "Actions",
                rows: [row.item("Edit"), row.item("Duplicate"), row.item("Move to..."), row.separator, row.item("Delete")],
              });
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
              <DropdownItem>Move to...</DropdownItem>
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
          elementsCaption="`<primitiv-dropdown-checkbox-item>` is a togglable row whose `checked` attribute is its state (set it to `indeterminate` for mixed); `<primitiv-dropdown-radio-group>` holds a single choice in its `value`, set by its `<primitiv-dropdown-radio-item>`s. Each fires a cancelable change first — `primitiv-dropdown-checked-change`, `primitiv-dropdown-value-change` — and the `<primitiv-dropdown-item-indicator>` inside shows only while its row is checked. Choosing one closes the menu; cancel its `primitiv-dropdown-select` to keep it open."
          caption="`Dropdown.CheckboxItem` is a togglable row (many can be on); `Dropdown.RadioGroup` + `Dropdown.RadioItem` is a single-choice set. Each carries a `Dropdown.ItemIndicator` that shows only when the row is selected — the check or dot in the gutter. Selecting one keeps the menu open for these, unlike a plain action."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsDropdown({
                trigger: "View options",
                rows: [
                  row.label("Editor"),
                  row.checkbox("Word wrap", true),
                  row.separator,
                  row.label("Theme"),
                  `<primitiv-dropdown-radio-group class="primitiv-dropdown__radio-group" value="system">` +
                    row.radio("system", "System") +
                    row.radio("light", "Light") +
                    row.radio("dark", "Dark") +
                    `</primitiv-dropdown-radio-group>`,
                ],
              });
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
          elementsCaption="`<primitiv-dropdown-sub>` nests a second menu: its `<primitiv-dropdown-sub-trigger>` row opens the `<primitiv-dropdown-sub-content>` beside it on hover, a click or ArrowRight, and ArrowLeft or the pointer reaching another row closes it again. The row is the submenu's implicit anchor, so it is placed with no wiring and flips when there is not room."
          caption="`Dropdown.Sub` nests a second menu: `Dropdown.SubTrigger` is a row that opens `Dropdown.SubContent` to the side on hover or ArrowRight. A submenu is a real anchor-positioned menu of its own, so it flips when there is not room — use it to keep a long list of options tucked behind one row rather than sprawling."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsDropdown({
                trigger: "With a submenu",
                rows: [row.item("Rename"), SUBMENU, row.separator, row.item("Archive")],
              });
            const p = partNamer(mode, "Dropdown");
            return [
              imports(mode, ["Content", "Item", "Sub", "SubTrigger", "SubContent"]),
              ``,
              `<${p("Sub")}>`,
              `  <${p("SubTrigger")}>Move to...</${p("SubTrigger")}>`,
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
                <DropdownSubTrigger>Move to...</DropdownSubTrigger>
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
          elementsCaption="`<primitiv-dropdown-group>` with a `<primitiv-dropdown-label>` inside sections a long menu into named runs; the element gives the label an id and the group `aria-labelledby` it, so a screen reader announces which group each item belongs to."
          caption="`Dropdown.Group` with a `Dropdown.Label` sections a long menu into named runs, and the label is wired as the group's accessible name — so a screen reader announces which group each item belongs to, not just a flat list."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsDropdown({
                trigger: "Account",
                rows: [group("Account", ["Profile", "Billing"]), row.separator, group("Workspace", ["Members", "Settings"])],
              });
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

  elements: {
    description:
      "A menu button on the native Popover API: `<primitiv-dropdown>` shows its menu in the top layer with the trigger as its anchor, moves focus to the first item, runs the menu's keyboard and typeahead, and closes it on a chosen item, Escape or a press outside.",
    anatomyMeta:
      "Fourteen elements. `<primitiv-dropdown>` holds the state in its `open` attribute. The trigger and every row — item, checkbox item, radio item, sub-trigger — wrap the element you write (a `<button>`, a `<div>` — not an `<li>`: the content element is not a list, so a list item has no valid parent), which gets the menu roles; the content element is the menu itself, so the registry classes go on it. Groups, labels, separators and indicators are their own elements. `<primitiv-dropdown-sub>` nests a submenu with its own `open`.",
    keyboardMeta:
      "The menu is a roving-focus list: it opens focused on the first item and the arrow keys move between items — the WAI-ARIA Menu pattern, a single tab stop. Typing focuses the item it starts.",
    keyboard: [
      { keys: ["Enter", "Space"], behaviour: "Open the menu from the trigger; choose the focused item." },
      { keys: ["ArrowDown", "ArrowUp"], behaviour: "Move focus to the next / previous enabled item, wrapping at the ends." },
      { keys: ["Home", "End"], behaviour: "First / last item." },
      { keys: ["ArrowRight"], behaviour: "Open the focused submenu (ArrowLeft under `dir=\"rtl\"`)." },
      { keys: ["ArrowLeft"], behaviour: "Close the current submenu and return to its row (ArrowRight under `dir=\"rtl\"`)." },
      { keys: ["Escape"], behaviour: "Close the menu and return focus to the trigger." },
    ],
    accessibility: [
      "The element gives the menu `role=\"menu\"` and each row its item role — `menuitem`, `menuitemcheckbox` with `aria-checked`, `menuitemradio` — on the element you write, and the trigger's button `aria-haspopup=\"menu\"`, `aria-expanded` and `aria-controls`.",
      "The menu is a native `popover=\"auto\"` in the top layer, so it escapes `overflow: hidden` and `z-index` ancestors and light-dismisses on an outside press. Write `popover=\"auto\"` in your markup: the menu is then hidden before the script loads.",
      "A `disabled` row gets `aria-disabled`, is skipped by the arrow keys and does nothing when clicked.",
      "A label inside a `<primitiv-dropdown-group>` names it, so items are announced within their section.",
      "Every user-driven change fires a cancelable event first: `primitiv-dropdown-change` for the menu, `primitiv-dropdown-sub-change` for a submenu, `primitiv-dropdown-checked-change` and `primitiv-dropdown-value-change` for checkbox and radio items, and `primitiv-dropdown-select` as an item is chosen — `preventDefault()` keeps it as it was.",
    ],
  },

  accessibility: [
    "It is the WAI-ARIA Menu pattern: the menu is a single tab stop with roving focus, so the arrow keys move between items and Tab leaves the whole menu — a keyboard user is not made to Tab through every row.",
    "The panel is a native `[popover]` in the top layer, so it escapes `overflow: hidden` and `z-index` ancestors, and light-dismisses on an outside click. Focus moves into the menu on open and back to the trigger on close.",
    "`Dropdown.CheckboxItem` and `Dropdown.RadioItem` carry the real `menuitemcheckbox`/`menuitemradio` roles and checked state, so their on/off is announced — the `Dropdown.ItemIndicator` is the visual half of a state assistive tech already conveys.",
    "`Dropdown.Label` names its `Dropdown.Group`, so items are announced within their section rather than as one long undifferentiated list.",
    "A `Dropdown.Item` supports `disabled`, which keeps the row focusable (so a screen-reader user learns it exists) while skipping it in activation — a disabled row that vanishes from the keyboard is one nobody discovers.",
  ],
};
