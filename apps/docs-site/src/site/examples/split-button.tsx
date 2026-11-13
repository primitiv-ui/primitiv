"use client";

import { useState } from "react";

import { ChevronDown, File, Plus } from "@primitiv-ui/icons";

import {
  DropdownItemLeading,
  DropdownItemLabel,
} from "@/components/dropdown";
import {
  SplitButton,
  SplitButtonAction,
  SplitButtonItem,
  SplitButtonMenu,
  SplitButtonSeparator,
  SplitButtonTrigger,
} from "@/components/split-button";
import { contractAttr, importBlock, indent, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Variant = "primary" | "secondary" | "danger";

const imports = (mode: Mode, parts: readonly string[], icons: readonly string[] = []) =>
  importBlock({ mode, component: "SplitButton", componentId: "split-button", parts, icons });

/* ------------------------------------------------------------------ *
 * Live previews
 * ------------------------------------------------------------------ */

/**
 * A Save split button — the primary action welded to a menu of alternatives.
 *
 * Stateful: the action is a "sticky default", so selecting an alternative makes
 * it the new primary and the button's label updates. The action half runs
 * whatever the label currently says.
 */
const SaveSplitButton = ({
  variant,
  size,
}: {
  variant?: Variant;
  size?: Size;
}) => {
  const [action, setAction] = useState("Save");

  return (
    <SplitButton variant={variant} size={size}>
      <SplitButtonAction>{action}</SplitButtonAction>
      <SplitButtonTrigger aria-label="Change save action">
        <ChevronDown aria-hidden="true" />
      </SplitButtonTrigger>
      <SplitButtonMenu>
        <SplitButtonItem onSelect={() => setAction("Save")}>Save</SplitButtonItem>
        <SplitButtonItem onSelect={() => setAction("Save and close")}>
          Save and close
        </SplitButtonItem>
        <SplitButtonItem onSelect={() => setAction("Save as draft")}>
          Save as draft
        </SplitButtonItem>
        <SplitButtonSeparator />
        <SplitButtonItem onSelect={() => setAction("Save as template")}>
          Save as template
        </SplitButtonItem>
      </SplitButtonMenu>
    </SplitButton>
  );
};

/* ------------------------------------------------------------------ *
 * Snippet builders — clean dual-surface (every part on both). The
 * styled copy self-wires the anchor; headless wires it by hand, since
 * anchor positioning is the styling layer's job.
 * ------------------------------------------------------------------ */

/** The root open tag — headless carries the `anchor-name` the styled copy adds for you. */
const rootOpen = (mode: Mode, attrs: string) => {
  const p = partNamer(mode, "SplitButton");
  return mode === "headless"
    ? `<${p("Root")}${attrs} style={{ anchorName: "--actions" }}>`
    : `<SplitButton${attrs}>`;
};

/** The menu open tag — headless carries the matching `position-anchor`. */
const menuOpen = (mode: Mode) => {
  const p = partNamer(mode, "SplitButton");
  return mode === "headless"
    ? `  <${p("Menu")} style={{ positionAnchor: "--actions" }}>`
    : `  <SplitButtonMenu>`;
};

/** The stateful Save menu items — each `onSelect` makes its label the new default. */
const saveItemLines = (mode: Mode) => {
  const p = partNamer(mode, "SplitButton");
  return [
    `    <${p("Item")} onSelect={() => setAction("Save")}>Save</${p("Item")}>`,
    `    <${p("Item")} onSelect={() => setAction("Save and close")}>Save and close</${p("Item")}>`,
    `    <${p("Item")} onSelect={() => setAction("Save as draft")}>Save as draft</${p("Item")}>`,
    `    <${p("Separator")} />`,
    `    <${p("Item")} onSelect={() => setAction("Save as template")}>Save as template</${p("Item")}>`,
  ];
};

/* ------------------------------------------------------------------ *
 * Elements markup (RFC 0033)
 * ------------------------------------------------------------------ */

const CHEVRON =
  '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M20.06 9 12 17.06 3.94 9 5 7.94l7 7 7-7L20.06 9Z"/></svg>';
const PLUS =
  '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M11.25 3.25h1.5v17.5h-1.5V3.25Z"/><path d="M20.75 11.25v1.5H3.25v-1.5h17.5Z"/></svg>';
const FILE =
  '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="m14.31 2.25 5.44 5.44v14.06H4.25V2.25h10.06Zm-8.56 18h12.5V8.31l-4.56-4.56H5.75v16.5Z"/><path d="M13.25 2.75h1.5v4.5h4.5v1.5h-6v-6Z"/></svg>';

/** A menu row: a label, an icon-plus-label row, or `null` for a separator. */
type ElementsRow = string | { icon: string; label: string } | null;

const SAVE_ROWS: readonly ElementsRow[] = ["Save", "Save and close", "Save as draft", null, "Save as template"];

/**
 * One split button as Elements markup, in the shape `primitiv add split-button
 * --surface elements` prints: `<primitiv-split-button>` around the action's
 * `<button>` and a `<primitiv-dropdown>` whose trigger is the chevron half.
 * The classes are the styled surface's, which the headless tab drops.
 */
const elementsSplit = ({
  action = "Save",
  label = "Change save action",
  rows = SAVE_ROWS,
  variant = "primary",
  size = "md",
}: {
  action?: string;
  label?: string;
  rows?: readonly ElementsRow[];
  variant?: string;
  size?: string;
} = {}) => {
  const button = `primitiv-button primitiv-button--${variant} primitiv-button--${size}`;
  const row = (r: ElementsRow) =>
    r === null
      ? `<primitiv-dropdown-separator class="primitiv-dropdown__separator"></primitiv-dropdown-separator>`
      : typeof r === "string"
        ? `<primitiv-dropdown-item><div class="primitiv-dropdown__item">${r}</div></primitiv-dropdown-item>`
        : `<primitiv-dropdown-item><div class="primitiv-dropdown__item"><span class="primitiv-dropdown__item-leading">${r.icon}</span><span class="primitiv-dropdown__item-label">${r.label}</span></div></primitiv-dropdown-item>`;
  return [
    `<primitiv-split-button class="primitiv-split-button primitiv-split-button--${variant} primitiv-split-button--${size}">`,
    `  <primitiv-split-button-action>`,
    `    <button type="button" class="${button} primitiv-split-button__action">`,
    `      <span class="primitiv-button__label">${action}</span>`,
    `    </button>`,
    `  </primitiv-split-button-action>`,
    `  <primitiv-dropdown>`,
    `    <primitiv-dropdown-trigger>`,
    `      <button type="button" class="${button} primitiv-split-button__trigger" aria-label="${label}">${CHEVRON}</button>`,
    `    </primitiv-dropdown-trigger>`,
    `    <primitiv-dropdown-content class="primitiv-dropdown primitiv-dropdown--${size} primitiv-dropdown--bottom-start primitiv-split-button__menu" popover="auto">`,
    ...rows.map((r) => `      ${row(r)}`),
    `    </primitiv-dropdown-content>`,
    `  </primitiv-dropdown>`,
    `</primitiv-split-button>`,
  ].join("\n");
};

/** Split buttons side by side, as the React examples' flex row lays them out. */
const elementsRow = (buttons: readonly string[]) =>
  [`<div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap">`, ...buttons.map((b) => indent(b)), `</div>`].join(
    "\n",
  );

/** The sticky-default script: a chosen row becomes the action's label. */
const STICKY_SCRIPT = [
  `<script type="module">`,
  `  document.addEventListener("primitiv-dropdown-select", (event) => {`,
  `    const group = event.target.closest("primitiv-split-button");`,
  `    group.querySelector(".primitiv-button__label").textContent = event.target.textContent;`,
  `  });`,
  `</script>`,
];

/** Wires the sticky default into the preview, as the code tab's listener does. */
const wireSticky = (root: HTMLElement) => {
  const onSelect = (event: Event) => {
    const item = event.target as HTMLElement;
    const label = item.closest("primitiv-split-button")?.querySelector(".primitiv-button__label");
    if (label) label.textContent = item.textContent;
  };
  root.addEventListener("primitiv-dropdown-select", onSelect);
  return () => root.removeEventListener("primitiv-dropdown-select", onSelect);
};

/* ------------------------------------------------------------------ *
 * The spec
 * ------------------------------------------------------------------ */

/**
 * SplitButton's page content.
 *
 * A primary action welded to a chevron trigger that opens a menu of related
 * alternatives — one `role="group"` widget composing the registry `button` and
 * `dropdown`. Clean dual-surface: every part exists on both surfaces. The menu
 * is a top-layer popover, so it is closed by default (open on click) and
 * escapes the preview's clipping; the styled copy wires the anchor for you.
 */
export const splitButtonSpec: ComponentSpec = {
  playground: {
    component: "SplitButton",
    snippet: (values, mode) => {
      if (mode === "elements") return elementsSplit({ variant: values.variant, size: values.size });
      const p = partNamer(mode, "SplitButton");
      const attrs =
        contractAttr({ mode, prop: "variant", value: values.variant }) +
        contractAttr({ mode, prop: "size", value: values.size });
      return [
        imports(mode, ["Action", "Trigger", "Menu", "Item", "Separator"], ["ChevronDown"]),
        `import { useState } from "react";`,
        ``,
        `const [action, setAction] = useState("Save");`,
        ``,
        rootOpen(mode, attrs),
        `  <${p("Action")}>{action}</${p("Action")}>`,
        `  <${p("Trigger")} aria-label="Change save action">`,
        `    <ChevronDown aria-hidden="true" />`,
        `  </${p("Trigger")}>`,
        menuOpen(mode),
        ...saveItemLines(mode),
        `  </${p("Menu")}>`,
        `</${p("Root")}>`,
      ].join("\n");
    },
    render: (values) => (
      <SaveSplitButton variant={values.variant as Variant} size={values.size as Size} />
    ),
  },

  anatomyMeta:
    "`SplitButton` is the `role=\"group\"` frame that carries `variant`/`size` down to both halves. `SplitButton.Action` is the primary button (its label names the trigger for free); `SplitButton.Trigger` is the square chevron button that opens `SplitButton.Menu`, a Dropdown panel of `SplitButton.Item` rows split by `SplitButton.Separator`. Both halves are real `Button`s and the menu is a real Dropdown panel, so intent, size, focus and the row styles all come from those components — this adds only the seam and the anchor wiring.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        if (mode === "elements")
          return [
            `<primitiv-split-button>`,
            `  <primitiv-split-button-action>`,
            `    <button type="button">Save</button>         <!-- the primary action -->`,
            `  </primitiv-split-button-action>`,
            `  <primitiv-dropdown>`,
            `    <primitiv-dropdown-trigger>`,
            `      <button type="button">More</button>       <!-- the chevron, opens the menu -->`,
            `    </primitiv-dropdown-trigger>`,
            `    <primitiv-dropdown-content popover="auto">`,
            `      <primitiv-dropdown-item><div>Save and close</div></primitiv-dropdown-item>`,
            `      <primitiv-dropdown-separator></primitiv-dropdown-separator>`,
            `      <primitiv-dropdown-item><div>Save as template</div></primitiv-dropdown-item>`,
            `    </primitiv-dropdown-content>`,
            `  </primitiv-dropdown>`,
            `</primitiv-split-button>`,
          ].join("\n");
        const p = partNamer(mode, "SplitButton");
        return [
          `<${p("Root")}>`,
          `  <${p("Action")} />        {/* the primary action */}`,
          `  <${p("Trigger")} />       {/* the chevron, opens the menu */}`,
          `  <${p("Menu")}>`,
          `    <${p("Item")} />`,
          `    <${p("Separator")} />`,
          `    <${p("Item")} />`,
          `  </${p("Menu")}>`,
          `</${p("Root")}>`,
        ].join("\n");
      },
    },
  ],

  keyboardMeta:
    "The two halves are ordinary buttons in the tab order; the menu is the WAI-ARIA Menu pattern — a single tab stop with roving focus, so once open the arrow keys move between rows rather than Tab.",

  keyboard: [
    { keys: ["Enter", "Space"], behaviour: "Run the action (on the action half); open the menu (on the trigger half); activate the focused row (in the menu)." },
    { keys: ["ArrowDown"], behaviour: "On the action half, open the menu on its first row — the alternatives without tabbing past the action." },
    { keys: ["ArrowDown", "ArrowUp"], behaviour: "Open the menu from the trigger, then move between rows (wrapping at the ends)." },
    { keys: ["Home", "End"], behaviour: "Move to the first / last row of the open menu." },
    { keys: ["Escape"], behaviour: "Close the menu and return focus to the trigger." },
  ],

  examples: [
    {
      id: "menu-of-actions",
      title: "A default action and its alternatives",
      render: () => (
        <InteractiveExample
          elementsCaption="The action's `<button>` is yours: its click runs the default immediately, and the group never touches it. **Click the chevron**, or press **ArrowDown** on the action, to open the menu — the `<primitiv-dropdown>` inside the group. Here the action is a **sticky default**: a few lines listen for `primitiv-dropdown-select`, which every chosen row fires, and copy the row's text into the action's label. Choosing a row closes the menu; a `<primitiv-dropdown-separator>` groups related runs. The menu is anchored to the whole group, at least as wide as it, with no `anchor-name` to wire."
          elementsPreview={() => elementsSplit()}
          wire={wireSticky}
          caption="`SplitButton.Action` runs the default immediately; **click the chevron** to open `SplitButton.Menu` for the alternatives. Here the action is a **sticky default** — each `SplitButton.Item`'s `onSelect` sets state that becomes the button's label, so picking one makes it the new primary (try it, then read the button). `onSelect` closes the menu; `SplitButton.Separator` groups related runs. The menu is a Dropdown panel floored at the group's width and aligned to its leading edge, and the anchor is wired for you."
          code={(_density, mode) => {
            if (mode === "elements") return [elementsSplit(), ``, ...STICKY_SCRIPT].join("\n");
            const p = partNamer(mode, "SplitButton");
            return [
              imports(mode, ["Action", "Trigger", "Menu", "Item", "Separator"], ["ChevronDown"]),
              `import { useState } from "react";`,
              ``,
              `const [action, setAction] = useState("Save");`,
              ``,
              rootOpen(mode, ""),
              `  <${p("Action")} onClick={() => run(action)}>{action}</${p("Action")}>`,
              `  <${p("Trigger")} aria-label="Change save action">`,
              `    <ChevronDown aria-hidden="true" />`,
              `  </${p("Trigger")}>`,
              menuOpen(mode),
              ...saveItemLines(mode),
              `  </${p("Menu")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <SaveSplitButton />}
        </InteractiveExample>
      ),
    },
    {
      id: "variants",
      title: "Variants",
      render: () => (
        <InteractiveExample
          elementsCaption="The intent is a class on the group **and** on both buttons — `primitiv-split-button--danger` with `primitiv-button--danger` on each half — so keep them in step and the seam divides one coherent control. Three intents: `primary`, `secondary`, `danger`. `ghost` and `link` are deliberately unavailable — neither has a box at rest for the seam to divide."
          elementsPreview={() => elementsRow((["primary", "secondary", "danger"] as const).map((v) =>
      elementsSplit({
        action: v[0].toUpperCase() + v.slice(1),
        label: `More ${v} options`,
        rows: ["Alternative one", "Alternative two"],
        variant: v,
      }),
    ))}
          caption="`variant` is set once on the root and applies to **both** halves, so the seam divides one coherent control. Three intents: `primary`, `secondary`, `danger`. `ghost` and `link` are deliberately unavailable — neither has a box at rest for the seam to divide, so a welded pair would read as a label with a stray chevron."
          code={(density, mode) => {
            if (mode === "elements")
              return [
                `<div data-density="${density}">`,
                indent(elementsSplit({ action: "Danger", label: "More danger options", rows: ["Alternative one", "Alternative two"], variant: "danger" })),
                `</div>`,
              ].join("\n");
            const open = rootOpen(mode, contractAttr({ mode, prop: "variant", value: "danger" }));
            return [
              imports(mode, ["Action", "Trigger", "Menu", "Item"], ["ChevronDown"]),
              ``,
              `<div data-density="${density}">`,
              `  ${open}...</${partNamer(mode, "SplitButton")("Root")}>`,
              `</div>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {(["primary", "secondary", "danger"] as const).map((v) => (
                <SplitButton key={v} variant={v}>
                  <SplitButtonAction>{v[0].toUpperCase() + v.slice(1)}</SplitButtonAction>
                  <SplitButtonTrigger aria-label={`More ${v} options`}>
                    <ChevronDown aria-hidden="true" />
                  </SplitButtonTrigger>
                  <SplitButtonMenu>
                    <SplitButtonItem>Alternative one</SplitButtonItem>
                    <SplitButtonItem>Alternative two</SplitButtonItem>
                  </SplitButtonMenu>
                </SplitButton>
              ))}
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
          elementsCaption="The size is a class too — `primitiv-split-button--sm` on the group, `primitiv-button--sm` on both halves and `primitiv-dropdown--sm` on the menu — five sizes, `xs` to `xl`, and each rescales again with the nearest `data-density` ancestor. The chevron half stays square at every size."
          elementsPreview={(density) =>
            [`<div data-density="${density}">`, indent(elementsRow((["xs", "sm", "md", "lg", "xl"] as const).map((s) =>
      elementsSplit({ action: `Save ${s}`, label: `More options (${s})`, rows: ["Save and close", "Save as draft"], size: s }),
    ))), `</div>`].join("\n")
          }
          caption="`size` is also set once on the root and drives both halves and the menu together — five sizes, `xs` to `xl` — and each rescales again with the nearest `data-density` ancestor. The chevron half stays square at every size."
          code={(density, mode) => {
            if (mode === "elements")
              return [
                `<div data-density="${density}">`,
                indent(elementsSplit({ action: "Save sm", label: "More options (sm)", rows: ["Save and close", "Save as draft"], size: "sm" })),
                `</div>`,
              ].join("\n");
            const p = partNamer(mode, "SplitButton");
            return [
              imports(mode, ["Action", "Trigger", "Menu", "Item"], ["ChevronDown"]),
              ``,
              `<div data-density="${density}">`,
              ...(["sm", "md", "lg"] as const).map(
                (s) =>
                  `  ${rootOpen(mode, contractAttr({ mode, prop: "size", value: s }))}...</${p("Root")}>`,
              ),
              `</div>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
                <SplitButton key={s} size={s}>
                  <SplitButtonAction>Save {s}</SplitButtonAction>
                  <SplitButtonTrigger aria-label={`More options (${s})`}>
                    <ChevronDown aria-hidden="true" />
                  </SplitButtonTrigger>
                  <SplitButtonMenu>
                    <SplitButtonItem>Save and close</SplitButtonItem>
                    <SplitButtonItem>Save as draft</SplitButtonItem>
                  </SplitButtonMenu>
                </SplitButton>
              ))}
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "rich-rows",
      title: "Richer menu rows",
      render: () => (
        <InteractiveExample
          elementsCaption="The menu is a real `<primitiv-dropdown>`, so every Dropdown part works inside it — here a `primitiv-dropdown__item-leading` icon beside a `primitiv-dropdown__item-label` for an icon-plus-label row. Groups and labels, checkbox and radio items, and submenus compose the same way."
          elementsPreview={() => elementsSplit({
      action: "Create",
      label: "More create options",
      rows: [
        { icon: PLUS, label: "New from template" },
        { icon: FILE, label: "Duplicate" },
      ],
    })}
          caption="`SplitButton` provides the Dropdown context, so any Dropdown row part composes inside `SplitButton.Menu` — here `DropdownItemLeading` + `DropdownItemLabel` for an icon-plus-label row. `DropdownGroup`/`DropdownLabel`, `DropdownCheckboxItem` and `DropdownSub` work the same way; import them from the `dropdown` component."
          code={(_density, mode) => {
            if (mode === "elements") return elementsSplit({
      action: "Create",
      label: "More create options",
      rows: [
        { icon: PLUS, label: "New from template" },
        { icon: FILE, label: "Duplicate" },
      ],
    });
            const p = partNamer(mode, "SplitButton");
            return [
              imports(mode, ["Action", "Trigger", "Menu", "Item"], ["ChevronDown", "File", "Plus"]),
              `import { DropdownItemLeading, DropdownItemLabel } from "@/components/ui/dropdown";`,
              ``,
              menuOpen(mode),
              `    <${p("Item")}>`,
              `      <DropdownItemLeading><Plus aria-hidden="true" /></DropdownItemLeading>`,
              `      <DropdownItemLabel>New from template</DropdownItemLabel>`,
              `    </${p("Item")}>`,
              `    <${p("Item")}>`,
              `      <DropdownItemLeading><File aria-hidden="true" /></DropdownItemLeading>`,
              `      <DropdownItemLabel>Duplicate</DropdownItemLabel>`,
              `    </${p("Item")}>`,
              `  </${p("Menu")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <SplitButton>
              <SplitButtonAction>Create</SplitButtonAction>
              <SplitButtonTrigger aria-label="More create options">
                <ChevronDown aria-hidden="true" />
              </SplitButtonTrigger>
              <SplitButtonMenu>
                <SplitButtonItem>
                  <DropdownItemLeading>
                    <Plus aria-hidden="true" />
                  </DropdownItemLeading>
                  <DropdownItemLabel>New from template</DropdownItemLabel>
                </SplitButtonItem>
                <SplitButtonItem>
                  <DropdownItemLeading>
                    <File aria-hidden="true" />
                  </DropdownItemLeading>
                  <DropdownItemLabel>Duplicate</DropdownItemLabel>
                </SplitButtonItem>
              </SplitButtonMenu>
            </SplitButton>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "One primary action welded to a menu of related alternatives. `<primitiv-split-button>` is the `role=\"group\"` around two things you write: the action's `<button>` in a `<primitiv-split-button-action>`, and a `<primitiv-dropdown>` whose trigger is the chevron half — so the menu, its `open` state and its events are the Dropdown's.",
    anatomyMeta:
      "Two elements of its own, plus Dropdown's. `<primitiv-split-button>` is the group: it mirrors the menu in `data-state`, names the trigger, disables both halves with `disabled`, and opens the menu when ArrowDown is pressed on the action. `<primitiv-split-button-action>` decorates the action's `<button>` (or link) and takes no box. The nested `<primitiv-dropdown>` is an ordinary Dropdown — its trigger's `<button>` is the chevron half, its content is the menu. Defining the split button defines the Dropdown elements too.",
    keyboardMeta:
      "Both halves are ordinary buttons in the tab order; the menu is the Dropdown's — a single tab stop with roving focus, opened in the top layer.",
    keyboard: [
      { keys: ["Tab"], behaviour: "Move between the action and the trigger. Each half is its own tab stop." },
      { keys: ["Enter", "Space"], behaviour: "Run the action (on the action half); open the menu (on the trigger half); choose the focused row (in the menu)." },
      { keys: ["ArrowDown"], behaviour: "On the action half, open the menu on its first row." },
      { keys: ["ArrowDown", "ArrowUp"], behaviour: "Move between rows of the open menu (wrapping at the ends)." },
      { keys: ["Escape"], behaviour: "Close the menu and return focus to the trigger." },
    ],
    accessibility: [
      "The group is one `role=\"group\"` (`data-split-button`), and the two halves are separate real `<button>`s, both in the tab order — the action runs on one press while the menu opens from the other.",
      "**The trigger is named for you.** Unless its `<button>` carries `aria-label` or `aria-labelledby`, the group sets `aria-labelledby` to the trigger's own id then the action's, so a visually hidden \"More options\" inside it reads as \"More options, Save\". Give the chevron `aria-hidden=\"true\"`.",
      "ArrowDown on the action opens the menu through the trigger, so it fires the same cancelable `primitiv-dropdown-change` a click does — one listener vetoes both.",
      "`disabled` on the group disables both halves (native `disabled` plus `data-disabled`). To disable one half alone, put `disabled` on its part — `<primitiv-split-button-action>` or `<primitiv-dropdown-trigger>` — rather than on the button, which the group owns.",
      "Keep the intent and size classes in step on the group, both buttons and the menu, so the seam always divides one coherent control.",
    ],
  },

  accessibility: [
    "The whole control is one `role=\"group\"` (`data-split-button`), and the two halves are separate real `<button>`s — so the action runs on one press while the menu opens from the other, and both are in the tab order.",
    "The `SplitButton.Trigger` is icon-only, so it needs an accessible name: it derives one from the `SplitButton.Action`'s visible label automatically, or pass `aria-label`/`aria-labelledby` to override — the chevron itself is `aria-hidden`.",
    "The menu is the WAI-ARIA Menu pattern — a single tab stop with roving focus, opened in the top layer as a native `[popover]`, so it escapes `overflow: hidden` ancestors and light-dismisses on an outside click. Focus moves into it on open and back to the trigger on close.",
    "`disabled` works per half or for the whole group: disable the action alone (the menu of alternatives may still be useful), the trigger alone, or the root (which sets `data-disabled` on the frame and both halves).",
    "`variant` and `size` are set once on the root and cascade to both halves and the menu, so the two buttons can never drift out of step — the seam always divides one coherent control.",
  ],
};
