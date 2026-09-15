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
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
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
          code={(_density, mode) => {
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
          caption={"`type=\"multiple\"` toggles options independently — `value` is a string array. Swap the mark for `Listbox.OptionCheckbox`, a checkbox drawn in CSS and filled when the row is selected (single-select uses a checkmark, multi a checkbox, deliberately). It is presentational and `aria-hidden`: the row's own `aria-selected` carries the state, so there is no second focusable control inside a row."}
          code={(_density, mode) => {
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
          code={(_density, mode) => {
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
          caption={"The composition this component exists for. Because the cursor is virtual focus (`aria-activedescendant`), DOM focus can stay in a separate control — here a search input — while it drives the list. Forward the input's arrow/Enter keys to the frame yourself (the primitive owns the keymap only while the frame has focus), and render `Listbox.Empty` when nothing matches. Type to filter, then arrow through the results without leaving the field."}
          code={(_density, mode) => {
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
          caption="A row can carry more than a label. `Listbox.OptionLeading` holds a glyph after the mark column, and `Listbox.OptionTrailing` a shortcut or badge pinned to the inline-end edge — the command-palette row. The `Listbox.OptionLabel` takes the free space between them and truncates."
          code={(_density, mode) => {
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

  accessibility: [
    "The frame is `role=\"listbox\"` and the only tab stop; each row is a `role=\"option\"` with `aria-selected`. Name the frame with `aria-label` or `aria-labelledby` — without a name a screen-reader user has no idea what the list is for.",
    "The cursor is **virtual focus**: DOM focus never leaves the frame, which publishes `aria-activedescendant` pointing at the current option (marked `data-highlighted`). That is what lets a separate control — a search input, a command palette — hold focus and drive the list; it also means an option never matches `:focus`, so the cursor is styled with `[data-highlighted]`, not `:focus`.",
    "The mark parts (`Listbox.OptionIndicator`, `Listbox.OptionCheckbox`) are presentational and `aria-hidden` — the row's `aria-selected` carries the state, so a screen reader is never told the selection twice, and a multi-select row gains no second focusable control.",
    "There is no `invalid` prop and no whole-list `disabled` — set `aria-invalid` on the frame yourself (the border follows, the same convention as `InputGroup`), and disable individual options with `disabled`, which drops them from navigation while keeping them discoverable.",
    "Related: reach for [Select](/components/select/) when the list should live in a popup opened from a trigger, and for [Combobox](/components/combobox/) when a text field should both filter and select. Listbox is the always-visible case, and the only one whose cursor a separate control can drive.",
  ],
};
