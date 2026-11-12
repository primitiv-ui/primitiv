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
import { glyph, withGlyphs } from "./glyphs";
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
 * Elements markup (RFC 0033), in the shape `primitiv add combobox` prints. The
 * root `<primitiv-combobox>` keeps `value`; the input part wraps the `<input>`
 * you write, the content element is the list and each item element is an
 * option. Glyphs are placeholders the preview fills in (`withGlyphs`); the
 * styled spans and classes drop away in the headless tab.
 */
type ElementsRow = { leading?: string; trailing?: string; label?: boolean };

const elementsItem = (name: string, { leading, trailing, label }: ElementsRow = {}) =>
  [
    `<primitiv-combobox-item value="${name.toLowerCase()}"${label ? ` label="${name}"` : ""} class="primitiv-combobox__item">`,
    `  <span class="primitiv-combobox__item-indicator" aria-hidden="true">${glyph("check")}</span>`,
    ...(leading ? [`  <span class="primitiv-combobox__item-leading" aria-hidden="true">${glyph(leading as "search")}</span>`] : []),
    `  <span class="primitiv-combobox__item-label">${name}</span>`,
    ...(trailing ? [`  <span class="primitiv-combobox__item-trailing">${trailing}</span>`] : []),
    `</primitiv-combobox-item>`,
  ].map((line) => `    ${line}`);

const elementsCombobox = ({
  size = "md",
  flavour = "chevron",
  row = () => ({}),
}: {
  size?: string;
  flavour?: "chevron" | "search";
  row?: (name: string) => ElementsRow;
} = {}) =>
  [
    `<primitiv-combobox class="primitiv-combobox primitiv-combobox--${size}">`,
    `  <span class="primitiv-combobox__control">`,
    ...(flavour === "search"
      ? [`    <span class="primitiv-combobox__leading" aria-hidden="true">${glyph("search")}</span>`]
      : []),
    `    <primitiv-combobox-input>`,
    `      <input class="primitiv-combobox__input" aria-label="Framework" placeholder="${flavour === "search" ? "Search frameworks..." : "Pick a framework..."}" autocomplete="off">`,
    `    </primitiv-combobox-input>`,
    ...(flavour === "chevron"
      ? [`    <span class="primitiv-combobox__icon" aria-hidden="true">${glyph("chevron-down")}</span>`]
      : []),
    `  </span>`,
    `  <primitiv-combobox-content aria-label="Frameworks" class="primitiv-combobox__content">`,
    ...FRAMEWORKS.flatMap((f) => elementsItem(f, row(f))),
    `    <primitiv-combobox-empty class="primitiv-combobox__empty">No frameworks match</primitiv-combobox-empty>`,
    `  </primitiv-combobox-content>`,
    `</primitiv-combobox>`,
  ].join("\n");

/** The page's own filter, as the code tab shows it: hide the items that do not match. */
const FILTER_SCRIPT = [
  ``,
  `<script type="module">`,
  `  const combobox = document.querySelector("primitiv-combobox");`,
  `  combobox.addEventListener("primitiv-combobox-query-change", (event) => {`,
  `    const query = event.detail.query.trim().toLowerCase();`,
  `    for (const item of combobox.querySelectorAll("primitiv-combobox-item")) {`,
  `      item.hidden = !item.textContent.toLowerCase().includes(query);`,
  `    }`,
  `  });`,
  `</script>`,
].join("\n");

/** The same filter, scoped to a preview (scripts in injected markup never run). */
const wireFilter = (root: HTMLElement) => {
  const combobox = root.querySelector("primitiv-combobox");
  if (!combobox) return;
  const onQuery = (event: Event) => {
    const query = (event as CustomEvent<{ query: string }>).detail.query.trim().toLowerCase();
    for (const item of combobox.querySelectorAll<HTMLElement>("primitiv-combobox-item")) {
      item.hidden = !(item.textContent ?? "").toLowerCase().includes(query);
    }
  };
  combobox.addEventListener("primitiv-combobox-query-change", onQuery);
  return () => combobox.removeEventListener("primitiv-combobox-query-change", onQuery);
};

/** The markup half of a code tab that ends in a script: what the preview renders. */
const markupOf = (code: string) => withGlyphs(code.slice(0, code.indexOf("\n\n<script")));

/** The controlled example's Elements code: a readout, the combobox, and the listener that follows it. */
const elementsControlled = () =>
  [
    `<p>Selected: <output data-combobox-value>nothing</output></p>`,
    elementsCombobox(),
    ``,
    `<script type="module">`,
    `  const combobox = document.querySelector("primitiv-combobox");`,
    `  combobox.addEventListener("primitiv-combobox-change", (event) => {`,
    `    document.querySelector("[data-combobox-value]").textContent = event.detail.value || "nothing";`,
    `    // preventDefault() here would veto the commit`,
    `  });`,
    `  // ...and the filter from the first example`,
    `</script>`,
  ].join("\n");

const wireControlled = (root: HTMLElement) => {
  const combobox = root.querySelector("primitiv-combobox");
  const output = root.querySelector("[data-combobox-value]");
  if (!combobox || !output) return;
  const onChange = (event: Event) => {
    output.textContent = (event as CustomEvent<{ value: string }>).detail.value || "nothing";
  };
  combobox.addEventListener("primitiv-combobox-change", onChange);
  const unfilter = wireFilter(root);
  return () => {
    combobox.removeEventListener("primitiv-combobox-change", onChange);
    unfilter?.();
  };
};

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
      if (mode === "elements") return elementsCombobox({ size: values.size });
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
    elementsPreview: (code) => withGlyphs(code),
    render: (values) => <BasicCombobox size={values.size as Size} />,
  },

  anatomyMeta:
    "Twelve parts. `Combobox.Control` is the framed field (Input's geometry) wrapping the `Combobox.Input`, an optional `Combobox.Leading` glyph and the decorative `Combobox.Icon` chevron. `Combobox.Content` is the popup listbox; each `Combobox.Item` holds a `Combobox.ItemIndicator` mark, optional `Combobox.ItemLeading` / `Combobox.ItemTrailing` slots, and its label, with `Combobox.Empty` for no results. Only `Combobox.Root`, `Input`, `Content`, `Item` and `Empty` exist in the headless primitive — the framed-control chrome and the row-anatomy parts are styled-surface additions.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        if (mode === "elements")
          return [
            `<primitiv-combobox>`,
            `  <primitiv-combobox-input>`,
            `    <input>`,
            `  </primitiv-combobox-input>`,
            `  <primitiv-combobox-content>`,
            `    <primitiv-combobox-item value="react">`,
            `      React`,
            `    </primitiv-combobox-item>`,
            `    <primitiv-combobox-empty>`,
            `  </primitiv-combobox-content>`,
            `</primitiv-combobox>`,
          ].join("\n");
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
          elementsCaption="The canonical combobox: an editable field with a trailing chevron over a list of suggestions. **Filtering is yours** — the element shows every item it holds, so listen for `primitiv-combobox-query-change` and set `hidden` on the items that do not match (or swap in new ones from a server). Hidden items are skipped by the cursor, and `<primitiv-combobox-empty>` shows only while none is left. Type to filter, or press ArrowDown to open the full list."
          elementsPreview={(_density, code) => markupOf(code)}
          wire={wireFilter}
          caption="The canonical combobox: an editable field with a trailing chevron over a filtered popup. **Filtering is yours** — there is no `filter` prop; `onQueryChange` reports every keystroke and you render the matching items (which keeps async loading, fuzzy matching and sorting where the data lives). Render `Combobox.Empty` when nothing matches. Type to filter, or press ArrowDown to open the full list."
          code={(_density, mode) =>
            mode === "elements"
              ? elementsCombobox() + "\n" + FILTER_SCRIPT
              : [
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
          elementsCaption="Same element, dressed as a search field: drop the chevron and put a magnifier in a `primitiv-combobox__leading` span before the input part, inside the control. The behaviour is identical — only the standing glyph moves to the start of the field."
          elementsPreview={(_density, code) => markupOf(code)}
          wire={wireFilter}
          caption="Same component, dressed as a search field: drop the chevron and put a magnifier in the `Combobox.Leading` slot. It is a documented variation rather than a second component — the behaviour is identical, only the standing glyph moves to the start of the field."
          code={(_density, mode) =>
            mode === "elements"
              ? elementsCombobox({ flavour: "search" }) + "\n" + FILTER_SCRIPT
              : [
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
          elementsCaption="A row can carry more than a mark and a label: a `primitiv-combobox__item-leading` span holds a glyph after the mark column, and a `primitiv-combobox__item-trailing` span a hint pinned to the inline-end edge. The field shows an item's text once it is committed — give the item a `label` attribute when its text holds more than the name, as these rows do."
          elementsPreview={(_density, code) => markupOf(code)}
          wire={wireFilter}
          caption="A row can carry more than a mark and a label. `Combobox.ItemLeading` holds a glyph after the mark column and `Combobox.ItemTrailing` a badge or hint pinned to the inline-end edge. Keep the label a plain text node between them — the headless layer reads the committed label from a row's text only when it is a bare string, so wrapping it would make the field show the item's `value` instead."
          code={(_density, mode) => {
            if (mode === "elements")
              return (
                elementsCombobox({ row: (f) => ({ leading: "search", trailing: `<kbd>${f.length}</kbd>`, label: true }) }) +
                "\n" +
                FILTER_SCRIPT
              );
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
          elementsCaption="The value lives in the root's reflected `value` attribute, so a server re-render or a history snapshot sees it, and setting the attribute (or the `value` property) commits from elsewhere — the field shows that item's text. Listen for `primitiv-combobox-change` to react to a commit: it fires before the value applies and is cancelable, and it fires with an empty value when the user clears the field."
          elementsPreview={() => markupOf(elementsControlled())}
          wire={wireControlled}
          caption="Pass `value` and `onValueChange` and the parent owns the committed selection — needed to react to a choice, persist it, or set it from elsewhere. `onValueChange` fires when the user commits (by click or Enter), separately from `onQueryChange` (every keystroke) and `onOpenChange` (the popup). Omit `value` for the uncontrolled form, or seed it with `defaultValue`."
          code={(_density, mode) => {
            if (mode === "elements") return elementsControlled();
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

  elements: {
    description:
      "An editable text field with a popup list of suggestions. `<primitiv-combobox>` keeps the committed item in its `value` attribute; the `<input>` inside `<primitiv-combobox-input>` keeps focus throughout, and `<primitiv-combobox-content>` is the list, shown in the top layer as the user types. Filtering is yours: hide the items that do not match. Give it a `name` and the value submits with a form.",
    anatomyMeta:
      "Five elements. `<primitiv-combobox>` owns `value` and `open`, both reflected, and `name` for forms. `<primitiv-combobox-input>` decorates the one `<input>` you write, which gets `role=\"combobox\"`, `aria-autocomplete=\"list\"`, `aria-expanded`, `aria-controls` and `aria-activedescendant`. `<primitiv-combobox-content>` is the list itself — `role=\"listbox\"`, `popover=\"auto\"` — each `<primitiv-combobox-item>` is an option, and `<primitiv-combobox-empty>` shows only while no item does. The framed control, the chevron and the row's mark and slots are styling spans.",
    keyboardMeta:
      "Focus stays in the `<input>` you write; the cursor is **virtual** — `aria-activedescendant` on the input, `data-highlighted` on the item — so an item never matches `:focus`. Typing fires `primitiv-combobox-query-change` and opens the list, which lives in the top layer and light-dismisses on a press outside. Hidden and disabled items are skipped.",
    keyboard: [
      { keys: ["ArrowDown", "ArrowUp"], behaviour: "While closed: open the list. While open: move the cursor, entering at the first / last item, and wrapping." },
      { keys: ["Home", "End"], behaviour: "While open: move the cursor to the first / last item." },
      { keys: ["Enter"], behaviour: "Commit the item under the cursor: the value changes, the field shows its text, and the list closes." },
      { keys: ["Escape"], behaviour: "While open: close, and put the committed text back in the field." },
      {
        keys: ["character"],
        literal: true,
        behaviour: "Type — `primitiv-combobox-query-change` fires and the list opens. Emptying the field clears the value.",
      },
    ],
    accessibility: [
      "The `<input>` is `role=\"combobox\"` with `aria-autocomplete=\"list\"`, `aria-expanded` and `aria-controls` pointing at `<primitiv-combobox-content>`, a `role=\"listbox\"`; each item is a `role=\"option\"` with `aria-selected`. Name the input with `aria-label` or a `<label>`, and the list with its own `aria-label`.",
      "The cursor is **virtual focus**: real focus never leaves the input, which publishes `aria-activedescendant` at the current item (marked `data-highlighted`). Style the cursor from `[data-highlighted]`, never `:focus`.",
      "The list lives in the top layer through the Popover API, so it escapes ancestor `overflow` and stacking contexts, and light dismiss is the browser's. While closed it is hidden, so it is out of the accessibility tree; a filtered-out item is `hidden` too.",
      "With a `name`, the combobox keeps a hidden input inside itself, so its form submits the committed **value** rather than the field's text, and a form reset restores the value it first rendered with.",
      "`primitiv-combobox-change` fires before a commit or a clear applies and is cancelable — the field then shows the kept value's text — and `primitiv-combobox-open-change` does the same for opening and closing.",
      "An item with no `value`, or an input part without exactly one element child, is reported once in the console and left alone.",
    ],
  },

  accessibility: [
    "The field is `role=\"combobox\"` with `aria-expanded` and `aria-controls` pointing at the popup `role=\"listbox\"`; each row is a `role=\"option\"`. Name the field with `aria-label` or `aria-labelledby` (or a `Field.Label`), and the popup with its own `aria-label`.",
    "The cursor is **virtual focus**: DOM focus never leaves the input, which keeps its focus ring while the popup is open and publishes `aria-activedescendant` at the current row (marked `data-highlighted`). A row never matches `:focus`, so the cursor is styled with `[data-highlighted]`. Both the ring (\"keystrokes go here\") and the cursor tint (\"Enter picks this\") showing at once is correct.",
    "The popup is a top-layer `popover=\"auto\"` panel: it paints above the whole page (no `z-index` needed) and light-dismisses on an outside click, and it is unmounted while closed — so a screen reader never meets a listbox that looks shut.",
    "`Combobox.Icon` is a decorative `aria-hidden` chevron with `pointer-events: none` — a click aimed at it falls through to the field. Unlike `Select`, the frame is a `<div>` wrapping an `<input>`, so the chevron does not open the popup; typing or ArrowDown does.",
    "There is no `invalid` prop and no root `disabled` — set `aria-invalid` or `disabled` on the `Combobox.Input` (or cascade `aria-invalid` from a `Field.Root`), and the frame follows via `:has()`.",
    "Related: reach for [Select](/components/select/) when the choices are fixed and need no typing, and [Listbox](/components/listbox/) for an always-visible list with no field. Combobox is the case where a text field both filters and selects.",
  ],
};
