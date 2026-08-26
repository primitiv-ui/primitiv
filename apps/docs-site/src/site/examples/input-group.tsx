"use client";

import { useState } from "react";

import { Close, Search } from "@primitiv-ui/icons";

import { Button } from "@/components/button";
import { Field, FieldDescription, FieldErrorText, FieldLabel } from "@/components/field";
import { Input } from "@/components/input";
import {
  InputGroup,
  InputGroupLeadingAdornment,
  InputGroupTrailingAdornment,
} from "@/components/input-group";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: readonly Size[] = ["xs", "sm", "md", "lg", "xl"];

/*
 * The demo fields start with a value.
 *
 * Clear only renders when there is something to clear — the right behaviour, and
 * the reason the field is seeded: an empty demo showed no trailing adornment,
 * so the example meant to contrast a decorative glyph with an interactive
 * control displayed only the glyph. Every snippet prints this same seed, so the
 * code still describes exactly what sits beside it. Press Clear and the field
 * empties and the button goes — which demonstrates the conditional too.
 */
const SEED = "design tokens";

const imports = (mode: Mode) =>
  importBlock({
    mode,
    component: "InputGroup",
    componentId: "input-group",
    parts: ["LeadingAdornment", "TrailingAdornment"],
  });

const inputImports = (mode: Mode) => importBlock({ mode, component: "Input", componentId: "input" });
const buttonImports = (mode: Mode) => importBlock({ mode, component: "Button", componentId: "button" });
const fieldImports = (mode: Mode) =>
  importBlock({
    mode,
    component: "Field",
    componentId: "field",
    parts: ["Label", "Description", "ErrorText"],
  });

/** Glyphs come from `@primitiv-ui/icons` in every mode — not part of the switch. */
const iconImports = (icons: readonly string[]) => `import { ${icons.join(", ")} } from "@primitiv-ui/icons";`;

/**
 * The search-field composition, per mode — with the state that makes Clear do
 * something. Both surfaces have the same shape, so this only varies the naming.
 *
 * The Clear button is only rendered once there is something to clear, which is
 * also what keeps it from being a permanently-present control that does nothing.
 */
const searchLines = (mode: Mode, { attrs = "" }: { attrs?: string } = {}) => {
  const p = partNamer(mode, "InputGroup");
  return [
    // Seeded, not empty — and the demo beside this is seeded identically. A
    // conditional Clear on an empty field renders nothing, which left the
    // page's headline example showing no interactive adornment at all.
    `const [query, setQuery] = useState("${SEED}");`,
    ``,
    `<${p("Root")}${attrs}>`,
    `  <${p("LeadingAdornment")}>`,
    `    <Search aria-hidden="true" />`,
    `  </${p("LeadingAdornment")}>`,
    `  <Input`,
    `    aria-label="Search"`,
    `    type="search"`,
    `    placeholder="Search..."`,
    `    value={query}`,
    `    onChange={(e) => setQuery(e.target.value)}`,
    `  />`,
    `  {query && (`,
    `    <${p("TrailingAdornment")} asChild>`,
    `      <Button variant="ghost" size="xs" aria-label="Clear" onClick={() => setQuery("")}>`,
    `        <Close aria-hidden="true" />`,
    `      </Button>`,
    `    </${p("TrailingAdornment")}>`,
    `  )}`,
    `</${p("Root")}>`,
  ];
};

/**
 * The reference composition, reused across examples — a real search field.
 *
 * Clear genuinely clears, because a control that does nothing teaches the wrong
 * thing about which slot to put a control in. It also only appears when there is
 * a value, which is the conventional behaviour and means the trailing slot is
 * empty (and the frame unchanged) on an empty field.
 */
const SearchField = ({ size }: { size?: Size }) => {
  const [query, setQuery] = useState(SEED);

  return (
    <InputGroup size={size}>
      <InputGroupLeadingAdornment>
        <Search aria-hidden="true" />
      </InputGroupLeadingAdornment>
      <Input
        aria-label="Search"
        type="search"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query && (
        <InputGroupTrailingAdornment asChild>
          <Button variant="ghost" size="xs" aria-label="Clear" onClick={() => setQuery("")}>
            <Close aria-hidden="true" />
          </Button>
        </InputGroupTrailingAdornment>
      )}
    </InputGroup>
  );
};

/**
 * The same field inside a `Field`, with a visible label.
 *
 * Worth its own example because the composition genuinely works, which is not
 * true of `Field` + every control (see the Field page): the thing that reads
 * `FieldContext` here is the ordinary `Input` in the middle, so it takes the
 * field's generated id and `Field.Label`'s `htmlFor` finds it — two levels down,
 * through a wrapper that knows nothing about fields.
 */
const LabelledSearchField = () => {
  const [query, setQuery] = useState(SEED);

  return (
    <Field>
      <FieldLabel>Search the docs</FieldLabel>
      <InputGroup>
        <InputGroupLeadingAdornment>
          <Search aria-hidden="true" />
        </InputGroupLeadingAdornment>
        {/* No `aria-label` and no `id`: the Field supplies both. */}
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && (
          <InputGroupTrailingAdornment asChild>
            <Button variant="ghost" size="xs" aria-label="Clear" onClick={() => setQuery("")}>
              <Close aria-hidden="true" />
            </Button>
          </InputGroupTrailingAdornment>
        )}
      </InputGroup>
      <FieldDescription>Components, tokens and guides.</FieldDescription>
    </Field>
  );
};

/**
 * InputGroup's page content.
 *
 * The thing to understand is that **the group takes over the frame**. The border,
 * background, radius and focus ring move to the wrapper, and it overrides the
 * inner Input's own `--primitiv-input-*` knobs so the control renders flat inside
 * it — which is why an Input in a group does not look like two nested boxes. The
 * focus ring is read off the real control with `:focus-within` / `:has()`, so
 * focus still belongs to the input and no JS coordinates it.
 *
 * The other half is that the two adornment slots share one props type and differ
 * only in side — so what actually decides how you write one is whether its
 * content is **decorative or interactive**, which no prop can tell you. That is
 * the distinction the examples are built around.
 *
 * The composition is the kitchen-sink's, which had the best worked example of
 * this component: leading glyph, trailing control.
 */
export const inputGroupSpec: ComponentSpec = {
  playground: {
    component: "InputGroup",
    fill: true,
    snippet: (values, mode) =>
      [
        `import { useState } from "react";`,
        iconImports(["Close", "Search"]),
        imports(mode),
        inputImports(mode),
        buttonImports(mode),
        ``,
        ...searchLines(mode, { attrs: contractAttr({ mode, prop: "size", value: values.size }) }),
      ].join("\n"),
    render: (values) => <SearchField size={values.size as Size} />,
  },

  anatomyMeta:
    "The Root is the frame; the two adornment slots sit either side of whatever control you put between them. Both slots share **one** props type — they differ only in which side they occupy, so there is genuinely no prop that tells them apart, and the props tables below print the same list twice. The control in the middle is an ordinary `Input`: the group does not wrap or replace it, it just re-points its border and background so it renders flat inside the shared frame.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => searchLines(mode).join("\n"),
    },
  ],

  examples: [
    {
      id: "decorative-vs-interactive",
      title: "Decorative or interactive?",
      render: () => (
        <InteractiveExample
          caption="This is the decision the API cannot make for you, and both adornments below get it right in opposite ways. The leading `Search` glyph is **decorative** — it repeats what the placeholder already says, so it is `aria-hidden` and reaches no one twice. The trailing Clear is **interactive**: it does something, so it is a real `Button` (via `asChild`, which merges the slot's positioning onto it), it is focusable, and it carries its own `aria-label` because an icon-only control has no text to be named by. Get this backwards and you either hide a control from assistive technology or announce a picture."
          code={(_density, mode) =>
            [
              `import { useState } from "react";`,
              iconImports(["Close", "Search"]),
              imports(mode),
              inputImports(mode),
              buttonImports(mode),
              ``,
              ...searchLines(mode),
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <SearchField />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "the-frame",
      title: "The group owns the frame",
      render: () => (
        <InteractiveExample
          caption="Compare the two. A bare `Input` draws its own border, background and focus ring; inside a group all three move to the **wrapper**, because the group re-points the Input's `--primitiv-input-*` custom properties. Worth knowing exactly how: the inner border is not removed, it is made **transparent** — still 1px, so the box it occupies does not change and nothing shifts when a control moves into a group. Focus the second one: the ring appears on the whole frame, read off the real control with `:focus-within`, so focus still belongs to the input and nothing coordinates it in JavaScript."
          code={(_density, mode) =>
            [
              iconImports(["Search"]),
              imports(mode),
              inputImports(mode),
              ``,
              `// its own frame`,
              `<Input aria-label="Bare" placeholder="A bare Input" />`,
              ``,
              `// the group's frame; the Input renders flat inside it`,
              `<${partNamer(mode, "InputGroup")("Root")}>`,
              `  <${partNamer(mode, "InputGroup")("LeadingAdornment")}>`,
              `    <Search aria-hidden="true" />`,
              `  </${partNamer(mode, "InputGroup")("LeadingAdornment")}>`,
              `  <Input aria-label="Grouped" placeholder="In a group" />`,
              `</${partNamer(mode, "InputGroup")("Root")}>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Input aria-label="Bare" placeholder="A bare Input" />
              <InputGroup>
                <InputGroupLeadingAdornment>
                  <Search aria-hidden="true" />
                </InputGroupLeadingAdornment>
                <Input aria-label="Grouped" placeholder="In a group" />
              </InputGroup>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "text-adornments",
      title: "Text adornments",
      render: () => (
        <InteractiveExample
          caption="An adornment does not have to be an icon. A currency symbol or a unit suffix is the other common case, and it is decorative in the same sense — it describes the *format* of the field, so it belongs in the label or a description as well, not only as a glyph beside the box. Here `aria-label` carries the currency so the field is not announced as a bare number."
          code={(_density, mode) => {
            const p = partNamer(mode, "InputGroup");
            return [
              imports(mode),
              inputImports(mode),
              ``,
              `<${p("Root")}>`,
              `  <${p("LeadingAdornment")}>£</${p("LeadingAdornment")}>`,
              `  <Input aria-label="Budget in pounds" type="number" placeholder="0.00" />`,
              `  <${p("TrailingAdornment")}>per month</${p("TrailingAdornment")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div className="docs-example-stack">
              <InputGroup>
                <InputGroupLeadingAdornment>£</InputGroupLeadingAdornment>
                <Input aria-label="Budget in pounds" type="number" placeholder="0.00" />
                <InputGroupTrailingAdornment>per month</InputGroupTrailingAdornment>
              </InputGroup>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "in-a-field",
      title: "With a visible label (Field)",
      render: () => (
        <InteractiveExample
          caption="This composition **works**, and it is worth saying why, because the equivalent does not for every control. `Field` cascades its generated id to whatever reads `FieldContext` — and the control inside a group is an ordinary `Input`, which does. So `Field.Label`'s `htmlFor` lands on the real input even though it is nested two levels down, and clicking the label focuses the field. The group itself reads no context and needs none; it is only the frame."
          code={(_density, mode) => {
            const f = partNamer(mode, "Field");
            const p = partNamer(mode, "InputGroup");
            return [
              `import { useState } from "react";`,
              iconImports(["Close", "Search"]),
              fieldImports(mode),
              imports(mode),
              inputImports(mode),
              buttonImports(mode),
              ``,
              `const [query, setQuery] = useState("${SEED}");`,
              ``,
              `<${f("Root")}>`,
              `  <${f("Label")}>Search the docs</${f("Label")}>`,
              `  <${p("Root")}>`,
              `    <${p("LeadingAdornment")}>`,
              `      <Search aria-hidden="true" />`,
              `    </${p("LeadingAdornment")}>`,
              `    {/* no id needed — Input reads FieldContext and takes the field's */}`,
              `    <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />`,
              `    {query && (`,
              `      <${p("TrailingAdornment")} asChild>`,
              `        <Button variant="ghost" size="xs" aria-label="Clear" onClick={() => setQuery("")}>`,
              `          <Close aria-hidden="true" />`,
              `        </Button>`,
              `      </${p("TrailingAdornment")}>`,
              `    )}`,
              `  </${p("Root")}>`,
              `  <${f("Description")}>Components, tokens and guides.</${f("Description")}>`,
              `</${f("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <LabelledSearchField />}
        </InteractiveExample>
      ),
    },
    {
      id: "states",
      title: "Invalid and disabled",
      render: () => (
        <InteractiveExample
          caption="**The frame carries the state, and no prop on the group says so.** Its stylesheet reads the wrapped control directly — `:has(input[aria-invalid=&quot;true&quot;])` reddens the border, `:has(input:disabled)` dims the whole frame — which is the same trick `:focus-within` uses for the ring. So a `Field` cascading `invalid` or `disabled` reaches the *input*, and the frame follows on its own: three components agreeing with no prop threaded between them. Note where the colour lands — on the frame, not as a second red box around the inner control."
          code={(_density, mode) => {
            const f = partNamer(mode, "Field");
            const p = partNamer(mode, "InputGroup");
            return [
              iconImports(["Search"]),
              fieldImports(mode),
              imports(mode),
              inputImports(mode),
              ``,
              `// the Field sets it on the Input; the frame reads it off the Input`,
              `<${f("Root")} invalid>`,
              `  <${f("Label")}>Search the docs</${f("Label")}>`,
              `  <${p("Root")}>`,
              `    <${p("LeadingAdornment")}><Search aria-hidden="true" /></${p("LeadingAdornment")}>`,
              `    <Input type="search" defaultValue="???" />`,
              `  </${p("Root")}>`,
              `  <${f("ErrorText")}>No results for that query.</${f("ErrorText")}>`,
              `</${f("Root")}>`,
              ``,
              `<${f("Root")} disabled>`,
              `  <${f("Label")}>Search (unavailable)</${f("Label")}>`,
              `  <${p("Root")}>`,
              `    <${p("LeadingAdornment")}><Search aria-hidden="true" /></${p("LeadingAdornment")}>`,
              `    <Input type="search" />`,
              `  </${p("Root")}>`,
              `</${f("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div className="docs-example-stack">
              <Field invalid>
                <FieldLabel>Search the docs</FieldLabel>
                <InputGroup>
                  <InputGroupLeadingAdornment>
                    <Search aria-hidden="true" />
                  </InputGroupLeadingAdornment>
                  <Input type="search" defaultValue="???" />
                </InputGroup>
                <FieldErrorText>No results for that query.</FieldErrorText>
              </Field>
              <Field disabled>
                <FieldLabel>Search (unavailable)</FieldLabel>
                <InputGroup>
                  <InputGroupLeadingAdornment>
                    <Search aria-hidden="true" />
                  </InputGroupLeadingAdornment>
                  <Input type="search" placeholder="Search..." />
                </InputGroup>
              </Field>
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
          caption="`size` on the group sets the frame and the adornments together, and the nearest `data-density` ancestor rescales the whole ramp again. Note the Clear button is `size=&quot;xs&quot;` at every group size: an adornment control should sit *inside* the frame's height rather than setting it, so it is sized against the slot, not against the group."
          code={(density, mode) =>
            [
              iconImports(["Close", "Search"]),
              imports(mode),
              inputImports(mode),
              buttonImports(mode),
              ``,
              `<div data-density="${density}">`,
              ...SIZES.flatMap((s) => [
                `  <${partNamer(mode, "InputGroup")("Root")}${contractAttr({ mode, prop: "size", value: s })}>`,
                `    ...`,
                `  </${partNamer(mode, "InputGroup")("Root")}>`,
              ]),
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              {SIZES.map((size) => (
                <SearchField key={size} size={size} />
              ))}
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "**The control inside still needs its own label.** The group is a `<div>` — it adds no name and no role, so an `aria-label` on it does nothing for the input. Label the `Input` (or wrap the pair in a `Field`, which is what associates a visible label with it).",
    "A decorative adornment must be `aria-hidden=\"true\"`. A search glyph beside a field labelled \"Search\" is announced twice otherwise, and the second announcement carries no information.",
    "An interactive adornment needs a name of its own. `asChild` onto a `Button` keeps it a real, focusable control in the tab order — and because it is icon-only, `aria-label` is the only thing that names it. Never put a click handler on a bare adornment `<span>`: it would be unreachable by keyboard.",
    "Mind the tab order. A trailing control comes **after** the input in the DOM, which is what a keyboard user expects — type, then Tab to Clear. Putting an interactive control in the *leading* slot puts it before the field, so reach for that only when the action genuinely precedes typing.",
    "The focus ring is drawn on the frame but focus is on the input, via `:focus-within`. That is deliberate: the visible ring matches the frame the user sees while the real focus target stays the control, so screen-reader focus and visible focus never disagree.",
    "A unit or currency adornment describes the expected format, so it belongs in the accessible name or a `Field` description too — a glyph outside the input is not read as part of it.",
    "**`type=\"search\"` grows its own clear button**, and it used to collide with this one: WebKit and Blink draw `::-webkit-search-cancel-button` as soon as the field has a value, so a group with its own Clear rendered **two** X's the moment you typed. Nothing in the DOM shows it — it is a UA pseudo-element, so it survives any review that reads markup. The stylesheet now suppresses it, but only when the group actually supplies a trailing adornment: stripping the native control from a search field that offers no replacement would be worse than the duplicate.",
  ],
};
