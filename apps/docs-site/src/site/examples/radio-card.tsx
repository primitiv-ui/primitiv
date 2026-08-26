"use client";

import { useState } from "react";

import { Field, FieldDescription, FieldLabel } from "@/components/field";
import { RadioCard, RadioCardItem } from "@/components/radio-card";
import { Stack } from "@/components/stack";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: readonly Size[] = ["xs", "sm", "md", "lg", "xl"];

const PLANS = [
  { value: "starter", title: "Starter", description: "One project, community support." },
  { value: "pro", title: "Pro", description: "Unlimited projects, email support." },
  { value: "team", title: "Team", description: "Shared workspaces and SSO." },
];

const imports = (mode: Mode) =>
  importBlock({ mode, component: "RadioCard", componentId: "radio-card", parts: ["Item"] });
const stackImports = (mode: Mode) => importBlock({ mode, component: "Stack", componentId: "stack" });

const fieldPart = (mode: Mode) => partNamer(mode, "Field");
const fieldImports = (mode: Mode) =>
  importBlock({ mode, component: "Field", componentId: "field", parts: ["Label", "Description"] });

/**
 * One Item, in the shape of the current mode.
 *
 * Same real-API-difference as CheckboxCard rather than a rename: `title` /
 * `description` / `showDescription` belong to the copied `RadioCardItem` alone,
 * and under Headless the content is `children` with an `Indicator` you place
 * yourself. The Root, by contrast, IS the same component in both modes — it has
 * no styling at all — so only the Item branches.
 */
const itemLines = (
  mode: Mode,
  { value, title, description }: { value: string; title: string; description?: string },
  { attrs = "", indent = "" }: { attrs?: string; indent?: string } = {},
) => {
  const p = partNamer(mode, "RadioCard");
  if (mode === "headless") {
    return [
      `${indent}<${p("Item")} value="${value}"${attrs}>`,
      `${indent}  <${p("Indicator")} forceMount />`,
      `${indent}  <span>${title}</span>`,
      ...(description ? [`${indent}  <span>${description}</span>`] : []),
      `${indent}</${p("Item")}>`,
    ];
  }
  const desc = description ? ` description="${description}"` : "";
  return [`${indent}<RadioCardItem value="${value}"${attrs} title="${title}"${desc} />`];
};

/**
 * Root + Items, per mode. The Root's name is all that varies.
 *
 * `stack` emits the inner `Stack` wrapper, and defaults to on because every
 * live example on this page has one: the group renders no layout of its own, so
 * a snippet without it would not be the tree rendered beside it.
 */
const groupLines = (
  mode: Mode,
  {
    attrs = "",
    items = PLANS,
    itemAttrs = "",
    indent = "",
    stack = "column",
  }: {
    attrs?: string;
    items?: readonly { value: string; title: string; description?: string }[];
    itemAttrs?: string;
    indent?: string;
    stack?: "column" | "row" | false;
  } = {},
) => {
  const p = partNamer(mode, "RadioCard");
  const inner = stack ? `${indent}    ` : `${indent}  `;
  const itemBlock = items.flatMap((i) => itemLines(mode, i, { attrs: itemAttrs, indent: inner }));
  return [
    `${indent}<${p("Root")}${attrs}>`,
    ...(stack
      ? [
          `${indent}  <Stack${stack === "row" ? ` direction="row"` : ""} gap="sm">`,
          ...itemBlock,
          `${indent}  </Stack>`,
        ]
      : itemBlock),
    `${indent}</${p("Root")}>`,
  ];
};

/** The controlled example's live half. */
const ControlledExample = () => {
  const [plan, setPlan] = useState("pro");

  return (
    <Stack gap="sm">
      <RadioCard value={plan} onValueChange={setPlan} aria-label="Plan">
        <Stack gap="sm">
          {PLANS.map((p) => (
            <RadioCardItem key={p.value} value={p.value} title={p.title} description={p.description} />
          ))}
        </Stack>
      </RadioCard>
      <p className="docs-example-caption">
        Selected: <code>{plan}</code>
      </p>
    </Stack>
  );
};

/**
 * RadioCard's page content.
 *
 * Two things lead, and both are invisible from the props table.
 *
 * First, the same fact CheckboxCard's page opens with: these are
 * `<button role="radio">`s inside a `<div role="radiogroup">`, so **nothing
 * submits with a form** and there is no `name`. The group owns the value in
 * React instead — which is a bigger deal here than for CheckboxCard, because
 * `Radio` (the input-based sibling) gets its grouping *from* the shared `name`,
 * and that mechanism is simply absent.
 *
 * Second, the Root/Item asymmetry, which the page has to state because it makes
 * a props table look broken: `RadioCard` (the group) has NO contract row and no
 * styling — it is a pure pass-through — while every class, modifier and data
 * attribute belongs to the Item. A reader seeing an empty styled column on the
 * Root needs to know that is the design and not a gap.
 */
export const radioCardSpec: ComponentSpec = {
  playground: {
    component: "RadioCard",
    controls: [
      {
        name: "showDescription",
        options: ["true", "false"],
        defaultValue: "true",
        description:
          "Hide each Item's supporting text without unmounting its title — the description is a skippable subcomponent, not a change to the card's anatomy.",
      },
    ],
    /* Hand-written for both the usual reasons: `size` lives on the Item and not
       on the named root (so the generated `toJsx` would print it in the wrong
       place, on a component that does not accept it), and `showDescription` is a
       spec control that must survive the Headless tab. */
    snippet: (values, mode) =>
      [
        imports(mode),
        stackImports(mode),
        ``,
        ...groupLines(mode, {
          attrs: ` defaultValue="pro" aria-label="Plan"`,
          items: PLANS.map((p) =>
            values.showDescription === "true" ? p : { value: p.value, title: p.title },
          ),
          itemAttrs: `${contractAttr({ mode, prop: "size", value: values.size })}${
            mode === "headless" ? "" : ` showDescription={${values.showDescription}}`
          }`,
        }),
      ].join("\n"),
    render: (values) => (
      <RadioCard defaultValue="pro" aria-label="Plan">
        <Stack gap="sm">
          {PLANS.map((p) => (
            <RadioCardItem
              key={p.value}
              size={values.size as Size}
              value={p.value}
              title={p.title}
              description={p.description}
              showDescription={values.showDescription === "true"}
            />
          ))}
        </Stack>
      </RadioCard>
    ),
  },

  anatomyMeta:
    "Note which half is which. `RadioCard` — the group — is a plain `<div role=\"radiogroup\">` with **no styling at all**, identical in both modes; that is why it has no class, no modifiers and no data attributes, and why the props table's styled column is empty for it. Everything visual is `RadioCard.Item`, and there the two surfaces diverge like `CheckboxCard`'s do: the copied `RadioCardItem` takes `title` and `description` as props and renders the indicator itself, while the headless `Item` takes `children` and expects you to place `RadioCard.Indicator`. The group also does not lay its Items out — compose them with `Stack` or a grid.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) =>
        groupLines(mode, {
          attrs: ` defaultValue="pro" aria-label="Plan"`,
          items: PLANS.slice(0, 2),
          /* Parts only — the `Stack` every example composes is the consumer's
             layout, not a part of the component. */
          stack: false,
        }).join("\n"),
    },
  ],

  examples: [
    {
      id: "the-group-owns-the-value",
      title: "The group owns the value (the headline)",
      render: () => (
        <InteractiveExample
          caption="These are `<button role=&quot;radio&quot;>`s in a `<div role=&quot;radiogroup&quot;>`, and the group holds the selected `value` in React. Two consequences. **Nothing submits with a form** — there is no input and no `name`, so read `value` and post it yourself, or use `Radio` when you want the browser's own form handling. And the grouping is explicit: `Radio` becomes a group because siblings share a `name`, whereas here the group is a real component that owns the state, which is why arrow keys and the single tab stop work no matter how you lay the Items out."
          code={(_density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `// A radiogroup of buttons — no name, nothing in FormData.`,
              ...groupLines(mode, { attrs: ` defaultValue="pro" aria-label="Plan"` }),
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <RadioCard defaultValue="pro" aria-label="Plan">
                <Stack gap="sm">
                  {PLANS.map((p) => (
                    <RadioCardItem key={p.value} value={p.value} title={p.title} description={p.description} />
                  ))}
                </Stack>
              </RadioCard>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "orientation",
      title: "Layout and orientation",
      render: () => (
        <InteractiveExample
          caption="The group renders no layout of its own, so a row is just a row-direction `Stack` inside it. What you **must** keep in step is `orientation`: it decides which arrow keys navigate, and it defaults to `&quot;both&quot;` (all four). Set `&quot;horizontal&quot;` on a row or `&quot;vertical&quot;` on a column and the group also publishes `aria-orientation`, so a screen reader announces the axis that is actually on screen. Leaving it at `&quot;both&quot;` is not wrong — it just declines to tell anyone which way the options run."
          code={(_density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              ...groupLines(mode, {
                attrs: ` defaultValue="pro" orientation="horizontal" aria-label="Plan"`,
                stack: "row",
              }),
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <RadioCard defaultValue="pro" orientation="horizontal" aria-label="Plan">
                <Stack direction="row" gap="sm">
                  {PLANS.map((p) => (
                    <RadioCardItem key={p.value} value={p.value} title={p.title} description={p.description} />
                  ))}
                </Stack>
              </RadioCard>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "labelling-the-group",
      title: "Labelling the group",
      render: () => (
        <InteractiveExample
          caption="A `radiogroup` with no accessible name announces three options and no idea what they are choosing between, so the group needs `aria-label` or `aria-labelledby` — every example on this page passes one. When the choice needs visible label text and a hint, `Field` with `asChild` gets you a real `<fieldset>` and `<legend>` while keeping its layout and description. Note what this deliberately avoids: a plain `Field.Label` renders a `<label htmlFor>` pointing at an id no Item claims — `RadioCard` does not read `FieldContext` — whereas a `<legend>` names its fieldset directly and needs no id at all."
          code={(_density, mode) =>
            [
              fieldImports(mode),
              imports(mode),
              stackImports(mode),
              ``,
              `<Field asChild>`,
              `  <fieldset>`,
              `    <${fieldPart(mode)("Label")} asChild><legend>Plan</legend></${fieldPart(mode)("Label")}>`,
              ...groupLines(mode, { attrs: ` defaultValue="pro" aria-labelledby="plan-legend"`, indent: "    " }),
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
                    <legend id="plan-legend">Plan</legend>
                  </FieldLabel>
                  <RadioCard defaultValue="pro" aria-labelledby="plan-legend">
                    <Stack gap="sm">
                      {PLANS.map((p) => (
                        <RadioCardItem key={p.value} value={p.value} title={p.title} description={p.description} />
                      ))}
                    </Stack>
                  </RadioCard>
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
          caption="Pass `value` and `onValueChange` on the **group** — not on the Items — and you own the selection. This is the normal way to use the component, because with no form to submit into the value has to reach your code somehow. Uncontrolled works too via `defaultValue`; the props table lists both, but TypeScript accepts one or the other."
          code={(_density, mode) =>
            [
              `import { useState } from "react";`,
              imports(mode),
              stackImports(mode),
              ``,
              `const [plan, setPlan] = useState("pro");`,
              ``,
              ...groupLines(mode, { attrs: ` value={plan} onValueChange={setPlan} aria-label="Plan"` }),
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <ControlledExample />
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
          caption="`size` is the **Item's** prop, not the group's — the group has no styling to size. Five sizes, each rescaling again with the nearest `data-density` ancestor, and matching `CheckboxCard`'s scale exactly so a form mixing single-choice and multi-choice cards keeps one baseline."
          code={(density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<div data-density="${density}">`,
              `  <${partNamer(mode, "RadioCard")("Root")} defaultValue="md" aria-label="Size">`,
              `    <Stack gap="sm">`,
              ...SIZES.flatMap((s) =>
                itemLines(
                  mode,
                  { value: s, title: s.toUpperCase(), description: "Supporting text." },
                  { attrs: contractAttr({ mode, prop: "size", value: s }), indent: "      " },
                ),
              ),
              `    </Stack>`,
              `  </${partNamer(mode, "RadioCard")("Root")}>`,
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <RadioCard defaultValue="md" aria-label="Size">
                <Stack gap="sm">
                  {SIZES.map((size) => (
                    <RadioCardItem
                      key={size}
                      size={size}
                      value={size}
                      title={size.toUpperCase()}
                      description="Supporting text."
                    />
                  ))}
                </Stack>
              </RadioCard>
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
          caption="`disabled` on an Item forwards the native `<button>` attribute, and the group excludes it from two things: arrow-key navigation skips over it, and it can never be the group's tab stop. That second part matters — with nothing selected the tab stop is the first *non-disabled* Item, so a group whose first option is unavailable still receives focus somewhere sensible."
          code={(_density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<${partNamer(mode, "RadioCard")("Root")} defaultValue="pro" aria-label="Plan">`,
              `  <Stack gap="sm">`,
              ...itemLines(mode, PLANS[0], { attrs: ` disabled`, indent: "    " }),
              ...itemLines(mode, PLANS[1], { indent: "    " }),
              ...itemLines(
                mode,
                { value: "team", title: "Team", description: "Contact sales." },
                { attrs: ` disabled`, indent: "    " },
              ),
              `  </Stack>`,
              `</${partNamer(mode, "RadioCard")("Root")}>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <RadioCard defaultValue="pro" aria-label="Plan">
                <Stack gap="sm">
                  <RadioCardItem value="starter" title="Starter" description="Not available on your account." disabled />
                  <RadioCardItem value="pro" title="Pro" description="Unlimited projects, email support." />
                  <RadioCardItem value="team" title="Team" description="Contact sales." disabled />
                </Stack>
              </RadioCard>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  keyboardMeta:
    "The full ARIA radio-group model: the group is **one tab stop**, and the arrow keys move focus *and* selection together. Which arrows work depends on the group's `orientation` — `\"both\"` (the default) enables all four.",
  keyboard: [
    {
      keys: ["Tab"],
      behaviour:
        "Move focus into the group, landing on the **selected** Item — or, with nothing selected, the first non-`disabled` one. The whole group is a single tab stop, not one per option (a roving tabindex).",
    },
    {
      keys: ["ArrowDown", "ArrowRight"],
      behaviour:
        "Move to the next Item **and select it**, wrapping at the end and skipping `disabled` Items. `ArrowRight` is inert when `orientation=\"vertical\"`, and follows `dir` in RTL.",
    },
    { keys: ["ArrowUp", "ArrowLeft"], behaviour: "Move to the previous Item and select it, wrapping at the start." },
    {
      keys: ["Space"],
      behaviour:
        "Select the focused Item. Like a native radio, selection never moves *off* an Item — pressing again keeps it selected.",
    },
    {
      keys: ["Enter"],
      behaviour:
        "Also selects, because each Item is a real `<button>`. A native radio would submit the form instead; there is no form here to submit.",
    },
  ],

  accessibility: [
    "**Radio or RadioCard?** `Radio` is a real `<input type=\"radio\">` in a `<label>`: siblings sharing a `name` are grouped by the browser, and the chosen value submits with the form. `RadioCard` is a `radiogroup` of buttons — no inputs, no `name`, nothing in `FormData` — for when each option is a substantial choice with supporting text that deserves a whole surface. Choose on form participation first, not on looks.",
    "**Always name the group.** A `radiogroup` with no accessible name is the most common mistake here: the options are announced individually with no indication of what is being chosen. Pass `aria-label`, or `aria-labelledby` pointing at visible heading text — or wrap the group in a `<fieldset>` with a `<legend>`, as the labelling example does.",
    "Each Item's accessible name comes from its **content**, so it includes the description as well as the title. That is usually right for a card whose description is part of the choice; pass an explicit `aria-label` on the Item when the description is long or is boilerplate, so the announcement stays the option's name.",
    "Set `orientation` to match the layout you compose. It does two things at once — it decides which arrow keys navigate, and it publishes `aria-orientation` — so a row of Items left at the default `\"both\"` works by keyboard but tells assistive technology nothing about the axis. `\"both\"` omits the attribute deliberately, since claiming an axis that does not exist would be worse.",
    "The Root's `dir` feeds the keymap: in RTL, `ArrowRight` moves to the *previous* Item. Set it on the group (or inherit it from a `dir` ancestor) rather than hand-swapping the keys.",
    "`aria-checked` carries the selected state and `data-state` (`checked` / `unchecked`) is its CSS mirror; style off `data-state`. Unlike `Radio`, `data-state` here can never lag — React owns the selection outright, so there is no browser-side deselection to miss.",
    "The indicator is `aria-hidden` and holds no state; it is decoration over `aria-checked`. `forceMount` (which the copied Item always passes) only keeps it in the DOM so a CSS exit animation can play.",
    "A group should have a default. `defaultValue` makes the tab stop the selected Item and saves every user from an empty required choice; without one, focus lands on the first Item without selecting it, which is correct but leaves the group unanswered.",
    "The whole card is the hit target, so anything interactive **inside** an Item would be a nested control inside a button, which is invalid. Keep links and buttons out of the cards; put them beside the group.",
  ],
};
