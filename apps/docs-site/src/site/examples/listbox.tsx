"use client";

import { useRef, useState } from "react";

import { Check, Search } from "@primitiv-ui/icons";

import { Input } from "@/components/input";
import { Kbd } from "@/components/kbd";
import {
  Listbox,
  ListboxEmpty,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxOption,
  ListboxOptionCheckbox,
  ListboxOptionIndicator,
  ListboxOptionLabel,
  ListboxOptionLeading,
  ListboxOptionTrailing,
} from "@/components/listbox";
import { contractAttr, importBlock, indent, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import { glyph, withGlyphs } from "./glyphs";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const CITIES = [
  { id: "ams", label: "Amsterdam" },
  { id: "ber", label: "Berlin" },
  { id: "lon", label: "London" },
  { id: "mad", label: "Madrid" },
  { id: "par", label: "Paris" },
  { id: "rom", label: "Rome" },
];

/** The live rows for the simple examples — a mark column plus the label. */
const CityOptions = ({ mark = "indicator" }: { mark?: "indicator" | "checkbox" }) => (
  <>
    {CITIES.map((c) => (
      <ListboxOption key={c.id} value={c.id}>
        {mark === "checkbox" ? (
          <ListboxOptionCheckbox />
        ) : (
          <ListboxOptionIndicator>
            <Check aria-hidden="true" />
          </ListboxOptionIndicator>
        )}
        <ListboxOptionLabel>{c.label}</ListboxOptionLabel>
      </ListboxOption>
    ))}
  </>
);

const imports = (mode: Mode, parts: readonly string[], icons: readonly string[] = []) =>
  importBlock({
    mode,
    component: "Listbox",
    componentId: "listbox",
    parts,
    /* The mark glyph is the consumer's, and only the styled row composes the
       mark parts — a headless row is plain, so it imports no icon. */
    icons: mode === "headless" ? [] : icons,
  });

/**
 * One option, in the current mode's spelling. Styled composes the mark +
 * label parts; the headless row is a plain `Listbox.Option` whose mark and
 * label are the consumer's own (only the styled surface has those parts).
 */
const optionLines = (
  mode: Mode,
  value: string,
  label: string,
  mark: "indicator" | "checkbox" = "indicator",
  indent = "  ",
) => {
  const p = partNamer(mode, "Listbox");
  if (mode === "headless") {
    return [`${indent}<${p("Option")} value="${value}">${label}</${p("Option")}>`];
  }
  const markLine =
    mark === "checkbox"
      ? `${indent}  <ListboxOptionCheckbox />`
      : `${indent}  <ListboxOptionIndicator><Check aria-hidden="true" /></ListboxOptionIndicator>`;
  return [
    `${indent}<ListboxOption value="${value}">`,
    markLine,
    `${indent}  <ListboxOptionLabel>${label}</ListboxOptionLabel>`,
    `${indent}</ListboxOption>`,
  ];
};

/** The multi-select example's live half — controlled, with a readout. */
const MultiExample = () => {
  const [picked, setPicked] = useState<string[]>(["ams", "par"]);
  return (
    <div className="docs-example-stack" style={{ inlineSize: "100%" }}>
      <p className="docs-prop-description">
        Selected: {picked.length > 0 ? picked.join(", ") : "nothing"}
      </p>
      <Listbox type="multiple" value={picked} onValueChange={setPicked} aria-label="Cities">
        <CityOptions mark="checkbox" />
      </Listbox>
    </div>
  );
};

/**
 * One option as Elements markup (RFC 0033): the `<primitiv-listbox-option>` is
 * the option itself, and the mark and label spans are the styled surface's,
 * which the headless tab drops with the classes. The single-select checkmark is
 * a glyph placeholder the preview fills in (`withGlyphs`); the multi-select
 * checkbox is drawn in CSS, so it needs none.
 */
const elementsOption = (
  value: string,
  label: string,
  { mark = "indicator", indent = "  " }: { mark?: "indicator" | "checkbox" | "none"; indent?: string } = {},
) => [
  `${indent}<primitiv-listbox-option value="${value}" class="primitiv-listbox__option">`,
  ...(mark === "checkbox"
    ? [`${indent}  <span class="primitiv-listbox__option-checkbox"></span>`]
    : mark === "indicator"
      ? [`${indent}  <span class="primitiv-listbox__option-indicator">${glyph("check")}</span>`]
      : []),
  `${indent}  <span class="primitiv-listbox__option-label">${label}</span>`,
  `${indent}</primitiv-listbox-option>`,
];

/**
 * One listbox as Elements markup, in the shape `primitiv add listbox` prints:
 * the root is the listbox — name it with `aria-label` — and `value` lists the
 * selected options separated by spaces.
 */
const elementsList = ({
  type = "single",
  value = "",
  label = "Cities",
  size = "md",
  body,
}: {
  type?: "single" | "multiple";
  value?: string;
  label?: string;
  size?: string;
  body: readonly string[];
}) =>
  [
    `<primitiv-listbox${type === "multiple" ? ' type="multiple"' : ""}${value ? ` value="${value}"` : ""} aria-label="${label}" class="primitiv-listbox primitiv-listbox--${size}">`,
    ...body,
    `</primitiv-listbox>`,
  ].join("\n");

/** Every city as an Elements option. */
const elementsCities = (mark: "indicator" | "checkbox" = "indicator") =>
  CITIES.flatMap((c) => elementsOption(c.id, c.label, { mark }));

/** The multi-select example's Elements preview: a readout above the list, as the React preview has. */
const elementsReadout = (list: string, initial: string) =>
  [
    `<div class="docs-example-stack" style="inline-size: 100%">`,
    `  <p class="docs-prop-description">Selected: <span data-selected-cities>${initial}</span></p>`,
    indent(list),
    `</div>`,
  ].join("\n");

/** Follows `primitiv-listbox-change` into the readout, as the code tab's listener does. */
const wireReadout = (root: HTMLElement) => {
  const list = root.querySelector("primitiv-listbox");
  const readout = root.querySelector("[data-selected-cities]");
  if (!list || !readout) return;
  const onChange = (event: Event) => {
    const value = (event as CustomEvent<{ value: string[] }>).detail.value;
    readout.textContent = value.length > 0 ? value.join(", ") : "nothing";
  };
  list.addEventListener("primitiv-listbox-change", onChange);
  return () => list.removeEventListener("primitiv-listbox-change", onChange);
};

/** The search-driven example as Elements markup: an input, the listbox it drives, and the script between them. */
const elementsSearch = () =>
  [
    `<input type="search" aria-label="Search cities" placeholder="Search cities" class="primitiv-input primitiv-input--md">`,
    elementsList({ label: "City results", body: elementsCities() }),
    ``,
    `<script type="module">`,
    `  const input = document.querySelector('input[type="search"]');`,
    `  const list = document.querySelector("primitiv-listbox");`,
    `  const options = [...list.querySelectorAll("primitiv-listbox-option")];`,
    `  // Filter by taking options out of the list, not hiding them: a hidden option`,
    `  // would still be navigable, and the list picks up the change on its own.`,
    `  input.addEventListener("input", () => {`,
    `    const query = input.value.trim().toLowerCase();`,
    `    list.replaceChildren(...options.filter((o) => o.textContent.toLowerCase().includes(query)));`,
    `  });`,
    `  // Focus stays in the input: forward the list's keys to it.`,
    `  input.addEventListener("keydown", (event) => {`,
    `    if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter"].includes(event.key)) return;`,
    `    list.dispatchEvent(new KeyboardEvent("keydown", { key: event.key, bubbles: true, cancelable: true }));`,
    `    event.preventDefault();`,
    `  });`,
    `</script>`,
  ].join("\n");

/** The same script, scoped to the preview (scripts in injected markup never run). */
const wireSearch = (root: HTMLElement) => {
  const input = root.querySelector<HTMLInputElement>('input[type="search"]');
  const list = root.querySelector("primitiv-listbox");
  if (!input || !list) return;
  const options = [...list.querySelectorAll("primitiv-listbox-option")];
  const onInput = () => {
    const query = input.value.trim().toLowerCase();
    list.replaceChildren(...options.filter((o) => (o.textContent ?? "").toLowerCase().includes(query)));
  };
  const onKeydown = (event: KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter"].includes(event.key)) return;
    list.dispatchEvent(new KeyboardEvent("keydown", { key: event.key, bubbles: true, cancelable: true }));
    event.preventDefault();
  };
  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onKeydown);
  return () => {
    input.removeEventListener("input", onInput);
    input.removeEventListener("keydown", onKeydown);
  };
};

/**
 * The search-driven example — the composition Listbox exists for. Focus stays
 * in the input; the list shows the cursor with no ring near it, and the input
 * forwards the navigation keys to the frame (which owns the keymap only while
 * IT has focus, per the primitive).
 */
const SearchExample = () => {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const results = CITIES.filter((c) =>
    c.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const forward = (event: React.KeyboardEvent) => {
    const NAV = ["ArrowDown", "ArrowUp", "Home", "End", "Enter"];
    if (!NAV.includes(event.key)) return;
    // Re-dispatch a native keydown on the frame: React catches it at the root,
    // so the frame's own handler runs the keymap even though focus is here.
    listRef.current?.dispatchEvent(
      new KeyboardEvent("keydown", { key: event.key, bubbles: true, cancelable: true }),
    );
    // Enter selects; the arrows would otherwise move the text caret.
    if (event.key !== "Enter") event.preventDefault();
  };

  return (
    <div className="docs-example-stack" style={{ inlineSize: "100%" }}>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={forward}
        placeholder="Search cities"
        aria-label="Search cities"
      />
      <Listbox
        ref={listRef}
        type="single"
        value={picked}
        onValueChange={setPicked}
        aria-label="City results"
      >
        {results.length === 0 ? (
          <ListboxEmpty>No cities match “{query}”</ListboxEmpty>
        ) : (
          results.map((c) => (
            <ListboxOption key={c.id} value={c.id}>
              <ListboxOptionIndicator>
                <Check aria-hidden="true" />
              </ListboxOptionIndicator>
              <ListboxOptionLabel>{c.label}</ListboxOptionLabel>
            </ListboxOption>
          ))
        )}
      </Listbox>
    </div>
  );
};

/**
 * Listbox's page content.
 *
 * The WAI-ARIA listbox — always on screen, no trigger, no popup. Its cursor is
 * virtual focus (`aria-activedescendant`), which is what lets a separate control
 * drive it; that search-input composition is the reason it exists. The keyboard
 * model is the pattern's own, so it earns a section.
 */
export const listboxSpec: ComponentSpec = {
  playground: {
    component: "Listbox",
    snippet: (values, mode) => {
      if (mode === "elements") return elementsList({ value: "ams", size: values.size, body: elementsCities() });
      const p = partNamer(mode, "Listbox");
      return [
        imports(mode, ["Option", "OptionIndicator", "OptionLabel"], ["Check"]),
        ``,
        `<${p("Root")}${contractAttr({ mode, prop: "size", value: values.size })} type="single" defaultValue="ams" aria-label="Cities">`,
        ...optionLines(mode, "ams", "Amsterdam"),
        `  {/* ...more options */}`,
        `</${p("Root")}>`,
      ].join("\n");
    },
    fill: true,
    elementsPreview: (code) => withGlyphs(code),
    render: (values) => (
      <div style={{ inlineSize: "100%" }}>
        <Listbox
          size={values.size as Size}
          type="single"
          defaultValue="ams"
          aria-label="Cities"
        >
          <CityOptions />
        </Listbox>
      </div>
    ),
  },

  anatomyMeta:
    "Ten parts — a row is **composed**, not configured, so the mark glyph is yours (installing this pulls in no icon package). `Listbox.Option` holds a mark (`Listbox.OptionIndicator` for single-select, or `Listbox.OptionCheckbox` for multi — one or the other, never both), an optional `Listbox.OptionLeading` glyph, the `Listbox.OptionLabel`, and an optional `Listbox.OptionTrailing` shortcut. `Listbox.Group` + `Listbox.GroupLabel` cluster options; `Listbox.Empty` is the no-results row. Only `Listbox.Root`, `Option`, `Group` and `GroupLabel` exist in the headless primitive — the row-anatomy parts and `Empty` are styled-surface additions.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        if (mode === "elements")
          return [
            `<primitiv-listbox>`,
            `  <primitiv-listbox-group>`,
            `    <primitiv-listbox-group-label>`,
            `    <primitiv-listbox-option value="...">`,
            `  </primitiv-listbox-group>`,
            `  <primitiv-listbox-option value="...">`,
            `</primitiv-listbox>`,
            ``,
            `// The mark, leading, label and trailing spans inside an option are the`,
            `// styled surface's — headless, an option's content is your own markup.`,
          ].join("\n");
        const p = partNamer(mode, "Listbox");
        if (mode === "headless") {
          return [
            `<${p("Root")}>`,
            `  <${p("Group")}>`,
            `    <${p("GroupLabel")} />`,
            `    <${p("Option")} />`,
            `  </${p("Group")}>`,
            `  <${p("Option")} />`,
            `</${p("Root")}>`,
            ``,
            `// The mark, label and empty-state parts are styled-surface only —`,
            `// in headless a row's mark and label are your own markup.`,
          ].join("\n");
        }
        return [
          `<Listbox>`,
          `  <ListboxGroup>`,
          `    <ListboxGroupLabel />`,
          `    <ListboxOption>`,
          `      <ListboxOptionIndicator />   {/* or ListboxOptionCheckbox */}`,
          `      <ListboxOptionLeading />     {/* optional */}`,
          `      <ListboxOptionLabel />`,
          `      <ListboxOptionTrailing />    {/* optional */}`,
          `    </ListboxOption>`,
          `  </ListboxGroup>`,
          `  <ListboxEmpty />                 {/* the no-results row */}`,
          `</Listbox>`,
        ].join("\n");
      },
    },
  ],

  keyboardMeta:
    "The frame is the single tab stop and the cursor is **virtual** — `aria-activedescendant` on the frame, `data-highlighted` on the option — so DOM focus never leaves the frame. The arrow keys move along the `orientation` axis and wrap at both ends; printable characters run a prefix typeahead. Selection is manual by default (`selectionFollowsFocus` opts into select-as-you-arrow). In `type=\"multiple\"`, APG's modifier shortcuts are added — `Shift`+arrow extends, `Ctrl`/`Cmd`+`A` selects all or clears.",

  keyboard: [
    {
      keys: ["ArrowDown", "ArrowUp"],
      behaviour: "Move the cursor to the next / previous option (wraps). `ArrowRight` / `ArrowLeft` when `orientation` is horizontal.",
    },
    { keys: ["Home", "End"], behaviour: "Move the cursor to the first / last option." },
    {
      keys: ["Enter", "Space"],
      behaviour: "Select (single) or toggle (multiple) the option under the cursor.",
    },
    {
      keys: ["character"],
      literal: true,
      behaviour: "Typeahead — jump the cursor to the next option whose label starts with the typed characters.",
    },
  ],

  examples: [
    {
      id: "single",
      title: "Single select",
      render: () => (
        <InteractiveExample
          caption={"`type=\"single\"` selects at most one option; `defaultValue` seeds it (or `value` + `onValueChange` to control it). Each row is composed — a `Listbox.OptionIndicator` holding your own checkmark glyph, revealed by CSS on the selected row, beside a `Listbox.OptionLabel`. Click a row, or focus the list and use the arrow keys."}
          elementsCaption={"Without `type`, a listbox is single: one option selected, and `value` names it. Each row is composed — an indicator span holding your own checkmark glyph, revealed by CSS on the selected row, beside a label span. Click a row, or Tab to the list and use the arrow keys: the cursor moves, and Enter or Space chooses. In headless markup the glyph is yours to style: show it only on `[aria-selected=\"true\"]`, as the registry stylesheet does."}
          elementsPreview={(_density, code) => withGlyphs(code)}
          code={(_density, mode) => {
            if (mode === "elements") return elementsList({ value: "ams", body: elementsCities() });
            const p = partNamer(mode, "Listbox");
            return [
              imports(mode, ["Option", "OptionIndicator", "OptionLabel"], ["Check"]),
              ``,
              `<${p("Root")} type="single" defaultValue="ams" aria-label="Cities">`,
              ...optionLines(mode, "ams", "Amsterdam"),
              ...optionLines(mode, "ber", "Berlin"),
              `  {/* ...more options */}`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Listbox type="single" defaultValue="ams" aria-label="Cities">
                <CityOptions />
              </Listbox>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "multiple",
      title: "Multiple select",
      render: () => (
        <InteractiveExample
          elementsCaption={"`type=\"multiple\"` toggles options independently, and `value` lists them separated by spaces. Listen for `primitiv-listbox-change`: its `detail.value` is every option selected afterwards, always an array, and `preventDefault()` vetoes it. The mark is the checkbox span, drawn in CSS and filled when the row is selected; it holds no glyph, so the headless markup loses nothing with it."}
          elementsPreview={() =>
            elementsReadout(elementsList({ type: "multiple", value: "ams par", body: elementsCities("checkbox") }), "ams, par")
          }
          wire={wireReadout}
          caption={"`type=\"multiple\"` toggles options independently — `value` is a string array. Swap the mark for `Listbox.OptionCheckbox`, a checkbox drawn in CSS and filled when the row is selected (single-select uses a checkmark, multi a checkbox, deliberately). It is presentational and `aria-hidden`: the row's own `aria-selected` carries the state, so there is no second focusable control inside a row."}
          code={(_density, mode) => {
            if (mode === "elements")
              return [
                elementsList({ type: "multiple", value: "ams par", body: elementsCities("checkbox") }),
                ``,
                `<script type="module">`,
                `  const list = document.querySelector("primitiv-listbox");`,
                `  list.addEventListener("primitiv-listbox-change", (event) => {`,
                `    console.log(event.detail.value); // every selected option; preventDefault() vetoes it`,
                `  });`,
                `</script>`,
              ].join("\n");
            const p = partNamer(mode, "Listbox");
            return [
              imports(mode, ["Option", "OptionCheckbox", "OptionLabel"]),
              `import { useState } from "react";`,
              ``,
              `const [picked, setPicked] = useState(["ams", "par"]);`,
              ``,
              `<${p("Root")} type="multiple" value={picked} onValueChange={setPicked} aria-label="Cities">`,
              ...optionLines(mode, "ams", "Amsterdam", "checkbox"),
              `  {/* ...more options */}`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <MultiExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "grouped",
      title: "Grouped options",
      render: () => (
        <InteractiveExample
          caption={"`Listbox.Group` clusters options under a `Listbox.GroupLabel` — a visible heading that names the group (`role=\"group\"` + `aria-labelledby`) and sticks to the top while its options scroll past."}
          elementsCaption={"`<primitiv-listbox-group>` clusters options under a `<primitiv-listbox-group-label>` — a visible heading the group is named by (`role=\"group\"` + `aria-labelledby`, wired for you) that sticks to the top while its options scroll past. The arrows and typeahead still run through every option as one list."}
          elementsPreview={(_density, code) => withGlyphs(code)}
          code={(_density, mode) => {
            if (mode === "elements") {
              const group = (heading: string, ids: readonly string[]) => [
                `  <primitiv-listbox-group class="primitiv-listbox__group">`,
                `    <primitiv-listbox-group-label class="primitiv-listbox__group-label">${heading}</primitiv-listbox-group-label>`,
                ...ids.flatMap((id) => elementsOption(id, CITIES.find((c) => c.id === id)!.label, { indent: "    " })),
                `  </primitiv-listbox-group>`,
              ];
              return elementsList({
                value: "ams",
                body: [...group("Western Europe", ["ams", "ber", "lon"]), ...group("Southern Europe", ["mad", "par", "rom"])],
              });
            }
            const p = partNamer(mode, "Listbox");
            return [
              imports(mode, ["Group", "GroupLabel", "Option", "OptionIndicator", "OptionLabel"], ["Check"]),
              ``,
              `<${p("Root")} type="single" defaultValue="ams" aria-label="Cities">`,
              `  <${p("Group")}${mode === "headless" ? ' label="Western Europe"' : ""}>`,
              mode === "headless"
                ? `    {/* GroupLabel is optional in headless; Group takes a label prop */}`
                : `    <ListboxGroupLabel>Western Europe</ListboxGroupLabel>`,
              ...optionLines(mode, "ams", "Amsterdam", "indicator", "    "),
              `  </${p("Group")}>`,
              `  <${p("Group")}${mode === "headless" ? ' label="Southern Europe"' : ""}>`,
              mode === "headless"
                ? `    {/* ... */}`
                : `    <ListboxGroupLabel>Southern Europe</ListboxGroupLabel>`,
              ...optionLines(mode, "mad", "Madrid", "indicator", "    "),
              `  </${p("Group")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Listbox type="single" defaultValue="ams" aria-label="Cities">
                <ListboxGroup>
                  <ListboxGroupLabel>Western Europe</ListboxGroupLabel>
                  {["ams", "ber", "lon"].map((id) => {
                    const c = CITIES.find((x) => x.id === id)!;
                    return (
                      <ListboxOption key={id} value={id}>
                        <ListboxOptionIndicator>
                          <Check aria-hidden="true" />
                        </ListboxOptionIndicator>
                        <ListboxOptionLabel>{c.label}</ListboxOptionLabel>
                      </ListboxOption>
                    );
                  })}
                </ListboxGroup>
                <ListboxGroup>
                  <ListboxGroupLabel>Southern Europe</ListboxGroupLabel>
                  {["mad", "par", "rom"].map((id) => {
                    const c = CITIES.find((x) => x.id === id)!;
                    return (
                      <ListboxOption key={id} value={id}>
                        <ListboxOptionIndicator>
                          <Check aria-hidden="true" />
                        </ListboxOptionIndicator>
                        <ListboxOptionLabel>{c.label}</ListboxOptionLabel>
                      </ListboxOption>
                    );
                  })}
                </ListboxGroup>
              </Listbox>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "search-driven",
      title: "Driven by a search input",
      render: () => (
        <InteractiveExample
          elementsCaption={"The composition this component exists for. Because the cursor is virtual focus (`aria-activedescendant`), real focus can stay in a separate control — here a search input — while it drives the list. Forward the input's arrow keys, Home, End and Enter to the listbox yourself (it handles keys only while it has focus), and filter by taking options out of the list rather than hiding them, since a hidden option is still navigable. Type to filter, then arrow through the results without leaving the field."}
          elementsPreview={() => elementsSearch().slice(0, elementsSearch().indexOf("\n\n<script"))}
          wire={wireSearch}
          caption={"The composition this component exists for. Because the cursor is virtual focus (`aria-activedescendant`), DOM focus can stay in a separate control — here a search input — while it drives the list. Forward the input's arrow/Enter keys to the frame yourself (the primitive owns the keymap only while the frame has focus), and render `Listbox.Empty` when nothing matches. Type to filter, then arrow through the results without leaving the field."}
          code={(_density, mode) => {
            if (mode === "elements") return elementsSearch();
            const p = partNamer(mode, "Listbox");
            return [
              imports(mode, ["Option", "OptionIndicator", "OptionLabel", "Empty"], ["Check"]),
              `import { Input } from "@/components/ui/input";`,
              `import { useRef, useState } from "react";`,
              ``,
              `const listRef = useRef(null);`,
              `const forward = (e) => {`,
              `  if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter"].includes(e.key)) return;`,
              `  listRef.current?.dispatchEvent(`,
              `    new KeyboardEvent("keydown", { key: e.key, bubbles: true, cancelable: true }),`,
              `  );`,
              `  if (e.key !== "Enter") e.preventDefault();`,
              `};`,
              ``,
              `<Input value={query} onChange={...} onKeyDown={forward} aria-label="Search" />`,
              `<${p("Root")} ref={listRef} type="single" value={picked} onValueChange={setPicked} aria-label="Results">`,
              `  {results.length === 0 ? (`,
              mode === "headless"
                ? `    <${p("Root")}>{/* your empty row */}</${p("Root")}>`
                : `    <ListboxEmpty>No matches</ListboxEmpty>`,
              `  ) : (`,
              `    results.map((r) => (`,
              ...optionLines(mode, "{r.id}", "{r.label}", "indicator", "      "),
              `    ))`,
              `  )}`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <SearchExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "rich-rows",
      title: "Rich rows",
      render: () => (
        <InteractiveExample
          elementsCaption="A row can carry more than a label. A leading span holds a glyph after the mark column, and a trailing span a shortcut or badge pinned to the inline-end edge — the command-palette row. The label span takes the free space between them and truncates. Typeahead matches the whole row's text, so keep the label first."
          elementsPreview={(_density, code) => withGlyphs(code)}
          caption="A row can carry more than a label. `Listbox.OptionLeading` holds a glyph after the mark column, and `Listbox.OptionTrailing` a shortcut or badge pinned to the inline-end edge — the command-palette row. The `Listbox.OptionLabel` takes the free space between them and truncates."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsList({
                value: "search",
                label: "Commands",
                body: [
                  ["search", "Search files", "⌘K"],
                  ["new", "New file", "⌘N"],
                  ["settings", "Open settings", "⌘,"],
                ].flatMap(([id, label, shortcut]) => [
                  `  <primitiv-listbox-option value="${id}" class="primitiv-listbox__option">`,
                  `    <span class="primitiv-listbox__option-leading">${glyph("search")}</span>`,
                  `    <span class="primitiv-listbox__option-label">${label}</span>`,
                  `    <span class="primitiv-listbox__option-trailing"><kbd class="primitiv-kbd primitiv-kbd--md">${shortcut}</kbd></span>`,
                  `  </primitiv-listbox-option>`,
                ]),
              });
            const p = partNamer(mode, "Listbox");
            if (mode === "headless") {
              return [
                imports(mode, ["Option"]),
                ``,
                `<${p("Root")} type="single" aria-label="Commands">`,
                `  <${p("Option")} value="search">{/* your leading icon, label and shortcut */}</${p("Option")}>`,
                `</${p("Root")}>`,
              ].join("\n");
            }
            return [
              imports(mode, ["Option", "OptionLeading", "OptionLabel", "OptionTrailing"], ["Search"]),
              `import { Kbd } from "@/components/ui/kbd";`,
              ``,
              `<Listbox type="single" aria-label="Commands">`,
              `  <ListboxOption value="search">`,
              `    <ListboxOptionLeading><Search aria-hidden="true" /></ListboxOptionLeading>`,
              `    <ListboxOptionLabel>Search files</ListboxOptionLabel>`,
              `    <ListboxOptionTrailing><Kbd>⌘K</Kbd></ListboxOptionTrailing>`,
              `  </ListboxOption>`,
              `</Listbox>`,
            ].join("\n");
          }}
        >
          {() => {
            const COMMANDS = [
              { id: "search", label: "Search files", shortcut: "⌘K" },
              { id: "new", label: "New file", shortcut: "⌘N" },
              { id: "settings", label: "Open settings", shortcut: "⌘," },
            ];
            return (
              <div style={{ inlineSize: "100%" }}>
                <Listbox type="single" defaultValue="search" aria-label="Commands">
                  {COMMANDS.map((c) => (
                    <ListboxOption key={c.id} value={c.id}>
                      <ListboxOptionLeading>
                        <Search aria-hidden="true" />
                      </ListboxOptionLeading>
                      <ListboxOptionLabel>{c.label}</ListboxOptionLabel>
                      <ListboxOptionTrailing>
                        <Kbd>{c.shortcut}</Kbd>
                      </ListboxOptionTrailing>
                    </ListboxOption>
                  ))}
                </Listbox>
              </div>
            );
          }}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "An always-visible list of options to choose from. `<primitiv-listbox>` is the listbox and the only Tab stop, and keeps the selection in its `value` attribute; each `<primitiv-listbox-option>` is an option itself. Real focus never moves to an option: a cursor does, published as `aria-activedescendant`, which is what lets a search input hold focus and drive the list.",
    anatomyMeta:
      "Four elements. `<primitiv-listbox>` is the `role=\"listbox\"` — name it with `aria-label` — and owns `value`, the selected options separated by spaces, `type` and `orientation`. Each `<primitiv-listbox-option>` carries a `value` and *is* the `role=\"option\"`, with `aria-selected` and an `id` derived from the root's: there is no button inside, since an option is never focused. `<primitiv-listbox-group>` clusters options and is named by the `<primitiv-listbox-group-label>` inside it. Inside an option, the mark, leading, label and trailing spans are the styled surface's, so headless markup keeps only their content: a checkmark glyph stays, and showing it only on `[aria-selected=\"true\"]` is then your stylesheet's job.",
    keyboardMeta:
      "The listbox is the single Tab stop, and the cursor is **virtual**: `aria-activedescendant` on the listbox, `data-highlighted` on the option, so focus never leaves the listbox. The cursor lands on the first selected option (else the first) when the list takes focus, and is cleared when it leaves. Choosing is manual unless `selection-follows-focus` is set. A `multiple` listbox adds APG's range shortcuts.",
    keyboard: [
      {
        keys: ["ArrowDown", "ArrowUp"],
        behaviour:
          "Move the cursor to the next / previous option, skipping `disabled` ones and wrapping. `ArrowRight` / `ArrowLeft` with `orientation=\"horizontal\"`, swapped under right-to-left — set `dir=\"rtl\"` on the listbox or any ancestor.",
      },
      { keys: ["Home", "End"], behaviour: "Move the cursor to the first / last option." },
      {
        keys: ["Enter", "Space"],
        behaviour: "Choose the option under the cursor — replacing the selection, or toggling it with `type=\"multiple\"`.",
      },
      {
        keys: ["character"],
        literal: true,
        behaviour: "Typeahead — jump the cursor to the next option whose text starts with what was typed.",
      },
      {
        keys: ["Shift+ArrowDown"],
        behaviour: "With `type=\"multiple\"`: move the cursor and add the option it lands on. Does not wrap.",
      },
      {
        keys: ["Ctrl+A"],
        behaviour: "With `type=\"multiple\"`: select every enabled option, or none once all are. `Cmd` on a Mac.",
      },
      {
        keys: ["Ctrl+Shift+End"],
        behaviour: "With `type=\"multiple\"`: select from the cursor to the last option (`Home` for the first). `Cmd` on a Mac.",
      },
    ],
    accessibility: [
      "`<primitiv-listbox>` is `role=\"listbox\"` and the only Tab stop; each `<primitiv-listbox-option>` is a `role=\"option\"` with `aria-selected`. **Name the listbox** with `aria-label`, or `aria-labelledby` pointing at a visible heading — without a name a screen-reader user has no idea what the list is for.",
      "The cursor is **virtual focus**: focus never leaves the listbox, which points `aria-activedescendant` at the current option (marked `data-highlighted`). That is what lets a separate control drive the list, and it means an option never matches `:focus` — style the cursor with `[data-highlighted]`.",
      "The mark spans are presentational: the option's own `aria-selected` carries the state, so a screen reader is never told the selection twice.",
      "`disabled` on an option sets `aria-disabled` and `data-disabled`: the cursor and typeahead skip it and a click does nothing, while it stays announced. An option with no `value` is reported once in the console and left alone.",
      "`primitiv-listbox-change` fires before a change applies and is cancelable, so a listener can refuse a selection. Set `aria-invalid` on the listbox yourself when it fails validation; the border follows.",
      "Related: reach for [Select](/components/select/) when the list should live in a popup opened from a trigger. Listbox is the always-visible case.",
    ],
  },

  accessibility: [
    "The frame is `role=\"listbox\"` and the only tab stop; each row is a `role=\"option\"` with `aria-selected`. Name the frame with `aria-label` or `aria-labelledby` — without a name a screen-reader user has no idea what the list is for.",
    "The cursor is **virtual focus**: DOM focus never leaves the frame, which publishes `aria-activedescendant` pointing at the current option (marked `data-highlighted`). That is what lets a separate control — a search input, a command palette — hold focus and drive the list; it also means an option never matches `:focus`, so the cursor is styled with `[data-highlighted]`, not `:focus`.",
    "The mark parts (`Listbox.OptionIndicator`, `Listbox.OptionCheckbox`) are presentational and `aria-hidden` — the row's `aria-selected` carries the state, so a screen reader is never told the selection twice, and a multi-select row gains no second focusable control.",
    "There is no `invalid` prop and no whole-list `disabled` — set `aria-invalid` on the frame yourself (the border follows, the same convention as `InputGroup`), and disable individual options with `disabled`, which drops them from navigation while keeping them discoverable.",
    "Related: reach for [Select](/components/select/) when the list should live in a popup opened from a trigger, and for [Combobox](/components/combobox/) when a text field should both filter and select. Listbox is the always-visible case, and the only one whose cursor a separate control can drive.",
  ],
};
