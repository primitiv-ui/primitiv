"use client";

import { useState, type ComponentType } from "react";
import {
  Check,
  ChevronDown,
  Moon,
  Settings,
  Sun,
  type IconProps,
} from "@primitiv-ui/icons";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemLabel,
  SelectItemLeading,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

/*
 * Frameworks for the single-list examples, cities for the grouped one — both
 * taken from the Figma frame's own sample data, so the page and the design read
 * the same. Shared rather than re-declared per example (the fixtures convention).
 */
const FRAMEWORKS = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "solid", label: "Solid" },
] as const;

/*
 * The playground's own option set, chosen so the leading icons MEAN something.
 *
 * The icon package ships 47 general-purpose glyphs and no framework logos, so
 * hanging File/Folder/Grid off React/Vue/Solid would be filler that demonstrates
 * the slot without demonstrating the point. A theme picker is the most
 * recognisable real-world select there is and each glyph is unambiguous, so the
 * row anatomy `[leading][label][mark]` reads as a component rather than a
 * diagram. The examples below keep the frame's own framework data, where the
 * copy is about render paths rather than row content.
 */
const THEMES: readonly {
  value: string;
  label: string;
  Icon: ComponentType<IconProps>;
}[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Settings },
];

const CITIES = {
  Americas: [
    { value: "new-york", label: "New York" },
    { value: "sao-paulo", label: "São Paulo" },
    { value: "toronto", label: "Toronto" },
  ],
  Europe: [
    { value: "london", label: "London" },
    { value: "berlin", label: "Berlin" },
    { value: "lisbon", label: "Lisbon" },
  ],
} as const;

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Placement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

/**
 * The import lines for a Select snippet, in the current mode.
 *
 * Every snippet on the page carries them, so each one stands alone AND shows
 * what the mode switch changes: headless imports the single `Select` compound
 * and reaches parts through it, styled imports every part as its own symbol from
 * the copied file. `SelectTrigger` visibly exists in one and not the other.
 */
const imports = (
  mode: Mode,
  parts: readonly string[],
  icons: readonly string[] = [],
) => importBlock({ mode, component: "Select", componentId: "select", parts, icons });

/**
 * A framework option row.
 *
 * The mark comes first in source order and the styled layer puts it in the
 * reserved gutter — the gutter is reserved unconditionally, because a listbox
 * row is one class whether or not it holds a mark and the mark unmounts while
 * unselected (`docs/combobox-future-work.md` covers the same reasoning).
 */
const FrameworkItems = () =>
  FRAMEWORKS.map((f) => (
    <SelectItem key={f.value} value={f.value}>
      <SelectItemIndicator>
        <Check size="100%" />
      </SelectItemIndicator>
      <SelectItemLabel>{f.label}</SelectItemLabel>
    </SelectItem>
  ));

/*
 * The rich example's rows, with their leading icons.
 *
 * Uses THEMES rather than FRAMEWORKS for the reason recorded above: a leading
 * icon has to mean something, and there is no React/Vue/Solid glyph to use. The
 * rich example is the one place on the page whose subject IS the row anatomy —
 * `[leading][label][mark]`, and `Select.Value` mirroring the chosen row's icon
 * into the closed trigger — so showing it without icons made the caption's
 * promise ("options carry icons... mirrors the chosen item") false on screen. The
 * other examples keep the framework data, where the copy is about render paths.
 */
const ThemeItems = () =>
  THEMES.map(({ value, label, Icon }) => (
    <SelectItem key={value} value={value}>
      <SelectItemIndicator>
        <Check size="100%" />
      </SelectItemIndicator>
      <SelectItemLeading>
        <Icon size="100%" />
      </SelectItemLeading>
      <SelectItemLabel>{label}</SelectItemLabel>
    </SelectItem>
  ));

/** The rich example's trigger — same anatomy, its own placeholder. */
const ThemeTrigger = () => (
  <SelectTrigger>
    <SelectValue placeholder="Choose a theme..." />
    <SelectIcon>
      <ChevronDown size="100%" />
    </SelectIcon>
  </SelectTrigger>
);

/**
 * The trigger, with its chevron.
 *
 * `SelectIcon` is NOT supplied by the component in rich mode — the consumer
 * composes it, exactly as the component README shows. (Native mode is the
 * asymmetry: there the stylesheet paints its own chevron over the UA arrow, so
 * one appears without being asked for.) Leaving it out is invisible in code
 * review and obvious on screen: the trigger renders as bare text with no
 * disclosure affordance at all.
 */
const FrameworkTrigger = ({ size }: { size?: Size }) => (
  <SelectTrigger size={size}>
    <SelectValue placeholder="Choose a framework..." />
    <SelectIcon>
      <ChevronDown size="100%" />
    </SelectIcon>
  </SelectTrigger>
);

/**
 * Select's page content.
 *
 * The section set mirrors the Figma "Component page — Select (desktop)" frame,
 * which is a richer template than Button's: it adds Anatomy, Keyboard and Data
 * attributes. Examples: Rich mode, Native mode, Grouped options, Controlled.
 */
export const selectSpec: ComponentSpec = {
  playground: {
    component: "Select",
    /*
     * Hand-written because the controls are not the root's props — `size` goes
     * on Trigger AND Content, `placement` on Content alone, and `mode` is the
     * root's `native` boolean under a different name. The generated snippet
     * would put all three on `<Select>`, which accepts none of them.
     */
    snippet: (values, mode) => {
      const p = partNamer(mode, "Select");
      return values.mode === "native"
        ? [
            imports(mode, ["Item"]),
            ``,
            `// Under native an <option> cannot hold an element, so the leading`,
            `// icons and the mark are dropped — only the text survives.`,
            `<${p("Root")} native${contractAttr({ mode, prop: "size", value: values.size })} defaultValue="light" aria-label="Theme">`,
            `  <${p("Item")} value="light">Light</${p("Item")}>`,
            `  <${p("Item")} value="dark">Dark</${p("Item")}>`,
            `  <${p("Item")} value="system">System</${p("Item")}>`,
            `</${p("Root")}>`,
          ].join("\n")
        : [
            imports(
              mode,
              ["Trigger", "Value", "Icon", "Content", "Item", "ItemIndicator", "ItemLeading", "ItemLabel"],
              ["Check", "ChevronDown", "Sun"],
            ),
            ``,
            `<${p("Root")} defaultValue="light">`,
            `  <${p("Trigger")}${contractAttr({ mode, prop: "size", value: values.size })}>`,
            `    <${p("Value")} placeholder="Choose a theme..." />`,
            `    <${p("Icon")}><ChevronDown /></${p("Icon")}>`,
            `  </${p("Trigger")}>`,
            `  <${p("Content")}${contractAttr({ mode, prop: "size", value: values.size })}${contractAttr({ mode, prop: "placement", value: values.placement })}>`,
            `    <${p("Item")} value="light">`,
            `      <${p("ItemIndicator")}><Check /></${p("ItemIndicator")}>`,
            `      <${p("ItemLeading")}><Sun /></${p("ItemLeading")}>`,
            `      <${p("ItemLabel")}>Light</${p("ItemLabel")}>`,
            `    </${p("Item")}>`,
            `    {/* ... */}`,
            `  </${p("Content")}>`,
            `</${p("Root")}>`,
          ].join("\n");
    },
    /*
     * `mode` swaps the whole composition rather than toggling a class, because
     * that IS the prop: it is the root's `native` boolean, and under `native`
     * the Trigger/Content pair stops existing. Wiring it to the preview as well
     * as the snippet is what keeps the two honest — the page's own rule is that
     * a snippet is a readout of the live preview, so a control that moved the
     * code without moving the picture would be the drift it warns about.
     */
    render: (values) =>
      values.mode === "native" ? (
        /*
         * The SAME `THEMES` data, deliberately — the leading icons are simply
         * not passed, because an `<option>` cannot contain an element and the
         * component would drop them anyway. Flipping the Mode control therefore
         * shows the real cost of the native path rather than telling you about
         * it: the icons and the mark disappear.
         *
         * aria-label because there is no Trigger to name the control.
         */
        <Select
          native
          size={values.size as Size}
          defaultValue="light"
          aria-label="Theme"
        >
          {THEMES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </Select>
      ) : (
        <Select defaultValue="light">
          <SelectTrigger size={values.size as Size}>
            {/* `SelectValue` mirrors the selected row's children — the leading
                icon included — so the closed trigger shows the glyph without it
                being declared twice. */}
            <SelectValue placeholder="Choose a theme..." />
            <SelectIcon>
              <ChevronDown size="100%" />
            </SelectIcon>
          </SelectTrigger>
          {/*
           * `size` is repeated on Content because in rich mode the root renders
           * no element — it is a context boundary plus a hidden form `<select>`
           * — so there is nothing for the axis to inherit down from. Combobox
           * declares its knobs once on a real root `<div>`; Select cannot.
           */}
          <SelectContent
            size={values.size as Size}
            placement={values.placement as Placement}
          >
            {THEMES.map(({ value, label, Icon }) => (
              <SelectItem key={value} value={value}>
                <SelectItemIndicator>
                  <Check size="100%" />
                </SelectItemIndicator>
                <SelectItemLeading>
                  <Icon size="100%" />
                </SelectItemLeading>
                <SelectItemLabel>{label}</SelectItemLabel>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
  },

  anatomyMeta:
    "Nine parts, but the tree differs by render path — five of them render nothing at all under `native`. Switch the tab to compare.",

  anatomy: [
    {
      label: "Rich",
      code: (mode) => {
        const p = partNamer(mode, "Select");
        return [
          `<${p("Root")}>`,
          `  <${p("Trigger")}>`,
          `    <${p("Value")} placeholder="Choose a framework..." />`,
          `    <${p("Icon")} />`,
          `  </${p("Trigger")}>`,
          ``,
          `  <${p("Content")}>`,
          `    <${p("Group")} label="Stable">`,
          `      <${p("Item")} value="react">`,
          `        <${p("ItemIndicator")} />`,
          `        React`,
          `      </${p("Item")}>`,
          `    </${p("Group")}>`,
          ``,
          `    <${p("Separator")} />`,
          `  </${p("Content")}>`,
          `</${p("Root")}>`,
        ].join("\n");
      },
    },
    {
      label: "Native",
      code: (mode) => {
        const p = partNamer(mode, "Select");
        return [
          `<${p("Root")} native>`,
          `  <${p("Placeholder")}>Choose a framework...</${p("Placeholder")}>`,
          ``,
          `  <${p("Group")} label="Stable">`,
          `    <${p("Item")} value="react">React</${p("Item")}>`,
          `  </${p("Group")}>`,
          `</${p("Root")}>`,
          ``,
          /* Kept, unlike the per-line DOM annotations: this is the whole point
             of tabbing the two trees against each other, and it is a statement
             about the PARTS rather than about the markup each one emits. */
          `// Renders nothing under native:`,
          `//   ${p("Trigger")} — the root is the control, so there is nothing to wrap`,
          `//   ${p("Value")} — the platform draws the selected option`,
          `//   ${p("Content")} — the platform owns the popup`,
          `//   ${p("Icon")} — the stylesheet paints the chevron itself here`,
          `//   ${p("ItemIndicator")} — an <option> cannot contain an element`,
        ].join("\n");
      },
    },
  ],

  keyboardMeta:
    "While the listbox is open. Disabled options are skipped by arrows and typeahead; on open, focus moves to the selected option, or the first enabled one. Under `native` every key below belongs to the platform instead.",

  keyboard: [
    {
      keys: ["ArrowDown", "ArrowUp"],
      behaviour: "Move focus to the next / previous option (wraps).",
    },
    { keys: ["Home", "End"], behaviour: "First / last option." },
    {
      keys: ["Enter", "Space"],
      behaviour: "Select the focused option and close.",
    },
    { keys: ["Escape"], behaviour: "Close and return focus to the trigger." },
    {
      keys: ["printable character"],
      literal: true,
      behaviour: "Typeahead — focus the next option matching the prefix.",
    },
  ],

  examples: [
    {
      id: "rich-mode",
      title: "Rich mode (the default)",
      render: () => (
        <InteractiveExample
          caption="A Popover-API listbox. Each option carries a leading icon and a selected mark, and `Select.Value` mirrors the chosen row — icon included — straight into the closed trigger, so the trigger needs no icon of its own. The panel lives in the top layer, so it escapes ancestor `overflow` and stacking contexts, and it anchors itself to its trigger with no `anchor-name` to wire."
          code={(density, mode) => {
            const p = partNamer(mode, "Select");
            return [
              imports(
                mode,
                ["Trigger", "Value", "Icon", "Content", "Item", "ItemIndicator", "ItemLeading", "ItemLabel"],
                ["Check", "ChevronDown", "Sun"],
              ),
              ``,
              `<div data-density="${density}">`,
              `  <${p("Root")} defaultValue="light">`,
              `    <${p("Trigger")}>`,
              `      <${p("Value")} placeholder="Choose a theme..." />`,
              `      <${p("Icon")}><ChevronDown /></${p("Icon")}>`,
              `    </${p("Trigger")}>`,
              `    <${p("Content")}>`,
              `      <${p("Item")} value="light">`,
              `        <${p("ItemIndicator")}><Check /></${p("ItemIndicator")}>`,
              `        <${p("ItemLeading")}><Sun /></${p("ItemLeading")}>`,
              `        <${p("ItemLabel")}>Light</${p("ItemLabel")}>`,
              `      </${p("Item")}>`,
              `      {/* ... */}`,
              `    </${p("Content")}>`,
              `  </${p("Root")}>`,
              `</div>`,
            ].join("\n");
          }}
        >
          {() => (
            <Select defaultValue="light">
              <ThemeTrigger />
              <SelectContent>
                <ThemeItems />
              </SelectContent>
            </Select>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "native-mode",
      title: "Native mode",
      render: () => (
        <InteractiveExample
          caption="`native` renders a real `<select>` / `<option>`, for flat lists, OS wheel pickers and maximum-compatibility forms. The composition is genuinely different: items sit directly on the root, with no `Trigger` or `Content` — the root *is* the control, so those parts have nothing to wrap. Element children on an `Item` are dropped too, and only its text survives as the option label, because an `<option>` cannot contain elements."
          code={(density, mode) => {
            const p = partNamer(mode, "Select");
            return [
              imports(mode, ["Item"]),
              ``,
              `<div data-density="${density}">`,
              `  <${p("Root")} native defaultValue="react" aria-label="Choose a framework">`,
              `    <${p("Item")} value="react">React</${p("Item")}>`,
              `    <${p("Item")} value="vue">Vue</${p("Item")}>`,
              `    <${p("Item")} value="solid">Solid</${p("Item")}>`,
              `  </${p("Root")}>`,
              `</div>`,
            ].join("\n");
          }}
        >
          {() => (
            /* aria-label rather than a visible label: there is no Trigger to
               name it, and an unlabelled <select> is a real a11y failure. */
            <Select native defaultValue="react" aria-label="Choose a framework">
              {FRAMEWORKS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </Select>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "grouped-options",
      title: "Grouped options",
      render: () => (
        <InteractiveExample
          caption="`SelectGroup` takes a required `label` — the `<optgroup>` label under native, the group's `aria-label` in rich mode. Either way it is the group's accessible name, so a group without one is inaccessible. It is a string prop rather than JSX children, which sidesteps the text-vs-element extraction problem `Item` has under native. `SelectSeparator` divides groups and is skipped by keyboard navigation."
          code={(density, mode) => {
            const p = partNamer(mode, "Select");
            return [
              imports(mode, ["Content", "Group", "Item", "Separator"]),
              ``,
              `<div data-density="${density}">`,
              `  <${p("Content")}>`,
              `    <${p("Group")} label="Americas">`,
              `      <${p("Item")} value="new-york">...</${p("Item")}>`,
              `    </${p("Group")}>`,
              ``,
              `    <${p("Separator")} />`,
              ``,
              `    <${p("Group")} label="Europe">`,
              `      <${p("Item")} value="london">...</${p("Item")}>`,
              `    </${p("Group")}>`,
              `  </${p("Content")}>`,
              `</div>`,
            ].join("\n");
          }}
        >
          {() => (
            <Select defaultValue="london">
              <SelectTrigger>
                <SelectValue placeholder="Choose a city..." />
                <SelectIcon>
                  <ChevronDown size="100%" />
                </SelectIcon>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CITIES).map(([region, cities], i) => (
                  <SelectGroup key={region} label={region}>
                    {/* The separator belongs BETWEEN groups, so it is emitted
                        with every group after the first rather than after each
                        one — a trailing rule above the panel's own padding
                        reads as a mistake. */}
                    {i > 0 && <SelectSeparator />}
                    {cities.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <SelectItemIndicator>
                          <Check size="100%" />
                        </SelectItemIndicator>
                        <SelectItemLabel>{c.label}</SelectItemLabel>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "controlled",
      title: "Controlled",
      render: () => <ControlledSelectExample />,
    },
  ],

  accessibility: [
    "Rich mode renders a real listbox: `role=\"listbox\"` on the panel and `role=\"option\"` on each row, with `aria-selected` tracking the value and `aria-haspopup=\"listbox\"` on the trigger.",
    "The panel lives in the top layer via the Popover API, so it escapes ancestor `overflow` and stacking contexts — and light dismiss (click outside, `Escape`) is handled by the browser rather than a hand-rolled outside-pointerdown listener.",
    "A closed Select has no listbox in the accessibility tree at all: the panel unmounts while closed rather than being hidden, so assistive tech is never offered a control that is not there.",
    "A hidden native `<select>` is rendered alongside rich mode, so the control takes part in normal form submission without the listbox having to fake it.",
    "Native mode is a real `<select>`, so it inherits the platform picker and every OS accessibility affordance for free — including the mobile wheel and any assistive tech that special-cases the element.",
    "The cursor row is tracked separately from the selected row, so moving focus with the arrows does not change the value until you commit it.",
    "A rich trigger is named by its own content, but a `native` root has no `Trigger` to name it — pass `aria-label` (or wire a `Field` label), because an unlabelled `<select>` is a genuine failure rather than a lint nit.",
  ],
};

/**
 * Controlled mode, kept as a component rather than an inline render function
 * because it needs its own state — and showing the value outside the control is
 * the whole point of the example.
 */
const ControlledSelectExample = () => {
  const [value, setValue] = useState("react");

  return (
    <InteractiveExample
      caption="Pass `value` with `onValueChange` and the parent owns the selection. `defaultValue` is then forbidden at the type level — a discriminated union enforces it, so only one shape compiles. That constraint is why you will not find it in the props table above: a union collapses to a flat prop list when the types are extracted, so it has to be stated here."
      code={(_density, mode) => {
        const p = partNamer(mode, "Select");
        return [
          `import { useState } from "react";`,
          imports(mode, ["Trigger", "Value", "Icon"], ["ChevronDown"]),
          ``,
          `const [value, setValue] = useState("react");`,
          ``,
          `<${p("Root")} value={value} onValueChange={setValue}>`,
          `  <${p("Trigger")}>`,
          `    <${p("Value")} placeholder="Choose a framework..." />`,
          `    <${p("Icon")}><ChevronDown /></${p("Icon")}>`,
          `  </${p("Trigger")}>`,
          `  {/* ... */}`,
          `</${p("Root")}>`,
          ``,
          `// current value: ${JSON.stringify(value)}`,
        ].join("\n");
      }}
    >
      {() => (
        <>
          <Select value={value} onValueChange={setValue}>
            <FrameworkTrigger />
            <SelectContent>
              <FrameworkItems />
            </SelectContent>
          </Select>
          <output className="docs-prop-description">
            Selected: {value}
          </output>
        </>
      )}
    </InteractiveExample>
  );
};
