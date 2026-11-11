"use client";

import { useState } from "react";

import { CheckboxCard } from "@/components/checkbox-card";
import { Stack } from "@/components/stack";
import { contractAttr, importBlock, indent, partNamer, stackImports } from "@/lib/playground";
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

/**
 * One card as Elements markup (RFC 0033): the `@primitiv-ui/web` custom
 * element, in the shape `primitiv add checkbox-card --surface elements` prints.
 * It wraps the `<button>` you write; the wrapper spans are the styled surface's,
 * which the headless tab drops with the classes.
 */
const elementsCard = ({
  title,
  description,
  checked,
  disabled = false,
  size = "md",
  id,
}: {
  title: string;
  description?: string;
  checked?: boolean | "indeterminate";
  disabled?: boolean;
  size?: string;
  id?: string;
}) =>
  [
    `<primitiv-checkbox-card${id ? ` id="${id}"` : ""}${checked === "indeterminate" ? ' checked="indeterminate"' : checked ? " checked" : ""}${disabled ? " disabled" : ""}>`,
    `  <button type="button" class="primitiv-checkbox-card primitiv-checkbox-card--${size}">`,
    `    <span class="primitiv-checkbox-card__indicator-wrapper">`,
    `      <span class="primitiv-checkbox-card__indicator">`,
    `        <primitiv-checkbox-card-indicator force-mount class="primitiv-checkbox-card__mark"></primitiv-checkbox-card-indicator>`,
    `      </span>`,
    `    </span>`,
    `    <span class="primitiv-checkbox-card__content">`,
    `      <span class="primitiv-checkbox-card__title">${title}</span>`,
    ...(description ? [`      <span class="primitiv-checkbox-card__description">${description}</span>`] : []),
    `    </span>`,
    `  </button>`,
    `</primitiv-checkbox-card>`,
  ].join("\n");

/** Cards in a column, as the React examples' `<Stack gap="sm">` lays them out. */
const elementsStack = (cards: readonly string[], extra = "") =>
  [
    `<div class="primitiv-stack primitiv-stack--column primitiv-stack--gap-sm primitiv-stack--align-stretch primitiv-stack--nowrap primitiv-stack--justify-start"${extra}>`,
    ...cards.map((card) => indent(card)),
    `</div>`,
  ].join("\n");

/** The disabled example's cards: one locked on, one unavailable. */
const DISABLED_CARDS = () => [
  elementsCard({ title: "Analytics", description: "Included in every plan.", checked: true, disabled: true }),
  elementsCard({ title: "Exports", description: "Available on the Team plan.", disabled: true }),
];

/** Wraps Elements markup in the full-width stack the React examples render into. */
const stacked = (markup: string) => [`<div class="docs-example-stack">`, indent(markup), `</div>`].join("\n");

const FEATURE_CARDS = (checked: readonly string[] = []) =>
  FEATURES.map((f) => elementsCard({ ...f, id: f.value, checked: checked.includes(f.value) }));

/** The listening example's Elements preview: the cards above a readout of the ones on. */
const enabledPreview = () =>
  stacked(
    elementsStack([...FEATURE_CARDS(["analytics"]), `<p class="docs-example-caption">Enabled: <code data-enabled>analytics</code></p>`]),
  );

/** Follows each card's `primitiv-checkbox-card-change` into the readout, as the code tab's listener does. */
const wireEnabled = (root: HTMLElement) => {
  const readout = root.querySelector("[data-enabled]");
  if (!readout) return;
  const onChange = (event: Event) => {
    const card = event.target as HTMLElement;
    const on = new Set([...root.querySelectorAll("primitiv-checkbox-card[checked]")].map((c) => c.id));
    if ((event as CustomEvent<{ checked: boolean }>).detail.checked) on.add(card.id);
    else on.delete(card.id);
    readout.textContent = on.size ? [...on].sort().join(", ") : "none";
  };
  root.addEventListener("primitiv-checkbox-card-change", onChange);
  return () => root.removeEventListener("primitiv-checkbox-card-change", onChange);
};

/** The select-all example's Elements markup: a parent card over the three features. */
const selectAllMarkup = () =>
  elementsStack([
    elementsCard({ id: "all", title: "All features", description: "1 of 3 selected", checked: "indeterminate" }),
    [
      `<div class="docs-example-indent">`,
      indent(
        elementsStack(FEATURES.map((f) => elementsCard({ id: f.value, title: f.title, size: "sm", checked: f.value === "analytics" }))),
      ),
      `</div>`,
    ].join("\n"),
  ]);

/**
 * Keeps the parent card in step with its children, and its press selecting or
 * clearing them all — the script the select-all code tab shows. Runs after each
 * change has applied, so it reads the cards' own `checked` attributes.
 */
const wireSelectAll = (root: HTMLElement) => {
  const parent = root.querySelector<HTMLElement & { checked: boolean | "indeterminate" }>("#all");
  const description = parent?.querySelector(".primitiv-checkbox-card__description");
  if (!parent || !description) return;
  const children = FEATURES.map((f) => root.querySelector<HTMLElement & { checked: boolean | "indeterminate" }>(`#${f.value}`)!);
  const sync = () => {
    const on = children.filter((child) => child.checked === true).length;
    parent.checked = on === children.length ? true : on === 0 ? false : "indeterminate";
    description.textContent = `${on} of ${children.length} selected`;
  };
  const onChange = (event: Event) => {
    const checked = (event as CustomEvent<{ checked: boolean }>).detail.checked;
    queueMicrotask(() => {
      if (event.target === parent) for (const child of children) child.checked = checked;
      sync();
    });
  };
  root.addEventListener("primitiv-checkbox-card-change", onChange);
  return () => root.removeEventListener("primitiv-checkbox-card-change", onChange);
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
    /* The cards are `<button>`s that shrink-to-fit; the same full-width wrapper
       the React preview renders into keeps them at a stable width. */
    elementsPreview: (code) => stacked(code),
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
      mode === "elements"
        ? elementsCard({
            title: "Analytics",
            description: values.showDescription === "true" ? "Page views, referrers and conversion funnels." : undefined,
            checked: true,
            size: values.size,
          })
        : [
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
      code: (mode) =>
        mode === "elements"
          ? elementsCard({ title: "Analytics", description: "Page views and referrers." })
          : cardLines(mode, { title: "Analytics", description: "Page views and referrers." }).join("\n"),
    },
  ],

  examples: [
    {
      id: "not-a-form-control",
      title: "It is a button, not an input (the headline)",
      render: () => (
        <InteractiveExample
          caption="`CheckboxCard` renders a `<button type=&quot;button&quot; role=&quot;checkbox&quot;>`. There is no hidden `<input>` anywhere in it, which has one consequence worth knowing before you choose it: **it does not submit with a form, and it takes no `name`**. Read its state from React and post it yourself, or use `Checkbox` — a real `<input type=&quot;checkbox&quot;>` in a `<label>` — when the browser's own form handling is what you want. Everything else follows from the same fact: the accessible state is `aria-checked`, not `:checked`, and the whole bordered surface is the hit target rather than a small box plus a label."
          elementsCaption="`<primitiv-checkbox-card>` decorates the `<button type=&quot;button&quot;>` you write as a `role=&quot;checkbox&quot;`. There is no hidden `<input>` anywhere in it, which has one consequence worth knowing before you choose it: **it does not submit with a form, and it takes no `name`**. Read its `checked` attribute and post it yourself, or use a native `<input type=&quot;checkbox&quot;>` in a `<label>` when the browser's own form handling is what you want. The accessible state is `aria-checked`, and the whole bordered surface is the hit target."
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  `<!-- A button, so no name and nothing in FormData — you own the value. -->`,
                  elementsCard({ title: "Analytics", description: "Page views, referrers and conversion funnels." }),
                ].join("\n")
              : [
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
          elementsCaption="There is no group element: each `<primitiv-checkbox-card>` owns its own `checked` and nothing coordinates them. That is what makes this the multi-select control — three cards mean three independent answers, and turning one on never turns another off. Lay them out however you like; here they sit in a Stack."
          elementsPreview={() => stacked(elementsStack(FEATURES.map((f) => elementsCard(f))))}
          code={(_density, mode) =>
            mode === "elements"
              ? elementsStack(FEATURES.map((f) => elementsCard(f)))
              : [
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
          elementsCaption="`checked` is tri-state — present, absent or `checked=&quot;indeterminate&quot;` — which is what makes the select-all pattern possible: the parent is indeterminate exactly when *some but not all* of the cards beneath it are on. The element does not coordinate them; a few lines of script do, listening for `primitiv-checkbox-card-change`. Its `detail.checked` is always a **boolean**, because a mixed card resolves to checked when pressed. The styling treats indeterminate as selected: only the mark differs (a bar instead of a tick)."
          elementsPreview={() => stacked(selectAllMarkup())}
          wire={wireSelectAll}
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  selectAllMarkup(),
                  ``,
                  `<script type="module">`,
                  `  const parent = document.getElementById("all");`,
                  `  const cards = ["analytics", "alerts", "exports"].map((id) => document.getElementById(id));`,
                  `  const sync = () => {`,
                  `    const on = cards.filter((card) => card.checked === true).length;`,
                  `    parent.checked = on === cards.length ? true : on === 0 ? false : "indeterminate";`,
                  `  };`,
                  `  document.addEventListener("primitiv-checkbox-card-change", (event) => {`,
                  `    // Fired before the change applies: act once it has.`,
                  `    queueMicrotask(() => {`,
                  `      if (event.target === parent) for (const card of cards) card.checked = event.detail.checked;`,
                  `      sync();`,
                  `    });`,
                  `  });`,
                  `</script>`,
                ].join("\n")
              : [
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
      elementsTitle: "Listening for changes",
      render: () => (
        <InteractiveExample
          caption="Pass `checked` and `onCheckedChange` together and you own the value. Both are **required together** in controlled mode — the props table flattens the two shapes into one list, but TypeScript accepts either `checked` + `onCheckedChange` or `defaultChecked`, never a mix. Since there is no form to submit into, controlled is the normal way to use these cards: the value has to reach your code somehow."
          elementsCaption="Each card keeps its state in its own `checked` attribute, so it works with no script. To follow it, listen for `primitiv-checkbox-card-change` — it bubbles, so one listener on a container hears every card. It fires **before** the change applies, with the state afterwards in `detail.checked`, and `preventDefault()` vetoes it. With no form to submit into, this is how the values reach your code."
          elementsPreview={() => enabledPreview()}
          wire={wireEnabled}
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  elementsStack(FEATURE_CARDS(["analytics"])),
                  ``,
                  `<script type="module">`,
                  `  document.addEventListener("primitiv-checkbox-card-change", (event) => {`,
                  `    console.log(event.target.id, event.detail.checked); // preventDefault() vetoes it`,
                  `  });`,
                  `</script>`,
                ].join("\n")
              : [
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
          elementsCaption="The description is optional: leave its span out and the card is title-only. Nothing reserves space for a description that is not there."
          elementsPreview={() => stacked(elementsStack([elementsCard({ title: "Analytics" }), elementsCard({ title: "Alerts" })]))}
          code={(_density, mode) =>
            mode === "elements"
              ? elementsStack([elementsCard({ title: "Analytics" }), elementsCard({ title: "Alerts" })])
              : [
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
          elementsCaption="Five sizes, `primitiv-checkbox-card--xs` to `--xl` on the button, each rescaling again with the nearest `data-density` ancestor. Size moves the whole card — padding, radius, the indicator, and both text ramps."
          elementsPreview={(density) =>
            stacked(elementsStack(SIZES.map((s) => elementsCard({ title: s.toUpperCase(), description: "Supporting text.", size: s })), ` data-density="${density}"`))
          }
          code={(density, mode) =>
            mode === "elements"
              ? elementsStack(
                  SIZES.map((s) => elementsCard({ title: s.toUpperCase(), description: "Supporting text.", size: s })),
                  ` data-density="${density}"`,
                )
              : [
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
          elementsCaption="`disabled` on `<primitiv-checkbox-card>` gives its button `aria-disabled` and `data-disabled`, and the card never toggles. It stays focusable and announced rather than taking the native attribute. A disabled card keeps its checked look — `data-state` is independent of `data-disabled`, which is what lets you show a locked-on option."
          elementsPreview={() => stacked(elementsStack(DISABLED_CARDS()))}
          code={(_density, mode) =>
            mode === "elements"
              ? elementsStack(DISABLED_CARDS())
              : [
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

  elements: {
    description:
      "A card whose whole surface is one checkbox. `<primitiv-checkbox-card>` keeps the state in its `checked` attribute — present, absent, or `\"indeterminate\"` — and decorates the `<button>` you write as a `role=\"checkbox\"` with `aria-checked`. Cards are independent: no group, each its own tab stop.",
    anatomyMeta:
      "Two elements. `<primitiv-checkbox-card>` owns `checked` and `disabled` and decorates exactly one child, the `<button>` holding the card's content, which gets the checkbox's ARIA and `data-state`; the element itself takes no box. `<primitiv-checkbox-card-indicator>`, anywhere inside the button, is the decorative mark: `hidden` while the card is unchecked unless it carries `force-mount`, which the styled card uses so its mark can animate.",
    keyboardMeta:
      "All native, because the card is a real `<button>` — the element adds no key handling of its own. Every card is its own tab stop, since there is no group to rove within.",
    keyboard: [
      { keys: ["Tab"], behaviour: "Move focus to the card. Each card is a separate tab stop." },
      {
        keys: ["Space", "Enter"],
        behaviour: "Toggle the card — the button's own click. An `\"indeterminate\"` card resolves to **checked**.",
      },
    ],
    accessibility: [
      "**A native checkbox or a checkbox card?** `<input type=\"checkbox\">` in a `<label>` submits with a form and takes a `name`. `<primitiv-checkbox-card>` is a button — no input, no `name`, nothing in `FormData` — for when the option deserves a whole surface. Choose on form participation first.",
      "The card's accessible name comes from the `<button>`'s **content**, so it includes the description. Put an `aria-label` on the button when the description is long or boilerplate.",
      "`aria-checked` carries the state, including `mixed` for indeterminate — what a screen reader announces as partially checked. `data-state` (`checked` / `unchecked` / `indeterminate`) is its CSS mirror; style off `data-state`.",
      "A card decorates the one `<button>` you put inside it. A card without exactly one element child is reported once in the console and left alone.",
      "`disabled` sets `aria-disabled` and `data-disabled` on the button rather than the native attribute, so the card stays focusable and announced while nothing toggles it.",
      "A set of related cards still needs a group label: put them in a `<fieldset>` with a `<legend>`, or a container with `role=\"group\"` and `aria-labelledby`.",
      "The whole card is the hit target, so nothing interactive belongs **inside** it. Put links and buttons beside it.",
    ],
  },

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
