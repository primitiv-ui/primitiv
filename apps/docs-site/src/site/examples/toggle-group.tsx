"use client";

import { useState } from "react";

import { SegmentedControl, SegmentedControlItem } from "@/components/segmented-control";
import { Stack } from "@/components/stack";
import { ToggleGroup, ToggleGroupItem } from "@/components/toggle-group";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Justify = "content" | "justified";

const SIZES: readonly Size[] = ["xs", "sm", "md", "lg", "xl"];

const imports = (mode: Mode) =>
  importBlock({ mode, component: "ToggleGroup", componentId: "toggle-group", parts: ["Item"] });
/*
 * The toolbar uses LETTERFORMS, not the Bold / Italic / Underline glyphs.
 *
 * Those glyphs now exist — added 2026-08-26 for exactly this component — but
 * this site depends on the PUBLISHED @primitiv-ui/icons (registry-bugs §6: a
 * `link:` dependency leaves its @types/react peer uninstalled and IconProps
 * collapses to {}), so they only arrive here after the next release. Swap the
 * spans for <Bold /> / <Italic /> / <Underline /> then; the Figma Item set
 * already defaults its label to "B" for the same reason.
 */

/** The formatting toolbar — the canonical use, and what the Figma set defaults to. */
const FORMATS = [
  { value: "bold", glyph: "B", label: "Bold" },
  { value: "italic", glyph: "I", label: "Italic" },
  { value: "underline", glyph: "U", label: "Underline" },
];

const toolbarLines = (mode: Mode, { attrs = "" }: { attrs?: string } = {}) => {
  const p = partNamer(mode, "ToggleGroup");
  return [
    `<${p("Root")} type="multiple"${attrs} aria-label="Text formatting">`,
    ...FORMATS.map(
      (f) => `  <${p("Item")} value="${f.value}" aria-label="${f.label}">${f.glyph}</${p("Item")}>`,
    ),
    `</${p("Root")}>`,
  ];
};

/** The multi-select example's live half. */
const ToolbarExample = () => {
  const [value, setValue] = useState<string[]>(["bold"]);
  return (
    /* align="start": Stack stretches by default, which let the caption's own
       width drive the track's and made it jump as items were pressed. */
    <Stack gap="sm" align="start">
      <ToggleGroup type="multiple" value={value} onValueChange={setValue} aria-label="Text formatting">
        {FORMATS.map(({ value: v, glyph, label }) => (
          <ToggleGroupItem key={v} value={v} aria-label={label}>
            {glyph}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="docs-example-caption">
        Pressed: <code>[{value.map((v) => `"${v}"`).join(", ")}]</code>
      </p>
    </Stack>
  );
};

/** The single-with-clear example's live half. */
const SingleExample = () => {
  const [value, setValue] = useState<string | undefined>("grid");
  return (
    <Stack gap="sm" align="start">
      <ToggleGroup type="single" value={value} onValueChange={setValue} aria-label="View">
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
        <ToggleGroupItem value="board">Board</ToggleGroupItem>
      </ToggleGroup>
      <p className="docs-example-caption">
        Value: <code>{value === undefined ? "undefined (cleared)" : `"${value}"`}</code>
      </p>
    </Stack>
  );
};

/**
 * ToggleGroup's page content.
 *
 * This page has one job before it has any other: say which component this is.
 * It looks exactly like `SegmentedControl` — deliberately, since the 2026-08-26
 * redesign put both on the framed-control anatomy with the same paint recipe —
 * so nothing on screen distinguishes them and the choice is entirely semantic.
 * `role="group"` + `aria-pressed`, any number on including none, versus
 * `role="radiogroup"` + `aria-checked`, exactly one and never empty.
 *
 * Everything else follows from `type`, which is the prop that actually changes
 * what the component is: `"single"` (at most one, clearable by pressing again)
 * or `"multiple"` (a real set). The value type changes with it — string vs
 * string[] — which the flattened props table cannot show, so the examples do.
 */
export const toggleGroupSpec: ComponentSpec = {
  playground: {
    component: "ToggleGroup",
    /* Hand-written: `size`/`justify` are the ROOT's, but the items below are what
       a reader needs to see, and the generated `toJsx` prints a childless
       `<ToggleGroup size="md" justify="content" />`. */
    snippet: (values, mode) =>
      [
        imports(mode),
        ``,
        ...toolbarLines(mode, {
          attrs: `${contractAttr({ mode, prop: "size", value: values.size })}${contractAttr({
            mode,
            prop: "justify",
            value: values.justify,
          })}`,
        }),
      ].join("\n"),
    render: (values) => (
      <ToggleGroup
        type="multiple"
        defaultValue={["bold"]}
        size={values.size as Size}
        justify={values.justify as Justify}
        aria-label="Text formatting"
      >
        {FORMATS.map(({ value: v, glyph, label }) => (
          <ToggleGroupItem key={v} value={v} aria-label={label}>
            {glyph}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    ),
  },

  anatomyMeta:
    "Two parts: the Root is the `role=\"group\"` that owns the pressed value and the roving tabindex, and each Item is a `<button>` carrying `aria-pressed` and `data-state=\"on\" | \"off\"`. Both surfaces have the same shape — the copied file adds classes and nothing else. The track is a transparent bordered frame, so the control sits on any surface; its radius is **concentric** with the items, `calc(item-radius + track-inset)`.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => toolbarLines(mode).join("\n"),
    },
  ],

  examples: [
    {
      id: "vs-segmented-control",
      title: "ToggleGroup or SegmentedControl?",
      render: () => (
        <InteractiveExample
          caption="**These two look identical, and that is on purpose** — since the 2026-08-26 redesign both use the framed-control anatomy and the same `action/*` fills. So you cannot pick by appearance; pick by what the control *means*. Use `ToggleGroup` when each button is an independent toggle or command: any number can be on, **including none**. Use `SegmentedControl` when the choice is a single value that is always set. Underneath: `role=&quot;group&quot;` / `aria-pressed` and clearable, versus `role=&quot;radiogroup&quot;` / `aria-checked` and never empty. Press the pressed item in each — the ToggleGroup clears, the SegmentedControl does not."
          code={(_density, mode) =>
            [
              imports(mode),
              importBlock({ mode, component: "SegmentedControl", componentId: "segmented-control", parts: ["Item"] }),
              ``,
              `// independent toggles — can end up empty`,
              `<${partNamer(mode, "ToggleGroup")("Root")} type="multiple" aria-label="Formatting">`,
              `  <${partNamer(mode, "ToggleGroup")("Item")} value="bold">Bold</${partNamer(mode, "ToggleGroup")("Item")}>`,
              `</${partNamer(mode, "ToggleGroup")("Root")}>`,
              ``,
              `// one value, always set`,
              `<${partNamer(mode, "SegmentedControl")("Root")} defaultValue="grid" aria-label="View">`,
              `  <${partNamer(mode, "SegmentedControl")("Item")} value="grid">Grid</${partNamer(mode, "SegmentedControl")("Item")}>`,
              `</${partNamer(mode, "SegmentedControl")("Root")}>`,
            ].join("\n")
          }
        >
          {() => (
            <Stack gap="md" align="start">
              <ToggleGroup type="multiple" defaultValue={["bold"]} aria-label="Formatting, toggle group">
                <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
                <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
                <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
              </ToggleGroup>
              <SegmentedControl defaultValue="grid" aria-label="View, segmented control">
                <SegmentedControlItem value="list">List</SegmentedControlItem>
                <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
                <SegmentedControlItem value="board">Board</SegmentedControlItem>
              </SegmentedControl>
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "multiple",
      title: "Multi-select (type=\"multiple\")",
      render: () => (
        <InteractiveExample
          caption="`type=&quot;multiple&quot;` makes the value a **`string[]`**, and any number of items can be on at once — the formatting toolbar this component exists for. Note what a multi-select strip looks like with two pressed: two brand-filled buttons side by side. That was a known cost of matching SegmentedControl's fill language, and it is the one place the shared look reads least well."
          code={(_density, mode) =>
            [
              `import { useState } from "react";`,
              imports(mode),
              ``,
              `const [value, setValue] = useState<string[]>(["bold"]);`,
              ``,
              ...toolbarLines(mode, { attrs: ` value={value} onValueChange={setValue}` }),
            ].join("\n")
          }
        >
          {() => <ToolbarExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "single",
      title: "Single with clear (type=\"single\")",
      render: () => (
        <InteractiveExample
          caption="`type=&quot;single&quot;` allows at most one, and the value is a plain **`string`** — but pressing the active item **clears it** — and the callback hands you `undefined`, not an empty string, so type your state `string | undefined`. That clearability is the whole difference from `SegmentedControl`, which cannot be emptied. Press Grid twice to see it."
          code={(_density, mode) => {
            const p = partNamer(mode, "ToggleGroup");
            return [
              `import { useState } from "react";`,
              imports(mode),
              ``,
              `const [value, setValue] = useState<string | undefined>("grid");`,
              ``,
              `<${p("Root")} type="single" value={value} onValueChange={setValue} aria-label="View">`,
              `  <${p("Item")} value="list">List</${p("Item")}>`,
              `  <${p("Item")} value="grid">Grid</${p("Item")}>`,
              `  <${p("Item")} value="board">Board</${p("Item")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <SingleExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "justify",
      title: "Sizing the track (justify)",
      render: () => (
        <InteractiveExample
          caption="`justify=&quot;content&quot;` (the default) sizes each item to its own content, so the whole control hugs — right for an icon toolbar, where equal widths would stretch the glyphs apart. `justified` shares the track's width equally between the items, which suits word labels of uneven length. The two rows below are drawn in **different containers on purpose**, because that is the difference: the first sizes itself, the second fills the column it is given. `justified` in a container that hugs has nothing to distribute and comes out identical to `content`."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              ...(["content", "justified"] as const).flatMap((j) => {
                const p = partNamer(mode, "ToggleGroup");
                return [
                  `<${p("Root")} type="single"${contractAttr({ mode, prop: "justify", value: j })} aria-label="Period">`,
                  `  <${p("Item")} value="day">Day</${p("Item")}>`,
                  `  <${p("Item")} value="quarter">Quarter</${p("Item")}>`,
                  `</${p("Root")}>`,
                ];
              }),
            ].join("\n")
          }
        >
          {() => (
            /*
             * The two rows deliberately get DIFFERENT containers, because that
             * is the actual behaviour rather than a presentation choice.
             *
             * `content` hugs, so it is left to size itself — wrapping it in a
             * full-width box gave a 590px track around 209px of items, which
             * reads as broken. `justified` distributes whatever width it is
             * given, so it needs a box to fill; in a hugging container it has
             * nothing to share out and renders identically to `content`, which
             * is how this example started.
             */
            /*
             * The OUTER box must be full width. An `align="start"` Stack shrinks
             * to its content, and a percentage width inside a shrunken box
             * resolves against that shrunken width — so wrapping this in one
             * silently took `justified` back to hugging and made the two rows
             * identical again. `.docs-example-stack` is inline-size: 100%.
             */
            <div className="docs-example-stack">
              {/* align="start" so this row hugs, which is what `content` does */}
              <Stack gap="xs" align="start">
                <ToggleGroup type="single" justify="content" defaultValue="day" aria-label="Period, content">
                  <ToggleGroupItem value="day">Day</ToggleGroupItem>
                  <ToggleGroupItem value="week">Week</ToggleGroupItem>
                  <ToggleGroupItem value="quarter">Quarter</ToggleGroupItem>
                </ToggleGroup>
                <p className="docs-example-caption">
                  <code>content</code> — the control sizes itself to its items
                </p>
              </Stack>
              {/* stretches, so `justified` has a width to share out */}
              <Stack gap="xs">
                <ToggleGroup type="single" justify="justified" defaultValue="day" aria-label="Period, justified">
                  <ToggleGroupItem value="day">Day</ToggleGroupItem>
                  <ToggleGroupItem value="week">Week</ToggleGroupItem>
                  <ToggleGroupItem value="quarter">Quarter</ToggleGroupItem>
                </ToggleGroup>
                <p className="docs-example-caption">
                  <code>justified</code> — the items share the container equally
                </p>
              </Stack>
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
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor. The track's corner follows the items': its radius is `calc(item-radius + track-inset)`, so the outer curve stays parallel to the inner one at every size instead of needing a value per size."
          code={(density, mode) =>
            [
              imports(mode),
              ``,
              `<div data-density="${density}">`,
              ...SIZES.flatMap((s) =>
                toolbarLines(mode, { attrs: contractAttr({ mode, prop: "size", value: s }) }).map((l) => `  ${l}`),
              ),
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <Stack gap="md" align="start">
              {SIZES.map((size) => (
                <ToggleGroup
                  key={size}
                  type="multiple"
                  defaultValue={["bold"]}
                  size={size}
                  aria-label={`Formatting, ${size}`}
                >
                  {FORMATS.map(({ value: v, glyph, label }) => (
                    <ToggleGroupItem key={v} value={v} aria-label={label}>
                      {glyph}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              ))}
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "disabled",
      title: "Disabled",
      render: () => (
        <InteractiveExample
          caption="`disabled` on an Item forwards the native attribute and removes it from the roving tab order, so the arrow keys skip it — right for a command that is unavailable in the current context. The item keeps reporting its pressed state, so a disabled-but-on toggle still reads correctly."
          code={(_density, mode) => {
            const p = partNamer(mode, "ToggleGroup");
            return [
              imports(mode),
              ``,
              `<${p("Root")} type="multiple" defaultValue={["bold"]} aria-label="Formatting">`,
              `  <${p("Item")} value="bold">Bold</${p("Item")}>`,
              `  <${p("Item")} value="italic" disabled>Italic</${p("Item")}>`,
              `  <${p("Item")} value="underline">Underline</${p("Item")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <ToggleGroup type="multiple" defaultValue={["bold"]} aria-label="Formatting, disabled example">
              <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
              <ToggleGroupItem value="italic" disabled>
                Italic
              </ToggleGroupItem>
              <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
            </ToggleGroup>
          )}
        </InteractiveExample>
      ),
    },
  ],

  keyboardMeta:
    "One tab stop for the whole group — a roving tabindex, so a five-item toolbar costs one `Tab` to pass, not five. Unlike `SegmentedControl`, the arrows move focus **without** pressing anything: pressing is a separate, explicit act, which is what independent toggles require.",
  keyboard: [
    { keys: ["Tab"], behaviour: "Move into or out of the group in one keystroke." },
    {
      keys: ["ArrowRight", "ArrowLeft"],
      behaviour: "Move focus to the next / previous item, skipping `disabled` ones. **Focus only** — nothing is toggled. Mirrored under `dir=\"rtl\"`.",
    },
    { keys: ["ArrowDown", "ArrowUp"], behaviour: "The same, when `orientation=\"vertical\"`." },
    { keys: ["Space", "Enter"], behaviour: "Toggle the focused item — native `<button>` activation. Under `type=\"single\"` this also clears the item if it was already on." },
  ],

  accessibility: [
    "This is `role=\"group\"` with `aria-pressed` on each button — a set of independent toggles. It is **not** `SegmentedControl` (`role=\"radiogroup\"` / `aria-checked`), even though the two are now visually identical. Choosing by appearance gives assistive technology the wrong model of the control, and no visual review catches it.",
    "**Name the group.** `aria-label` on the Root, or `aria-labelledby` pointing at a visible heading. Without one, a screen-reader user hears a set of buttons with no idea what they belong to.",
    "**Icon-only items each need their own name.** The formatting toolbar is the canonical use and the worst case for this: three buttons whose only content is a glyph announce as nothing at all without `aria-label`. Every icon example on this page carries one.",
    "The arrows move focus without toggling, which is correct here and the opposite of `SegmentedControl`. It means a keyboard user can traverse the toolbar without changing anything — essential when each item is a real command.",
    "`type=\"single\"` is clearable: pressing the active item empties the value. That is a genuine state your handler must accept — and the callback hands you **`undefined`** rather than an empty string — and it is the behaviour that makes this component the right choice over a radio group.",
    "A `disabled` item stays visible and announced but leaves the tab order and is skipped by the arrows. Right for a command unavailable in the current context; if it will never be available, leave it out.",
  ],
};
