"use client";

import { useState } from "react";

import { Field, FieldDescription, FieldLabel } from "@/components/field";
import { Radio } from "@/components/radio";
import { Stack } from "@/components/stack";
import { contractAttr, importBlock, partNamer, stackImports } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: readonly Size[] = ["xs", "sm", "md", "lg", "xl"];

const PLANS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "team", label: "Team" },
];

const imports = (mode: Mode) => importBlock({ mode, component: "Radio", componentId: "radio" });

const fieldPart = (mode: Mode) => partNamer(mode, "Field");
const fieldImports = (mode: Mode) =>
  importBlock({ mode, component: "Field", componentId: "field", parts: ["Label", "Description"] });

/**
 * One radio, in the shape of the current mode.
 *
 * Same two-surfaces-differ-in-shape case as Checkbox and Switch: the copied file
 * exports a single `Radio` that renders the box, the dot and the label span,
 * while the headless compound exports `Root` and `Indicator` and expects you to
 * place the indicator. `partNamer(mode, "Radio")` would print `RadioIndicator`
 * under Styled, which the copied file does not export.
 */
const radioLines = (
  mode: Mode,
  label: string,
  { attrs = "", indent = "" }: { attrs?: string; indent?: string } = {},
) => {
  const p = partNamer(mode, "Radio");
  if (mode === "headless") {
    return [
      `${indent}<${p("Root")}${attrs}>`,
      `${indent}  <${p("Indicator")} />`,
      `${indent}  ${label}`,
      `${indent}</${p("Root")}>`,
    ];
  }
  return [`${indent}<Radio${attrs}>${label}</Radio>`];
};

/** The controlled example's live half. */
const ControlledExample = () => {
  const [plan, setPlan] = useState("pro");

  return (
    <Stack gap="sm">
      {PLANS.map((p) => (
        <Radio
          key={p.value}
          name="plan-controlled"
          value={p.value}
          checked={plan === p.value}
          onCheckedChange={() => setPlan(p.value)}
        >
          {p.label}
        </Radio>
      ))}
      <p className="docs-example-caption">
        Selected: <code>{plan}</code>
      </p>
    </Stack>
  );
};

/**
 * Radio's page content.
 *
 * The headline is that **the browser owns the grouping**: give siblings a shared
 * `name` and selection, deselection, arrow-key navigation and form submission
 * all come from the platform. That is the fact a props table cannot tell you,
 * and it is why the first example is grouping rather than sizes.
 *
 * It also has to answer "why is there no RadioGroup here?", because there IS a
 * headless `RadioGroup` and no copied surface for it. Left unsaid, a reader
 * hunting for `primitiv add radio-group` finds nothing and assumes an omission.
 */
export const radioSpec: ComponentSpec = {
  playground: {
    component: "Radio",
    /* Hand-written for the same reason Switch's is: the generated `toJsx` would
       print `<Radio>Pro</Radio>` under Headless, which renders a box with no
       dot — the headless compound expects you to place `Radio.Indicator`. */
    snippet: (values, mode) =>
      [
        imports(mode),
        ``,
        ...radioLines(mode, "Pro", {
          attrs: `${contractAttr({ mode, prop: "size", value: values.size })} name="plan" value="pro"`,
        }),
      ].join("\n"),
    render: (values) => (
      <Radio size={values.size as Size} name="plan-playground" value="pro" defaultChecked>
        Pro
      </Radio>
    ),
  },

  anatomyMeta:
    "The same shape difference `Checkbox` and `Switch` have. `@primitiv-ui/react` exports `Root` and `Indicator` and leaves you to place the dot; the copied file exports a single `Radio` that renders the box, the dot and the label span itself — so there is no `RadioIndicator` to import under Styled. Either way the Root renders a real `<label>` wrapping a visually-hidden `<input type=\"radio\">`.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        const p = partNamer(mode, "Radio");
        if (mode === "headless") {
          return [`<${p("Root")} name="plan" value="pro">`, `  <${p("Indicator")} />`, `  Pro`, `</${p("Root")}>`].join(
            "\n",
          );
        }
        return `<Radio name="plan" value="pro">Pro</Radio>`;
      },
    },
  ],

  examples: [
    {
      id: "grouping",
      title: "Grouping (the headline)",
      render: () => (
        <InteractiveExample
          caption="Give sibling radios the same `name` and **the browser groups them** — no shared state, no context, no controlled wiring. Selecting one deselects the rest, arrow keys move between them, and inside a `<form>` the chosen `value` submits under that name. This is the whole reason `Radio` exists as a lone control: the platform already implements the hard parts, so the component does not re-implement them."
          code={(_density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<Stack gap="sm">`,
              ...PLANS.flatMap((p) =>
                radioLines(mode, p.label, {
                  attrs: ` name="plan" value="${p.value}"`,
                  indent: "  ",
                }),
              ),
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <Stack gap="sm">
              {PLANS.map((p) => (
                <Radio key={p.value} name="plan-grouped" value={p.value}>
                  {p.label}
                </Radio>
              ))}
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "labelling-the-group",
      title: "Labelling the group",
      render: () => (
        <InteractiveExample
          caption="Each radio labels itself, but the **set** needs a name too — otherwise the options are announced with no idea what they are choosing between. The native answer is a `<fieldset>` whose `<legend>` names the group, which `asChild` gets you from `Field` without losing its layout or description. Note what this example deliberately does **not** do: a plain `Field.Label` beside radios renders a `<label htmlFor>` pointing at an id no radio claims — `Radio` does not read `FieldContext` — so the label would associate with nothing. A `<legend>` names its fieldset directly and needs no id at all."
          code={(_density, mode) =>
            [
              fieldImports(mode),
              imports(mode),
              stackImports(mode),
              ``,
              `<Field asChild>`,
              `  <fieldset>`,
              `    <${fieldPart(mode)("Label")} asChild><legend>Plan</legend></${fieldPart(mode)("Label")}>`,
              `    <Stack gap="sm">`,
              ...PLANS.flatMap((p) =>
                radioLines(mode, p.label, { attrs: ` name="tier" value="${p.value}"`, indent: "      " }),
              ),
              `    </Stack>`,
              `    <${fieldPart(mode)("Description")}>You can change this at any time.</${fieldPart(mode)("Description")}>`,
              `  </fieldset>`,
              `</Field>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Field asChild>
                <fieldset>
                  <FieldLabel asChild>
                    <legend>Plan</legend>
                  </FieldLabel>
                  <Stack gap="sm">
                    {PLANS.map((p) => (
                      <Radio key={p.value} name="tier" value={p.value}>
                        {p.label}
                      </Radio>
                    ))}
                  </Stack>
                  <FieldDescription>You can change this at any time.</FieldDescription>
                </fieldset>
              </Field>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "controlled",
      title: "Controlled",
      render: () => (
        <InteractiveExample
          caption="Pass `checked` and `onCheckedChange` together and you own the value — worth it when the selection drives something else on the page. Note the shape: `onCheckedChange` fires on the radio being **selected**, so you set the group's value from that radio's own value rather than reading a shared event. As with the other choice controls, the props table flattens the controlled and uncontrolled shapes but TypeScript accepts only one at a time."
          code={(_density, mode) =>
            [
              `import { useState } from "react";`,
              imports(mode),
              ``,
              `const [plan, setPlan] = useState("pro");`,
              ``,
              ...PLANS.flatMap((p) =>
                radioLines(mode, p.label, {
                  attrs: ` name="plan" value="${p.value}" checked={plan === "${p.value}"} onCheckedChange={() => setPlan("${p.value}")}`,
                }),
              ),
            ].join("\n")
          }
        >
          {() => <ControlledExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "sizes",
      title: "Sizes and density",
      render: () => (
        <InteractiveExample
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor. The box is deliberately the same height as `Checkbox`'s box and `Switch`'s track at every size and density, so a form mixing the three choice controls keeps one baseline."
          code={(density, mode) =>
            [
              imports(mode),
              ``,
              `<div data-density="${density}">`,
              ...SIZES.flatMap((s) =>
                radioLines(mode, "Pro", {
                  attrs: `${contractAttr({ mode, prop: "size", value: s })} name="size-demo" value="${s}"`,
                  indent: "  ",
                }),
              ),
              `</div>`,
            ].join("\n")
          }
        >
          {() =>
            SIZES.map((size) => (
              <Radio key={size} size={size} name="size-demo" value={size}>
                Pro
              </Radio>
            ))
          }
        </InteractiveExample>
      ),
    },
    {
      id: "disabled",
      title: "Disabled",
      render: () => (
        <InteractiveExample
          caption="`disabled` forwards the native attribute, so the option cannot be chosen and leaves the tab order; `data-disabled` lands on the box for styling. Disabling one option of a group is the common case — the rest stay selectable, and the browser skips the disabled one with the arrow keys."
          code={(_density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<Stack gap="sm">`,
              ...radioLines(mode, "Free", { attrs: ` name="plan" value="free" defaultChecked`, indent: "  " }),
              ...radioLines(mode, "Team (contact sales)", {
                attrs: ` name="plan" value="team" disabled`,
                indent: "  ",
              }),
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <Stack gap="sm">
              <Radio name="plan-disabled" value="free" defaultChecked>
                Free
              </Radio>
              <Radio name="plan-disabled" value="team" disabled>
                Team (contact sales)
              </Radio>
            </Stack>
          )}
        </InteractiveExample>
      ),
    },
  ],

  keyboardMeta:
    "All of it native, because these are real radio inputs — the browser treats same-`name` siblings as one group and gives you the roving behaviour for free.",
  keyboard: [
    { keys: ["Tab"], behaviour: "Move focus into the group, landing on the **selected** radio (or the first, if none is selected) — the group is a single tab stop, not one per option." },
    {
      keys: ["ArrowDown", "ArrowRight"],
      behaviour: "Move to the next radio in the group **and select it**. Wraps at the end, and skips `disabled` options.",
    },
    { keys: ["ArrowUp", "ArrowLeft"], behaviour: "Move to the previous radio and select it." },
    { keys: ["Space"], behaviour: "Select the focused radio. Selection never moves *off* a radio by clicking it again — a native radio only ever moves into the checked state." },
  ],

  accessibility: [
    "**Radio or RadioGroup?** `Radio` is the lone native control, for when you own the grouping — a shared `name`, a bespoke layout, a single opt-in. The headless `RadioGroup` is the managed alternative: it composes `role=\"radio\"` items, owns the selected value, and implements roving tabindex itself. It has no copied styled surface, so under the Styled tab `Radio` is the one to reach for.",
    "Label the **group**, not just the options. Each radio names itself, but without a group label the choice is announced as three unrelated options — use `Field` (as the second example does) or a `<fieldset>` with a `<legend>`.",
    "The shared `name` is what makes it a group in the accessibility tree, not just in your layout. Radios that look grouped but have different names are announced separately, and the arrow keys stop working — if the keyboard behaviour is wrong, that is the first thing to check.",
    "A group should have a default. Tabbing into a group with nothing selected lands on the first option without selecting it, which is fine, but shipping a form where every group starts empty forces a choice on every user — pick a sensible `defaultChecked` where one exists.",
    "The input is visually hidden, not `display: none` — a hidden-by-`display` input leaves the accessibility tree and stops submitting. It stays focusable and reachable.",
    "`data-state` is a best-effort mirror and can lag: when the browser silently deselects a sibling, no React event fires for that sibling. Key the visual selected look off the input's native `:checked` (the shipped stylesheet uses `:has(> input:checked)`), which is always right.",
  ],
};
