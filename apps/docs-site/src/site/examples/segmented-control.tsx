"use client";

import { useState } from "react";

import { SegmentedControl, SegmentedControlItem } from "@/components/segmented-control";
import { Stack } from "@/components/stack";
import { contractAttr, importBlock, indent, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Justify = "content" | "justified";

const VIEWS = [
  { value: "list", label: "List" },
  { value: "grid", label: "Grid" },
  { value: "board", label: "Board" },
];

const imports = (mode: Mode) =>
  importBlock({ mode, component: "SegmentedControl", componentId: "segmented-control", parts: ["Item"] });

/**
 * The control's tree, per mode. Both surfaces have the same shape — Root plus
 * one Item per segment — so this only varies the naming.
 */
const controlLines = (
  mode: Mode,
  {
    attrs = "",
    items = VIEWS,
    indent = "",
  }: { attrs?: string; items?: readonly { value: string; label: string; extra?: string }[]; indent?: string } = {},
) => {
  const p = partNamer(mode, "SegmentedControl");
  return [
    `${indent}<${p("Root")}${attrs}>`,
    ...items.map(
      (i) =>
        `${indent}  <${p("Item")} value="${i.value}"${i.extra ?? ""}>${i.label}</${p("Item")}>`,
    ),
    `${indent}</${p("Root")}>`,
  ];
};

/** A segment of Elements markup: its value, its label, and whether it is disabled. */
type ElementsSegment = { value: string; label: string; disabled?: boolean };

/**
 * One segmented control as Elements markup (RFC 0033): the `@primitiv-ui/web`
 * custom elements, in the shape `primitiv add segmented-control --surface
 * elements` prints. The root is the radio group — name it with `aria-label` or
 * `aria-labelledby` — and `value` is the selected segment. Each segment wraps a
 * real `<button>`; the label span is the styled surface's, which the headless
 * tab drops with the classes.
 */
const elementsControl = ({
  value = "grid",
  name = ` aria-label="View"`,
  size = "md",
  justify = "justified",
  orientation,
  disabled = false,
  items = VIEWS,
}: {
  /** The selected segment, or "" for none. */
  value?: string;
  /** The naming attribute, written verbatim with its leading space. */
  name?: string;
  size?: string;
  justify?: string;
  orientation?: "vertical";
  /** Whether the whole control is disabled. */
  disabled?: boolean;
  items?: readonly ElementsSegment[];
} = {}) => {
  const classes = [
    "primitiv-segmented-control",
    `primitiv-segmented-control--${size}`,
    ...(justify === "justified" ? ["primitiv-segmented-control--justified"] : []),
  ].join(" ");
  const attrs = [
    value ? ` value="${value}"` : "",
    orientation ? ` orientation="${orientation}"` : "",
    disabled ? " disabled" : "",
    name,
  ].join("");
  return [
    `<primitiv-segmented-control${attrs} class="${classes}">`,
    ...items.flatMap((item) => [
      `  <primitiv-segmented-control-item value="${item.value}"${item.disabled ? " disabled" : ""}>`,
      `    <button type="button" class="primitiv-segmented-control__item">`,
      `      <span class="primitiv-segmented-control__item-label">${item.label}</span>`,
      `    </button>`,
      `  </primitiv-segmented-control-item>`,
    ]),
    `</primitiv-segmented-control>`,
  ].join("\n");
};

/** A column of Elements markup, as the React examples' `<Stack>` lays them out. */
const elementsStack = (blocks: readonly string[], align = "start") =>
  [
    `<div class="primitiv-stack primitiv-stack--column primitiv-stack--gap-md primitiv-stack--nowrap primitiv-stack--align-${align} primitiv-stack--justify-start">`,
    ...blocks.map((block) => indent(block)),
    `</div>`,
  ].join("\n");

/** The controlled example's Elements preview: the control above a readout of the selection. */
const readoutPreview = () =>
  [
    `<div class="primitiv-stack primitiv-stack--column primitiv-stack--gap-sm primitiv-stack--nowrap primitiv-stack--align-start primitiv-stack--justify-start">`,
    indent(elementsControl()),
    `  <p class="docs-example-caption">Selected: <code data-selected-segment>grid</code></p>`,
    `</div>`,
  ].join("\n");

/** Follows `primitiv-segmented-control-change` into the readout, as the code tab's listener does. */
const wireReadout = (root: HTMLElement) => {
  const control = root.querySelector("primitiv-segmented-control");
  const readout = root.querySelector("[data-selected-segment]");
  if (!control || !readout) return;
  const onChange = (event: Event) => {
    readout.textContent = (event as CustomEvent<{ value: string }>).detail.value;
  };
  control.addEventListener("primitiv-segmented-control-change", onChange);
  return () => control.removeEventListener("primitiv-segmented-control-change", onChange);
};

const FRAMEWORKS: readonly ElementsSegment[] = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue", disabled: true },
  { value: "svelte", label: "Svelte", disabled: true },
];

const PERIODS: readonly ElementsSegment[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "quarter", label: "This quarter" },
];

const DENSITIES: readonly ElementsSegment[] = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
];

/** The controlled example's live half. */
const ControlledExample = () => {
  const [view, setView] = useState("grid");
  return (
    <Stack gap="sm">
      <SegmentedControl value={view} onValueChange={setView} aria-label="View">
        {VIEWS.map((v) => (
          <SegmentedControlItem key={v.value} value={v.value}>
            {v.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <p className="docs-example-caption">
        Selected: <code>{view}</code>
      </p>
    </Stack>
  );
};

/**
 * SegmentedControl's page content.
 *
 * The thing worth documenting is not how it looks — that is the playground's job
 * — but **which component this is**. It is a `role="radiogroup"` of
 * `role="radio"` buttons, so it means "one of these values is active", and it is
 * one tab stop with arrow keys inside. `ToggleGroup` looks nearly identical and
 * means something else entirely (`aria-pressed` commands that can all be off),
 * so the first example is the choice between them rather than a variant tour.
 *
 * This site uses it in its own header. The `disabled`-per-segment example is a
 * framework picker with options that are not available yet, which is exactly
 * the case a disabled segment is for.
 */
export const segmentedControlSpec: ComponentSpec = {
  playground: {
    component: "SegmentedControl",
    fill: true,
    snippet: (values, mode) =>
      mode === "elements"
        ? elementsControl({ size: values.size, justify: values.justify })
        : [
        imports(mode),
        ``,
        ...controlLines(mode, {
          attrs: `${contractAttr({ mode, prop: "size", value: values.size })}${contractAttr({
            mode,
            prop: "justify",
            value: values.justify,
          })} defaultValue="grid" aria-label="View"`,
        }),
      ].join("\n"),
    render: (values) => (
      <SegmentedControl
        size={values.size as Size}
        justify={values.justify as Justify}
        defaultValue="grid"
        aria-label="View"
      >
        {VIEWS.map((v) => (
          <SegmentedControlItem key={v.value} value={v.value}>
            {v.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    ),
  },

  anatomyMeta:
    "Two parts: the Root is the `role=\"radiogroup\"` that owns the value, and each Item is a `<button role=\"radio\">` carrying `aria-checked`. Both surfaces have the same shape — the copied file adds classes and nothing else — so a segment is a segment in either mode.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) =>
        mode === "elements" ? elementsControl() : controlLines(mode, { attrs: ` defaultValue="grid" aria-label="View"` }).join("\n"),
    },
  ],

  examples: [
    {
      id: "vs-toggle-group",
      title: "SegmentedControl or ToggleGroup?",
      elementsTitle: "Segmented control or toggle group?",
      render: () => (
        <InteractiveExample
          caption="They look almost identical and mean different things, so pick by **semantics**, not appearance. Use `SegmentedControl` when the choice is a **value** and one option is always active — a view mode, a density, a plan. Use `ToggleGroup` when the buttons are **commands or toggles** that can each be on or off, including “none selected”. Under the hood: this is `role=&quot;radiogroup&quot;` / `role=&quot;radio&quot;` with `aria-checked` and no way to deselect; `ToggleGroup` is `role=&quot;group&quot;` with `aria-pressed` and can end up empty. Try clicking the selected segment below — nothing happens, because a value cannot be un-chosen."
          elementsCaption="They look almost identical and mean different things, so pick by **semantics**, not appearance. Use `<primitiv-segmented-control>` when the choice is a **value** and one option is always active — a view mode, a density, a plan. Use `<primitiv-toggle-group>` when the buttons are **commands or toggles** that can each be on or off, including none. Under the hood: this is `role=&quot;radiogroup&quot;` with `role=&quot;radio&quot;` and `aria-checked` on each `<button>`, and no way to deselect; a toggle group is `role=&quot;group&quot;` with `aria-pressed` and can end up empty. Try clicking the selected segment below — nothing happens, because a value cannot be un-chosen."
          code={(_density, mode) =>
            mode === "elements"
              ? [`<!-- one of these is always active -->`, elementsControl()].join("\n")
              : [
              imports(mode),
              ``,
              `// one of these is always active`,
              ...controlLines(mode, { attrs: ` defaultValue="grid" aria-label="View"` }),
            ].join("\n")
          }
        >
          {() => (
            <SegmentedControl defaultValue="grid" aria-label="View mode">
              {VIEWS.map((v) => (
                <SegmentedControlItem key={v.value} value={v.value}>
                  {v.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "controlled",
      title: "Controlled",
      elementsTitle: "Listening for changes",
      render: () => (
        <InteractiveExample
          elementsCaption="The element keeps the selection in its own `value` attribute, so there is nothing to wire for it to work. To follow it, listen for `primitiv-segmented-control-change`: it bubbles, fires **before** the change applies with the new segment in `detail.value`, and `preventDefault()` vetoes it — the equivalent of a controlled component refusing an update. Setting `value` (the attribute or the property) selects a segment from script."
          elementsPreview={() => readoutPreview()}
          wire={wireReadout}
          caption="Pass `value` and `onValueChange` together and the parent owns the selection — the usual reason being that the value drives something else on the page. `onValueChange` hands you the segment's `value` string, so there is no event to unpack."
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  elementsControl(),
                  ``,
                  `<script type="module">`,
                  `  const control = document.querySelector("primitiv-segmented-control");`,
                  `  control.addEventListener("primitiv-segmented-control-change", (event) => {`,
                  `    console.log(event.detail.value); // the segment selected; preventDefault() vetoes it`,
                  `  });`,
                  `</script>`,
                ].join("\n")
              : [
              `import { useState } from "react";`,
              imports(mode),
              ``,
              `const [view, setView] = useState("grid");`,
              ``,
              ...controlLines(mode, { attrs: ` value={view} onValueChange={setView} aria-label="View"` }),
            ].join("\n")
          }
        >
          {() => <ControlledExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "disabled",
      title: "Disabling a segment, or all of them",
      render: () => (
        <InteractiveExample
          caption="`disabled` on an **Item** takes that one segment out of play: it stops responding, leaves the roving tab order, and the arrow keys skip over it — which is what makes it right for an option that exists but is not available yet. `disabled` on the **Root** disables every segment and the whole control takes no tab stop, while still reporting which one is selected so it reads correctly."
          elementsCaption="`disabled` on a `<primitiv-segmented-control-item>` takes that one segment out of play: its `<button>` gets `aria-disabled` and `data-disabled`, the arrow keys skip it, the tab stop never lands on it and a click does nothing — right for an option that exists but is not available yet. `disabled` on `<primitiv-segmented-control>` disables every segment, while the selected one still reports `aria-checked` so the control reads correctly."
          elementsPreview={() =>
            elementsStack([
              elementsControl({ value: "react", name: ` aria-label="Framework"`, items: FRAMEWORKS }),
              elementsControl({ disabled: true, name: ` aria-label="View, unavailable"` }),
            ])
          }
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  `<!-- one unavailable option -->`,
                  elementsControl({ value: "react", name: ` aria-label="Framework"`, items: FRAMEWORKS }),
                  ``,
                  `<!-- the whole control inert -->`,
                  elementsControl({ disabled: true }),
                ].join("\n")
              : [
              imports(mode),
              ``,
              `// one unavailable option`,
              ...controlLines(mode, {
                attrs: ` defaultValue="react" aria-label="Framework"`,
                items: [
                  { value: "react", label: "React" },
                  { value: "vue", label: "Vue", extra: " disabled" },
                  { value: "svelte", label: "Svelte", extra: " disabled" },
                ],
              }),
              ``,
              `// the whole control inert`,
              ...controlLines(mode, { attrs: ` disabled defaultValue="grid" aria-label="View"` }),
            ].join("\n")
          }
        >
          {() => (
            <Stack gap="md" align="start">
              <SegmentedControl defaultValue="react" aria-label="Framework">
                <SegmentedControlItem value="react">React</SegmentedControlItem>
                <SegmentedControlItem value="vue" disabled>
                  Vue
                </SegmentedControlItem>
                <SegmentedControlItem value="svelte" disabled>
                  Svelte
                </SegmentedControlItem>
              </SegmentedControl>
              <SegmentedControl disabled defaultValue="grid" aria-label="View, unavailable">
                {VIEWS.map((v) => (
                  <SegmentedControlItem key={v.value} value={v.value}>
                    {v.label}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "justify",
      title: "Sizing the strip (justify)",
      render: () => (
        <InteractiveExample
          caption="`justify` decides what sets the width. `justified` (the default) splits the strip evenly, so every segment is the same width regardless of label length — right for a control that fills a column or sits in a toolbar of fixed width. `content` sizes each segment to its own label, so the strip hugs its contents. The difference only shows when the labels are uneven, which is why this example uses one long one."
          elementsCaption="The `primitiv-segmented-control--justified` class decides what sets the width. With it (the styled default) the strip splits evenly, so every segment is the same width regardless of label length — right for a control that fills a column or sits in a toolbar of fixed width. Without it each segment sizes to its own label and the strip hugs its contents. The difference only shows when the labels are uneven, which is why this example uses one long one."
          elementsPreview={() =>
            elementsStack(
              (["justified", "content"] as const).map((justify) =>
                elementsControl({ value: "day", justify, name: ` aria-label="Period, ${justify}"`, items: PERIODS }),
              ),
              "stretch",
            )
          }
          code={(_density, mode) =>
            mode === "elements"
              ? (["justified", "content"] as const)
                  .map((justify) => elementsControl({ value: "day", justify, name: ` aria-label="Period"`, items: PERIODS }))
                  .join("\n\n")
              : [
              imports(mode),
              ``,
              ...(["justified", "content"] as const).flatMap((j) =>
                controlLines(mode, {
                  attrs: `${contractAttr({ mode, prop: "justify", value: j })} defaultValue="day" aria-label="Period"`,
                  items: [
                    { value: "day", label: "Day" },
                    { value: "week", label: "Week" },
                    { value: "quarter", label: "This quarter" },
                  ],
                }),
              ),
            ].join("\n")
          }
        >
          {() => (
            <Stack gap="md">
              {(["justified", "content"] as const).map((j) => (
                <SegmentedControl key={j} justify={j} defaultValue="day" aria-label={`Period, ${j}`}>
                  <SegmentedControlItem value="day">Day</SegmentedControlItem>
                  <SegmentedControlItem value="week">Week</SegmentedControlItem>
                  <SegmentedControlItem value="quarter">This quarter</SegmentedControlItem>
                </SegmentedControl>
              ))}
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "vertical",
      title: "Vertical",
      render: () => (
        <InteractiveExample
          caption="`orientation=&quot;vertical&quot;` stacks the segments and moves the arrow keys with them — `ArrowDown` / `ArrowUp` navigate, and `aria-orientation` tells assistive technology which axis it is on. Worth knowing that the keys follow the orientation rather than being fixed, so you do not have to document a different keymap for a vertical strip."
          elementsCaption="`orientation=&quot;vertical&quot;` stacks the segments and moves the arrow keys with them — `ArrowDown` / `ArrowUp` navigate, and the element writes `aria-orientation` so assistive technology knows which axis it is on. The keys follow the orientation rather than being fixed, so a vertical strip needs no keymap of its own."
          elementsPreview={() => elementsControl({ orientation: "vertical", name: ` aria-label="View, vertical"` })}
          code={(_density, mode) =>
            mode === "elements"
              ? elementsControl({ orientation: "vertical" })
              : [
              imports(mode),
              ``,
              ...controlLines(mode, {
                attrs: ` orientation="vertical" defaultValue="grid" aria-label="View"`,
              }),
            ].join("\n")
          }
        >
          {() => (
            <SegmentedControl orientation="vertical" defaultValue="grid" aria-label="View, vertical">
              {VIEWS.map((v) => (
                <SegmentedControlItem key={v.value} value={v.value}>
                  {v.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "labelling",
      title: "Labelling",
      render: () => (
        <InteractiveExample
          caption="The group needs a name — each segment labels itself, but without one the options are announced with no idea what they choose between. `aria-label` on the Root is the quick path and, unlike `Slider`, it works: the Root **is** the `role=&quot;radiogroup&quot;`. For a **visible** label, give it an id and point `aria-labelledby` at it. Not a `Field.Label`: that renders a `<label htmlFor>` aimed at an id no segment claims — only `Input`, `Textarea` and `Select` read `FieldContext` — so it would associate with nothing."
          elementsCaption="The group needs a name — each segment labels itself, but without one the options are announced with no idea what they choose between. `aria-label` on `<primitiv-segmented-control>` is the quick path, and it works because the element **is** the `role=&quot;radiogroup&quot;`. For a **visible** label, give it an id and point `aria-labelledby` at it. Not a `<label for>`: no segment is a labellable form control, so it would associate with nothing."
          elementsPreview={() =>
            [
              `<div class="docs-example-stack">`,
              `  <span id="density-label-elements" class="docs-example-title">Density</span>`,
              indent(elementsControl({ value: "comfortable", name: ` aria-labelledby="density-label-elements"`, items: DENSITIES })),
              `</div>`,
            ].join("\n")
          }
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  `<!-- visible label, referenced by the group -->`,
                  `<span id="density-label">Density</span>`,
                  elementsControl({ value: "comfortable", name: ` aria-labelledby="density-label"`, items: DENSITIES }),
                  ``,
                  `<!-- no visible label? name the group directly -->`,
                  `<primitiv-segmented-control aria-label="Density" class="primitiv-segmented-control primitiv-segmented-control--md primitiv-segmented-control--justified">`,
                ].join("\n")
              : [
              imports(mode),
              ``,
              `// visible label, referenced by the group`,
              `<span id="density-label">Density</span>`,
              ...controlLines(mode, {
                attrs: ` aria-labelledby="density-label" defaultValue="comfortable"`,
                items: [
                  { value: "compact", label: "Compact" },
                  { value: "comfortable", label: "Comfortable" },
                ],
              }),
              ``,
              `// no visible label? name the group directly`,
              `<${partNamer(mode, "SegmentedControl")("Root")} aria-label="Density">`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              {/* Deliberately NOT `Field` + `Field.Label` — see the caption. */}
              <span id="density-label" className="docs-example-title">
                Density
              </span>
              <SegmentedControl aria-labelledby="density-label" defaultValue="comfortable">
                <SegmentedControlItem value="compact">Compact</SegmentedControlItem>
                <SegmentedControlItem value="comfortable">Comfortable</SegmentedControlItem>
              </SegmentedControl>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "A single-select strip of segments where exactly one is always selected. `<primitiv-segmented-control>` is the radio group and keeps the selected segment in its `value` attribute; each `<primitiv-segmented-control-item>` wraps the `<button>` you write, which becomes a `role=\"radio\"` with `aria-checked`. One Tab stop for the whole control, with the arrow keys moving the selection.",
    anatomyMeta:
      "Two elements. `<primitiv-segmented-control>` is the `role=\"radiogroup\"` — name it with `aria-label` or `aria-labelledby` — and owns `value`, `orientation` and `disabled`. Each `<primitiv-segmented-control-item>` carries a `value` and wraps the `<button>` you write, which receives `role=\"radio\"`, `aria-checked`, `data-state=\"checked\" | \"unchecked\"` and the roving `tabindex`; the wrapper itself takes no box, so the buttons are the track's own items.",
    keyboardMeta:
      "One Tab stop for the whole control — the selected segment, or the first enabled one when nothing is selected — with the arrows navigating inside it. That is the radio-group model, and it is why a five-segment control does not cost five presses of `Tab` to get past.",
    keyboard: [
      { keys: ["Tab"], behaviour: "Move into or out of the control in **one** keystroke, landing on the selected segment." },
      {
        keys: ["ArrowRight", "ArrowLeft"],
        behaviour:
          "Move focus **and** selection to the next / previous segment, wrapping at the ends and skipping `disabled` ones. They swap under right-to-left: set `dir=\"rtl\"` on the control or any ancestor.",
      },
      { keys: ["ArrowDown", "ArrowUp"], behaviour: "The same, with `orientation=\"vertical\"`." },
      { keys: ["Space", "Enter"], behaviour: "Select the focused segment — the native `<button>`'s own click, so it also works if focus arrived by other means." },
    ],
    accessibility: [
      "This is `role=\"radiogroup\"` with `role=\"radio\"` segments and `aria-checked` — the same semantics as a radio group, drawn as a strip. It announces as a set of exclusive options, which is only honest if one of them really is always active.",
      "**Not** `<primitiv-toggle-group>`. That one is `role=\"group\"` with `aria-pressed` and can be emptied. Choosing by appearance rather than meaning gives assistive technology the wrong model of the control, and no visual review catches it.",
      "**Name the group.** `aria-label` on `<primitiv-segmented-control>`, or `aria-labelledby` pointing at a visible label. Without a name, a screen-reader user hears three options and no question.",
      "The arrow keys move selection, not just focus, so `primitiv-segmented-control-change` fires as someone navigates. Anything expensive downstream should react to the settled value rather than every event.",
      "A segment decorates the one `<button>` you put inside it. A segment with no `value`, or without exactly one element child, is reported once in the console and left alone.",
      "`disabled` on a segment sets `aria-disabled` and `data-disabled` on its button rather than the native attribute, so it stays announced while the arrows skip it and nothing selects it. `disabled` on the control does the same for every segment and keeps the current selection checked.",
    ],
  },

  keyboardMeta:
    "One tab stop for the whole control — the selected segment, or the first enabled one when nothing is selected — with the arrows navigating inside it. That is the radio-group model, and it is why a five-segment control does not cost five presses of `Tab` to get past.",
  keyboard: [
    { keys: ["Tab"], behaviour: "Move into or out of the control in **one** keystroke, landing on the selected segment." },
    {
      keys: ["ArrowRight", "ArrowLeft"],
      behaviour: "Move focus **and** selection to the next / previous segment, wrapping at the ends and skipping `disabled` ones. Horizontal orientation.",
    },
    { keys: ["ArrowDown", "ArrowUp"], behaviour: "The same, when `orientation=\"vertical\"`." },
    { keys: ["Space", "Enter"], behaviour: "Select the focused segment — native `<button>` activation, so it also works if focus arrived by other means." },
  ],

  accessibility: [
    "This is `role=\"radiogroup\"` with `role=\"radio\"` segments and `aria-checked` — the same semantics as `RadioGroup`, drawn as a strip. So it announces as a set of exclusive options, which is only honest if one of them really is always active.",
    "**Not** `ToggleGroup`. That one is `role=\"group\"` with `aria-pressed` and can be deselected to nothing. Choosing by appearance rather than meaning gives assistive technology the wrong model of what the control does, and no visual review catches it.",
    "Label the group. `aria-label` on the Root works — it *is* the radiogroup, unlike `Slider`'s role-less root — and a visible label needs an id with `aria-labelledby` pointing at it. **Not** a `Field.Label`: that renders a `<label htmlFor>` aimed at an id no segment claims, because only `Input`, `Textarea` and `Select` read `FieldContext`. Without a name, a screen-reader user hears three options and no question.",
    "Arrow keys move selection, not just focus. That is correct for a radio group, but it means the value changes as someone navigates — so anything expensive downstream should react to the settled value rather than firing per keystroke.",
    "A `disabled` Item stays visible and announced but is skipped by the arrows and takes no tab stop, which is the right treatment for an option that exists and is temporarily unavailable. If it will never be available, leave it out instead.",
    "`disabled` on the Root makes the whole control inert while still reporting the current selection, so it reads correctly rather than announcing as empty.",
  ],
};
