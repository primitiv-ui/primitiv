"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectItemLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { InlineCode } from "@/components/inline-code";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { ComponentSpec } from "./types";

const FRAMEWORKS = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "vite", label: "Vite" },
] as const;

/**
 * Select's page content.
 *
 * The example set mirrors the Figma "Component page — Select (desktop)" frame:
 * Rich mode (the default), Native mode, Grouped options, Controlled.
 */
export const selectSpec: ComponentSpec = {
  playground: {
    component: "Select",
    render: (values) => (
      <Select defaultValue="next">
        <SelectTrigger size={values.size as "xs" | "sm" | "md" | "lg" | "xl"}>
          <SelectValue placeholder="Pick a framework" />
        </SelectTrigger>
        <SelectContent
          size={values.size as "xs" | "sm" | "md" | "lg" | "xl"}
        >
          {FRAMEWORKS.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              <SelectItemLabel>{f.label}</SelectItemLabel>
              <SelectItemIndicator />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
  },

  examples: [
    {
      id: "rich-mode",
      title: "Rich mode (the default)",
      render: () => (
        <InteractiveExample
          caption="The default path: a Popover-API listbox whose rows can hold icons, labels and a selected mark. Size is set once on the root's parts and inherits down."
          code={(density) =>
            [
              `<div data-density="${density}">`,
              `  <Select defaultValue="next">`,
              `    <SelectTrigger>`,
              `      <SelectValue placeholder="Pick a framework" />`,
              `    </SelectTrigger>`,
              `    <SelectContent>`,
              `      <SelectItem value="next">`,
              `        <SelectItemLabel>Next.js</SelectItemLabel>`,
              `        <SelectItemIndicator />`,
              `      </SelectItem>`,
              `      {/* … */}`,
              `    </SelectContent>`,
              `  </Select>`,
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <Select defaultValue="next">
              <SelectTrigger>
                <SelectValue placeholder="Pick a framework" />
              </SelectTrigger>
              <SelectContent>
                {FRAMEWORKS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    <SelectItemLabel>{f.label}</SelectItemLabel>
                    <SelectItemIndicator />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "native-mode",
      title: "Native mode",
      render: () => (
        <InteractiveExample
          caption={
            <>
              <InlineCode>native</InlineCode> renders a real{" "}
              <InlineCode>&lt;select&gt;</InlineCode>, for flat option lists and
              the OS picker on mobile. Note the composition is{" "}
              <strong>not</strong> the same: items sit directly on the root, with
              no <InlineCode>Trigger</InlineCode>/
              <InlineCode>Content</InlineCode> — the root <em>is</em> the
              control, so those parts have nothing to wrap (and would throw,
              since the rich context only exists in rich mode). An{" "}
              <InlineCode>Item</InlineCode> also keeps only its text children,
              because an <InlineCode>&lt;option&gt;</InlineCode> cannot contain
              elements.
            </>
          }
          code={(density) =>
            [
              `<div data-density="${density}">`,
              `  <Select native defaultValue="next" aria-label="Pick a framework">`,
              `    <SelectPlaceholder>Choose…</SelectPlaceholder>`,
              `    <SelectItem value="next">Next.js</SelectItem>`,
              `    <SelectItem value="remix">Remix</SelectItem>`,
              `  </Select>`,
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            /* aria-label rather than a visible label: there is no Trigger to
               name it, and an unlabelled <select> is a real a11y failure. */
            <Select native defaultValue="next" aria-label="Pick a framework">
              {FRAMEWORKS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </Select>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "grouped-options",
      title: "Grouped options",
      render: () => (
        <InteractiveExample
          caption="SelectGroup takes its label as a string prop rather than JSX children — which sidesteps the text-vs-element extraction problem that Item has under native mode."
          code={(density) =>
            [
              `<div data-density="${density}">`,
              `  <SelectContent>`,
              `    <SelectGroup label="Meta-frameworks">`,
              `      <SelectItem value="next">…</SelectItem>`,
              `    </SelectGroup>`,
              `    <SelectGroup label="Bundlers">`,
              `      <SelectItem value="vite">…</SelectItem>`,
              `    </SelectGroup>`,
              `  </SelectContent>`,
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <Select defaultValue="next">
              <SelectTrigger>
                <SelectValue placeholder="Pick a tool" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup label="Meta-frameworks">
                  {FRAMEWORKS.slice(0, 3).map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <SelectItemLabel>{f.label}</SelectItemLabel>
                      <SelectItemIndicator />
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup label="Bundlers">
                  <SelectItem value="vite">
                    <SelectItemLabel>Vite</SelectItemLabel>
                    <SelectItemIndicator />
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "controlled",
      title: "Controlled",
      render: () => <ControlledSelectExample />,
    },
  ],

  accessibility: [
    "Rich mode renders a real listbox: role=listbox on the panel and role=option on each row, with aria-selected tracking the value.",
    "The panel lives in the top layer via the Popover API, so it escapes ancestor overflow and stacking contexts — and light dismiss (click outside, Escape) is handled by the browser rather than a hand-rolled outside-pointerdown listener.",
    "A hidden native <select> is rendered alongside rich mode so the control participates in normal form submission.",
    "Native mode is a real <select>, so it inherits the platform picker and every OS accessibility affordance for free.",
    "Typeahead, Home/End and arrow-key navigation come from the headless layer; the cursor row is tracked separately from the selected row.",
  ],
};

/**
 * Controlled mode, kept as a component rather than an inline render function
 * because it needs its own state — and showing the value outside the control is
 * the whole point of the example.
 */
const ControlledSelectExample = () => {
  const [value, setValue] = useState("next");

  return (
    <InteractiveExample
      caption={
        <>
          Pass <InlineCode>value</InlineCode> and{" "}
          <InlineCode>onValueChange</InlineCode> together. They are mutually
          exclusive with <InlineCode>defaultValue</InlineCode> — a discriminated
          union enforces it at the type level, which is why you will not find it
          in the props table below: a union collapses to a flat prop list when
          the types are extracted.
        </>
      }
      code={() =>
        [
          `const [value, setValue] = useState("next");`,
          ``,
          `<Select value={value} onValueChange={setValue}>`,
          `  <SelectTrigger>`,
          `    <SelectValue placeholder="Pick a framework" />`,
          `  </SelectTrigger>`,
          `  {/* … */}`,
          `</Select>`,
          ``,
          `// current value: ${JSON.stringify(value)}`,
        ].join("\n")
      }
    >
      {() => (
        <>
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder="Pick a framework" />
            </SelectTrigger>
            <SelectContent>
              {FRAMEWORKS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  <SelectItemLabel>{f.label}</SelectItemLabel>
                  <SelectItemIndicator />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <output className="docs-prop-description">
            Selected: <InlineCode>{value}</InlineCode>
          </output>
        </>
      )}
    </InteractiveExample>
  );
};
