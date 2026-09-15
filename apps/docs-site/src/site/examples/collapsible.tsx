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
          caption="`variant` picks the look without changing the behaviour. `plain` is a bare trigger row over a frameless panel — reach for it inside a container that already has a frame. `card` encloses trigger and panel in one bordered box, revealing a hairline seam where the gap was once open. `inline` styles the trigger as a text link over continuous prose — the read-more pattern below."
          code={(_density, mode) => {
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
      render: () => (
        <InteractiveExample
          caption="`collapsedHeight` shows a **clamped preview** of the panel while closed instead of hiding it — the read-more pattern. Pass a number (pixels) or any CSS length. The preview is real, readable content, so it stays in the accessibility tree; a bottom fade signals there is more, and disappears once the panel is fully open. Best paired with the `inline` dressing."
          code={(_density, mode) => {
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
          caption="Pass `open` and `onOpenChange` together and the parent owns the state — needed to open the panel in response to something else on the page, to keep two widgets in step, or to persist the state. Omit both (or pass `defaultOpen`) for the uncontrolled form, where Collapsible owns it; the two shapes are mutually exclusive, so pick one."
          code={(_density, mode) => {
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
          caption="`disabled` freezes the widget: the trigger renders `aria-disabled` (not the native attribute, so it stays focusable and discoverable) and both click and keyboard activation are short-circuited. The state is mirrored as `data-disabled` onto Root, Trigger and Content for styling."
          code={(_density, mode) => {
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

  accessibility: [
    "The trigger is a real `<button>` with `aria-expanded` and `aria-controls` wired to its panel, so `Space` and `Enter` toggle it — the native behaviour, kept rather than re-implemented.",
    "A closed panel is `hidden` (or `aria-hidden` when force-mounted for animation), so its content never leaks to a screen reader while it looks closed. The exception is `collapsedHeight`: that preview is real, readable content, so it stays in the accessibility tree even while the widget is closed.",
    "`disabled` is rendered as `aria-disabled`, not the native attribute, so the trigger stays focusable and discoverable while being inert. A disabled control that cannot be focused is one a screen-reader user never learns exists.",
    "`Collapsible.TriggerIcon` is decorative — give the chevron `aria-hidden`. The expanded state is already announced through `aria-expanded`, so a labelled icon would say it twice.",
    "Collapsible adds no heading of its own — if the trigger labels a section of the page, wrap or precede it with your own heading at the right level. When you have several related panels that should list as headings and share one tab stop, reach for [Accordion](/components/accordion/) instead.",
  ],
};
