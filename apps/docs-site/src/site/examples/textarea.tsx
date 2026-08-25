"use client";

import { Field, FieldDescription, FieldErrorText, FieldLabel } from "@/components/field";
import { Textarea } from "@/components/textarea";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const imports = (mode: Mode) => importBlock({ mode, component: "Textarea", componentId: "textarea" });

/** Field's parts are FLAT in the copied file (`FieldLabel`), dotted in headless. */
const fieldPart = (mode: Mode) => partNamer(mode, "Field");

const fieldImports = (mode: Mode) =>
  importBlock({
    mode,
    component: "Field",
    componentId: "field",
    parts: ["Label", "Description", "ErrorText"],
  });

/**
 * Textarea's page content.
 *
 * One part, one contract prop, and the same shape in both modes — so unlike
 * Switch and Checkbox this needs no hand-written snippet and no Anatomy: the
 * generated `toJsx` is correct, because `size` really is this component's own
 * prop and there is no second part to place.
 *
 * That leaves the examples to carry everything the props table cannot: the
 * labelling requirement (a `<textarea>` has no implicit accessible name), the
 * two sizing axes that are NOT the `size` prop (`rows` and the user's own drag),
 * and `asChild` — which exists here for one concrete reason, wrapping a
 * third-party autosizing textarea.
 *
 * No Keyboard section: every key is the platform's, which is `ComponentSpec`'s
 * own test for omitting it.
 */
export const textareaSpec: ComponentSpec = {
  playground: {
    component: "Textarea",
    snippet: (values, mode) =>
      [
        imports(mode),
        ``,
        `<Textarea${contractAttr({ mode, prop: "size", value: values.size })} rows={4} placeholder="Tell us what happened..." />`,
      ].join("\n"),
    render: (values) => (
      /* `aria-label`, not a bare field: a <textarea> has no implicit accessible
         name, so an unlabelled one here would model the exact mistake the
         Accessibility section warns about. */
      <Textarea
        size={values.size as Size}
        rows={4}
        placeholder="Tell us what happened..."
        aria-label="Description"
      />
    ),
  },

  examples: [
    {
      id: "labelling",
      title: "Labelling",
      render: () => (
        <InteractiveExample
          caption="A `<textarea>` has no implicit accessible name, so every one needs a label — a `<label htmlFor>`, an `aria-label`, or `aria-labelledby`. `Field` does the wiring: it generates the id, points the label at it, and links the description through `aria-describedby`, so the three stay in step when the field is replaced."
          code={(_density, mode) =>
            [
              fieldImports(mode),
              imports(mode),
              ``,
              `<Field>`,
              `  <${fieldPart(mode)("Label")}>What went wrong?</${fieldPart(mode)("Label")}>`,
              `  <Textarea rows={4} placeholder="Tell us what happened..." />`,
              `  <${fieldPart(mode)("Description")}>Include the steps you took, if you can.</${fieldPart(mode)("Description")}>`,
              `</Field>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Field>
                <FieldLabel>What went wrong?</FieldLabel>
                <Textarea rows={4} placeholder="Tell us what happened..." />
                <FieldDescription>Include the steps you took, if you can.</FieldDescription>
              </Field>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "height",
      title: "Height, and who controls it",
      render: () => (
        <InteractiveExample
          caption="Three different things set the height, and only one of them is a Primitiv prop. `rows` is the native attribute and sets the **initial** height. `size` (the contract prop, in the playground above) sets the type scale and a `min-height` floor the field will not shrink below. And the user sets the rest — the styled surface allows **vertical resizing only**, because the width already fills the form column, so a free-axis handle would just let someone drag the field out of its own layout. Drag the bottom edge of either field below."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<Textarea rows={2} aria-label="Short note" placeholder="Two rows..." />`,
              `<Textarea rows={6} aria-label="Long note" placeholder="Six rows..." />`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Textarea rows={2} aria-label="Short note" placeholder="Two rows..." />
              <Textarea rows={6} aria-label="Long note" placeholder="Six rows..." />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "validation",
      title: "Validation",
      render: () => (
        <InteractiveExample
          caption="Native constraints work exactly as the browser intends — `required`, `maxLength`, `minLength` — because the component does not interfere with them; the browser sets `:invalid` itself and blocks submission. `aria-invalid` is the separate, deliberate hook for an error your *server* or validation library found, and it is what the stylesheet keys the invalid ring off. Inside a `Field`, `invalid` sets it for you and links the error text through `aria-describedby`."
          code={(_density, mode) =>
            [
              fieldImports(mode),
              imports(mode),
              ``,
              `<Field invalid>`,
              `  <${fieldPart(mode)("Label")}>Summary</${fieldPart(mode)("Label")}>`,
              `  <Textarea rows={3} required maxLength={280} defaultValue="Too short" />`,
              `  <${fieldPart(mode)("ErrorText")}>Give us at least a sentence.</${fieldPart(mode)("ErrorText")}>`,
              `</Field>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Field invalid>
                <FieldLabel>Summary</FieldLabel>
                <Textarea rows={3} required maxLength={280} defaultValue="Too short" />
                <FieldErrorText>Give us at least a sentence.</FieldErrorText>
              </Field>
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
          caption="`disabled` forwards the native attribute — blocking input and removing the field from the tab order — **and** sets `data-disabled` so CSS can style it without depending on the `:disabled` pseudo-class. Inside a `Field`, setting it on the field disables the control and dims the label with it, so you set it in one place."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `<Textarea rows={3} disabled aria-label="Notes" defaultValue="Read-only for now." />`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Textarea rows={3} disabled aria-label="Notes" defaultValue="Read-only for now." />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "as-child",
      title: "As another element (asChild)",
      render: () => (
        <InteractiveExample
          caption="`asChild` renders your element instead of the native `<textarea>`, merging every prop onto it — `aria-*`, `data-*`, handlers (yours runs first) and the ref. It exists here for one concrete case the component deliberately does not solve itself: **autosizing**. Reach for a library that grows the field as you type and keep this prop contract, rather than asking Primitiv to own a measurement loop."
          code={(_density, mode) =>
            [
              `import AutosizeTextarea from "react-textarea-autosize";`,
              imports(mode),
              ``,
              `<Textarea asChild aria-label="Bio">`,
              `  <AutosizeTextarea minRows={2} maxRows={8} />`,
              `</Textarea>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              {/* No autosize dependency on the docs site, so the demo shows the
                  MERGE itself — the styled classes and every prop landing on a
                  plain <textarea> supplied as the child. */}
              <Textarea asChild aria-label="Bio">
                <textarea rows={3} placeholder="Your own element, styled as a Textarea." />
              </Textarea>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "A `<textarea>` has **no implicit accessible name**. Give it one every time — a `<label htmlFor>`, `aria-label`, or `aria-labelledby`. `Field` is the path of least resistance because it generates the id and the wiring, so the two cannot drift apart.",
    "Placeholder text is not a label. It disappears the moment someone types, it is announced inconsistently, and it usually fails contrast — use it for an example of the *format*, never for the field's name.",
    "`disabled` removes the field from the tab order entirely, so a screen-reader user browsing by control will not find it. If the reason it is unavailable matters, say so in visible text near the field rather than relying on the disabled state to communicate it.",
    "`aria-invalid` is for errors the browser cannot know about — a server rejection, a validation library. Native constraints (`required`, `maxLength`) already set `:invalid` themselves, and doubling them up makes the field announce as invalid before anyone has typed.",
    "A character limit needs to be announced, not just enforced. `maxLength` silently stops input at the cap; pair it with description text (through `Field`, so it is linked by `aria-describedby`) that states the limit up front.",
    "The field resizes on the block axis only. That is a deliberate constraint rather than a missing feature — the width tracks the form column, so a free-axis handle would let someone drag the field out of the layout — but it does mean a user cannot widen it, so avoid content that genuinely needs a wide measure.",
    "Under `asChild` the element and its semantics are yours; nothing about the component overrides them. That is what makes it safe to wrap an autosizing textarea — it is still a real `<textarea>` underneath.",
  ],
};
