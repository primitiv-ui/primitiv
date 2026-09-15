"use client";

import { useState } from "react";

import { Check, ChevronDown, Search } from "@primitiv-ui/icons";

import { Kbd } from "@/components/kbd";
import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxEmpty,
  ComboboxIcon,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemLeading,
  ComboboxItemTrailing,
  ComboboxLeading,
} from "@/components/combobox";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const FRAMEWORKS = ["React", "Preact", "Solid", "Svelte", "Vue", "Angular", "Qwik", "Lit"];

const filterFrameworks = (query: string) =>
  FRAMEWORKS.filter((f) => f.toLowerCase().includes(query.trim().toLowerCase()));

const imports = (mode: Mode, parts: readonly string[], icons: readonly string[] = []) =>
  importBlock({
    mode,
    component: "Combobox",
    componentId: "combobox",
    parts,
    /* The chevron, the mark and the framed-control chrome are styled-surface
       parts — a headless combobox brings its own, so it imports no icon. */
    icons: mode === "headless" ? [] : icons,
  });

/**
 * The default framework picker — the canonical composition. Filtering is
 * consumer-owned: `onQueryChange` reports each keystroke and the rendered items
 * narrow in response. Reused (with tweaks) by most examples.
 */
const BasicCombobox = ({
  size,
  flavour = "chevron",
}: {
  size?: Size;
  flavour?: "chevron" | "search";
}) => {
  const [query, setQuery] = useState("");
  const matches = filterFrameworks(query);
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: "22rem" }}>
      <Combobox size={size} onQueryChange={setQuery}>
        <ComboboxControl>
          {flavour === "search" && (
            <ComboboxLeading>
              <Search aria-hidden="true" />
            </ComboboxLeading>
          )}
          <ComboboxInput
            aria-label="Framework"
            placeholder={flavour === "search" ? "Search frameworks..." : "Pick a framework..."}
          />
          {flavour === "chevron" && (
            <ComboboxIcon>
              <ChevronDown aria-hidden="true" />
            </ComboboxIcon>
          )}
        </ComboboxControl>
        <ComboboxContent aria-label="Frameworks">
          {matches.map((f) => (
            <ComboboxItem key={f} value={f}>
              <ComboboxItemIndicator>
                <Check aria-hidden="true" />
              </ComboboxItemIndicator>
              {f}
            </ComboboxItem>
          ))}
          {matches.length === 0 && <ComboboxEmpty>No frameworks match</ComboboxEmpty>}
        </ComboboxContent>
      </Combobox>
    </div>
  );
};

/** The controlled example's live half — owns the committed value and shows it. */
const ControlledCombobox = () => {
  const [query, setQuery] = useState("");
  const [value, setValue] = useState("");
  const matches = filterFrameworks(query);
  return (
    <div className="docs-example-stack" style={{ inlineSize: "100%", maxInlineSize: "22rem" }}>
      <p className="docs-prop-description">Selected: {value || "nothing"}</p>
      <Combobox value={value} onValueChange={setValue} onQueryChange={setQuery}>
        <ComboboxControl>
          <ComboboxInput aria-label="Framework" placeholder="Pick a framework..." />
          <ComboboxIcon>
            <ChevronDown aria-hidden="true" />
          </ComboboxIcon>
        </ComboboxControl>
        <ComboboxContent aria-label="Frameworks">
          {matches.map((f) => (
            <ComboboxItem key={f} value={f}>
              <ComboboxItemIndicator>
                <Check aria-hidden="true" />
              </ComboboxItemIndicator>
              {f}
            </ComboboxItem>
          ))}
          {matches.length === 0 && <ComboboxEmpty>No frameworks match</ComboboxEmpty>}
        </ComboboxContent>
      </Combobox>
    </div>
  );
};

/** A row's snippet lines, mode-aware: styled composes the mark + text; a
 *  headless row is a plain `Combobox.Item` (the mark is the consumer's). */
const rowLines = (mode: Mode, value: string, indent = "    ") => {
  const p = partNamer(mode, "Combobox");
  if (mode === "headless") {
    return [`${indent}<${p("Item")} value="${value}">${value}</${p("Item")}>`];
  }
  return [
    `${indent}<ComboboxItem value="${value}">`,
    `${indent}  <ComboboxItemIndicator><Check aria-hidden="true" /></ComboboxItemIndicator>`,
    `${indent}  ${value}`,
    `${indent}</ComboboxItem>`,
  ];
};

/** The control's snippet lines, mode-aware: styled wraps the field in a framed
 *  `ComboboxControl` with a chevron; headless has just the bare `Combobox.Input`. */
const controlLines = (mode: Mode, flavour: "chevron" | "search" = "chevron") => {
  const p = partNamer(mode, "Combobox");
  if (mode === "headless") {
    return [`  <${p("Input")} aria-label="Framework" placeholder="Pick a framework..." />`];
  }
  return [
    `  <ComboboxControl>`,
    ...(flavour === "search"
      ? [`    <ComboboxLeading><Search aria-hidden="true" /></ComboboxLeading>`]
      : []),
    `    <ComboboxInput aria-label="Framework" placeholder="Pick a framework..." />`,
    ...(flavour === "chevron"
      ? [`    <ComboboxIcon><ChevronDown aria-hidden="true" /></ComboboxIcon>`]
      : []),
    `  </ComboboxControl>`,
  ];
};

/** The whole picker snippet, mode-aware — shared by the playground and the
 *  Basic/Search examples, which differ only in the leading/trailing chrome. */
const pickerLines = (
  mode: Mode,
  { flavour = "chevron", sizeAttr = "" }: { flavour?: "chevron" | "search"; sizeAttr?: string } = {},
) => {
  const p = partNamer(mode, "Combobox");
  return [
    `<${p("Root")}${sizeAttr} onQueryChange={setQuery}>`,
    ...controlLines(mode, flavour),
    `  <${p("Content")} aria-label="Frameworks">`,
    `    {matches.map((f) => (`,
    ...rowLines(mode, "{f}", "      "),
    `    ))}`,
    mode === "headless"
      ? `    {matches.length === 0 && <${p("Empty")}>No matches</${p("Empty")}>}`
      : `    {matches.length === 0 && <ComboboxEmpty>No matches</ComboboxEmpty>}`,
    `  </${p("Content")}>`,
    `</${p("Root")}>`,
  ];
};

const stateLines = () => [
  `const [query, setQuery] = useState("");`,
  `const matches = FRAMEWORKS.filter((f) =>`,
  `  f.toLowerCase().includes(query.toLowerCase()),`,
  `);`,
];

/**
 * Combobox's page content.
 *
 * The WAI-ARIA combobox — an editable field over a filtered popup listbox. The
 * control is Input verbatim; the popup is a top-layer floating panel; filtering
 * is the consumer's. The keyboard model and the virtual-focus cursor belong to
 * the primitive, so a keyboard section earns its place.
 */
export const comboboxSpec: ComponentSpec = {
  playground: {
    component: "Combobox",
    snippet: (values, mode) => {
      const sizeAttr = contractAttr({ mode, prop: "size", value: values.size });
      return [
        imports(mode, ["Control", "Input", "Icon", "Content", "Item", "ItemIndicator", "Empty"], ["Check", "ChevronDown"]),
        `import { useState } from "react";`,
        ``,
        ...stateLines(),
        ``,
        ...pickerLines(mode, { sizeAttr }),
      ].join("\n");
    },
    fill: true,
    render: (values) => <BasicCombobox size={values.size as Size} />,
  },

  anatomyMeta:
    "Twelve parts. `Combobox.Control` is the framed field (Input's geometry) wrapping the `Combobox.Input`, an optional `Combobox.Leading` glyph and the decorative `Combobox.Icon` chevron. `Combobox.Content` is the popup listbox; each `Combobox.Item` holds a `Combobox.ItemIndicator` mark, optional `Combobox.ItemLeading` / `Combobox.ItemTrailing` slots, and its label, with `Combobox.Empty` for no results. Only `Combobox.Root`, `Input`, `Content`, `Item` and `Empty` exist in the headless primitive — the framed-control chrome and the row-anatomy parts are styled-surface additions.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        const p = partNamer(mode, "Combobox");
        if (mode === "headless") {
          return [
            `<${p("Root")}>`,
            `  <${p("Input")} />`,
            `  <${p("Content")}>`,
            `    <${p("Item")} />`,
            `    <${p("Empty")} />`,
            `  </${p("Content")}>`,
            `</${p("Root")}>`,
            ``,
            `// The framed control (Control/Leading/Icon), the mark and the row`,
            `// slots are styled-surface parts — a headless row is your own markup.`,
          ].join("\n");
        }
        return [
          `<Combobox>`,
          `  <ComboboxControl>`,
          `    <ComboboxLeading />     {/* optional */}`,
          `    <ComboboxInput />`,
          `    <ComboboxIcon />        {/* the chevron */}`,
          `  </ComboboxControl>`,
          `  <ComboboxContent>`,
          `    <ComboboxItem>`,
          `      <ComboboxItemIndicator />`,
          `      <ComboboxItemLeading />   {/* optional */}`,
          `      {/* label */}`,
          `      <ComboboxItemTrailing />  {/* optional */}`,
          `    </ComboboxItem>`,
          `    <ComboboxEmpty />`,
          `  </ComboboxContent>`,
          `</Combobox>`,
        ].join("\n");
      },
    },
  ],

  keyboardMeta:
    "Focus stays in the `Combobox.Input` (`role=\"combobox\"`, the tab stop); the cursor is **virtual** — `aria-activedescendant` on the input, `data-highlighted` on the row — so a row never matches `:focus`. Typing filters (via `onQueryChange`) and opens the popup, which lives in the top layer and light-dismisses on an outside click.",

  keyboard: [
    {
      keys: ["ArrowDown", "ArrowUp"],
      behaviour: "Open the popup and move the cursor, seeding the first / last item when there is none.",
    },
    { keys: ["Home", "End"], behaviour: "Move the cursor to the first / last item." },
    { keys: ["Enter"], behaviour: "Commit the item under the cursor and close the popup." },
    { keys: ["Escape"], behaviour: "Close the popup and restore the committed label to the field." },
    {
      keys: ["character"],
      literal: true,
      behaviour: "Type to filter — every keystroke fires `onQueryChange`, and the popup opens.",
    },
  ],

  examples: [
    {
      id: "basic",
      title: "A framework picker",
      render: () => (
        <InteractiveExample
          caption="The canonical combobox: an editable field with a trailing chevron over a filtered popup. **Filtering is yours** — there is no `filter` prop; `onQueryChange` reports every keystroke and you render the matching items (which keeps async loading, fuzzy matching and sorting where the data lives). Render `Combobox.Empty` when nothing matches. Type to filter, or press ArrowDown to open the full list."
          code={(_density, mode) =>
            [
              imports(mode, ["Control", "Input", "Icon", "Content", "Item", "ItemIndicator", "Empty"], ["Check", "ChevronDown"]),
              `import { useState } from "react";`,
              ``,
              ...stateLines(),
              ``,
              ...pickerLines(mode),
            ].join("\n")
          }
        >
          {() => <BasicCombobox />}
        </InteractiveExample>
      ),
    },
    {
      id: "search",
      title: "Search flavour",
      render: () => (
        <InteractiveExample
          caption="Same component, dressed as a search field: drop the chevron and put a magnifier in the `Combobox.Leading` slot. It is a documented variation rather than a second component — the behaviour is identical, only the standing glyph moves to the start of the field."
          code={(_density, mode) =>
            [
              imports(mode, ["Control", "Leading", "Input", "Content", "Item", "ItemIndicator", "Empty"], ["Check", "Search"]),
              `import { useState } from "react";`,
              ``,
              ...stateLines(),
              ``,
              ...pickerLines(mode, { flavour: "search" }),
            ].join("\n")
          }
        >
          {() => <BasicCombobox flavour="search" />}
        </InteractiveExample>
      ),
    },
    {
      id: "rich-rows",
      title: "Rich rows",
      render: () => (
        <InteractiveExample
          caption="A row can carry more than a mark and a label. `Combobox.ItemLeading` holds a glyph after the mark column and `Combobox.ItemTrailing` a badge or hint pinned to the inline-end edge. Keep the label a plain text node between them — the headless layer reads the committed label from a row's text only when it is a bare string, so wrapping it would make the field show the item's `value` instead."
          code={(_density, mode) => {
            const p = partNamer(mode, "Combobox");
            if (mode === "headless") {
              return [
                imports(mode, ["Control", "Input", "Content", "Item", "Empty"]),
                `import { useState } from "react";`,
                ``,
                ...stateLines(),
                ``,
                `<${p("Root")} onQueryChange={setQuery}>`,
                `  <${p("Input")} aria-label="Framework" />`,
                `  <${p("Content")} aria-label="Frameworks">`,
                `    {matches.map((f) => (`,
                `      <${p("Item")} value={f}>{/* your leading glyph, label and hint */}</${p("Item")}>`,
                `    ))}`,
                `  </${p("Content")}>`,
                `</${p("Root")}>`,
              ].join("\n");
            }
            return [
              imports(mode, ["Control", "Input", "Icon", "Content", "Item", "ItemLeading", "ItemTrailing", "Empty"], ["ChevronDown"]),
              `import { Kbd } from "@/components/ui/kbd";`,
              `import { useState } from "react";`,
              ``,
              ...stateLines(),
              ``,
              `<Combobox onQueryChange={setQuery}>`,
              `  <ComboboxControl>`,
              `    <ComboboxInput aria-label="Framework" placeholder="Pick a framework..." />`,
              `    <ComboboxIcon><ChevronDown aria-hidden="true" /></ComboboxIcon>`,
              `  </ComboboxControl>`,
              `  <ComboboxContent aria-label="Frameworks">`,
              `    {matches.map((f) => (`,
              `      <ComboboxItem key={f} value={f}>`,
              `        <ComboboxItemLeading><FrameworkGlyph /></ComboboxItemLeading>`,
              `        {f}`,
              `        <ComboboxItemTrailing><Kbd>{count}</Kbd></ComboboxItemTrailing>`,
              `      </ComboboxItem>`,
              `    ))}`,
              `  </ComboboxContent>`,
              `</Combobox>`,
            ].join("\n");
          }}
        >
          {() => {
            const Rich = () => {
              const [query, setQuery] = useState("");
              const matches = filterFrameworks(query);
              return (
                <div style={{ inlineSize: "100%", maxInlineSize: "22rem" }}>
                  <Combobox onQueryChange={setQuery}>
                    <ComboboxControl>
                      <ComboboxInput aria-label="Framework" placeholder="Pick a framework..." />
                      <ComboboxIcon>
                        <ChevronDown aria-hidden="true" />
                      </ComboboxIcon>
                    </ComboboxControl>
                    <ComboboxContent aria-label="Frameworks">
                      {matches.map((f) => (
                        <ComboboxItem key={f} value={f}>
                          <ComboboxItemLeading>
                            <Search aria-hidden="true" />
                          </ComboboxItemLeading>
                          {f}
                          <ComboboxItemTrailing>
                            <Kbd>{f.length}</Kbd>
                          </ComboboxItemTrailing>
                        </ComboboxItem>
                      ))}
                      {matches.length === 0 && <ComboboxEmpty>No frameworks match</ComboboxEmpty>}
                    </ComboboxContent>
                  </Combobox>
                </div>
              );
            };
            return <Rich />;
          }}
        </InteractiveExample>
      ),
    },
    {
      id: "controlled",
      title: "Controlled",
      render: () => (
        <InteractiveExample
          caption="Pass `value` and `onValueChange` and the parent owns the committed selection — needed to react to a choice, persist it, or set it from elsewhere. `onValueChange` fires when the user commits (by click or Enter), separately from `onQueryChange` (every keystroke) and `onOpenChange` (the popup). Omit `value` for the uncontrolled form, or seed it with `defaultValue`."
          code={(_density, mode) => {
            const p = partNamer(mode, "Combobox");
            return [
              imports(mode, ["Control", "Input", "Icon", "Content", "Item", "ItemIndicator", "Empty"], ["Check", "ChevronDown"]),
              `import { useState } from "react";`,
              ``,
              `const [query, setQuery] = useState("");`,
              `const [value, setValue] = useState("");`,
              `const matches = FRAMEWORKS.filter((f) =>`,
              `  f.toLowerCase().includes(query.toLowerCase()),`,
              `);`,
              ``,
              `<${p("Root")} value={value} onValueChange={setValue} onQueryChange={setQuery}>`,
              ...controlLines(mode),
              `  <${p("Content")} aria-label="Frameworks">`,
              `    {matches.map((f) => (`,
              ...rowLines(mode, "{f}", "      "),
              `    ))}`,
              `  </${p("Content")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <ControlledCombobox />}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "The field is `role=\"combobox\"` with `aria-expanded` and `aria-controls` pointing at the popup `role=\"listbox\"`; each row is a `role=\"option\"`. Name the field with `aria-label` or `aria-labelledby` (or a `Field.Label`), and the popup with its own `aria-label`.",
    "The cursor is **virtual focus**: DOM focus never leaves the input, which keeps its focus ring while the popup is open and publishes `aria-activedescendant` at the current row (marked `data-highlighted`). A row never matches `:focus`, so the cursor is styled with `[data-highlighted]`. Both the ring (\"keystrokes go here\") and the cursor tint (\"Enter picks this\") showing at once is correct.",
    "The popup is a top-layer `popover=\"auto\"` panel: it paints above the whole page (no `z-index` needed) and light-dismisses on an outside click, and it is unmounted while closed — so a screen reader never meets a listbox that looks shut.",
    "`Combobox.Icon` is a decorative `aria-hidden` chevron with `pointer-events: none` — a click aimed at it falls through to the field. Unlike `Select`, the frame is a `<div>` wrapping an `<input>`, so the chevron does not open the popup; typing or ArrowDown does.",
    "There is no `invalid` prop and no root `disabled` — set `aria-invalid` or `disabled` on the `Combobox.Input` (or cascade `aria-invalid` from a `Field.Root`), and the frame follows via `:has()`.",
    "Related: reach for [Select](/components/select/) when the choices are fixed and need no typing, and [Listbox](/components/listbox/) for an always-visible list with no field. Combobox is the case where a text field both filters and selects.",
  ],
};
