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

/** The chevron `@primitiv-ui/icons` draws, inlined as the CLI's example does. */
const CHEVRON =
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.06 9 12 17.06 3.94 9 5 7.94l7 7 7-7L20.06 9Z"/></svg>';

/**
 * The same sections as Elements markup (RFC 0033): the `@primitiv-ui/web`
 * custom elements, in the shape `primitiv add accordion --surface elements`
 * prints. Each trigger wraps a real `<button>`, the heading is a real `<h3>`
 * you write, and `value` lists the open items separated by spaces. Closed
 * panels carry `hidden`, so the page is right before the script loads; the
 * open one pre-renders `data-state`, so the styled panel does not animate open
 * on load. The two spans inside each panel are the styled surface's clip and
 * body — the headless tab drops them with the classes.
 */
const elementsTree = ({
  size = "md",
  value = "install",
  rootAttrs = "",
  heading = "h3",
  sections = SECTIONS,
}: {
  size?: string;
  /** The open items, space-separated, or "" for none. */
  value?: string;
  rootAttrs?: string;
  heading?: string;
  sections?: readonly (typeof SECTIONS)[number][];
} = {}) => {
  const open = value.split(" ");
  return [
    `<primitiv-accordion${value ? ` value="${value}"` : ""}${rootAttrs} class="primitiv-accordion primitiv-accordion--${size}">`,
    ...sections.flatMap((section) => {
      const state = open.includes(section.value) ? ' data-state="open"' : "";
      return [
        `  <primitiv-accordion-item value="${section.value}" class="primitiv-accordion__item">`,
        `    <${heading} class="primitiv-accordion__header">`,
        `      <primitiv-accordion-trigger>`,
        `        <button type="button" class="primitiv-accordion__trigger">`,
        `          <span class="primitiv-accordion__trigger-label">${section.title}</span>`,
        `          <primitiv-accordion-trigger-icon class="primitiv-accordion__trigger-icon"${state}>${CHEVRON}</primitiv-accordion-trigger-icon>`,
        `        </button>`,
        `      </primitiv-accordion-trigger>`,
        `    </${heading}>`,
        `    <primitiv-accordion-content class="primitiv-accordion__content"${state || " hidden"}>`,
        `      <span class="primitiv-accordion__content-inner"><span class="primitiv-accordion__content-body">${section.body}</span></span>`,
        `    </primitiv-accordion-content>`,
        `  </primitiv-accordion-item>`,
      ];
    }),
    `</primitiv-accordion>`,
  ].join("\n");
};

/**
 * The Controlled example's Elements preview: the full tree plus the readout,
 * so the DOM a reader inspects is the real thing.
 */
const controlledElementsPreview = () =>
  [
    `<div class="docs-example-stack">`,
    `<p class="docs-prop-description">Open: <span data-open-items>install</span></p>`,
    elementsTree({ rootAttrs: " multiple" }),
    `</div>`,
  ].join("\n");

/** Follows `primitiv-accordion-change` into the readout, as the code tab's listener does. */
const wireControlled = (root: HTMLElement) => {
  const accordion = root.querySelector("primitiv-accordion");
  const readout = root.querySelector("[data-open-items]");
  if (!accordion || !readout) return;
  const onChange = (event: Event) => {
    const { value } = (event as CustomEvent<{ value: string[] }>).detail;
    readout.textContent = value.length > 0 ? value.join(", ") : "nothing";
  };
  accordion.addEventListener("primitiv-accordion-change", onChange);
  return () => accordion.removeEventListener("primitiv-accordion-change", onChange);
};

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
 * The keyboard section is the one that earns its place here: on top of the
 * platform's Tab order (every trigger stays a stop), the arrows, Home and End
 * move between triggers — what the WAI-ARIA Accordion pattern adds, and what a
 * reader cannot infer from the props table.
 */
export const accordionSpec: ComponentSpec = {
  playground: {
    component: "Accordion",
    /*
     * `multiple` is the knob worth having here and the contract cannot supply
     * it: contract modifiers are class modifiers on the styled surface, and
     * this is a headless prop that changes BEHAVIOUR rather than appearance.
     * It exists in both modes, so unlike `size` it is not dropped under the
     * Headless tab.
     */
    controls: [
      {
        name: "multiple",
        options: ["false", "true"],
        defaultValue: "false",
        description:
          "Allow more than one section to be open. When false, opening one closes the last.",
      },
    ],
    /* Hand-written: `size` is the root's, but the parts below it are what a
       reader needs to see, and the generated `toJsx` prints a childless
       `<Accordion size="md" />`. */
    snippet: (values, mode) => {
      if (mode === "elements")
        return elementsTree({
          size: values.size,
          rootAttrs: values.multiple === "true" ? " multiple" : "",
        });
      const p = partNamer(mode, "Accordion");
      /* A valueless boolean attribute, the way it is actually written. */
      const multiple = values.multiple === "true" ? " multiple" : "";
      return [
        imports(mode),
        ``,
        `<${p("Root")}${multiple}${contractAttr({ mode, prop: "size", value: values.size })} defaultValue="install">`,
        ...SECTIONS.flatMap((section) => sectionLines(mode, section)),
        `</${p("Root")}>`,
      ].join("\n");
    },
    fill: true,
    render: (values) => (
      <Accordion
        /* Remounted when the mode flips, so the open set cannot carry over —
           switching to single with three sections open would otherwise leave
           an accordion in a state it can no longer reach on its own. */
        key={values.multiple}
        multiple={values.multiple === "true"}
        size={values.size as Size}
        defaultValue="install"
      >
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
        if (mode === "elements")
          return [
            `<primitiv-accordion>`,
            `  <primitiv-accordion-item value="...">`,
            `    <h3>`,
            `      <primitiv-accordion-trigger>`,
            `        <button type="button">`,
            `          <primitiv-accordion-trigger-icon></primitiv-accordion-trigger-icon>`,
            `        </button>`,
            `      </primitiv-accordion-trigger>`,
            `    </h3>`,
            `    <primitiv-accordion-content></primitiv-accordion-content>`,
            `  </primitiv-accordion-item>`,
            `</primitiv-accordion>`,
          ].join("\n");
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
    "Every trigger stays in the Tab order — there is no roving tab stop — and on top of that the arrows, `Home` and `End` move between triggers, which is what the WAI-ARIA Accordion pattern adds to a plain set of buttons. Movement wraps at both ends and skips disabled items.",

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
    {
      keys: ["Tab"],
      behaviour:
        "Move to the next trigger, or out of the accordion after the last — each trigger is its own stop.",
    },
  ],

  examples: [
    {
      id: "one-at-a-time",
      title: "One section at a time",
      render: () => (
        <InteractiveExample
          elementsCaption="The default: opening a section closes whichever was open. Use it when the sections are alternatives — a set of mutually exclusive settings, or a form whose steps are taken in order. `value` names the one that starts open; leave it off to start fully collapsed."
          caption="The default: opening a section closes whichever was open. Use it when the sections are alternatives — a set of mutually exclusive settings, or a form whose steps are taken in order. `defaultValue` seeds which one starts open; omit it to start fully collapsed."
          code={(_density, mode) => {
            if (mode === "elements") return elementsTree();
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
          elementsCaption="`multiple` lets sections open independently, which is what an FAQ or a reference page wants — closing what someone just read to show them something else is the wrong model there. `value` can start several open: list them separated by spaces, as `class` does."
          caption="`multiple` lets sections open independently, which is what an FAQ or a reference page wants — closing what someone just read to show them something else is the wrong model there. One asymmetry to know: even in `multiple` mode an uncontrolled accordion can only seed **one** open section through `defaultValue`. Start with several and you need the controlled form below."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsTree({ value: "install own", rootAttrs: " multiple" });
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
          elementsPreview={controlledElementsPreview}
          wire={wireControlled}
          elementsCaption="The `value` attribute is the state: set it from the server, from markup or with the `value` property (an array, or a space-separated string) to open sections, and listen for `primitiv-accordion-change` to follow the user. Its `detail.value` is every section open afterwards; the event fires before the change and is cancelable, so `preventDefault()` keeps the accordion as it is."
          caption="Pass `value` and `onValueChange` and the parent owns the open set — needed to start with several sections open, to open one in response to something else on the page, or to persist the state. `value` is always an **array**, even in single mode where it holds at most one entry. Note the uncontrolled form deliberately does not call `onValueChange`, matching Tabs: if you need to observe changes, you are controlled."
          code={(_density, mode) => {
            if (mode === "elements")
              return [
                `<!-- The value attribute is the state: set it to open sections,`,
                `     and listen for the change to follow the user. -->`,
                `<primitiv-accordion multiple value="install" class="primitiv-accordion primitiv-accordion--md">`,
                `  <!-- ... the same items ... -->`,
                `</primitiv-accordion>`,
                ``,
                `<script type="module">`,
                `  const accordion = document.querySelector("primitiv-accordion");`,
                `  accordion.addEventListener("primitiv-accordion-change", (event) => {`,
                `    console.log(event.detail.value); // preventDefault() vetoes it`,
                `  });`,
                `  accordion.value = ["install", "headless"];`,
                `</script>`,
              ].join("\n");
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
          elementsCaption="The heading is yours: wrap each `<primitiv-accordion-trigger>` in a real `<h2>`–`<h6>` at the level the page's outline needs — there is no header element to configure. This is not styling: the pattern requires the trigger to sit inside a heading so assistive tech can list the sections and jump between them, and a heading at the wrong level breaks the document outline just as surely as a missing one."
          caption="`Accordion.Header` renders a real heading — `h3` by default — and `level` moves it to fit the page's outline. This is not styling: the pattern requires the trigger to sit inside a heading so assistive tech can list the sections and jump between them, and a heading at the wrong level breaks the document outline just as surely as a missing one. Pick the level that follows the heading above the accordion."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsTree({ sections: SECTIONS.slice(0, 2) });
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
          elementsCaption="The styled surface already animates: the panel is a grid whose row track moves between `0fr` and `1fr`, and its display wins over `hidden`, so it needs nothing from you. With your own styles, add `force-mount` to a panel instead: it is then never `hidden`, and your CSS keys the transition off `data-state`. A closed panel carries `aria-hidden` either way, so it stays invisible to assistive tech."
          caption="The styled surface already animates: the panel is a grid whose row track moves between `0fr` and `1fr`, which is how a height transition runs to a height nobody has to measure. Doing it yourself needs `forceMount` — without it the panel unmounts when it closes and there is nothing left to transition. The panel keeps `aria-hidden` while closed either way, so a force-mounted panel is still invisible to assistive tech."
          code={(_density, mode) => {
            const p = partNamer(mode, "Accordion");
            return [
              ...(mode === "elements"
                ? [
                    `<primitiv-accordion-content force-mount class="panel">`,
                    `  <div><!-- ... --></div>`,
                    `</primitiv-accordion-content>`,
                  ]
                : [
                    imports(mode, ["Item", "Header", "Trigger", "Content"]),
                    ``,
                    `<${p("Content")} forceMount>{/* ... */}</${p("Content")}>`,
                  ]),
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
          elementsPreview={() => elementsTree()}
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

  elements: {
    anatomyMeta:
      "Five elements, and the nesting is not decorative. Each `<primitiv-accordion-item>` carries the `value` that `<primitiv-accordion>` lists while it is open, and pairs one trigger with one content. The heading is a real `<h3>` you write around the trigger — the WAI-ARIA Accordion pattern requires it, and it is what lets a screen reader list the sections and jump between them. The trigger wraps the `<button>` you write, which becomes the control.",
    keyboardMeta:
      "Every trigger stays in the Tab order — there is no roving tab stop — and on top of that the arrows, `Home` and `End` move between triggers, which is what the WAI-ARIA Accordion pattern adds to a plain set of buttons. Movement wraps at both ends and skips triggers with `disabled`.",
    keyboard: [
      { keys: ["Enter", "Space"], behaviour: "Toggle the focused section." },
      {
        keys: ["ArrowDown", "ArrowUp"],
        behaviour: "Move focus to the next / previous trigger (the default `vertical` orientation).",
      },
      {
        keys: ["ArrowRight", "ArrowLeft"],
        behaviour:
          "The same, with `orientation=\"horizontal\"`. They swap under right-to-left: set `dir=\"rtl\"` on the accordion or any ancestor.",
      },
      { keys: ["Home", "End"], behaviour: "First / last enabled trigger." },
      {
        keys: ["Tab"],
        behaviour:
          "Move to the next trigger, or out of the accordion after the last — each trigger is its own stop.",
      },
    ],
    accessibility: [
      "Each trigger sits inside a real heading you write — `<h3>` here, whatever level follows the heading above the accordion. That is what the WAI-ARIA Accordion pattern requires and what lets a screen-reader user list the sections and jump straight to one.",
      "Every trigger is its own tab stop, as the APG pattern specifies, and the arrows, Home and End add a faster way between sections.",
      "A trigger decorates the one `<button>` you put inside it, which receives `aria-expanded` and `aria-controls`; each content becomes a `role=\"region\"` labelled by its button, with ids generated where you gave none. A trigger without exactly one element child, or an item with no `value`, is reported once in the console and left alone.",
      "`disabled` on a trigger sets `aria-disabled` and `data-disabled` on its button rather than the native attribute, so it stays focusable and discoverable while the arrows skip it and nothing toggles it.",
      "A closed panel gets `hidden` and `aria-hidden`, so it is out of the accessibility tree even when a stylesheet keeps it displayed to animate it. Render `hidden` on closed panels in your own markup too: the page is then correct before the script loads.",
      "`role=\"none\"` on a `<primitiv-accordion-content>` opts it out of being a region landmark — worth it on an accordion with many sections, where every panel becoming a landmark crowds a screen reader's landmark list.",
      "`<primitiv-accordion-trigger-icon>` is decorative: the element gives it `aria-hidden` and a `data-state` to flip on. The expanded state is already announced through `aria-expanded`.",
      "Reach for Collapsible when there is only one section. An accordion of one is a disclosure with extra ARIA, and the arrow-key model it sets up has nothing to move between.",
    ],
  },

  accessibility: [
    "Each trigger sits inside a real heading (`Accordion.Header`, `h3` by default, `level` to change it). That is what the WAI-ARIA Accordion pattern requires and what lets a screen-reader user list the sections and jump straight to one — a `<div>` wrapper would leave them scrolling.",
    "Every trigger is its own tab stop, as the APG pattern specifies, and the arrows, Home and End add a faster way between sections. Tab also reaches anything focusable inside an open panel, in reading order.",
    "`Enter` and `Space` toggle, because each trigger is a real `<button>` with `aria-expanded` and `aria-controls` wired to its panel. Nothing here reimplements a button.",
    "`disabled` on a trigger is rendered as `aria-disabled`, not the native attribute, so the trigger stays focusable and discoverable while being skipped by the arrow keys. A disabled control that cannot be focused is one a screen-reader user never learns exists.",
    "A closed panel is `hidden`, or `aria-hidden` when force-mounted for animation. Either way it is out of the accessibility tree, so a force-mounted panel never leaks its content to a screen reader while it looks closed.",
    "`Accordion.TriggerIcon` is decorative — give the chevron `aria-hidden`. The expanded state is already announced through `aria-expanded`, so a labelled icon would say it twice.",
    "Reach for `Collapsible` when there is only one section. An accordion of one is a disclosure with extra ARIA, and the arrow-key model it sets up has nothing to move between.",
  ],
};
