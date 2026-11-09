"use client";

import { useState } from "react";

import { ChevronDown } from "@primitiv-ui/icons";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  CollapsibleTriggerIcon,
} from "@/components/collapsible";
import { contractAttr, contractNote, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Variant = "plain" | "card" | "inline";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

const PARTS = ["Trigger", "TriggerIcon", "Content"] as const;

const imports = (mode: Mode, parts: readonly string[] = PARTS) =>
  importBlock({
    mode,
    component: "Collapsible",
    componentId: "collapsible",
    parts,
    icons: ["ChevronDown"],
  });

/**
 * The trigger + content body, in whichever spelling the current mode uses.
 *
 * The four-part nest (`Trigger > TriggerIcon`, then `Content`) is most of every
 * snippet on this page, so it is built once. `content` is the literal placed
 * inside `Content` — a `{/* ... *\/}` comment in the structural snippets, real
 * text where the example needs the panel to say something.
 */
const bodyLines = (
  mode: Mode,
  label: string,
  content = "{/* ... */}",
  indent = "  ",
) => {
  const p = partNamer(mode, "Collapsible");
  return [
    `${indent}<${p("Trigger")}>`,
    `${indent}  ${label}`,
    `${indent}  <${p("TriggerIcon")}>`,
    `${indent}    <ChevronDown aria-hidden="true" />`,
    `${indent}  </${p("TriggerIcon")}>`,
    `${indent}</${p("Trigger")}>`,
    `${indent}<${p("Content")}>${content}</${p("Content")}>`,
  ];
};

/**
 * The live counterpart to `bodyLines` — one collapsible, trigger + panel.
 *
 * A component rather than inline JSX because the controlled and read-more
 * examples need to hold state, and a hook cannot be called from
 * `InteractiveExample`'s render function.
 */
const Panel = ({
  label,
  children,
  ...props
}: {
  label: string;
  children: React.ReactNode;
} & React.ComponentProps<typeof Collapsible>) => (
  <div style={{ inlineSize: "100%" }}>
    <Collapsible {...props}>
      <CollapsibleTrigger>
        {label}
        <CollapsibleTriggerIcon>
          <ChevronDown aria-hidden="true" />
        </CollapsibleTriggerIcon>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  </div>
);

/** The chevron `@primitiv-ui/icons` draws, inlined as the CLI's example does. */
const CHEVRON =
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.06 9 12 17.06 3.94 9 5 7.94l7 7 7-7L20.06 9Z"/></svg>';

/**
 * One collapsible as Elements markup (RFC 0033): the `@primitiv-ui/web` custom
 * elements, in the shape `primitiv add collapsible --surface elements` prints.
 * The trigger wraps a real `<button>`, and `open` on the root is the state. A
 * closed panel carries `hidden`, so the page is right before the script loads;
 * an open one pre-renders `data-state`, so the styled panel does not animate
 * open on load. The spans inside the panel are the styled surface's clip, body
 * and fade — the headless tab drops them with the classes.
 */
const elementsTree = ({
  variant = "plain",
  size = "md",
  open = false,
  label = "Section title",
  body = "Panel content.",
  rootAttrs = "",
  collapsedHeight,
  triggerLast = false,
}: {
  variant?: string;
  size?: string;
  open?: boolean;
  label?: string;
  body?: string;
  rootAttrs?: string;
  /** The panel's `collapsed-height`: a clamped preview, never `hidden`. */
  collapsedHeight?: string;
  /** Put the trigger after the panel, as a read-more does. */
  triggerLast?: boolean;
} = {}) => {
  const state = open ? ' data-state="open"' : "";
  const contentAttrs =
    collapsedHeight !== undefined
      ? ` collapsed-height="${collapsedHeight}"${state}`
      : state || " hidden";
  const trigger = [
    `  <primitiv-collapsible-trigger>`,
    `    <button type="button" class="primitiv-collapsible__trigger">`,
    `      <span class="primitiv-collapsible__trigger-label">${label}</span>`,
    `      <primitiv-collapsible-trigger-icon class="primitiv-collapsible__trigger-icon"${state}>${CHEVRON}</primitiv-collapsible-trigger-icon>`,
    `    </button>`,
    `  </primitiv-collapsible-trigger>`,
  ];
  const content = [
    `  <primitiv-collapsible-content class="primitiv-collapsible__content"${contentAttrs}>`,
    `    <span class="primitiv-collapsible__content-inner"><span class="primitiv-collapsible__content-body">${body}</span><span class="primitiv-collapsible__content-fade"></span></span>`,
    `  </primitiv-collapsible-content>`,
  ];
  return [
    `<primitiv-collapsible${open ? " open" : ""}${rootAttrs} class="primitiv-collapsible primitiv-collapsible--${variant} primitiv-collapsible--${size}">`,
    ...(triggerLast ? [...content, ...trigger] : [...trigger, ...content]),
    `</primitiv-collapsible>`,
  ].join("\n");
};

/** A listener on `primitiv-collapsible-change`, for the code tab and the preview alike. */
const onChange = (root: HTMLElement, apply: (open: boolean) => void) => {
  const collapsible = root.querySelector("primitiv-collapsible");
  if (!collapsible) return;
  const listener = (event: Event) => apply((event as CustomEvent<{ open: boolean }>).detail.open);
  collapsible.addEventListener("primitiv-collapsible-change", listener);
  return () => collapsible.removeEventListener("primitiv-collapsible-change", listener);
};

/** The Controlled example's Elements preview: the tree plus the readout. */
const controlledElementsPreview = () =>
  [
    `<div class="docs-example-stack">`,
    `<p class="docs-prop-description">Panel is <span data-open-state>open</span>.</p>`,
    elementsTree({
      variant: "card",
      open: true,
      label: "Release notes",
      body: "The open attribute is the state, so the same value can drive other UI or be saved between visits.",
    }),
    `</div>`,
  ].join("\n");

/** Follows `primitiv-collapsible-change` into the readout, as the code tab's listener does. */
const wireControlled = (root: HTMLElement) =>
  onChange(root, (open) => {
    const readout = root.querySelector("[data-open-state]");
    if (readout) readout.textContent = open ? "open" : "closed";
  });

/** Swaps the read-more trigger's label as it opens and closes, as the code tab's listener does. */
const wireReadMore = (root: HTMLElement) =>
  onChange(root, (open) => {
    const label = root.querySelector(".primitiv-collapsible__trigger-label");
    if (label) label.textContent = open ? "Show less" : "Show more";
  });

/** A passage long enough to overflow the read-more example's clamped preview. */
const HARMONI_BLURB =
  "Harmoni is the palette-generation engine underneath Primitiv — a Rust core compiled to WebAssembly that turns a single brand colour into a full, perceptually even ramp. It handles light and dark modes, neutral and soft-neutral ramps, brand-hue tinting, and an OKLCH picker for dialling in the exact anchor colours, all from one input.";

/** The controlled example's live half — it owns the open state. */
const ControlledExample = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="docs-example-stack" style={{ inlineSize: "100%" }}>
      <p className="docs-prop-description">
        Panel is {open ? "open" : "closed"}.
      </p>
      <Collapsible variant="card" open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger>
          Release notes
          <CollapsibleTriggerIcon>
            <ChevronDown aria-hidden="true" />
          </CollapsibleTriggerIcon>
        </CollapsibleTrigger>
        <CollapsibleContent>
          The parent holds the open value and re-renders on every toggle, so the
          same state can drive other UI or be persisted between visits.
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

/** The read-more example's live half — a clamped preview it can expand. */
const ReadMoreExample = () => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ inlineSize: "100%" }}>
      <Collapsible variant="inline" open={open} onOpenChange={setOpen}>
        <CollapsibleContent collapsedHeight={72}>
          {HARMONI_BLURB}
        </CollapsibleContent>
        <CollapsibleTrigger>
          {open ? "Show less" : "Show more"}
          <CollapsibleTriggerIcon>
            <ChevronDown aria-hidden="true" />
          </CollapsibleTriggerIcon>
        </CollapsibleTrigger>
      </Collapsible>
    </div>
  );
};

/**
 * Collapsible's page content.
 *
 * The single-item analogue of Accordion: one trigger, one panel, and a real
 * `<button>` whose keys are the platform's — so unlike Accordion there is no
 * keyboard section to write (nothing here overrides Space/Enter on a button, and
 * a lone disclosure has no roving tabindex to move between).
 */
export const collapsibleSpec: ComponentSpec = {
  playground: {
    component: "Collapsible",
    /* Hand-written: `variant`/`size` are the root's own props, but this is a
       compound and the generated `toJsx` prints a childless
       `<Collapsible variant="plain" size="md" />`, hiding the parts a reader
       needs to see. */
    snippet: (values, mode) => {
      if (mode === "elements")
        return elementsTree({
          variant: values.variant,
          size: values.size,
          open: true,
          body: "A single disclosure widget: the trigger toggles this panel open and closed.",
        });
      const p = partNamer(mode, "Collapsible");
      return [
        imports(mode),
        ``,
        `<${p("Root")}${contractAttr({ mode, prop: "variant", value: values.variant })}${contractAttr({ mode, prop: "size", value: values.size })} defaultOpen>`,
        ...bodyLines(mode, "Section title"),
        `</${p("Root")}>`,
      ].join("\n");
    },
    fill: true,
    render: (values) => (
      <Panel
        label="Section title"
        variant={values.variant as Variant}
        size={values.size as Size}
        defaultOpen
      >
        A single disclosure widget: the trigger toggles this panel open and
        closed. Change the variant and size above to see the three dressings and
        the size ramp.
      </Panel>
    ),
  },

  anatomyMeta:
    "Four parts, and unlike Accordion there is no `Header` — a single disclosure needs no wrapping heading, which is the whole reason to reach for Collapsible over an Accordion of one. `TriggerIcon` is optional; omit it for a trigger with no chevron.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        if (mode === "elements")
          return [
            `<primitiv-collapsible>`,
            `  <primitiv-collapsible-trigger>`,
            `    <button type="button">`,
            `      <primitiv-collapsible-trigger-icon></primitiv-collapsible-trigger-icon>`,
            `    </button>`,
            `  </primitiv-collapsible-trigger>`,
            `  <primitiv-collapsible-content></primitiv-collapsible-content>`,
            `</primitiv-collapsible>`,
          ].join("\n");
        const p = partNamer(mode, "Collapsible");
        return [
          `<${p("Root")}>`,
          `  <${p("Trigger")}>`,
          `    <${p("TriggerIcon")} />`,
          `  </${p("Trigger")}>`,
          `  <${p("Content")} />`,
          `</${p("Root")}>`,
        ].join("\n");
      },
    },
  ],

  examples: [
    {
      id: "dressings",
      title: "Three dressings",
      render: () => (
        <InteractiveExample
          elementsCaption="The dressing is a class on `<primitiv-collapsible>` — `primitiv-collapsible--plain`, `--card` or `--inline` — so the behaviour never changes with it. `plain` is a bare trigger row over a frameless panel, for inside a container that already has a frame. `card` encloses trigger and panel in one bordered box, with a hairline seam where the gap was once open. `inline` styles the trigger as a text link over continuous prose — the read-more pattern below."
          caption="`variant` picks the look without changing the behaviour. `plain` is a bare trigger row over a frameless panel — reach for it inside a container that already has a frame. `card` encloses trigger and panel in one bordered box, revealing a hairline seam where the gap was once open. `inline` styles the trigger as a text link over continuous prose — the read-more pattern below."
          code={(_density, mode) => {
            if (mode === "elements")
              return (["plain", "card", "inline"] as const)
                .map((variant) =>
                  elementsTree({
                    variant,
                    open: variant === "plain",
                    label: `${variant[0].toUpperCase()}${variant.slice(1)} dressing`,
                  }),
                )
                .join("\n\n");
            const p = partNamer(mode, "Collapsible");
            return [
              imports(mode),
              ``,
              ...contractNote(mode, "`variant`"),
              ...(["plain", "card", "inline"] as const).flatMap((variant) => [
                `<${p("Root")}${contractAttr({ mode, prop: "variant", value: variant, headlessClass: `collapsible--${variant}` })} defaultOpen>`,
                ...bodyLines(mode, `${variant[0].toUpperCase()}${variant.slice(1)} dressing`),
                `</${p("Root")}>`,
                ``,
              ]),
            ]
              .join("\n")
              .trimEnd();
          }}
        >
          {() => (
            <div
              style={{
                inlineSize: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <Panel label="Plain dressing" variant="plain" defaultOpen>
                A bare trigger row above a frameless panel — the lightest option,
                for use inside something that already provides a frame.
              </Panel>
              <Panel label="Card dressing" variant="card">
                A bordered, radiused box around both the trigger and the panel;
                opening it reveals a hairline seam in place of the whitespace.
              </Panel>
              <Panel label="Inline dressing" variant="inline">
                A text-flow trigger that reads as a link, sitting over continuous
                prose — pair it with `collapsedHeight` for a read-more.
              </Panel>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "read-more",
      title: "Read more (collapsedHeight)",
      elementsTitle: "Read more (collapsed-height)",
      render: () => (
        <InteractiveExample
          caption="`collapsedHeight` shows a **clamped preview** of the panel while closed instead of hiding it — the read-more pattern. Pass a number (pixels) or any CSS length. The preview is real, readable content, so it stays in the accessibility tree; a bottom fade signals there is more, and disappears once the panel is fully open. Best paired with the `inline` dressing."
          elementsCaption="`collapsed-height` on `<primitiv-collapsible-content>` shows a **clamped preview** while closed instead of hiding the panel — the read-more pattern. A bare number is pixels; any other CSS length is used as written. The preview is real, readable content, so the panel is never `hidden` and stays in the accessibility tree; a bottom fade signals there is more, and disappears once it is fully open. A `primitiv-collapsible-change` listener swaps the trigger's label."
          elementsPreview={(_density, code) => code.slice(0, code.indexOf("\n\n<script"))}
          wire={wireReadMore}
          code={(_density, mode) => {
            if (mode === "elements")
              return [
                elementsTree({
                  variant: "inline",
                  label: "Show more",
                  body: HARMONI_BLURB,
                  collapsedHeight: "72",
                  triggerLast: true,
                }),
                ``,
                `<script type="module">`,
                `  const collapsible = document.querySelector("primitiv-collapsible");`,
                `  const label = collapsible.querySelector(".primitiv-collapsible__trigger-label");`,
                `  collapsible.addEventListener("primitiv-collapsible-change", (event) => {`,
                `    label.textContent = event.detail.open ? "Show less" : "Show more";`,
                `  });`,
                `</script>`,
              ].join("\n");
            const p = partNamer(mode, "Collapsible");
            return [
              imports(mode, ["Content", "Trigger", "TriggerIcon"]),
              `import { useState } from "react";`,
              ``,
              `const [open, setOpen] = useState(false);`,
              ``,
              `<${p("Root")}${contractAttr({ mode, prop: "variant", value: "inline", headlessClass: "collapsible--inline" })} open={open} onOpenChange={setOpen}>`,
              `  <${p("Content")} collapsedHeight={72}>`,
              `    {/* a passage longer than the preview height */}`,
              `  </${p("Content")}>`,
              `  <${p("Trigger")}>`,
              `    {open ? "Show less" : "Show more"}`,
              `    <${p("TriggerIcon")}>`,
              `      <ChevronDown aria-hidden="true" />`,
              `    </${p("TriggerIcon")}>`,
              `  </${p("Trigger")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <ReadMoreExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "controlled",
      title: "Controlled",
      render: () => (
        <InteractiveExample
          elementsPreview={controlledElementsPreview}
          wire={wireControlled}
          elementsCaption="The `open` attribute is the state: set it from the server, from markup or with the `open` property to open the panel, and listen for `primitiv-collapsible-change` to follow the user. Its `detail.open` is the state afterwards; the event fires before the change and is cancelable, so `preventDefault()` keeps the panel as it is."
          caption="Pass `open` and `onOpenChange` together and the parent owns the state — needed to open the panel in response to something else on the page, to keep two widgets in step, or to persist the state. Omit both (or pass `defaultOpen`) for the uncontrolled form, where Collapsible owns it; the two shapes are mutually exclusive, so pick one."
          code={(_density, mode) => {
            if (mode === "elements")
              return [
                `<!-- The open attribute is the state: set it to open the panel,`,
                `     and listen for the change to follow the user. -->`,
                `<primitiv-collapsible open class="primitiv-collapsible primitiv-collapsible--card primitiv-collapsible--md">`,
                `  <!-- ... the trigger and content ... -->`,
                `</primitiv-collapsible>`,
                ``,
                `<script type="module">`,
                `  const collapsible = document.querySelector("primitiv-collapsible");`,
                `  collapsible.addEventListener("primitiv-collapsible-change", (event) => {`,
                `    console.log(event.detail.open); // preventDefault() vetoes it`,
                `  });`,
                `  collapsible.open = false;`,
                `</script>`,
              ].join("\n");
            const p = partNamer(mode, "Collapsible");
            return [
              imports(mode),
              `import { useState } from "react";`,
              ``,
              `const [open, setOpen] = useState(true);`,
              ``,
              `<${p("Root")}${contractAttr({ mode, prop: "variant", value: "card" })} open={open} onOpenChange={setOpen}>`,
              ...bodyLines(mode, "Release notes"),
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <ControlledExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "disabled",
      title: "Disabled",
      render: () => (
        <InteractiveExample
          elementsCaption="`disabled` on `<primitiv-collapsible>` freezes it: the button inside the trigger gets `aria-disabled` (not the native attribute, so it stays focusable and discoverable) and neither a click nor Enter or Space toggles it. The state is mirrored as `data-disabled` onto the root, the button and the content for styling."
          caption="`disabled` freezes the widget: the trigger renders `aria-disabled` (not the native attribute, so it stays focusable and discoverable) and both click and keyboard activation are short-circuited. The state is mirrored as `data-disabled` onto Root, Trigger and Content for styling."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsTree({
                variant: "card",
                label: "Advanced settings",
                rootAttrs: " disabled",
                body: "You cannot reach this panel while the widget is disabled.",
              });
            const p = partNamer(mode, "Collapsible");
            return [
              imports(mode),
              ``,
              `<${p("Root")}${contractAttr({ mode, prop: "variant", value: "card" })} disabled>`,
              ...bodyLines(mode, "Advanced settings"),
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <Panel label="Advanced settings" variant="card" disabled>
              You cannot reach this panel while the widget is disabled — the
              trigger stays focusable so assistive tech still finds it.
            </Panel>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    anatomyMeta:
      "Four elements. `<primitiv-collapsible>` holds the state in its `open` attribute; the trigger wraps the `<button>` you write, which becomes the control; the content is the panel. There is no header element — a single disclosure needs no wrapping heading, which is the whole reason to reach for Collapsible over an accordion of one. `<primitiv-collapsible-trigger-icon>` is optional; leave it out for a trigger with no chevron.",
    accessibility: [
      "The trigger decorates the one `<button>` you put inside it, which receives `aria-expanded` and `aria-controls` wired to the panel, with ids generated from the root's `id` where you gave none. `Enter` and `Space` toggle it. A trigger without exactly one element child is reported once in the console and left alone.",
      "A closed panel gets `hidden` and `aria-hidden`, so it is out of the accessibility tree even when a stylesheet keeps it displayed to animate it. Render `hidden` on a closed panel in your own markup too: the page is then correct before the script loads. `force-mount` keeps it unhidden for your own animation, still `aria-hidden` while closed.",
      "`collapsed-height` is the exception: that preview is real, readable content, so the panel is never hidden, in either state.",
      "`disabled` on the root sets `aria-disabled` and `data-disabled` on the button rather than the native attribute, so it stays focusable and discoverable while nothing toggles it.",
      "`<primitiv-collapsible-trigger-icon>` is decorative: the element gives it `aria-hidden` and a `data-state` to flip on. The expanded state is already announced through `aria-expanded`.",
      "Collapsible adds no heading of its own — if the trigger labels a section of the page, wrap or precede it with your own heading at the right level. For several related panels that should list as headings, reach for [Accordion](/components/accordion/) instead.",
    ],
  },

  accessibility: [
    "The trigger is a real `<button>` with `aria-expanded` and `aria-controls` wired to its panel, so `Space` and `Enter` toggle it — the native behaviour, kept rather than re-implemented.",
    "A closed panel is `hidden` (or `aria-hidden` when force-mounted for animation), so its content never leaks to a screen reader while it looks closed. The exception is `collapsedHeight`: that preview is real, readable content, so it stays in the accessibility tree even while the widget is closed.",
    "`disabled` is rendered as `aria-disabled`, not the native attribute, so the trigger stays focusable and discoverable while being inert. A disabled control that cannot be focused is one a screen-reader user never learns exists.",
    "`Collapsible.TriggerIcon` is decorative — give the chevron `aria-hidden`. The expanded state is already announced through `aria-expanded`, so a labelled icon would say it twice.",
    "Collapsible adds no heading of its own — if the trigger labels a section of the page, wrap or precede it with your own heading at the right level. When you have several related panels that should list as headings and share one tab stop, reach for [Accordion](/components/accordion/) instead.",
  ],
};
