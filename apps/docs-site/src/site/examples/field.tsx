"use client";

import { useState } from "react";

import { Field, FieldDescription, FieldErrorText, FieldLabel } from "@/components/field";
import { Input } from "@/components/input";
import { Radio } from "@/components/radio";
import { Stack } from "@/components/stack";
import { Textarea } from "@/components/textarea";
import { contractAttr, importBlock, partNamer, stackImports } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const imports = (mode: Mode) =>
  importBlock({
    mode,
    component: "Field",
    componentId: "field",
    parts: ["Label", "Description", "ErrorText"],
  });

const inputImports = (mode: Mode) => importBlock({ mode, component: "Input", componentId: "input" });
const radioImports = (mode: Mode) => importBlock({ mode, component: "Radio", componentId: "radio" });

/** The live half of the validation example — `invalid` toggling in real time. */
const ValidationExample = () => {
  const [value, setValue] = useState("not-an-email");
  const invalid = !value.includes("@");

  return (
    <div className="docs-example-stack">
      <Field invalid={invalid}>
        <FieldLabel>Email address</FieldLabel>
        <Input value={value} onChange={(e) => setValue(e.target.value)} />
        <FieldDescription>We only use this to send receipts.</FieldDescription>
        <FieldErrorText>That does not look like an email address.</FieldErrorText>
      </Field>
    </div>
  );
};

/**
 * Field's page content.
 *
 * Field is the odd one out among the form components: it renders almost nothing
 * of its own and its entire value is the **cascade** — one `invalid` on the
 * wrapper becomes `aria-invalid` on the control, an `aria-describedby` link to
 * the error, a `data-field-invalid` hook for CSS, and the condition that decides
 * whether the error renders at all. So the examples are about what one prop
 * reaches, not about how the box looks.
 *
 * Two behaviours here are genuinely surprising and get their own billing:
 * `ErrorText` is GATED on `invalid` (it is not "always rendered, hidden"), and a
 * prop set on the control always beats the cascaded one.
 *
 * No Keyboard section — Field owns no keys; the control it wraps does.
 */
export const fieldSpec: ComponentSpec = {
  playground: {
    component: "Field",
    snippet: (values, mode) => {
      const p = partNamer(mode, "Field");
      return [
        imports(mode),
        inputImports(mode),
        ``,
        `<${p("Root")}${contractAttr({ mode, prop: "size", value: values.size })}>`,
        `  <${p("Label")}>Email address</${p("Label")}>`,
        `  <Input type="email" placeholder="you@example.com" />`,
        `  <${p("Description")}>We only use this to send receipts.</${p("Description")}>`,
        `</${p("Root")}>`,
      ].join("\n");
    },
    fill: true,
    render: (values) => (
      <Field size={values.size as Size}>
        <FieldLabel>Email address</FieldLabel>
        <Input type="email" placeholder="you@example.com" />
        <FieldDescription>We only use this to send receipts.</FieldDescription>
      </Field>
    ),
  },

  anatomyMeta:
    "Four parts, and only the Root is required — a Field with a label and a control is a complete field. The Root renders a `<div>` (or your own element via `asChild`), generates the id, and provides the context every other part reads. Note the headless root is **callable directly**: `Field.Root` and `Field` are the same component, which is why the form pages elsewhere on this site write the shorter `<Field>`.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        const p = partNamer(mode, "Field");
        return [
          `<${p("Root")} invalid>`,
          `  <${p("Label")}>Email address</${p("Label")}>`,
          `  <Input type="email" />`,
          `  <${p("Description")}>We only use this to send receipts.</${p("Description")}>`,
          `  <${p("ErrorText")}>That does not look like an email address.</${p("ErrorText")}>`,
          `</${p("Root")}>`,
        ].join("\n");
      },
    },
  ],

  examples: [
    {
      id: "the-cascade",
      title: "The cascade (the headline)",
      render: () => (
        <InteractiveExample
          caption="Type something without an `@`. One `invalid` prop on the Field does four things at once: it sets `aria-invalid` on the control, links the error text to it through `aria-describedby`, puts `data-field-invalid` on the wrapper for CSS, and **decides whether the error renders at all**. That last one is the surprise — `ErrorText` is gated, not hidden, so there is no stale error sitting in the DOM waiting to be announced."
          code={(_density, mode) => {
            const p = partNamer(mode, "Field");
            return [
              `import { useState } from "react";`,
              imports(mode),
              inputImports(mode),
              ``,
              `const [value, setValue] = useState("");`,
              `const invalid = !value.includes("@");`,
              ``,
              `<${p("Root")} invalid={invalid}>`,
              `  <${p("Label")}>Email address</${p("Label")}>`,
              `  <Input value={value} onChange={(e) => setValue(e.target.value)} />`,
              `  <${p("Description")}>We only use this to send receipts.</${p("Description")}>`,
              `  <${p("ErrorText")}>That does not look like an email address.</${p("ErrorText")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <ValidationExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "ids",
      title: "Ids you never write",
      render: () => (
        <InteractiveExample
          caption="Give the Field an `id` and it derives the rest — `<id>-description` and `<id>-error` — then wires the label's `htmlFor`, the control's `id`, and the `aria-describedby` chain to match. Omit it and React's `useId` supplies one, which is the usual case: the ids only need to be unique and correct, not memorable. Inspect the control below and you will find all three links already made."
          code={(_density, mode) => {
            const p = partNamer(mode, "Field");
            return [
              imports(mode),
              inputImports(mode),
              ``,
              `// id optional — omit it and useId generates one`,
              `<${p("Root")} id="email">`,
              `  <${p("Label")}>Email address</${p("Label")}>   {/* htmlFor="email" */}`,
              `  <Input />                        {/* id="email", aria-describedby="email-description" */}`,
              `  <${p("Description")}>We only use this to send receipts.</${p("Description")}>  {/* id="email-description" */}`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div className="docs-example-stack">
              <Field id="email">
                <FieldLabel>Email address</FieldLabel>
                <Input type="email" placeholder="you@example.com" />
                <FieldDescription>We only use this to send receipts.</FieldDescription>
              </Field>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "disabled-and-required",
      title: "Disabled and required",
      render: () => (
        <InteractiveExample
          caption="Both cascade the same way `invalid` does, so you set them in **one** place rather than on the wrapper for styling and on the control for behaviour. `disabled` reaches the control's `disabled` prop and dims the label with it; `required` reaches the control's `required`. Each also lands on the wrapper as `data-field-disabled` / `data-field-required` for anything your own CSS needs."
          code={(_density, mode) => {
            const p = partNamer(mode, "Field");
            return [
              imports(mode),
              inputImports(mode),
              ``,
              `<${p("Root")} required>`,
              `  <${p("Label")}>Full name</${p("Label")}>`,
              `  <Input />`,
              `</${p("Root")}>`,
              ``,
              `<${p("Root")} disabled>`,
              `  <${p("Label")}>Account id</${p("Label")}>`,
              `  <Input defaultValue="acct_18f3" />`,
              `  <${p("Description")}>Assigned when the account was created.</${p("Description")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div className="docs-example-stack">
              <Field required>
                <FieldLabel>Full name</FieldLabel>
                <Input placeholder="Ada Lovelace" />
              </Field>
              <Field disabled>
                <FieldLabel>Account id</FieldLabel>
                <Input defaultValue="acct_18f3" />
                <FieldDescription>Assigned when the account was created.</FieldDescription>
              </Field>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "any-control",
      title: "Which controls the cascade reaches",
      render: () => (
        <InteractiveExample
          caption="**Three controls read `FieldContext`: `Input`, `Textarea` and `Select`.** Those inherit the id, the `aria-describedby` chain, `aria-invalid`, `disabled` and `required` without being told about the field at all — `Textarea` below is given nothing but `rows`. Everything else is only *inside* the field, not wired to it: `Switch`, `Checkbox` and `Radio` bring their own `<label>`, and `Slider` and `SegmentedControl` need `aria-labelledby` pointing at a label you give an id. For those, `Field.Label`'s `htmlFor` has nothing to attach to — see the note under Accessibility."
          code={(_density, mode) => {
            const p = partNamer(mode, "Field");
            return [
              imports(mode),
              importBlock({ mode, component: "Textarea", componentId: "textarea" }),
              ``,
              `<${p("Root")} required>`,
              `  <${p("Label")}>What went wrong?</${p("Label")}>`,
              `  {/* no id, no aria-*, no required — all inherited */}`,
              `  <Textarea rows={3} />`,
              `  <${p("Description")}>Include the steps you took.</${p("Description")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div className="docs-example-stack">
              <Field required>
                <FieldLabel>What went wrong?</FieldLabel>
                <Textarea rows={3} placeholder="Tell us what happened..." />
                <FieldDescription>Include the steps you took.</FieldDescription>
              </Field>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "fieldset",
      title: "A group of controls (asChild)",
      render: () => (
        <InteractiveExample
          caption="A Field wrapping several radios needs to be a `<fieldset>`, not a `<div>` — that is the native way to say “these options belong together”, and the Label becomes its `<legend>`. `asChild` on both swaps the elements while keeping the context, the ids and the `data-field-*` hooks. This is the group-labelling requirement the `Radio` page describes, done with the components you already have."
          code={(_density, mode) => {
            const p = partNamer(mode, "Field");
            return [
              imports(mode),
              radioImports(mode),
              stackImports(mode),
              ``,
              `<${p("Root")} asChild>`,
              `  <fieldset>`,
              `    <${p("Label")} asChild><legend>Plan</legend></${p("Label")}>`,
              `    <Stack gap="sm">`,
              `      <Radio name="plan" value="free">Free</Radio>`,
              `      <Radio name="plan" value="pro">Pro</Radio>`,
              `    </Stack>`,
              `  </fieldset>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div className="docs-example-stack">
              <Field asChild>
                <fieldset>
                  <FieldLabel asChild>
                    <legend>Plan</legend>
                  </FieldLabel>
                  <Stack gap="sm">
                    <Radio name="plan-field" value="free" defaultChecked>
                      Free
                    </Radio>
                    <Radio name="plan-field" value="pro">
                      Pro
                    </Radio>
                  </Stack>
                </fieldset>
              </Field>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "overrides",
      title: "Overriding the cascade",
      render: () => (
        <InteractiveExample
          caption="A prop you set on the control always beats the one the field cascaded — the field supplies a default, it does not seize control. That is what makes a mixed field possible: a disabled Field with one control that stays editable, or a control with its own `aria-describedby` pointing somewhere else. Outside a Field, every one of these components behaves exactly as it does on its own page."
          code={(_density, mode) => {
            const p = partNamer(mode, "Field");
            return [
              imports(mode),
              inputImports(mode),
              ``,
              `<${p("Root")} disabled>`,
              `  <${p("Label")}>Coupon code</${p("Label")}>`,
              `  {/* the field says disabled; this control says otherwise, and wins */}`,
              `  <Input disabled={false} placeholder="Still editable" />`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div className="docs-example-stack">
              <Field disabled>
                <FieldLabel>Coupon code</FieldLabel>
                <Input disabled={false} placeholder="Still editable" />
              </Field>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "Field exists to make the wiring **impossible to get wrong**, not to add semantics of its own. The label points at the control, the description and error are linked by `aria-describedby`, and the ids are generated — so the failure mode where a label is visually beside a control but not associated with it cannot happen.",
    "The `aria-describedby` chain is composed in a deliberate order: any ids you pass yourself come first, then the field's description, then the error when invalid. Your own value is added to, never replaced.",
    "`ErrorText` renders only when the field is `invalid`. That is the accessible behaviour — an error permanently in the DOM and hidden with CSS can still be announced, and one merely dimmed is announced as though it applied.",
    "Colour is not the error. The invalid state paints a ring and reddens the message, but the `ErrorText` has to *say* what is wrong — and it must be linked, which is what `aria-describedby` is doing, so it is read as part of the control rather than as loose text nearby.",
    "For a group of controls — radios, related checkboxes — use `asChild` to render a real `<fieldset>` with the label as its `<legend>`. A `<div>` with text above it does not tell assistive technology that the options belong together.",
    "`disabled` on the field cascades the **native** attribute to the control, so it leaves the tab order. If the field needs to stay discoverable while unavailable, keep it enabled and explain the constraint in the description rather than disabling the group.",
    "Field owns no keyboard behaviour. Whatever you put inside keeps its own — which is the point: the wrapper never intercepts focus or keys.",
    "**`Field.Label` always renders `htmlFor`, even when nothing can claim it.** Only `Input`, `Textarea` and `Select` adopt the field's id, so with any other control the label points at an element that does not exist — a dangling reference, and the label associates with nothing. Until that is fixed at source, give a non-context-aware control its name directly: `aria-labelledby` pointing at the label for `Slider` and `SegmentedControl`, a real `<fieldset>` / `<legend>` for a group of radios, or nothing at all for `Switch` and `Checkbox`, which render their own `<label>` around the text you pass them.",
  ],
};
