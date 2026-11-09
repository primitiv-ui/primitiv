"use client";

import { useState, type CSSProperties } from "react";

import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Field, FieldDescription } from "@/components/field";
import { Stack } from "@/components/stack";
import { contractAttr, importBlock, partNamer, stackImports } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: readonly Size[] = ["xs", "sm", "md", "lg", "xl"];

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Checkbox", componentId: "checkbox" });

/** Stack and Button appear in the examples that compose them, so their import
 *  lines have to appear too — a snippet that omits them does not run. */

const buttonImports = (mode: Mode) =>
  importBlock({ mode, component: "Button", componentId: "button" });

/**
 * One checkbox, in the spelling of the current mode.
 *
 * The two surfaces differ in SHAPE, not just in naming, so this cannot be a
 * `partNamer` call at the point of use. The copied file exports a single
 * `Checkbox` that renders the box, the mark and the label span for you; the
 * headless compound exports `Root` and `Indicator` and expects you to place
 * them. Note what is deliberately NOT here: `partNamer(mode, "Checkbox")` would
 * happily produce `CheckboxIndicator` under Styled, and the copied file exports
 * no such symbol.
 */
const checkboxLines = (
  mode: Mode,
  label: string,
  { attrs = "", indent = "" }: { attrs?: string; indent?: string } = {},
) => {
  const p = partNamer(mode, "Checkbox");
  if (mode === "headless") {
    return [
      `${indent}<${p("Root")}${attrs}>`,
      `${indent}  <${p("Indicator")} />`,
      `${indent}  ${label}`,
      `${indent}</${p("Root")}>`,
    ];
  }
  return [`${indent}<Checkbox${attrs}>${label}</Checkbox>`];
};

/** The tri-state example's live half — a parent driven by its three children. */
const LABELS = ["Comments", "Mentions", "Weekly digest"];

const IndeterminateExample = () => {
  const [items, setItems] = useState([true, false, false]);
  const all = items.every(Boolean);
  const none = items.every((c) => !c);

  return (
    <Stack gap="sm">
      <Checkbox
        checked={all ? true : none ? false : "indeterminate"}
        onCheckedChange={(checked) => setItems(items.map(() => checked))}
      >
        Notifications
      </Checkbox>
      <Stack gap="sm" style={{ paddingInlineStart: "1.75rem" }}>
        {LABELS.map((label, i) => (
          <Checkbox
            key={label}
            checked={items[i]}
            onCheckedChange={(checked) =>
              setItems(items.map((c, j) => (j === i ? checked : c)))
            }
          >
            {label}
          </Checkbox>
        ))}
      </Stack>
    </Stack>
  );
};

/**
 * The form example's live half.
 *
 * A real `<form>` with a real reset, because that is the point: the visual
 * state is driven by the input's native `:checked`, so a reset restores the
 * box without React hearing about it.
 */
const FormExample = () => (
  <form
    onSubmit={(event) => event.preventDefault()}
    style={{ display: "grid", gap: "0.75rem", justifyItems: "start" }}
  >
    <Checkbox name="updates" value="yes" defaultChecked>
      Email me product updates
    </Checkbox>
    <Checkbox name="terms" value="accepted" required>
      I accept the terms
    </Checkbox>
    <Stack direction="row" gap="sm">
      <Button type="submit" size="sm">
        Submit
      </Button>
      <Button type="reset" variant="secondary" size="sm">
        Reset
      </Button>
    </Stack>
  </form>
);

/** One checkbox as Elements markup: the classes around a native input. */
const checkboxHtml = (
  label: string,
  { size = "md", attrs = "", indent = "" }: { size?: string; attrs?: string; indent?: string } = {},
) =>
  [
    `${indent}<label class="primitiv-checkbox primitiv-checkbox--${size}">`,
    `${indent}  <input type="checkbox"${attrs}>`,
    `${indent}  <span class="primitiv-checkbox__control"><span class="primitiv-checkbox__indicator"></span></span>`,
    `${indent}  <span class="primitiv-checkbox__label">${label}</span>`,
    `${indent}</label>`,
  ];

/** Lays a preview's items out in a column, as the React previews do. */
const stacked = (_density: unknown, code: string) => `<div class="docs-example-stack">${code}</div>`;

/** The tri-state script, as the Elements code tab prints it. */
const TRI_STATE_SCRIPT = [
  `<script>`,
  `  const all = document.getElementById("notify-all");`,
  `  const items = [...document.querySelectorAll('input[name="notify"]')];`,
  `  const sync = () => {`,
  `    const on = items.filter((item) => item.checked).length;`,
  `    all.checked = on === items.length;`,
  `    all.indeterminate = on > 0 && on < items.length;`,
  `  };`,
  `  all.addEventListener("change", () => {`,
  `    items.forEach((item) => (item.checked = all.checked));`,
  `    sync();`,
  `  });`,
  `  items.forEach((item) => item.addEventListener("change", sync));`,
  `  sync();`,
  `</script>`,
];

/** The same script, scoped to the preview (scripts in injected markup never run). */
const wireTriState = (root: HTMLElement) => {
  const all = root.querySelector<HTMLInputElement>("#notify-all");
  const items = [...root.querySelectorAll<HTMLInputElement>('input[name="notify"]')];
  if (!all) return;
  const sync = () => {
    const on = items.filter((item) => item.checked).length;
    all.checked = on === items.length;
    all.indeterminate = on > 0 && on < items.length;
  };
  const toggleAll = () => {
    items.forEach((item) => (item.checked = all.checked));
    sync();
  };
  all.addEventListener("change", toggleAll);
  items.forEach((item) => item.addEventListener("change", sync));
  sync();
  return () => {
    all.removeEventListener("change", toggleAll);
    items.forEach((item) => item.removeEventListener("change", sync));
  };
};

/**
 * Checkbox's page content.
 *
 * The mirror of Modal's asymmetry, and worth knowing before editing: there the
 * registry ADDED parts the headless package does not have, here the registry
 * COLLAPSES two headless parts into one export. `Checkbox.Indicator` exists
 * only in `@primitiv-ui/react` — the copied `Checkbox` renders one internally
 * and exports nothing for it — so no styled snippet may name it. See
 * `checkboxLines`.
 *
 * No Keyboard section: Space toggles a native `<input type="checkbox">` and
 * nothing else is intercepted, which is `ComponentSpec`'s own test for leaving
 * it out (the same reason Button has none).
 */
export const checkboxSpec: ComponentSpec = {
  playground: {
    component: "Checkbox",
    snippet: (values, mode) =>
      mode === "elements"
        ? checkboxHtml("Email me product updates", { size: values.size, attrs: " checked" }).join("\n")
        : [
        imports(mode),
        ``,
        ...checkboxLines(mode, "Email me product updates", {
          attrs: contractAttr({ mode, prop: "size", value: values.size }),
        }),
      ].join("\n"),
    render: (values) => (
      <Checkbox size={values.size as Size} defaultChecked>
        Email me product updates
      </Checkbox>
    ),
  },

  anatomyMeta:
    "The one component whose two surfaces have a different **shape**, not just different names. `@primitiv-ui/react` exports `Root` and `Indicator` and leaves you to place them; the copied file exports a single `Checkbox` that renders the box, the mark and the label span itself — so there is no `CheckboxIndicator` to import under Styled. Either way the Root renders a real `<label>` wrapping a visually-hidden `<input type=\"checkbox\">`.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        if (mode === "elements") return checkboxHtml("Label text").join("\n");
        const p = partNamer(mode, "Checkbox");
        if (mode === "headless") {
          return [
            `<${p("Root")}>`,
            `  <${p("Indicator")} />`,
            `  Label text`,
            `</${p("Root")}>`,
          ].join("\n");
        }
        return `<Checkbox>Label text</Checkbox>`;
      },
    },
  ],

  examples: [
    {
      id: "labelling",
      title: "Labelling",
      render: () => (
        <InteractiveExample
          elementsCaption={"The `<label>` wraps the input, so the text inside it **is** the label and there is no `for` to wire — the association is structural and cannot come apart. For a description under it, add a Field description and list its id in the input's `aria-describedby`."}
          caption="The children **are** the label, and there is no `htmlFor` to wire: the Root renders a real `<label>` with the input inside it, so the association is structural and cannot come apart. Reach for `Field` when you need more than a label — a description or an error message — and let it own the `aria-describedby`. The one thing not to do is put the visible text outside and leave the checkbox unlabelled."
          elementsPreview={stacked}
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  ...checkboxHtml("Email me product updates", { attrs: " checked" }),
                  ``,
                  `<div class="primitiv-field primitiv-field--md">`,
                  ...checkboxHtml("Share anonymous usage data", {
                    attrs: ` aria-describedby="usage-description"`,
                    indent: "  ",
                  }),
                  `  <div class="primitiv-field__description" id="usage-description">Helps us work out which features to keep.</div>`,
                  `</div>`,
                ].join("\n")
              : [
              imports(mode),
              importBlock({
                mode,
                component: "Field",
                componentId: "field",
                parts: ["Description"],
              }),
              ``,
              ...checkboxLines(mode, "Email me product updates"),
              ``,
              `<Field>`,
              ...checkboxLines(mode, "Share anonymous usage data", { indent: "  " }),
              `  <${partNamer(mode, "Field")("Description")}>`,
              `    Helps us work out which features to keep.`,
              `  </${partNamer(mode, "Field")("Description")}>`,
              `</Field>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Checkbox defaultChecked>Email me product updates</Checkbox>
              <Field>
                <Checkbox>Share anonymous usage data</Checkbox>
                <FieldDescription>
                  Helps us work out which features to keep.
                </FieldDescription>
              </Field>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "indeterminate",
      title: "Indeterminate (the tri-state)",
      render: () => (
        <InteractiveExample
          elementsCaption={"The mixed state — a parent whose children disagree — is the platform's, but HTML has **no attribute** for it: only script can set the input's `.indeterminate` property. The few lines below derive the parent from its children and check or clear them all when it is clicked. The stylesheet reads `:indeterminate`, so the bar appears with no class to toggle."}
          elementsPreview={(_density, code) => code.slice(0, code.indexOf("\n\n<script"))}
          wire={wireTriState}
          caption="Pass `checked=&quot;indeterminate&quot;` for the mixed state — a parent whose children disagree. It is the **platform's** indeterminate, set through the input's `.indeterminate` DOM property rather than a class, so the browser exposes `aria-checked=&quot;mixed&quot;` and the `:indeterminate` pseudo-class for free. Two asymmetries to plan for: `onCheckedChange` always hands you a **boolean**, never `&quot;indeterminate&quot;`, and clicking a mixed box resolves it to checked."
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  `<div class="primitiv-stack primitiv-stack--column primitiv-stack--gap-sm primitiv-stack--align-start primitiv-stack--nowrap primitiv-stack--justify-start">`,
                  ...checkboxHtml("Notifications", { attrs: ` id="notify-all"`, indent: "  " }),
                  `  <div class="primitiv-stack primitiv-stack--column primitiv-stack--gap-sm primitiv-stack--align-start primitiv-stack--nowrap primitiv-stack--justify-start" style="padding-inline-start: 1.75rem">`,
                  ...LABELS.flatMap((label, i) =>
                    checkboxHtml(label, {
                      attrs: ` name="notify" value="${label.toLowerCase().replace(" ", "-")}"${i === 0 ? " checked" : ""}`,
                      indent: "    ",
                    }),
                  ),
                  `  </div>`,
                  `</div>`,
                  ``,
                  ...TRI_STATE_SCRIPT,
                ].join("\n")
              : [
              imports(mode),
              stackImports(mode),
              ``,
              `const LABELS = ["Comments", "Mentions", "Weekly digest"];`,
              ``,
              `const [items, setItems] = useState([true, false, false]);`,
              `const all = items.every(Boolean);`,
              `const none = items.every((c) => !c);`,
              ``,
              `<Stack gap="sm">`,
              ...(mode === "headless"
                ? [
                    `  <Checkbox.Root`,
                    `    checked={all ? true : none ? false : "indeterminate"}`,
                    `    onCheckedChange={(checked) => setItems(items.map(() => checked))}`,
                    `  >`,
                    `    <Checkbox.Indicator />`,
                    `    Notifications`,
                    `  </Checkbox.Root>`,
                  ]
                : [
                    `  <Checkbox`,
                    `    checked={all ? true : none ? false : "indeterminate"}`,
                    `    onCheckedChange={(checked) => setItems(items.map(() => checked))}`,
                    `  >`,
                    `    Notifications`,
                    `  </Checkbox>`,
                  ]),
              ``,
              `  <Stack gap="sm" style={{ paddingInlineStart: "1.75rem" }}>`,
              `    {LABELS.map((label, i) => (`,
              ...(mode === "headless"
                ? [
                    `      <Checkbox.Root`,
                    `        key={label}`,
                    `        checked={items[i]}`,
                    `        onCheckedChange={(checked) =>`,
                    `          setItems(items.map((c, j) => (j === i ? checked : c)))`,
                    `        }`,
                    `      >`,
                    `        <Checkbox.Indicator />`,
                    `        {label}`,
                    `      </Checkbox.Root>`,
                  ]
                : [
                    `      <Checkbox`,
                    `        key={label}`,
                    `        checked={items[i]}`,
                    `        onCheckedChange={(checked) =>`,
                    `          setItems(items.map((c, j) => (j === i ? checked : c)))`,
                    `        }`,
                    `      >`,
                    `        {label}`,
                    `      </Checkbox>`,
                  ]),
              `    ))}`,
              `  </Stack>`,
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => <IndeterminateExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "forms",
      title: "In a form",
      render: () => (
        <InteractiveExample
          elementsCaption={'It is a real `<input type="checkbox">`, so `name`, `value`, `checked` and `required` work as they always have — the box submits and validates like any checkbox. The look keys off the input\'s own `:checked`, so a native **reset** restores the box with no script. Try ticking and resetting.'}
          caption="Every native attribute lands on the real `<input>` — `name`, `value`, `required`, `form` — so the box submits and validates like any checkbox, with no adapter. It is also why the stylesheet keys its visual states off `:checked` and `:indeterminate` rather than off `data-state`: press **Reset** below and the browser restores the input without telling React, and a `data-state` mirror would be left painting the old state. `data-state` is a convenience hook for your own CSS, not the source of truth."
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  `<form action="/subscribe" method="post" style="display: grid; gap: 0.75rem; justify-items: start">`,
                  ...checkboxHtml("Email me product updates", { attrs: ` name="updates" value="yes" checked`, indent: "  " }),
                  ...checkboxHtml("I accept the terms", { attrs: ` name="terms" value="accepted" required`, indent: "  " }),
                  `  <div class="primitiv-stack primitiv-stack--row primitiv-stack--gap-sm primitiv-stack--align-stretch primitiv-stack--nowrap primitiv-stack--justify-start">`,
                  `    <button type="submit" class="primitiv-button primitiv-button--primary primitiv-button--sm"><span class="primitiv-button__label">Submit</span></button>`,
                  `    <button type="reset" class="primitiv-button primitiv-button--secondary primitiv-button--sm"><span class="primitiv-button__label">Reset</span></button>`,
                  `  </div>`,
                  `</form>`,
                ].join("\n")
              : [
              imports(mode),
              stackImports(mode),
              buttonImports(mode),
              ``,
              `<form action="/subscribe" method="post">`,
              ...checkboxLines(mode, "Email me product updates", {
                attrs: ` name="updates" value="yes" defaultChecked`,
                indent: "  ",
              }),
              ...checkboxLines(mode, "I accept the terms", {
                attrs: ` name="terms" value="accepted" required`,
                indent: "  ",
              }),
              ``,
              `  <Stack direction="row" gap="sm">`,
              `    <Button type="submit" size="sm">Submit</Button>`,
              `    <Button type="reset" variant="secondary" size="sm">Reset</Button>`,
              `  </Stack>`,
              `</form>`,
            ].join("\n")
          }
        >
          {() => <FormExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "sizes",
      title: "Sizes and disabled",
      render: () => (
        <InteractiveExample
          elementsCaption={'Five sizes, each rescaling again with the nearest `data-density` ancestor — the box, the mark, the gap and the label type all move together. The native `disabled` attribute dims the whole row and takes the input out of the tab order and form submission.'}
          elementsPreview={(_density, code) =>
            `<div class="docs-example-stack">${code.slice(code.indexOf("\n") + 1, code.lastIndexOf("\n"))}</div>`
          }
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor — the box, the mark, the gap and the label type all move together. `disabled` sets the native attribute and publishes `data-disabled`, so the hook and the behaviour cannot drift: the platform takes it out of the tab order and out of form submission, rather than CSS making it look inert."
          code={(density, mode) =>
            mode === "elements"
              ? [
                  `<div data-density="${density}">`,
                  ...SIZES.flatMap((size) => checkboxHtml(size, { size, attrs: " checked", indent: "  " })),
                  ``,
                  ...checkboxHtml("Unavailable", { attrs: " disabled", indent: "  " }),
                  ...checkboxHtml("Locked on", { attrs: " disabled checked", indent: "  " }),
                  `</div>`,
                ].join("\n")
              : [
              imports(mode),
              ``,
              `<div data-density="${density}">`,
              ...SIZES.flatMap((s) =>
                checkboxLines(mode, s, {
                  attrs: contractAttr({ mode, prop: "size", value: s }),
                  indent: "  ",
                }),
              ),
              ``,
              ...checkboxLines(mode, "Unavailable", {
                attrs: ` disabled`,
                indent: "  ",
              }),
              ...checkboxLines(mode, "Locked on", {
                attrs: ` disabled defaultChecked`,
                indent: "  ",
              }),
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              {SIZES.map((size) => (
                <Checkbox key={size} size={size} defaultChecked>
                  {size}
                </Checkbox>
              ))}
              <Checkbox disabled>Unavailable</Checkbox>
              <Checkbox disabled defaultChecked>
                Locked on
              </Checkbox>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "custom-mark",
      title: "Customising the mark",
      render: () => (
        <InteractiveExample
          elementsCaption={'The tick is drawn in CSS, so you retune it with the custom properties the stylesheet publishes — set them in a `style` attribute for one box, or in your own stylesheet for all of them. Here the checked box goes quiet: a sunken fill, a default border and a primary-coloured mark.'}
          caption="The two surfaces answer this differently, which is the clearest illustration of what the mode switch buys you. The copied file draws the tick in CSS, so you retune it with the custom properties it publishes — set below on the element for brevity, though a stylesheet is where they belong. In headless there is no CSS to retune: `Checkbox.Indicator` takes `children`, so you pass whatever mark you want (and `asChild` if it should BE your element rather than sit in a `<span>`). It is always mounted and `aria-hidden` in both, because the accessible state lives on the input."
          code={(_density, mode) => {
            if (mode === "elements")
              return checkboxHtml("Custom mark", { attrs: " checked" })
                .join("\n")
                .replace(
                  `<label class=`,
                  `<label style="--primitiv-checkbox-mark-color: var(--primitiv-content-primary); --primitiv-checkbox-bg-checked: var(--primitiv-surface-sunken); --primitiv-checkbox-border-color-checked: var(--primitiv-border-default)" class=`,
                );
            const p = partNamer(mode, "Checkbox");
            if (mode === "headless") {
              return [
                importBlock({
                  mode,
                  component: "Checkbox",
                  componentId: "checkbox",
                  icons: ["Check"],
                }),
                ``,
                `<${p("Root")} defaultChecked>`,
                `  <${p("Indicator")}>`,
                `    <Check />`,
                `  </${p("Indicator")}>`,
                `  Custom mark`,
                `</${p("Root")}>`,
              ].join("\n");
            }
            return [
              imports(mode),
              ``,
              `<Checkbox`,
              `  defaultChecked`,
              `  style={{`,
              `    "--primitiv-checkbox-mark-color": "var(--primitiv-content-primary)",`,
              `    "--primitiv-checkbox-bg-checked": "var(--primitiv-surface-sunken)",`,
              `    "--primitiv-checkbox-border-color-checked":`,
              `      "var(--primitiv-border-default)",`,
              `  }}`,
              `>`,
              `  Custom mark`,
              `</Checkbox>`,
            ].join("\n");
          }}
        >
          {() => (
            <Checkbox
              defaultChecked
              style={
                {
                  "--primitiv-checkbox-mark-color":
                    "var(--primitiv-content-primary)",
                  "--primitiv-checkbox-bg-checked":
                    "var(--primitiv-surface-sunken)",
                  "--primitiv-checkbox-border-color-checked":
                    "var(--primitiv-border-default)",
                } as CSSProperties
              }
            >
              Custom mark
            </Checkbox>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "A checkbox as classes: `primitiv-checkbox` and a size on a `<label>` that wraps a native `<input type=\"checkbox\">`, a `__control` box with its `__indicator` mark, and the `__label` text. The look reads the input's own `:checked`, `:indeterminate` and `:disabled`.",
    anatomyMeta:
      "The `<label>` is the root and the input sits inside it, first, so the label association is structural. The input is visually hidden; `__control` is the box you see, `__indicator` the mark inside it (empty — the tick is drawn in CSS), and `__label` the text.",
    accessibility: [
      "It is a real `<input type=\"checkbox\">` inside a `<label>` — not a `<div role=\"checkbox\">`. Space toggles it, forms submit it, and the label association cannot come apart.",
      "The mixed state is the platform's, set through the input's `.indeterminate` property by script — which is what makes the browser announce it as mixed. A class or attribute would only change the look.",
      "A user cannot choose the mixed state; clicking a mixed box resolves it to checked. Keep the derivation (all / none / some) in your script, as the indeterminate example does.",
      "The look keys off `:checked` and `:indeterminate`, so a native form **reset** restores the box with no script at all.",
      "Use the native `disabled` attribute: the platform takes the input out of the tab order and form submission, and the row dims from the same attribute. Keep the reason visible nearby.",
      "A checkbox is for an independent yes/no. For one-of-many, use radios.",
    ],
  },

  accessibility: [
    "It is a real `<input type=\"checkbox\">`, visually hidden inside the `<label>` the Root renders — not a `<div role=\"checkbox\">`. Space toggles it, forms submit it, and the label association is structural, so there is no `htmlFor`/`id` pair to keep in step.",
    "The mixed state is the platform's. `\"indeterminate\"` is applied through the input's `.indeterminate` DOM property, which is what makes the browser announce `aria-checked=\"mixed\"` — a class or a `data-` attribute alone would look mixed and read as unchecked.",
    "`onCheckedChange` reports a **boolean**, never `\"indeterminate\"`. A user cannot select the mixed state; only your code can set it, and clicking a mixed box resolves it to checked. Keep the derivation (all / none / some) in the parent.",
    "The visual state keys off `:checked` and `:indeterminate`, not off `data-state`. That is what keeps a native form **reset** correct — the browser restores the input without a React render, and anything keyed off the mirror would be left behind. Use `data-state` for your own styling hooks, not as the source of truth.",
    "`Checkbox.Indicator` is `aria-hidden` and always mounted; it carries no state of its own. Whatever mark you put in it is decoration — the announced state comes from the input, so a custom glyph never needs a label.",
    "`disabled` sets the native attribute and publishes `data-disabled`, so the control leaves the tab order and form submission because the platform says so. Prefer it to a read-only look-alike, and keep the reason visible in nearby text — a disabled control announces nothing about why.",
    "For a card-sized target with a description inside it, use `CheckboxCard`; for one-of-many, `Radio`. A checkbox is for an independent yes/no, and a set of checkboxes where exactly one may be chosen is the classic misuse.",
  ],
};
