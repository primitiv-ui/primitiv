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

/** One radio as Elements markup: the classes around a native input. */
const radioHtml = (
  label: string,
  { size = "md", attrs = "", indent = "" }: { size?: string; attrs?: string; indent?: string } = {},
) =>
  [
    `${indent}<label class="primitiv-radio primitiv-radio--${size}">`,
    `${indent}  <input type="radio"${attrs}>`,
    `${indent}  <span class="primitiv-radio__control"><span class="primitiv-radio__indicator"></span></span>`,
    `${indent}  <span class="primitiv-radio__label">${label}</span>`,
    `${indent}</label>`,
  ];

const STACK = `<div class="primitiv-stack primitiv-stack--column primitiv-stack--gap-sm primitiv-stack--align-start primitiv-stack--nowrap primitiv-stack--justify-start">`;

/** Plain radios in a column, the way the React previews stack them. */
const radioStack = (name: string, indent = "", checked?: string) => [
  `${indent}${STACK}`,
  ...PLANS.flatMap((p) =>
    radioHtml(p.label, {
      attrs: ` name="${name}" value="${p.value}"${p.value === checked ? " checked" : ""}`,
      indent: `${indent}  `,
    }),
  ),
  `${indent}</div>`,
];

/** Reading the group's value, as the Elements code tab prints it. */
const VALUE_SCRIPT = [
  `<script>`,
  `  const output = document.getElementById("subscription-value");`,
  `  document.querySelectorAll('input[name="subscription"]').forEach((radio) =>`,
  `    radio.addEventListener("change", () => (output.textContent = radio.value)),`,
  `  );`,
  `</script>`,
];

/** The same, scoped to the preview (scripts in injected markup never run). */
const wireValue = (root: HTMLElement) => {
  const output = root.querySelector("#subscription-value");
  const radios = [...root.querySelectorAll<HTMLInputElement>('input[name="subscription"]')];
  const handlers = radios.map((radio) => {
    const onChange = () => {
      if (output) output.textContent = radio.value;
    };
    radio.addEventListener("change", onChange);
    return () => radio.removeEventListener("change", onChange);
  });
  return () => handlers.forEach((off) => off());
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
      mode === "elements"
        ? radioHtml("Pro", { size: values.size, attrs: ` name="plan" value="pro" checked` }).join("\n")
        : [
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
        if (mode === "elements") return radioHtml("Pro", { attrs: ` name="plan" value="pro"` }).join("\n");
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
          elementsCaption={'Give sibling radios the same `name` and **the browser groups them** — no script, no shared state. Selecting one deselects the rest, arrow keys move between them, and the form submits the one selected value under that name.'}
          caption="Give sibling radios the same `name` and **the browser groups them** — no shared state, no context, no controlled wiring. Selecting one deselects the rest, arrow keys move between them, and inside a `<form>` the chosen `value` submits under that name. This is the whole reason `Radio` exists as a lone control: the platform already implements the hard parts, so the component does not re-implement them."
          code={(_density, mode) =>
            mode === "elements"
              ? radioStack("billing").join("\n")
              : [
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
          elementsCaption={"Each radio labels itself, but the **set** needs a name too — otherwise the options are announced with no idea what they are choosing between. The native answer is a `<fieldset>` with a `<legend>`, and Field's classes style them. Link a description to the fieldset with `aria-describedby`."}
          caption="Each radio labels itself, but the **set** needs a name too — otherwise the options are announced with no idea what they are choosing between. The native answer is a `<fieldset>` whose `<legend>` names the group, which `asChild` gets you from `Field` without losing its layout or description. Note what this example deliberately does **not** do: a plain `Field.Label` beside radios renders a `<label htmlFor>` pointing at an id no radio claims — `Radio` does not read `FieldContext` — so the label would associate with nothing. A `<legend>` names its fieldset directly and needs no id at all."
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  `<fieldset class="primitiv-field primitiv-field--md" aria-describedby="tier-description">`,
                  `  <legend class="primitiv-field__label">Plan</legend>`,
                  ...radioStack("tier", "  "),
                  `  <div class="primitiv-field__description" id="tier-description">You can change this at any time.</div>`,
                  `</fieldset>`,
                ].join("\n")
              : [
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
      elementsTitle: "Reading the value",
      render: () => (
        <InteractiveExample
          elementsCaption={'A form submits the selected value on its own, so you only need script when the selection drives something else on the page. Listen for `change` on the radios — it fires on the one being selected, never on the one being cleared — and read its `value`.'}
          wire={wireValue}
          elementsPreview={(_density, code) => code.slice(0, code.indexOf("\n\n<script"))}
          caption="Pass `checked` and `onCheckedChange` together and you own the value — worth it when the selection drives something else on the page. Note the shape: `onCheckedChange` fires on the radio being **selected**, so you set the group's value from that radio's own value rather than reading a shared event. As with the other choice controls, the props table flattens the controlled and uncontrolled shapes but TypeScript accepts only one at a time."
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  ...radioStack("subscription", "", "pro").slice(0, -1),
                  `  <p>Selected: <output id="subscription-value">pro</output></p>`,
                  `</div>`,
                  ``,
                  ...VALUE_SCRIPT,
                ].join("\n")
              : [
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
          elementsCaption={"Five sizes, each rescaling again with the nearest `data-density` ancestor. The box is deliberately the same height as Checkbox's box and Switch's track at every size and density, so mixed controls line up in a form."}
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor. The box is deliberately the same height as `Checkbox`'s box and `Switch`'s track at every size and density, so a form mixing the three choice controls keeps one baseline."
          code={(density, mode) =>
            mode === "elements"
              ? [
                  `<div data-density="${density}">`,
                  ...SIZES.flatMap((size) =>
                    radioHtml("Pro", { size, attrs: ` name="size-demo" value="${size}"`, indent: "  " }),
                  ),
                  `</div>`,
                ].join("\n")
              : [
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
          elementsCaption={'The native `disabled` attribute means the option cannot be chosen and leaves the arrow-key cycle, and the row dims from the same attribute. Disabling one option of a group is fine; say why nearby, as the label does here.'}
          caption="`disabled` forwards the native attribute, so the option cannot be chosen and leaves the tab order; `data-disabled` lands on the box for styling. Disabling one option of a group is the common case — the rest stay selectable, and the browser skips the disabled one with the arrow keys."
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  STACK,
                  ...radioHtml("Free", { attrs: ` name="seat" value="free" checked`, indent: "  " }),
                  ...radioHtml("Team (contact sales)", { attrs: ` name="seat" value="team" disabled`, indent: "  " }),
                  `</div>`,
                ].join("\n")
              : [
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

  elements: {
    description:
      "A radio as classes: `primitiv-radio` and a size on a `<label>` that wraps a native `<input type=\"radio\">`, a `__control` ring with its `__indicator` dot, and the `__label` text. Siblings sharing a `name` are one group — the browser does the rest.",
    anatomyMeta:
      "The `<label>` is the root and the input sits inside it, first, so the label association is structural. The input is visually hidden; `__control` is the ring you see, `__indicator` the dot (empty — drawn in CSS), and `__label` the text.",
    accessibility: [
      "Label the **group**, not just the options. Without a group label the choice is announced as unrelated options — wrap the set in a `<fieldset>` with a `<legend>`.",
      "The shared `name` is what makes it a group in the accessibility tree, not just in your layout. Radios with different names are announced separately, and the arrow keys stop at each.",
      "A group should have a default. Shipping a form where every group starts empty forces a choice nobody asked for and makes a required group fail on first submit.",
      "The input is visually hidden, not `display: none` — it stays focusable, announced, and submitted.",
      "The look keys off the input's own `:checked`, so it is right after the browser deselects a sibling and after a form reset, with no script.",
    ],
  },

  accessibility: [
    "**Radio or RadioGroup?** `Radio` is the lone native control, for when you own the grouping — a shared `name`, a bespoke layout, a single opt-in. The headless `RadioGroup` is the managed alternative: it composes `role=\"radio\"` items, owns the selected value, and implements roving tabindex itself. It has no copied styled surface, so under the Styled tab `Radio` is the one to reach for.",
    "Label the **group**, not just the options. Each radio names itself, but without a group label the choice is announced as three unrelated options — use `Field` (as the second example does) or a `<fieldset>` with a `<legend>`.",
    "The shared `name` is what makes it a group in the accessibility tree, not just in your layout. Radios that look grouped but have different names are announced separately, and the arrow keys stop working — if the keyboard behaviour is wrong, that is the first thing to check.",
    "A group should have a default. Tabbing into a group with nothing selected lands on the first option without selecting it, which is fine, but shipping a form where every group starts empty forces a choice on every user — pick a sensible `defaultChecked` where one exists.",
    "The input is visually hidden, not `display: none` — a hidden-by-`display` input leaves the accessibility tree and stops submitting. It stays focusable and reachable.",
    "`data-state` is a best-effort mirror and can lag: when the browser silently deselects a sibling, no React event fires for that sibling. Key the visual selected look off the input's native `:checked` (the shipped stylesheet uses `:has(> input:checked)`), which is always right.",
  ],
};
