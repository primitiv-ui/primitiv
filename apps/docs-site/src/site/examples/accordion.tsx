"use client";

import { useState } from "react";

import { ChevronDown } from "@primitiv-ui/icons";

import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
  AccordionTriggerIcon,
} from "@/components/accordion";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const PARTS = [
  "Item",
  "Header",
  "Trigger",
  "TriggerIcon",
  "Content",
] as const;

const imports = (mode: Mode, parts: readonly string[] = PARTS) =>
  importBlock({
    mode,
    component: "Accordion",
    componentId: "accordion",
    parts,
    icons: ["ChevronDown"],
  });

/** The three sections every example reuses, so the prose stays the subject. */
const SECTIONS = [
  {
    value: "install",
    title: "How do I install a component?",
    body: "Run the CLI and the component's files are copied into your project. There is no package to add and nothing to upgrade — the code is yours from that point on.",
  },
  {
    value: "own",
    title: "What does owning the code mean?",
    body: "Edit it. The stable surface is the contract — the class names and custom properties — not the file, so restyling never puts you on a fork.",
  },
  {
    value: "headless",
    title: "Can I use the behaviour without the styles?",
    body: "Yes. Every styled component wraps a headless primitive you can install on its own, keeping the keyboard model and ARIA while bringing your own CSS.",
  },
] as const;

/**
 * One section, in whichever spelling the current mode uses.
 *
 * A four-part nest (`Item > Header > Trigger > TriggerIcon`, then `Content`)
 * repeated three times is most of this page's snippet volume, so it is built
 * once rather than written out per example.
 */
const sectionLines = (
  mode: Mode,
  section: (typeof SECTIONS)[number],
  indent = "  ",
) => {
  const p = partNamer(mode, "Accordion");
  return [
    `${indent}<${p("Item")} value="${section.value}">`,
    `${indent}  <${p("Header")}>`,
    `${indent}    <${p("Trigger")}>`,
    `${indent}      ${section.title}`,
    `${indent}      <${p("TriggerIcon")}>`,
    `${indent}        <ChevronDown aria-hidden="true" />`,
    `${indent}      </${p("TriggerIcon")}>`,
    `${indent}    </${p("Trigger")}>`,
    `${indent}  </${p("Header")}>`,
    `${indent}  <${p("Content")}>{/* ... */}</${p("Content")}>`,
    `${indent}</${p("Item")}>`,
  ];
};

/** The live counterpart to `sectionLines`. */
const Section = ({ section }: { section: (typeof SECTIONS)[number] }) => (
  <AccordionItem value={section.value}>
    <AccordionHeader>
      <AccordionTrigger>
        {section.title}
        <AccordionTriggerIcon>
          <ChevronDown aria-hidden="true" />
        </AccordionTriggerIcon>
      </AccordionTrigger>
    </AccordionHeader>
    <AccordionContent>{section.body}</AccordionContent>
  </AccordionItem>
);

/**
 * The controlled example's live half — a component because
 * `InteractiveExample`'s children are a render function and a hook cannot be
 * called from one.
 */
const ControlledExample = () => {
  const [open, setOpen] = useState<string[]>(["install"]);

  return (
    <div className="docs-example-stack">
      <p className="docs-prop-description">
        Open: {open.length > 0 ? open.join(", ") : "nothing"}
      </p>
      <Accordion multiple value={open} onValueChange={setOpen}>
        {SECTIONS.map((section) => (
          <Section key={section.value} section={section} />
        ))}
      </Accordion>
    </div>
  );
};

/**
 * Accordion's page content.
 *
 * The keyboard section is the one that earns its place here: unlike Modal or
 * Checkbox, the keys are NOT the platform's. A set of `<button>`s would move
 * focus with Tab; this binds the arrows to a roving tabindex instead, which is
 * what the WAI-ARIA Accordion pattern asks for and what a reader cannot infer
 * from the props table.
 */
export const accordionSpec: ComponentSpec = {
  playground: {
    component: "Accordion",
    /* Hand-written: `size` is the root's, but the parts below it are what a
       reader needs to see, and the generated `toJsx` prints a childless
       `<Accordion size="md" />`. */
    snippet: (values, mode) => {
      const p = partNamer(mode, "Accordion");
      return [
        imports(mode),
        ``,
        `<${p("Root")}${contractAttr({ mode, prop: "size", value: values.size })}>`,
        ...sectionLines(mode, SECTIONS[0]),
        `</${p("Root")}>`,
      ].join("\n");
    },
    fill: true,
    render: (values) => (
      <Accordion size={values.size as Size} defaultValue="install">
        {SECTIONS.map((section) => (
          <Section key={section.value} section={section} />
        ))}
      </Accordion>
    ),
  },

  anatomyMeta:
    "Six parts, and the nesting is not decorative. `Header` renders a real heading around the `Trigger` because the WAI-ARIA Accordion pattern requires one — that is what lets a screen reader list the sections as headings and jump between them.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        const p = partNamer(mode, "Accordion");
        return [
          `<${p("Root")}>`,
          `  <${p("Item")}>`,
          `    <${p("Header")}>`,
          `      <${p("Trigger")}>`,
          `        <${p("TriggerIcon")} />`,
          `      </${p("Trigger")}>`,
          `    </${p("Header")}>`,
          `    <${p("Content")} />`,
          `  </${p("Item")}>`,
          `</${p("Root")}>`,
        ].join("\n");
      },
    },
  ],

  keyboardMeta:
    "The triggers share a **single tab stop** — Tab moves into the accordion and then straight past it, and the arrows move between sections. That is the WAI-ARIA Accordion pattern, and it is why these keys are worth knowing: a plain set of buttons would behave differently. Movement wraps at both ends and skips disabled items.",

  keyboard: [
    { keys: ["Enter", "Space"], behaviour: "Toggle the focused section." },
    {
      keys: ["ArrowDown", "ArrowUp"],
      behaviour:
        "Move focus to the next / previous trigger, when `orientation` is vertical (the default).",
    },
    {
      keys: ["ArrowRight", "ArrowLeft"],
      behaviour:
        "The same, when `orientation` is horizontal. Under `dir=\"rtl\"` the pair is mirrored.",
    },
    { keys: ["Home", "End"], behaviour: "First / last enabled trigger." },
    { keys: ["Tab"], behaviour: "Leave the accordion — not move within it." },
  ],

  examples: [
    {
      id: "one-at-a-time",
      title: "One section at a time",
      render: () => (
        <InteractiveExample
          caption="The default: opening a section closes whichever was open. Use it when the sections are alternatives — a set of mutually exclusive settings, or a form whose steps are taken in order. `defaultValue` seeds which one starts open; omit it to start fully collapsed."
          code={(_density, mode) => {
            const p = partNamer(mode, "Accordion");
            return [
              imports(mode),
              ``,
              `<${p("Root")} defaultValue="install">`,
              ...SECTIONS.flatMap((section) => sectionLines(mode, section)),
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <Accordion defaultValue="install">
              {SECTIONS.map((section) => (
                <Section key={section.value} section={section} />
              ))}
            </Accordion>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "multiple",
      title: "Several at once",
      render: () => (
        <InteractiveExample
          caption="`multiple` lets sections open independently, which is what an FAQ or a reference page wants — closing what someone just read to show them something else is the wrong model there. One asymmetry to know: even in `multiple` mode an uncontrolled accordion can only seed **one** open section through `defaultValue`. Start with several and you need the controlled form below."
          code={(_density, mode) => {
            const p = partNamer(mode, "Accordion");
            return [
              imports(mode),
              ``,
              `<${p("Root")} multiple defaultValue="install">`,
              ...SECTIONS.flatMap((section) => sectionLines(mode, section)),
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <Accordion multiple defaultValue="install">
              {SECTIONS.map((section) => (
                <Section key={section.value} section={section} />
              ))}
            </Accordion>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "controlled",
      title: "Controlled",
      render: () => (
        <InteractiveExample
          caption="Pass `value` and `onValueChange` and the parent owns the open set — needed to start with several sections open, to open one in response to something else on the page, or to persist the state. `value` is always an **array**, even in single mode where it holds at most one entry. Note the uncontrolled form deliberately does not call `onValueChange`, matching Tabs: if you need to observe changes, you are controlled."
          code={(_density, mode) => {
            const p = partNamer(mode, "Accordion");
            return [
              imports(mode),
              ``,
              `const [open, setOpen] = useState<string[]>(["install"]);`,
              ``,
              `<${p("Root")} multiple value={open} onValueChange={setOpen}>`,
              ...SECTIONS.flatMap((section) => sectionLines(mode, section)),
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <ControlledExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "heading-level",
      title: "Heading level",
      render: () => (
        <InteractiveExample
          caption="`Accordion.Header` renders a real heading — `h3` by default — and `level` moves it to fit the page's outline. This is not styling: the pattern requires the trigger to sit inside a heading so assistive tech can list the sections and jump between them, and a heading at the wrong level breaks the document outline just as surely as a missing one. Pick the level that follows the heading above the accordion."
          code={(_density, mode) => {
            const p = partNamer(mode, "Accordion");
            return [
              imports(mode, ["Item", "Header", "Trigger", "Content"]),
              ``,
              `<h2>Frequently asked</h2>`,
              ``,
              `<${p("Root")}>`,
              `  <${p("Item")} value="install">`,
              `    {/* h3 by default; under an h2 that is already right. */}`,
              `    <${p("Header")} level={3}>`,
              `      <${p("Trigger")}>How do I install a component?</${p("Trigger")}>`,
              `    </${p("Header")}>`,
              `    <${p("Content")}>{/* ... */}</${p("Content")}>`,
              `  </${p("Item")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <Accordion defaultValue="install">
              {SECTIONS.slice(0, 2).map((section) => (
                <Section key={section.value} section={section} />
              ))}
            </Accordion>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "animation",
      title: "Animating the panel",
      render: () => (
        <InteractiveExample
          caption="The styled surface already animates: the panel is a grid whose row track moves between `0fr` and `1fr`, which is how a height transition runs to a height nobody has to measure. Doing it yourself needs `forceMount` — without it the panel unmounts when it closes and there is nothing left to transition. The panel keeps `aria-hidden` while closed either way, so a force-mounted panel is still invisible to assistive tech."
          code={(_density, mode) => {
            const p = partNamer(mode, "Accordion");
            return [
              imports(mode, ["Item", "Header", "Trigger", "Content"]),
              ``,
              `<${p("Content")} forceMount>{/* ... */}</${p("Content")}>`,
              ``,
              `/* Your stylesheet — the panel publishes data-state. */`,
              `.panel {`,
              `  display: grid;`,
              `  grid-template-rows: 0fr;`,
              `  transition: grid-template-rows 200ms ease;`,
              `}`,
              ``,
              `.panel[data-state="open"] { grid-template-rows: 1fr; }`,
              ``,
              `/* The child must be able to collapse to nothing. */`,
              `.panel > * { min-block-size: 0; overflow: hidden; }`,
            ].join("\n");
          }}
        >
          {() => (
            <Accordion defaultValue="install">
              {SECTIONS.map((section) => (
                <Section key={section.value} section={section} />
              ))}
            </Accordion>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "Each trigger sits inside a real heading (`Accordion.Header`, `h3` by default, `level` to change it). That is what the WAI-ARIA Accordion pattern requires and what lets a screen-reader user list the sections and jump straight to one — a `<div>` wrapper would leave them scrolling.",
    "The triggers share **one tab stop**. Tab moves into the accordion and then out of it; the arrows, Home and End move between sections. That is deliberate — a group of related controls behaves as one stop so a keyboard user is not made to Tab through every section to reach the content after it.",
    "`Enter` and `Space` toggle, because each trigger is a real `<button>` with `aria-expanded` and `aria-controls` wired to its panel. Nothing here reimplements a button.",
    "`disabled` on a trigger is rendered as `aria-disabled`, not the native attribute, so the trigger stays focusable and discoverable while being skipped by the arrow keys. A disabled control that cannot be focused is one a screen-reader user never learns exists.",
    "A closed panel is `hidden`, or `aria-hidden` when force-mounted for animation. Either way it is out of the accessibility tree, so a force-mounted panel never leaks its content to a screen reader while it looks closed.",
    "`Accordion.TriggerIcon` is decorative — give the chevron `aria-hidden`. The expanded state is already announced through `aria-expanded`, so a labelled icon would say it twice.",
    "Reach for `Collapsible` when there is only one section. An accordion of one is a disclosure with extra ARIA, and the arrow-key model it sets up has nothing to move between.",
  ],
};
