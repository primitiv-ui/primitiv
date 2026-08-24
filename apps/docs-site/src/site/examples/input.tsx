"use client";

import { Field, FieldDescription, FieldLabel } from "@/components/field";
import { Input } from "@/components/input";
import { Stack } from "@/components/stack";
import { contractAttr, importBlock } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Input", componentId: "input" });

/** Field's own import line — a separate component, so a separate specifier. */
const fieldImports = (mode: Mode) =>
  importBlock({
    mode,
    component: "Field",
    componentId: "field",
    parts: ["Label", "Description"],
  });

/**
 * Input's page content.
 *
 * A single part with one contract prop, so the examples carry the weight — and
 * they deliberately cover what the PLAYGROUND cannot: `size` already has a
 * control there, so each example below is about something the native element
 * does (labelling, constraint validation, `disabled`) or about the one escape
 * hatch the primitive adds (`asChild`).
 *
 * No Anatomy or Keyboard section: one part has no tree worth drawing, and the
 * keys are the platform's — a text input needs no keymap documented, which is
 * `ComponentSpec`'s own test for when to omit them.
 */
export const inputSpec: ComponentSpec = {
  playground: {
    component: "Input",
    snippetPrefix: (mode) => imports(mode),
    snippet: (values, mode) =>
      [
        imports(mode),
        ``,
        `<Input${contractAttr({ mode, prop: "size", value: values.size })} type="email" placeholder="you@example.com" />`,
      ].join("\n"),
    render: (values) => (
      /* aria-label rather than a bare input: an <input> has no implicit
         accessible name, and shipping an unlabelled one in the playground would
         model the exact mistake the Accessibility section warns about. */
      <Input
        size={values.size as Size}
        type="email"
        placeholder="you@example.com"
        aria-label="Email address"
      />
    ),
  },

  examples: [
    {
      id: "labelling",
      title: "Labelling",
      render: () => (
        <InteractiveExample
          caption="An `<input>` has no implicit accessible name, so every one needs a label — a `<label htmlFor>`, an `aria-label`, or `aria-labelledby`. `Field` does the wiring for you: it generates the id, points the label at it, and links a description through `aria-describedby`, so the three stay in step when the input is replaced."
          code={(_density, mode) =>
            [
              fieldImports(mode),
              imports(mode),
              ``,
              `<Field>`,
              `  <Field.Label>Email address</Field.Label>`,
              `  <Input type="email" placeholder="you@example.com" />`,
              `  <Field.Description>We only use this to send receipts.</Field.Description>`,
              `</Field>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Field>
                <FieldLabel>Email address</FieldLabel>
                <Input type="email" placeholder="you@example.com" />
                <FieldDescription>
                  We only use this to send receipts.
                </FieldDescription>
              </Field>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "validation",
      title: "Native validation",
      render: () => (
        <InteractiveExample
          caption="Every HTML constraint attribute works as the browser intends — `required`, `type`, `pattern`, `minLength` — because the component does not interfere with them. The browser sets `:invalid` itself and blocks submission. `aria-invalid` is the separate, deliberate hook for showing a *server* or library error, and it is what the stylesheet keys the invalid ring off."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `// The browser validates this one on submit.`,
              `<Input type="email" required placeholder="you@example.com" />`,
              ``,
              `// This one is being told it is wrong by your own code.`,
              `<Input type="email" aria-invalid defaultValue="not-an-email" />`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Input
                type="email"
                required
                placeholder="you@example.com"
                aria-label="Email, required"
              />
              <Input
                type="email"
                aria-invalid
                defaultValue="not-an-email"
                aria-label="Email, showing an error"
              />
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
          caption="`disabled` sets the native attribute and exposes `data-disabled`, so the styling hook and the real behaviour can never disagree — a disabled input is skipped by the tab order and omitted from form submission because the platform says so, not because CSS made it look that way."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<Input disabled defaultValue="Read only for now" />`,
            ].join("\n")
          }
        >
          {() => (
            <Input
              disabled
              defaultValue="Read only for now"
              aria-label="Disabled example"
            />
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "as-child",
      title: "As another element (asChild)",
      render: () => (
        <InteractiveExample
          caption="`asChild` renders your element instead of the native `<input>`, merging every prop, `data-*`, handler and the `ref` onto it — for a masked-input or autocomplete library that insists on owning the element. One asymmetry worth knowing: `type` is **not** forwarded in this mode, because the child owns its own type semantics."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<Input asChild>`,
              `  <input type="search" placeholder="Search…" />`,
              `</Input>`,
            ].join("\n")
          }
        >
          {() => (
            <Input asChild>
              <input
                type="search"
                placeholder="Search..."
                aria-label="Search, rendered through asChild"
              />
            </Input>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "An `<input>` has **no implicit accessible name**. Give it a `<label htmlFor>`, an `aria-label`, or an `aria-labelledby` — or let `Field` wire the label, the id and the description for you. A placeholder is not a label: it disappears on the first keystroke and is not reliably announced.",
    "Constraint validation is the platform's. `required`, `type`, `pattern` and friends work untouched, and the browser owns `:invalid`, the submit block and the native message.",
    "`aria-invalid` is for an error your own code knows about — a server response, a form library — and is what the invalid ring keys off. It is deliberately separate from `:invalid`, so a field is not painted red the moment it is focused and still empty.",
    "`disabled` exposes both the native attribute and `data-disabled`, so the hook and the behaviour cannot drift: the platform removes it from the tab order and from form submission.",
    "Under `asChild` every attribute, handler and the `ref` transfer to your element, so it keeps the input's wiring — but `type` is not forwarded, since the element you supply owns its own type semantics.",
  ],
};
