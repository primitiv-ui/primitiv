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
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
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
          caption="`SplitButton.Action` runs the default immediately; **click the chevron** to open `SplitButton.Menu` for the alternatives. Here the action is a **sticky default** — each `SplitButton.Item`'s `onSelect` sets state that becomes the button's label, so picking one makes it the new primary (try it, then read the button). `onSelect` closes the menu; `SplitButton.Separator` groups related runs. The menu is a Dropdown panel floored at the group's width and aligned to its leading edge, and the anchor is wired for you."
          code={(_density, mode) => {
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
          caption="`variant` is set once on the root and applies to **both** halves, so the seam divides one coherent control. Three intents: `primary`, `secondary`, `danger`. `ghost` and `link` are deliberately unavailable — neither has a box at rest for the seam to divide, so a welded pair would read as a label with a stray chevron."
          code={(density, mode) => {
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
          caption="`size` is also set once on the root and drives both halves and the menu together — five sizes, `xs` to `xl` — and each rescales again with the nearest `data-density` ancestor. The chevron half stays square at every size."
          code={(density, mode) => {
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
          caption="`SplitButton` provides the Dropdown context, so any Dropdown row part composes inside `SplitButton.Menu` — here `DropdownItemLeading` + `DropdownItemLabel` for an icon-plus-label row. `DropdownGroup`/`DropdownLabel`, `DropdownCheckboxItem` and `DropdownSub` work the same way; import them from the `dropdown` component."
          code={(_density, mode) => {
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

  accessibility: [
    "The whole control is one `role=\"group\"` (`data-split-button`), and the two halves are separate real `<button>`s — so the action runs on one press while the menu opens from the other, and both are in the tab order.",
    "The `SplitButton.Trigger` is icon-only, so it needs an accessible name: it derives one from the `SplitButton.Action`'s visible label automatically, or pass `aria-label`/`aria-labelledby` to override — the chevron itself is `aria-hidden`.",
    "The menu is the WAI-ARIA Menu pattern — a single tab stop with roving focus, opened in the top layer as a native `[popover]`, so it escapes `overflow: hidden` ancestors and light-dismisses on an outside click. Focus moves into it on open and back to the trigger on close.",
    "`disabled` works per half or for the whole group: disable the action alone (the menu of alternatives may still be useful), the trigger alone, or the root (which sets `data-disabled` on the frame and both halves).",
    "`variant` and `size` are set once on the root and cascade to both halves and the menu, so the two buttons can never drift out of step — the seam always divides one coherent control.",
  ],
};
