"use client";

import { useState } from "react";

import { SegmentedControl, SegmentedControlItem } from "@/components/segmented-control";
import { Stack } from "@/components/stack";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
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
 * This site uses it in its own header, which is where the `disabled`-per-segment
 * example comes from: the Vue and Svelte segments are real options that are not
 * available yet, and that is exactly the case a disabled segment is for.
 */
export const segmentedControlSpec: ComponentSpec = {
  playground: {
    component: "SegmentedControl",
    fill: true,
    snippet: (values, mode) =>
      [
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
      code: (mode) => controlLines(mode, { attrs: ` defaultValue="grid" aria-label="View"` }).join("\n"),
    },
  ],

  examples: [
    {
      id: "vs-toggle-group",
      title: "SegmentedControl or ToggleGroup?",
      render: () => (
        <InteractiveExample
          caption="They look almost identical and mean different things, so pick by **semantics**, not appearance. Use `SegmentedControl` when the choice is a **value** and one option is always active — a view mode, a density, a plan. Use `ToggleGroup` when the buttons are **commands or toggles** that can each be on or off, including “none selected”. Under the hood: this is `role=&quot;radiogroup&quot;` / `role=&quot;radio&quot;` with `aria-checked` and no way to deselect; `ToggleGroup` is `role=&quot;group&quot;` with `aria-pressed` and can end up empty. Try clicking the selected segment below — nothing happens, because a value cannot be un-chosen."
          code={(_density, mode) =>
            [
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
      render: () => (
        <InteractiveExample
          caption="Pass `value` and `onValueChange` together and the parent owns the selection — the usual reason being that the value drives something else on the page. `onValueChange` hands you the segment's `value` string, so there is no event to unpack."
          code={(_density, mode) =>
            [
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
          caption="`disabled` on an **Item** takes that one segment out of play: it stops responding, leaves the roving tab order, and the arrow keys skip over it — which is what makes it right for an option that exists but is not available yet (this site's own header does exactly that for Vue and Svelte). `disabled` on the **Root** disables every segment and the whole control takes no tab stop, while still reporting which one is selected so it reads correctly."
          code={(_density, mode) =>
            [
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
          code={(_density, mode) =>
            [
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
          code={(_density, mode) =>
            [
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
          code={(_density, mode) =>
            [
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
