"use client";

import { useState } from "react";

import { Slider, SliderRange, SliderThumb, SliderTrack } from "@/components/slider";
import { Stack } from "@/components/stack";
import { contractAttr, importBlock, indent, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Slider", componentId: "slider", parts: ["Track", "Range", "Thumb"] });

/**
 * The slider tree, per mode.
 *
 * Unlike the choice controls, the two surfaces have the SAME shape here — you
 * compose Track, Range and Thumb yourself in both — so this only varies the
 * naming, and `partNamer` is enough.
 */
const sliderLines = (
  mode: Mode,
  {
    attrs = "",
    thumbAttrs = [""],
    indent = "",
  }: { attrs?: string; thumbAttrs?: readonly string[]; indent?: string } = {},
) => {
  const p = partNamer(mode, "Slider");
  return [
    `${indent}<${p("Root")}${attrs}>`,
    `${indent}  <${p("Track")}>`,
    `${indent}    <${p("Range")} />`,
    `${indent}  </${p("Track")}>`,
    // One line per thumb, each with its own attrs — the accessible name has to
    // live HERE, on the `role="slider"`, not on the Root.
    ...thumbAttrs.map((a) => `${indent}  <${p("Thumb")}${a} />`),
    `${indent}</${p("Root")}>`,
  ];
};

/**
 * One slider as Elements markup (RFC 0033): the `@primitiv-ui/web` custom
 * elements, in the shape `primitiv add slider --surface elements` prints —
 * the same four parts as React, with `value` the thumbs' values separated by
 * spaces. Each thumb is itself the `role="slider"`, so its name goes on it.
 */
const elementsSlider = ({
  value = "40",
  attrs = "",
  thumbs = [` aria-label="Volume"`],
  size = "md",
}: {
  value?: string;
  /** Further root attributes, written verbatim with a leading space each. */
  attrs?: string;
  thumbs?: readonly string[];
  size?: string;
} = {}) =>
  [
    `<primitiv-slider value="${value}"${attrs} class="primitiv-slider primitiv-slider--${size}">`,
    `  <primitiv-slider-track class="primitiv-slider__track">`,
    `    <primitiv-slider-range class="primitiv-slider__range"></primitiv-slider-range>`,
    `  </primitiv-slider-track>`,
    ...thumbs.map((thumb) => `  <primitiv-slider-thumb${thumb} class="primitiv-slider__thumb"></primitiv-slider-thumb>`),
    `</primitiv-slider>`,
  ].join("\n");

const BUDGET = elementsSlider({ value: "400", attrs: ` min="0" max="1000" step="50"`, thumbs: [` aria-label="Budget"`] });

const RANGE_THUMBS = [` aria-label="Minimum"`, ` aria-label="Maximum"`];

/** A live example's Elements preview: the slider above a readout. */
const readoutPreview = (slider: string, readout: string) =>
  [`<div class="docs-example-stack">`, indent(slider), `  <p class="docs-example-caption">${readout}</p>`, `</div>`].join("\n");

/** Follows `primitiv-slider-change` into the range example's readout. */
const wireRange = (root: HTMLElement) => {
  const slider = root.querySelector("primitiv-slider");
  const readout = root.querySelector("[data-slider-value]");
  if (!slider || !readout) return;
  const onChange = (event: Event) => {
    readout.textContent = `[${(event as CustomEvent<{ value: number[] }>).detail.value.join(", ")}]`;
  };
  slider.addEventListener("primitiv-slider-change", onChange);
  return () => slider.removeEventListener("primitiv-slider-change", onChange);
};

/** Counts `primitiv-slider-change` and `primitiv-slider-commit` into the commit example's readout. */
const wireCounts = (root: HTMLElement) => {
  const slider = root.querySelector("primitiv-slider");
  const changes = root.querySelector("[data-changes]");
  const commits = root.querySelector("[data-commits]");
  if (!slider || !changes || !commits) return;
  const count = (target: Element) => () => {
    target.textContent = String(Number(target.textContent) + 1);
  };
  const onChange = count(changes);
  const onCommit = count(commits);
  slider.addEventListener("primitiv-slider-change", onChange);
  slider.addEventListener("primitiv-slider-commit", onCommit);
  return () => {
    slider.removeEventListener("primitiv-slider-change", onChange);
    slider.removeEventListener("primitiv-slider-commit", onCommit);
  };
};

/** A single-thumb slider, composed once so the examples stay readable. */
const OneThumb = ({
  label,
  ...props
}: React.ComponentProps<typeof Slider> & { label?: string }) => (
  <Slider {...props}>
    <SliderTrack>
      <SliderRange />
    </SliderTrack>
    {/* The name goes on the THUMB — it is the `role="slider"`. On the Root it
        lands on a role-less <span> and is announced nowhere. */}
    <SliderThumb aria-label={label} />
  </Slider>
);

/** The range example's live half — two thumbs, one value array. */
const RangeExample = () => {
  const [value, setValue] = useState([20, 60]);
  return (
    <Stack gap="sm">
      <Slider value={value} onValueChange={setValue} minStepsBetweenThumbs={10}>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb aria-label="Minimum" />
        <SliderThumb aria-label="Maximum" />
      </Slider>
      <p className="docs-example-caption">
        Value: <code>[{value.join(", ")}]</code>
      </p>
    </Stack>
  );
};

/** The commit example's live half — two counters, one per callback. */
const CommitExample = () => {
  const [changes, setChanges] = useState(0);
  const [commits, setCommits] = useState(0);

  return (
    <Stack gap="sm">
      <Slider
        defaultValue={[40]}
        onValueChange={() => setChanges((n) => n + 1)}
        onValueCommit={() => setCommits((n) => n + 1)}
      >
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb aria-label="Quality" />
      </Slider>
      <p className="docs-example-caption">
        <code>onValueChange</code>: {changes} · <code>onValueCommit</code>: {commits}
      </p>
    </Stack>
  );
};

/**
 * Slider's page content.
 *
 * Two facts drive every example here, and neither is visible in a props table.
 *
 * The value is an **array**, always — `[value]` for one thumb, `[low, high]`
 * for two — because the number of thumbs is decided by how many `Slider.Thumb`
 * children you render, not by a prop. A reader who assumes `value={40}` gets a
 * type error whose cause is not obvious.
 *
 * And there are TWO change callbacks: `onValueChange` fires on every increment
 * of a drag, `onValueCommit` once when the interaction ends. Which one you want
 * depends entirely on whether the handler is cheap, and getting it wrong means a
 * network request per pixel — so the page counts them side by side rather than
 * describing the difference.
 */
export const sliderSpec: ComponentSpec = {
  playground: {
    component: "Slider",
    fill: true,
    /*
     * `range` is NOT a prop — there is no such thing on `Slider.Root`. The thumb
     * count is the CHILD count, so this control has to change the tree the
     * snippet prints rather than add an attribute to it, which is only possible
     * because the snippet below is hand-written. It earns its place precisely
     * because that is the API's least guessable part: a reader looking for a
     * `range` prop will not find one, and flipping this shows them why.
     *
     * Declared here rather than derived, so it survives the Headless tab (a
     * contract modifier would be dropped there) — and being exactly false/true
     * it renders as a Switch.
     */
    controls: [
      {
        name: "range",
        options: ["false", "true"],
        defaultValue: "false",
        description:
          "Render a second thumb to select a range. Not a prop — the value array and the thumb count grow together.",
      },
    ],
    snippet: (values, mode) => {
      const range = values.range === "true";
      if (mode === "elements")
        return range
          ? elementsSlider({ value: "20 60", attrs: ` min-steps-between-thumbs="10"`, thumbs: RANGE_THUMBS, size: values.size })
          : elementsSlider({ size: values.size });
      return [
        imports(mode),
        ``,
        ...sliderLines(mode, {
          attrs: `${contractAttr({ mode, prop: "size", value: values.size })} defaultValue={${
            range ? "[20, 60]" : "[40]"
          }}`,
          thumbAttrs: range
            ? [` aria-label="Minimum"`, ` aria-label="Maximum"`]
            : [` aria-label="Volume"`],
        }),
      ].join("\n");
    },
    render: (values) =>
      values.range === "true" ? (
        <Slider size={values.size as Size} defaultValue={[20, 60]} minStepsBetweenThumbs={10}>
          <SliderTrack>
            <SliderRange />
          </SliderTrack>
          <SliderThumb aria-label="Minimum" />
          <SliderThumb aria-label="Maximum" />
        </Slider>
      ) : (
        <OneThumb size={values.size as Size} defaultValue={[40]} label="Volume" />
      ),
  },

  anatomyMeta:
    "Four parts, and you compose all of them — in **both** modes, unlike the choice controls whose copied file renders its own indicator. The Root owns the value and the keyboard; `Track` is the full-length rail, `Range` the filled portion of it, and each `Thumb` is one focusable handle. **The number of thumbs is the number of `Thumb` children** — that is the whole API for going from a single value to a range.",

  anatomy: [
    {
      label: "Single value",
      code: (mode) =>
        mode === "elements" ? elementsSlider() : sliderLines(mode, { attrs: ` defaultValue={[40]}` }).join("\n"),
    },
    {
      label: "Range",
      code: (mode) =>
        mode === "elements"
          ? elementsSlider({ value: "20 60", thumbs: RANGE_THUMBS })
          : sliderLines(mode, {
          attrs: ` defaultValue={[20, 60]}`,
          thumbAttrs: [` aria-label="Minimum"`, ` aria-label="Maximum"`],
        }).join("\n"),
    },
  ],

  examples: [
    {
      id: "range",
      title: "A range (two thumbs)",
      render: () => (
        <InteractiveExample
          caption="Render a second `Slider.Thumb` and the slider becomes a range — there is no `range` prop. The value is an array either way, so two thumbs means `[low, high]`, and `Range` fills the span between them rather than from the start. A thumb cannot cross its neighbour, and `minStepsBetweenThumbs` keeps a gap between them (10 here — try to close it)."
          elementsCaption="Add a second `<primitiv-slider-thumb>` and the slider becomes a range — there is no `range` attribute. `value` lists one number per thumb, separated by spaces, so two thumbs means `value=&quot;20 60&quot;`, and the range fills the span between them. A thumb cannot cross its neighbour, and `min-steps-between-thumbs` keeps a gap (10 here — try to close it). `primitiv-slider-change` reports every thumb's value in `detail.value`."
          elementsPreview={() =>
            readoutPreview(
              elementsSlider({ value: "20 60", attrs: ` min-steps-between-thumbs="10"`, thumbs: RANGE_THUMBS }),
              `Value: <code data-slider-value>[20, 60]</code>`,
            )
          }
          wire={wireRange}
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  elementsSlider({ value: "20 60", attrs: ` min-steps-between-thumbs="10"`, thumbs: RANGE_THUMBS }),
                  ``,
                  `<script type="module">`,
                  `  const slider = document.querySelector("primitiv-slider");`,
                  `  slider.addEventListener("primitiv-slider-change", (event) => {`,
                  `    console.log(event.detail.value); // every thumb's value; preventDefault() vetoes it`,
                  `  });`,
                  `</script>`,
                ].join("\n")
              : [
              `import { useState } from "react";`,
              imports(mode),
              ``,
              `const [value, setValue] = useState([20, 60]);`,
              ``,
              ...sliderLines(mode, {
                attrs: ` value={value} onValueChange={setValue} minStepsBetweenThumbs={10}`,
                thumbAttrs: [` aria-label="Minimum"`, ` aria-label="Maximum"`],
              }),
            ].join("\n")
          }
        >
          {() => <RangeExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "commit",
      title: "onValueChange vs onValueCommit",
      elementsTitle: "Change and commit events",
      render: () => (
        <InteractiveExample
          caption="Drag the thumb and watch the two counters. `onValueChange` fires on **every** increment — each arrow press, each pointer move — and is what you use to keep controlled state in sync. `onValueCommit` fires **once**, when the interaction ends. Anything expensive belongs on the second: a request per intermediate value is the failure this pair exists to prevent."
          elementsCaption="Drag the thumb and watch the two counters. `primitiv-slider-change` fires on **every** increment — each arrow press, each pointer move — before it applies, and is cancelable. `primitiv-slider-commit` fires **once**, when the interaction ends, with the values the slider then holds. Anything expensive belongs on the second: a request per intermediate value is the failure this pair exists to prevent."
          elementsPreview={() =>
            readoutPreview(
              elementsSlider({ thumbs: [` aria-label="Quality"`] }),
              `<code>primitiv-slider-change</code>: <span data-changes>0</span> · <code>primitiv-slider-commit</code>: <span data-commits>0</span>`,
            )
          }
          wire={wireCounts}
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  elementsSlider({ thumbs: [` aria-label="Quality"`] }),
                  ``,
                  `<script type="module">`,
                  `  const slider = document.querySelector("primitiv-slider");`,
                  `  // keep the UI in sync on every step...`,
                  `  slider.addEventListener("primitiv-slider-change", (event) => setPreview(event.detail.value));`,
                  `  // ...but only persist the settled value`,
                  `  slider.addEventListener("primitiv-slider-commit", (event) => save(event.detail.value));`,
                  `</script>`,
                ].join("\n")
              : [
              `import { useState } from "react";`,
              imports(mode),
              ``,
              `// keep the UI in sync on every step...`,
              `// ...but only persist the settled value`,
              ...sliderLines(mode, {
                attrs: ` defaultValue={[40]} onValueChange={setPreview} onValueCommit={save}`,
              }),
            ].join("\n")
          }
        >
          {() => <CommitExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "range-and-step",
      title: "Min, max and step",
      render: () => (
        <InteractiveExample
          caption="`min`, `max` and `step` behave as on a native range input, and `step` is what the arrow keys move by — so a coarse step is also a coarser keyboard. `Page Up` / `Page Down` always move ten steps, which is what keeps a 0–1000 slider usable from the keyboard without making `step` itself unhelpfully large."
          elementsCaption="`min`, `max` and `step` behave as on a native range input, and `step` is what the arrow keys move by — so a coarse step is also a coarser keyboard. Page Up / Page Down always move ten steps, which keeps a 0–1000 slider usable from the keyboard without making `step` itself unhelpfully large."
          elementsPreview={() =>
            [`<div class="docs-example-stack">`, indent(BUDGET), `</div>`].join("\n")
          }
          code={(_density, mode) =>
            mode === "elements"
              ? BUDGET
              : [
              imports(mode),
              ``,
              ...sliderLines(mode, {
                attrs: ` min={0} max={1000} step={50} defaultValue={[400]}`,
                thumbAttrs: [` aria-label="Budget"`],
              }),
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <OneThumb min={0} max={1000} step={50} defaultValue={[400]} label="Budget" />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "labelling",
      title: "Labelling",
      render: () => (
        <InteractiveExample
          caption="**The name goes on the `Thumb`, not the Root.** The Thumb is the `role=&quot;slider&quot;` — it carries `aria-valuenow` and announces the position — while the Root is a plain `<span>` with no role, so an `aria-label` there is announced nowhere at all. A visible label needs an id with `aria-labelledby` on the thumb; `Field` does not do this for you, because only `Input`, `Textarea` and `Select` read `FieldContext`, so a `Field.Label` beside a slider points at an id nothing claims. On a range, label each thumb separately or both announce the same thing."
          elementsCaption="**The name goes on `<primitiv-slider-thumb>`, not the root.** The thumb is the `role=&quot;slider&quot;` — it carries `aria-valuenow` and announces the position — while `<primitiv-slider>` has no role, so an `aria-label` there is announced nowhere. A visible label needs an id with `aria-labelledby` on the thumb; a `<label for>` cannot reach a thumb, which is not a labellable form control. On a range, label each thumb separately or both announce the same thing."
          elementsPreview={() =>
            [
              `<div class="docs-example-stack">`,
              `  <span id="volume-label-elements" class="docs-example-title">Volume</span>`,
              indent(elementsSlider({ thumbs: [` aria-labelledby="volume-label-elements"`] })),
              `</div>`,
            ].join("\n")
          }
          code={(_density, mode) => {
            if (mode === "elements")
              return [
                `<!-- a visible label needs an id, and the THUMB points at it -->`,
                `<span id="volume-label">Volume</span>`,
                elementsSlider({ thumbs: [` aria-labelledby="volume-label"`] }),
                ``,
                `<!-- no visible label? name the thumb directly -->`,
                `<primitiv-slider-thumb aria-label="Volume" class="primitiv-slider__thumb"></primitiv-slider-thumb>`,
              ].join("\n");
            const p = partNamer(mode, "Slider");
            return [
              imports(mode),
              ``,
              `// a visible label needs an id, and the THUMB points at it`,
              `<span id="volume-label">Volume</span>`,
              ...sliderLines(mode, {
                attrs: ` defaultValue={[40]}`,
                thumbAttrs: [` aria-labelledby="volume-label"`],
              }),
              ``,
              `// no visible label? name the thumb directly`,
              `<${p("Thumb")} aria-label="Volume" />`,
            ].join("\n");
          }}
        >
          {() => (
            <div className="docs-example-stack">
              {/* Deliberately NOT `Field` + `Field.Label`: that renders a
                  `<label htmlFor>` pointing at an id no part of the slider
                  claims, so it would associate with nothing. A plain element
                  with an id, referenced by the thumb, is correct today. */}
              <span id="volume-label" className="docs-example-title">
                Volume
              </span>
              <Slider defaultValue={[40]}>
                <SliderTrack>
                  <SliderRange />
                </SliderTrack>
                <SliderThumb aria-labelledby="volume-label" />
              </Slider>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "disabled",
      title: "Disabled",
      render: () => (
        <InteractiveExample
          caption="`disabled` on the Root takes every thumb out of the tab order and stops pointer interaction, and puts `data-disabled` on the root and each part for styling. Note it belongs on the Root, not on a Thumb — the slider is one control even when it has two handles."
          elementsCaption="`disabled` on `<primitiv-slider>` takes every thumb out of the tab order, ignores keys and presses, and puts `data-disabled` on the root and each part for styling. It belongs on the root, not on a thumb — the slider is one control even when it has two handles."
          elementsPreview={() => [`<div class="docs-example-stack">`, indent(elementsSlider({ attrs: " disabled" })), `</div>`].join("\n")}
          code={(_density, mode) =>
            mode === "elements"
              ? elementsSlider({ attrs: " disabled" })
              : [
              imports(mode),
              ``,
              ...sliderLines(mode, {
                attrs: ` disabled defaultValue={[40]}`,
                thumbAttrs: [` aria-label="Volume"`],
              }),
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <OneThumb disabled defaultValue={[40]} label="Volume" />
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "One or more thumbs along a track, each picking a value between `min` and `max`. `<primitiv-slider>` keeps the values in its `value` attribute, separated by spaces; each `<primitiv-slider-thumb>` is itself a `role=\"slider\"`, positioned by the element along `<primitiv-slider-track>`, which `<primitiv-slider-range>` fills.",
    anatomyMeta:
      "Four elements. `<primitiv-slider>` owns `value`, `min`, `max`, `step`, `min-steps-between-thumbs`, `orientation`, `inverted`, `disabled` and `name`. `<primitiv-slider-track>` is the rail, `<primitiv-slider-range>` the filled portion, and each `<primitiv-slider-thumb>` one focusable handle — **the number of thumbs is the number of thumb elements**, each taking the value at its position. The element writes each thumb's and the range's inset along the track inline, as React does: position is the value itself, so it is the one style the elements write. With a `name`, the slider keeps one hidden `<input>` per value inside itself, so it submits with a form.",
    keyboardMeta:
      "Each thumb is independently focusable and carries the full keymap, so a range slider is two tab stops. Arrow direction follows `orientation`, `dir` and `inverted` together, so “increase” is always the direction that looks like increase.",
    keyboard: [
      { keys: ["ArrowRight", "ArrowUp"], behaviour: "Increase by `step`." },
      { keys: ["ArrowLeft", "ArrowDown"], behaviour: "Decrease by `step`." },
      { keys: ["PageUp", "PageDown"], behaviour: "Increase / decrease by **ten** steps." },
      { keys: ["Home", "End"], behaviour: "Jump to `min` / `max`. On a range, a thumb still cannot cross its neighbour." },
      { keys: ["Tab"], behaviour: "Move between thumbs — a range slider is **two** tab stops." },
    ],
    accessibility: [
      "Every thumb is a `role=\"slider\"` carrying `aria-valuenow`, `aria-valuemin` and `aria-valuemax`, written by the element. What is **not** automatic is the name — label each thumb with `aria-label` or `aria-labelledby`.",
      "**Label the thumb, never the root.** `<primitiv-slider>` has no role, so an `aria-label` on it is announced nowhere — a silent failure, since the slider still looks and behaves correctly.",
      "On a range, label the thumbs separately — `aria-label=\"Minimum\"` and `\"Maximum\"` — or both are announced identically.",
      "`primitiv-slider-commit` is the place for expensive work, not a debounce: a keyboard user's arrow press commits immediately, so a debounce keyed to pointer movement makes the keyboard path feel broken.",
      "`disabled` removes the thumbs from the tab order and sets `aria-disabled`. Explain nearby why the range is unavailable, if the user could act on it.",
      "The arrow keys follow `orientation`, `dir` (inherited from any ancestor) and `inverted`; set those rather than re-mapping keys yourself.",
    ],
  },

  keyboardMeta:
    "Each thumb is independently focusable and carries the full keymap, so a range slider is two tab stops. Arrow direction follows `orientation`, `dir` and `inverted` together — in a right-to-left, inverted vertical slider, “increase” is still the direction that looks like increase.",
  keyboard: [
    { keys: ["ArrowRight", "ArrowUp"], behaviour: "Increase by `step`." },
    { keys: ["ArrowLeft", "ArrowDown"], behaviour: "Decrease by `step`." },
    { keys: ["PageUp", "PageDown"], behaviour: "Increase / decrease by **ten** steps — what makes a wide range usable without coarsening `step`." },
    { keys: ["Home", "End"], behaviour: "Jump to `min` / `max`. On a range, a thumb still cannot cross its neighbour, so it stops at the gap." },
    { keys: ["Tab"], behaviour: "Move between thumbs — a range slider is **two** tab stops, not one." },
  ],

  accessibility: [
    "Every thumb is a `role=\"slider\"` carrying `aria-valuenow`, `aria-valuemin` and `aria-valuemax`, so the position is announced without any work from you. What is **not** automatic is the name — the control announces \"40\" and nothing else unless you label it.",
    "**Label the `Thumb`, never the Root.** The Root renders a plain `<span>` with no role, so an `aria-label` on it is attached to nothing and announced nowhere — a silent failure, since the slider still looks and behaves correctly. `Slider.Root`'s own JSDoc example shows `aria-label` on the Root, which is misleading; the Thumb's example has it right.",
    "A `Field` label does **not** reach the thumb. Only `Input`, `Textarea` and `Select` read `FieldContext`, and a `<label htmlFor>` cannot associate with a `<span role=\"slider\">` anyway — so `Field.Label` beside a slider renders a reference to an id nothing claims. Give the label an id and point `aria-labelledby` at it from each thumb.",
    "On a range, label the thumbs separately. Two thumbs sharing one label are announced identically, which makes it impossible to tell by ear which end you are on — `aria-label=\"Minimum\"` and `\"Maximum\"` is the smallest fix.",
    "A slider is a poor fit for a value that has to be exact. Pair it with a number input when precision matters, and keep the two in sync — the slider for the rough gesture, the field for the specific figure.",
    "`onValueCommit` is the accessible place for expensive work, not a debounce. A keyboard user pressing an arrow key commits immediately on that press, so a debounce keyed to pointer movement makes the keyboard path feel broken while the mouse path feels fine.",
    "`disabled` removes the thumbs from the tab order. If the range is unavailable for a reason the user could act on, explain it in nearby text — a disabled slider announces nothing about why.",
    "The arrow keys follow `orientation`, `dir` and `inverted`, so \"increase\" always matches the direction the thumb visibly moves. Do not re-map the keys yourself to compensate for an inverted track; set `inverted` and let the component handle both.",
  ],
};
