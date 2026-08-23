"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Justify = "start" | "center" | "end";

/** Every part a snippet on this page names, for the styled import line. */
const PARTS = ["List", "Trigger", "Content"] as const;

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Tabs", componentId: "tabs", parts: PARTS });

/**
 * The three panels every snippet and preview on this page uses.
 *
 * One data set, so the code and the picture cannot drift — and so a reader
 * comparing two examples is comparing the BEHAVIOUR, not two different tab sets.
 */
const PANELS = [
  { value: "overview", label: "Overview", body: "What the component is for." },
  { value: "props", label: "Props", body: "Every prop, generated from source." },
  { value: "a11y", label: "Accessibility", body: "Roles, keys and focus." },
] as const;

/**
 * The tree, as a snippet, in the current mode.
 *
 * Shared by the playground and the examples rather than written out four times:
 * the parts, the `value` pairing and the `label` are identical every time, and
 * only the root's props change per example.
 */
const tree = (
  mode: Mode,
  {
    rootProps = "",
    listProps = "",
    disabled,
  }: { rootProps?: string; listProps?: string; disabled?: string } = {},
) => {
  const p = partNamer(mode, "Tabs");
  return [
    `<${p("Root")} defaultValue="overview"${rootProps}>`,
    `  <${p("List")} label="Component docs"${listProps}>`,
    ...PANELS.map(
      (panel) =>
        `    <${p("Trigger")} value="${panel.value}"${panel.value === disabled ? " disabled" : ""}>${panel.label}</${p("Trigger")}>`,
    ),
    `  </${p("List")}>`,
    ``,
    ...PANELS.map(
      (panel) =>
        `  <${p("Content")} value="${panel.value}">${panel.body}</${p("Content")}>`,
    ),
    `</${p("Root")}>`,
  ].join("\n");
};

/**
 * The live tree, matching `tree()` above.
 *
 * Props are listed explicitly rather than spread from a rest object: `disabled`
 * here names the ONE trigger to disable (a panel value), which is not the shape
 * `Tabs.Root` would take, so passing it through by accident is exactly the bug
 * an explicit list prevents.
 */
const Demo = ({
  size,
  justify,
  orientation,
  activationMode,
  disabled,
}: {
  size?: Size;
  justify?: Justify;
  orientation?: "horizontal" | "vertical";
  activationMode?: "automatic" | "manual";
  /** The `value` of the trigger to disable, if any. */
  disabled?: string;
}) => (
  <Tabs
    defaultValue="overview"
    size={size}
    orientation={orientation}
    activationMode={activationMode}
  >
    <TabsList label="Component docs" justify={justify}>
      {PANELS.map((panel) => (
        <TabsTrigger
          key={panel.value}
          value={panel.value}
          disabled={panel.value === disabled}
        >
          {panel.label}
        </TabsTrigger>
      ))}
    </TabsList>

    {PANELS.map((panel) => (
      <TabsContent key={panel.value} value={panel.value}>
        {panel.body}
      </TabsContent>
    ))}
  </Tabs>
);

/**
 * Controlled: the active value lives outside the component.
 *
 * A component rather than inline JSX because it holds state — and this is the
 * pattern the generated props table cannot express. `Tabs.Root`'s props are a
 * discriminated union (`value` + `onValueChange` XOR `defaultValue`), and the
 * extractor flattens it into a plain list, so the mutual exclusivity has to be
 * shown here instead (the known gap recorded in lib/docs-data.ts).
 */
const ControlledDemo = () => {
  const [value, setValue] = useState("props");

  return (
    <div className="docs-example-stack">
      <Tabs value={value} onValueChange={setValue}>
        <TabsList label="Component docs">
          {PANELS.map((panel) => (
            <TabsTrigger key={panel.value} value={panel.value}>
              {panel.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {PANELS.map((panel) => (
          <TabsContent key={panel.value} value={panel.value}>
            {panel.body}
          </TabsContent>
        ))}
      </Tabs>

      {/* Proves the state is genuinely outside: this button moves the tabs
          without touching them. */}
      <p className="docs-example-caption">
        Active value: <code>{value}</code>
      </p>
    </div>
  );
};

/**
 * Tabs' page content.
 *
 * The examples deliberately cover what the PLAYGROUND cannot: `size` and
 * `justify` are contract props and already have controls, so every example here
 * demonstrates a headless behaviour instead — the controlled/uncontrolled split,
 * the activation mode, the orientation, and a disabled trigger.
 */
export const tabsSpec: ComponentSpec = {
  playground: {
    component: "Tabs",
    /*
     * Hand-written because the two controls are not the root's props: `size` is
     * declared on `Tabs` (the root) but `justify` on `Tabs.List`, so the
     * generated `toJsx` would emit `<Tabs size="md" justify="start">` — one prop
     * the root does not accept. The same escape hatch Select needs, for the same
     * reason (types.ts, `playground.snippet`).
     */
    snippet: (values, mode) =>
      [
        imports(mode),
        ``,
        tree(mode, {
          rootProps: contractAttr({ mode, prop: "size", value: values.size }),
          listProps: contractAttr({
            mode,
            prop: "justify",
            value: values.justify,
          }),
        }),
      ].join("\n"),
    /* The tablist has to span the container or `justify` has nothing to move
       the triggers within — start, center and end would all render identically
       on a tablist hugging its own content. */
    fill: true,
    render: (values) => (
      <Demo size={values.size as Size} justify={values.justify as Justify} />
    ),
  },

  anatomyMeta:
    "Four parts, one render path. The `value` string is the whole wiring — it pairs a `Trigger` with its `Content`, and `Tabs.Root` owns which pair is active.",

  anatomy: [
    {
      label: "Tabs",
      code: (mode) => tree(mode),
    },
  ],

  keyboardMeta:
    "The tablist is a single tab stop, not one per trigger — a roving `tabIndex` moves within it, so `Tab` leaves the list rather than walking it. `activationMode` is `automatic` by default, so arrow keys activate as they move; under `manual` they only move focus. A `disabled` trigger is never activated by any of these keys.",

  keyboard: [
    {
      keys: ["ArrowRight", "ArrowLeft"],
      behaviour:
        "Move between triggers in a horizontal tablist. `dir=\"rtl\"` swaps them, either as a prop or from a `DirectionProvider`.",
    },
    {
      keys: ["ArrowDown", "ArrowUp"],
      behaviour: "Move between triggers when `orientation` is `vertical`.",
    },
    { keys: ["Home", "End"], behaviour: "Jump to the first / last trigger." },
    {
      keys: ["Enter", "Space"],
      behaviour:
        "Activate the focused trigger. Only meaningful under `activationMode=\"manual\"` — automatic activation has already happened on the arrow key.",
    },
    {
      keys: ["Tab"],
      behaviour:
        "Move out of the tablist and into the active panel, which is the next tab stop.",
    },
  ],

  examples: [
    {
      id: "controlled",
      title: "Controlled",
      render: () => (
        <InteractiveExample
          caption="Pass `value` with `onValueChange` to own the active tab yourself — for syncing to a URL, or to another control. Pass `defaultValue` instead to let the component own it. The two are mutually exclusive, which is the one thing the generated props table below cannot show you: `Tabs.Root`'s props are a discriminated union and the table flattens it."
          code={(_density, mode) => {
            const p = partNamer(mode, "Tabs");
            return [
              `import { useState } from "react";`,
              imports(mode),
              ``,
              `const [value, setValue] = useState("props");`,
              ``,
              `<${p("Root")} value={value} onValueChange={setValue}>`,
              `  {/* … the same List and Content parts … */}`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <ControlledDemo />}
        </InteractiveExample>
      ),
    },
    {
      id: "activation-mode",
      title: "Activation mode",
      render: () => (
        <InteractiveExample
          caption="`automatic` (the default) activates a tab as the arrow keys reach it, so the panel follows focus. `manual` moves focus only and waits for `Enter` or `Space`. Focus a trigger below and use the arrow keys to feel the difference — automatic is right for cheap panels, manual for a panel that fetches."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              `// Automatic — the default; the panel follows the arrow keys.`,
              tree(mode),
              ``,
              `// Manual — arrows move focus, Enter/Space commits.`,
              tree(mode, { rootProps: ` activationMode="manual"` }),
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Demo activationMode="automatic" />
              <Demo activationMode="manual" />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "vertical",
      title: "Vertical orientation",
      render: () => (
        <InteractiveExample
          /* Braces, not a bare attribute string: a JSX attribute value is not a
             JS string literal, so `\"` inside one is a syntax error rather than
             an escaped quote. */
          caption={
            '`orientation="vertical"` stacks the tablist beside the panel and switches the arrow keys to `ArrowUp`/`ArrowDown`. It is one prop: every part publishes `data-orientation`, and the stylesheet does the rest — the axis is not a separate component.'
          }
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              tree(mode, { rootProps: ` orientation="vertical"` }),
            ].join("\n")
          }
        >
          {() => <Demo orientation="vertical" />}
        </InteractiveExample>
      ),
    },
    {
      id: "disabled-trigger",
      title: "Disabled trigger",
      render: () => (
        <InteractiveExample
          caption="`disabled` on a `Trigger` sets the native attribute and exposes `data-disabled`. Keyboard navigation never activates it — arrow keys, `Home` and `End` all leave the current panel in place rather than opening a disabled one."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              tree(mode, { disabled: "a11y" }),
            ].join("\n")
          }
        >
          {() => <Demo disabled="a11y" />}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "`Tabs.List` requires either `label` or `ariaLabelledBy` — an unnamed `role=\"tablist\"` is the one thing this component lets you get wrong, so the prop is not optional.",
    "The parts render the full APG trio: `role=\"tablist\"` on the list, `role=\"tab\"` on each trigger with `aria-selected` and `aria-controls`, and `role=\"tabpanel\"` on each content with `aria-labelledby` pointing back at its trigger.",
    "The tablist is a **single tab stop**. A roving `tabIndex` follows the active trigger, so `Tab` moves into the panel rather than through every trigger — the APG behaviour, and the reason a ten-tab list costs a keyboard user one keypress to pass rather than ten.",
    "Inactive panels stay mounted and are hidden with the `hidden` attribute, so anything stateful inside a panel — a scroll position, a half-filled field — survives a switch. `lazyMount` defers a panel's first render only; once mounted it stays.",
    "Under `asChild` the ARIA attributes, the event handlers and the roving `tabIndex` all merge onto the element you supply, so a custom trigger keeps full tab semantics rather than becoming a div that looks like one.",
    "`disabled` on a trigger exposes both the native attribute and `data-disabled`, and no keyboard navigation activates it.",
    "Every part publishes `data-orientation`, so a vertical tablist is a styling concern rather than a different component or a different keyboard model to learn.",
  ],
};
