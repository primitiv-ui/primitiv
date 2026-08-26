"use client";

import { useState } from "react";

import { CheckboxCard } from "@/components/checkbox-card";
import { Stack } from "@/components/stack";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: readonly Size[] = ["xs", "sm", "md", "lg", "xl"];

const FEATURES = [
  { value: "analytics", title: "Analytics", description: "Page views, referrers and conversion funnels." },
  { value: "alerts", title: "Alerts", description: "Email or Slack when a threshold is crossed." },
  { value: "exports", title: "Exports", description: "Scheduled CSV delivery to your warehouse." },
];

const imports = (mode: Mode) => importBlock({ mode, component: "CheckboxCard", componentId: "checkbox-card" });
const stackImports = (mode: Mode) => importBlock({ mode, component: "Stack", componentId: "stack" });

/**
 * One card, in the shape of the current mode.
 *
 * The two surfaces differ more here than on any other choice control, and it is
 * not just naming: `title` / `description` / `showDescription` are the copied
 * file's OWN props — the headless primitive has never heard of them. Under
 * Headless the card's content is `children` you write yourself, and the
 * indicator is a part you have to place. So this cannot be a `partNamer`
 * rename; the two branches emit genuinely different trees.
 */
const cardLines = (
  mode: Mode,
  { title, description }: { title: string; description?: string },
  { attrs = "", indent = "" }: { attrs?: string; indent?: string } = {},
) => {
  const p = partNamer(mode, "CheckboxCard");
  if (mode === "headless") {
    return [
      `${indent}<${p("Root")}${attrs}>`,
      `${indent}  <${p("Indicator")} forceMount />`,
      `${indent}  <span>${title}</span>`,
      ...(description ? [`${indent}  <span>${description}</span>`] : []),
      `${indent}</${p("Root")}>`,
    ];
  }
  const desc = description ? ` description="${description}"` : "";
  return [`${indent}<CheckboxCard${attrs} title="${title}"${desc} />`];
};

/** The controlled example's live half. */
const ControlledExample = () => {
  const [on, setOn] = useState<readonly string[]>(["analytics"]);
  const toggle = (value: string) =>
    setOn((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  return (
    <Stack gap="sm">
      {FEATURES.map((f) => (
        <CheckboxCard
          key={f.value}
          title={f.title}
          description={f.description}
          checked={on.includes(f.value)}
          onCheckedChange={() => toggle(f.value)}
        />
      ))}
      <p className="docs-example-caption">
        Enabled: <code>{on.length ? [...on].sort().join(", ") : "none"}</code>
      </p>
    </Stack>
  );
};

/**
 * The tri-state example's live half — the "select all" pattern the primitive's
 * JSDoc names but deliberately does not implement.
 *
 * The parent is the only card here whose state is genuinely derived: it is
 * `"indeterminate"` exactly when SOME but not all children are on, which is the
 * one state a boolean cannot express.
 */
const SelectAllExample = () => {
  const [on, setOn] = useState<readonly string[]>(["analytics"]);
  const all = on.length === FEATURES.length;
  const none = on.length === 0;

  return (
    <Stack gap="sm">
      <CheckboxCard
        title="All features"
        description={`${on.length} of ${FEATURES.length} selected`}
        checked={all ? true : none ? false : "indeterminate"}
        onCheckedChange={(next) => setOn(next ? FEATURES.map((f) => f.value) : [])}
      />
      <div className="docs-example-indent">
        <Stack gap="sm">
          {FEATURES.map((f) => (
            <CheckboxCard
              key={f.value}
              size="sm"
              title={f.title}
              checked={on.includes(f.value)}
              onCheckedChange={(next) =>
                setOn((prev) => (next ? [...prev, f.value] : prev.filter((v) => v !== f.value)))
              }
            />
          ))}
        </Stack>
      </div>
    </Stack>
  );
};

/**
 * CheckboxCard's page content.
 *
 * The headline is the one a props table structurally cannot tell you: this is a
 * `<button role="checkbox">`, NOT a label wrapping an input, so **it does not
 * submit with a form** and it has no `name`. That is the whole basis for
 * choosing between `Checkbox` and `CheckboxCard`, it is invisible from the
 * props, and neither README mentions it — so it leads the page.
 *
 * The second thing the page has to carry is that the two surfaces are not the
 * same component wearing different classes: `title`/`description` exist only on
 * the copied file. A reader who reads the props table under the Styled tab and
 * then switches to Headless finds three of its props gone.
 */
export const checkboxCardSpec: ComponentSpec = {
  playground: {
    component: "CheckboxCard",
    controls: [
      {
        name: "showDescription",
        options: ["true", "false"],
        defaultValue: "true",
        description:
          "Hide the supporting text without unmounting the title — the description is a skippable subcomponent, not a change to the card's anatomy.",
      },
    ],
    /* Hand-written because `showDescription` is a spec control (so the generated
       `toJsx` would drop it under Headless) and because the Headless branch has
       a different tree, not a different name — see `cardLines`. */
    snippet: (values, mode) =>
      [
        imports(mode),
        ``,
        ...cardLines(
          mode,
          {
            title: "Analytics",
            ...(values.showDescription === "true"
              ? { description: "Page views, referrers and conversion funnels." }
              : {}),
          },
          {
            attrs: `${contractAttr({ mode, prop: "size", value: values.size })} defaultChecked${
              mode === "headless" ? "" : ` showDescription={${values.showDescription}}`
            }`,
          },
        ),
      ].join("\n"),
    /* The wrapper is not decoration: the card is a `<button>`, so it
       shrink-to-fits, and toggling `showDescription` visibly resized the
       preview. `.docs-example-stack` is a full-width flex column, so the card
       stretches to a stable width instead. Every example below gets this for
       free from its `Stack`. */
    render: (values) => (
      <div className="docs-example-stack">
        <CheckboxCard
          size={values.size as Size}
          title="Analytics"
          description="Page views, referrers and conversion funnels."
          showDescription={values.showDescription === "true"}
          defaultChecked
        />
      </div>
    ),
  },

  anatomyMeta:
    "The widest gap between the two surfaces of any choice control, and it is a real API difference rather than a rename. `@primitiv-ui/react` gives you `Root` and `Indicator` and leaves the content to `children`; the copied file exports a single `CheckboxCard` that takes `title` and `description` as **props** and renders the indicator, the title and the description spans itself. Those three props exist nowhere in `@primitiv-ui/react` — so switching this page to Headless removes them from the props table, correctly.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => cardLines(mode, { title: "Analytics", description: "Page views and referrers." }).join("\n"),
    },
  ],

  examples: [
    {
      id: "not-a-form-control",
      title: "It is a button, not an input (the headline)",
      render: () => (
        <InteractiveExample
          caption="`CheckboxCard` renders a `<button type=&quot;button&quot; role=&quot;checkbox&quot;>`. There is no hidden `<input>` anywhere in it, which has one consequence worth knowing before you choose it: **it does not submit with a form, and it takes no `name`**. Read its state from React and post it yourself, or use `Checkbox` — a real `<input type=&quot;checkbox&quot;>` in a `<label>` — when the browser's own form handling is what you want. Everything else follows from the same fact: the accessible state is `aria-checked`, not `:checked`, and the whole bordered surface is the hit target rather than a small box plus a label."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `// A button, so no name and nothing in FormData — you own the value.`,
              ...cardLines(mode, {
                title: "Analytics",
                description: "Page views, referrers and conversion funnels.",
              }),
            ].join("\n")
          }
        >
          {() => (
            <CheckboxCard title="Analytics" description="Page views, referrers and conversion funnels." />
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "independent",
      title: "Each card is independent",
      render: () => (
        <InteractiveExample
          caption="Unlike `RadioCard`, there is no group: each card owns its own state and nothing coordinates them. That is what makes this the multi-select control — three cards mean three independent answers, and turning one on never turns another off. Layout is deliberately not baked in either; stack them, put them in a row, or drop them in a grid, and the cards fill whatever you compose them into."
          code={(_density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<Stack gap="sm">`,
              ...FEATURES.flatMap((f) => cardLines(mode, f, { indent: "  " })),
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Stack gap="sm">
                {FEATURES.map((f) => (
                  <CheckboxCard key={f.value} title={f.title} description={f.description} />
                ))}
              </Stack>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "indeterminate",
      title: "Indeterminate and select-all",
      render: () => (
        <InteractiveExample
          caption="`checked` is tri-state — `true`, `false` or `&quot;indeterminate&quot;` — which is what makes the select-all pattern possible: the parent is indeterminate exactly when *some but not all* children are on, a state no boolean can hold. Two shapes to note. `onCheckedChange` is always called with a **boolean**, never with `&quot;indeterminate&quot;`, because an indeterminate card resolves to `true` on click — so the parent's handler is a plain select-all/clear-all. And the styling treats indeterminate as selected: the card fills the same way a checked one does, and only the mark differs (a bar instead of a tick). The indentation here is the page's own CSS — the primitive does not bake in a hierarchy."
          code={(_density, mode) =>
            [
              `import { useState } from "react";`,
              imports(mode),
              stackImports(mode),
              ``,
              `const [on, setOn] = useState(["analytics"]);`,
              `const all = on.length === FEATURES.length;`,
              ``,
              `<Stack gap="sm">`,
              ...cardLines(
                mode,
                { title: "All features", description: `${"${on.length}"} of 3 selected` },
                {
                  attrs: ` checked={all ? true : on.length === 0 ? false : "indeterminate"}\n    onCheckedChange={(next) => setOn(next ? FEATURES.map((f) => f.value) : [])}`,
                  indent: "  ",
                },
              ),
              ...FEATURES.flatMap((f) =>
                cardLines(
                  mode,
                  { title: f.title },
                  {
                    attrs: `${contractAttr({ mode, prop: "size", value: "sm" })} checked={on.includes("${f.value}")} onCheckedChange={...}`,
                    indent: "  ",
                  },
                ),
              ),
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <SelectAllExample />
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
          caption="Pass `checked` and `onCheckedChange` together and you own the value. Both are **required together** in controlled mode — the props table flattens the two shapes into one list, but TypeScript accepts either `checked` + `onCheckedChange` or `defaultChecked`, never a mix. Since there is no form to submit into, controlled is the normal way to use these cards: the value has to reach your code somehow."
          code={(_density, mode) =>
            [
              `import { useState } from "react";`,
              imports(mode),
              ``,
              `const [on, setOn] = useState(["analytics"]);`,
              ``,
              ...cardLines(
                mode,
                { title: "Analytics", description: "Page views, referrers and conversion funnels." },
                { attrs: ` checked={on.includes("analytics")} onCheckedChange={() => toggle("analytics")}` },
              ),
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
      id: "without-description",
      title: "Title only",
      render: () => (
        <InteractiveExample
          caption="`description` is optional, and `showDescription` toggles it without unmounting the title — useful when the supporting text is conditional and you do not want the card's identity to change with it. Note that `showDescription` only has an effect when there is a `description` to show: the copied file renders the description only when **both** are truthy, so `showDescription` on a card with no description does nothing rather than reserving empty space."
          code={(_density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<Stack gap="sm">`,
              ...cardLines(mode, { title: "Analytics" }, { indent: "  " }),
              ...cardLines(
                mode,
                { title: "Alerts", description: "Hidden by showDescription={false}." },
                { attrs: mode === "headless" ? "" : ` showDescription={false}`, indent: "  " },
              ),
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Stack gap="sm">
                <CheckboxCard title="Analytics" />
                <CheckboxCard title="Alerts" description="Hidden by showDescription={false}." showDescription={false} />
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
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor. Size moves the whole card — padding, radius, the indicator, and both text ramps — so the smaller sizes are for dense option lists rather than for squeezing a long description into a small card."
          code={(density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<div data-density="${density}">`,
              `  <Stack gap="sm">`,
              ...SIZES.flatMap((s) =>
                cardLines(
                  mode,
                  { title: s.toUpperCase(), description: "Supporting text." },
                  { attrs: contractAttr({ mode, prop: "size", value: s }), indent: "    " },
                ),
              ),
              `  </Stack>`,
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Stack gap="sm">
                {SIZES.map((size) => (
                  <CheckboxCard key={size} size={size} title={size.toUpperCase()} description="Supporting text." />
                ))}
              </Stack>
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
          caption="`disabled` forwards the native `<button>` attribute, so the card cannot be toggled and leaves the tab order; `data-disabled` lands on the root for styling. A disabled card keeps its checked look — `data-state` is independent of `data-disabled`, which is what lets you show a locked-on option rather than an option that merely looks unavailable."
          code={(_density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<Stack gap="sm">`,
              ...cardLines(
                mode,
                { title: "Analytics", description: "Included in every plan." },
                { attrs: ` defaultChecked disabled`, indent: "  " },
              ),
              ...cardLines(
                mode,
                { title: "Exports", description: "Available on the Team plan." },
                { attrs: ` disabled`, indent: "  " },
              ),
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Stack gap="sm">
                <CheckboxCard title="Analytics" description="Included in every plan." defaultChecked disabled />
                <CheckboxCard title="Exports" description="Available on the Team plan." disabled />
              </Stack>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  keyboardMeta:
    "All native, because the root is a real `<button>` — the component adds no key handling of its own. Note the difference from `RadioCard`: every card here is its own tab stop, since there is no group to rove within.",
  keyboard: [
    { keys: ["Tab"], behaviour: "Move focus to the card. Each card is a separate tab stop; `disabled` cards are skipped." },
    {
      keys: ["Space"],
      behaviour: "Toggle the card. An `\"indeterminate\"` card resolves to **checked**, never back to unchecked.",
    },
    {
      keys: ["Enter"],
      behaviour:
        "Also toggles — a native `<button>` activates on both keys. Worth knowing if the card sits in a form, because `Enter` on a real checkbox would submit instead.",
    },
  ],

  accessibility: [
    "**Checkbox or CheckboxCard?** `Checkbox` is a real `<input type=\"checkbox\">` in a `<label>`: it submits with a form, takes a `name`, and is the right choice inside one. `CheckboxCard` is a `<button role=\"checkbox\">` — no input, no `name`, nothing in `FormData` — for when the option is a substantial choice with supporting text that deserves a whole surface. Choose on form participation first, not on looks.",
    "The card's accessible name comes from its **content**, so it includes the description as well as the title. That is usually what you want for a card whose description is part of the choice; when the description is long, or is redundant boilerplate, pass an explicit `aria-label` so the announcement stays the option's name.",
    "`aria-checked` carries the state, including `\"mixed\"` for indeterminate — that is the ARIA spelling, and it is what a screen reader announces as \"partially checked\". `data-state` is the CSS mirror of the same thing (`checked` / `unchecked` / `indeterminate`); style off `data-state`, never off `aria-checked`.",
    "There is no `:checked` pseudo-class to hook, because there is no input. The shipped stylesheet keys everything off `data-state` on the root, and unlike `Checkbox` — where `data-state` can lag the browser's own silent changes — here React owns the state outright, so `data-state` is always accurate.",
    "The indicator is `aria-hidden` and carries no state of its own; it is decoration over `aria-checked`. `forceMount` (which the copied file always passes) only keeps it in the DOM so a CSS exit animation can play — it changes nothing in the accessibility tree.",
    "A group of cards still needs a group label. Nothing here is a `radiogroup` or a `fieldset`, so a set of related cards should sit inside a `Field` with a `<legend>`, or a container with `role=\"group\"` and an `aria-labelledby` — otherwise the options are announced with no idea what they belong to.",
    "The whole card is the hit target, which is the point — but it also means anything interactive **inside** a card is a nested control inside a button, which is invalid. Keep links and buttons out of the card; put them beside it.",
  ],
};
