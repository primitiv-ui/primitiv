"use client";

import { useEffect, useState } from "react";

import { Progress, ProgressIndicator } from "@/components/progress";
import { Stack } from "@/components/stack";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Intent = "primary" | "secondary" | "danger";

const SIZES: readonly Size[] = ["xs", "sm", "md", "lg", "xl"];
const INTENTS: readonly Intent[] = ["primary", "secondary", "danger"];

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Progress", componentId: "progress", parts: ["Indicator"] });
const stackImports = (mode: Mode) => importBlock({ mode, component: "Stack", componentId: "stack" });

/**
 * The bar's tree, per mode.
 *
 * Both surfaces have the same two parts — the copied file mirrors the headless
 * compound — so unlike the choice controls this really is only a rename. What it
 * does NOT do is omit the Indicator: the Root renders the track and nothing
 * else, so a bar without one is an empty track in both modes.
 */
const barLines = (
  mode: Mode,
  { attrs = "", indent = "" }: { attrs?: string; indent?: string } = {},
) => {
  const p = partNamer(mode, "Progress");
  return [
    `${indent}<${p("Root")}${attrs}>`,
    `${indent}  <${p("Indicator")} />`,
    `${indent}</${p("Root")}>`,
  ];
};

/** The determinate example's live half — a real value that climbs. */
const ClimbingExample = () => {
  const [value, setValue] = useState(12);

  useEffect(() => {
    const id = setInterval(() => setValue((v) => (v >= 100 ? 0 : v + 4)), 400);
    return () => clearInterval(id);
  }, []);

  return (
    <Stack gap="sm">
      <Progress value={value} aria-label="Uploading files">
        <ProgressIndicator />
      </Progress>
      <p className="docs-example-caption">
        <code>value={value}</code> · <code>data-state</code> is{" "}
        <code>{value >= 100 ? "complete" : "loading"}</code>
      </p>
    </Stack>
  );
};

/**
 * Progress's page content.
 *
 * Two things lead, and neither is visible from the props table.
 *
 * `value` is **nullable on purpose**: omitting it is not "zero", it is
 * *indeterminate* — a different ARIA state, a different `data-state`, and the
 * animated look. A reader who assumes `value` defaults to 0 gets an animated
 * unknown-progress bar and no idea why.
 *
 * And the bar has **no accessible name of its own**. `role="progressbar"` with
 * no name is announced as an unlabelled progress bar, so every example here
 * passes `aria-label`. The props table cannot say that, because the name comes
 * from a native attribute the component never declares.
 */
export const progressSpec: ComponentSpec = {
  playground: {
    component: "Progress",
    controls: [
      {
        name: "indeterminate",
        options: ["false", "true"],
        defaultValue: "false",
        description:
          "Drop `value` entirely. Not the same as `value={0}` — the bar's completion is unknown, so it animates and reports no percentage.",
      },
    ],
    /* Hand-written: `indeterminate` is a spec control (so the generated `toJsx`
       would drop it under Headless), and the Indicator is a part the generated
       childless line would omit — leaving an empty track. */
    snippet: (values, mode) =>
      [
        imports(mode),
        ``,
        ...barLines(mode, {
          attrs:
            `${contractAttr({ mode, prop: "size", value: values.size })}` +
            `${contractAttr({ mode, prop: "intent", value: values.intent })}` +
            `${values.indeterminate === "true" ? "" : " value={60}"}` +
            ` aria-label="${values.indeterminate === "true" ? "Loading, progress unknown" : "60% complete"}"`,
        }),
      ].join("\n"),
    render: (values) => (
      <div className="docs-example-stack">
        <Progress
          size={values.size as Size}
          intent={values.intent as Intent}
          value={values.indeterminate === "true" ? undefined : 60}
          aria-label={values.indeterminate === "true" ? "Loading, progress unknown" : "60% complete"}
        >
          <ProgressIndicator />
        </Progress>
      </div>
    ),
  },

  anatomyMeta:
    "Two parts, and the same two in both modes — the copied file mirrors the headless compound rather than collapsing it, so this is a rename and nothing more. The Root renders the track and the ARIA; the Indicator is the fill, and you place it yourself. Leave it out and you get an empty track, in either mode.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => barLines(mode, { attrs: ` value={60} aria-label="60% complete"` }).join("\n"),
    },
  ],

  examples: [
    {
      id: "value-and-indeterminate",
      title: "Value, and the absence of one (the headline)",
      render: () => (
        <InteractiveExample
          caption="`value` is `number | null`, and **omitting it means indeterminate, not zero**. A determinate bar reports `aria-valuenow` and a percentage through `aria-valuetext`, and resolves `data-state` to `loading` or `complete`; an indeterminate one reports neither, sets `data-state=&quot;indeterminate&quot;`, and animates to say so. That distinction is the whole reason `value` is nullable rather than defaulting to 0 — `0` is a known amount of progress, and `null` is not knowing."
          code={(_density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<Stack gap="sm">`,
              `  {/* determinate — reports 40% */}`,
              ...barLines(mode, { attrs: ` value={40} aria-label="40% complete"`, indent: "  " }),
              ``,
              `  {/* indeterminate — value omitted, NOT value={0} */}`,
              ...barLines(mode, { attrs: ` aria-label="Loading, progress unknown"`, indent: "  " }),
              ``,
              `  {/* complete */}`,
              ...barLines(mode, { attrs: ` value={100} aria-label="Complete"`, indent: "  " }),
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Stack gap="lg">
                <Progress value={40} aria-label="40% complete">
                  <ProgressIndicator />
                </Progress>
                <Progress aria-label="Loading, progress unknown">
                  <ProgressIndicator />
                </Progress>
                <Progress value={100} aria-label="Complete">
                  <ProgressIndicator />
                </Progress>
              </Stack>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "live",
      title: "A value that changes",
      render: () => (
        <InteractiveExample
          caption="Nothing to wire up: pass a new `value` and the fill follows. The Root republishes `data-value` and `data-max` on every render — as **attributes**, not just custom properties, so CSS can read the number and a test can assert on it without computing a style. `data-state` flips to `complete` at `value === max`, which is the hook to key a finished treatment off rather than comparing numbers in your own code."
          code={(_density, mode) =>
            [
              `import { useEffect, useState } from "react";`,
              imports(mode),
              ``,
              `const [value, setValue] = useState(12);`,
              `useEffect(() => {`,
              `  const id = setInterval(() => setValue((v) => (v >= 100 ? 0 : v + 4)), 400);`,
              `  return () => clearInterval(id);`,
              `}, []);`,
              ``,
              ...barLines(mode, { attrs: ` value={value} aria-label="Uploading files"` }),
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <ClimbingExample />
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "max-and-label",
      title: "A scale other than percent",
      render: () => (
        <InteractiveExample
          caption="`max` moves the upper bound, so `value` can be a count rather than a percentage — 7 of 12 steps, 3 of 5 uploads. The visual fill is the ratio either way, but the announcement should not be: `getValueLabel` writes `aria-valuetext`, and its default is a rounded percentage, which reads as &quot;58%&quot; when the useful sentence is &quot;7 of 12&quot;. Note it is not called at all while indeterminate — there is no value to describe. `max` must be positive and finite, and a non-null `value` outside `0..max` **throws** rather than clamping, on the grounds that a bar silently pinned at 100% hides the bug that produced it."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              ...barLines(mode, {
                attrs: `\n  value={7}\n  max={12}\n  getValueLabel={(value, max) => \`Step \${value} of \${max}\`}\n  aria-label="Setup progress"\n`,
              }),
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Progress
                value={7}
                max={12}
                getValueLabel={(value, max) => `Step ${value} of ${max}`}
                aria-label="Setup progress"
              >
                <ProgressIndicator />
              </Progress>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "intent",
      title: "Intent",
      render: () => (
        <InteractiveExample
          caption="Three fills. The **track stays neutral in every intent** — only the fill changes — so bars of different intents still read as the same control on one page. `secondary` is for progress that should not compete for attention (a background sync), and `danger` for progress *toward* a bad outcome, like a quota filling up. Intent is decoration: it carries no ARIA, so a `danger` bar announces exactly as a `primary` one does, and anything the colour is meant to convey needs saying in the label too."
          code={(_density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<Stack gap="lg">`,
              ...INTENTS.flatMap((i) =>
                barLines(mode, {
                  attrs: `${contractAttr({ mode, prop: "intent", value: i })} value={60} aria-label="60% complete"`,
                  indent: "  ",
                }),
              ),
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Stack gap="lg">
                {INTENTS.map((intent) => (
                  <Progress key={intent} intent={intent} value={60} aria-label={`60% complete, ${intent}`}>
                    <ProgressIndicator />
                  </Progress>
                ))}
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
          caption="Five track heights, each rescaling again with the nearest `data-density` ancestor. Size is the only thing that moves — the radius stays fully rounded at every height, so a bar never reads as a rectangle at `xl`."
          code={(density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<div data-density="${density}">`,
              `  <Stack gap="lg">`,
              ...SIZES.flatMap((s) =>
                barLines(mode, {
                  attrs: `${contractAttr({ mode, prop: "size", value: s })} value={60} aria-label="60% complete"`,
                  indent: "    ",
                }),
              ),
              `  </Stack>`,
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <div className="docs-example-stack">
              <Stack gap="lg">
                {SIZES.map((size) => (
                  <Progress key={size} size={size} value={60} aria-label={`60% complete, ${size}`}>
                    <ProgressIndicator />
                  </Progress>
                ))}
              </Stack>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "**Always pass a name.** `role=\"progressbar\"` is set for you, but the name is not — an unnamed bar is announced as \"progress bar\" and nothing else. Use `aria-label`, or `aria-labelledby` pointing at visible text. Every example on this page does; the props table cannot tell you to, because the name arrives through a native attribute the component never declares.",
    "The `aria-value*` family is **derived and cannot be overridden** — the props type omits `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-valuetext` precisely so a consumer cannot set a number that disagrees with `value`. Change the announcement through `getValueLabel`, not through `aria-valuetext`.",
    "An indeterminate bar reports **no** `aria-valuenow`, which is the correct ARIA for unknown progress — a bar that claimed `0` would be telling assistive technology that nothing has happened yet, which is a different statement. It is also why `value` is nullable rather than defaulting to zero.",
    "`getValueLabel` is what makes a non-percentage scale legible. The default renders `\"58%\"` for `value={7} max={12}`, which is accurate and useless — \"Step 7 of 12\" is the sentence a screen-reader user needs.",
    "**Progress is not a live region.** Nothing is announced as the value changes; the bar reports its current state when asked. If a completion genuinely needs announcing, put that message in your own live region (or an `Alert`) rather than expecting the bar to speak.",
    "`intent` carries no meaning for assistive technology — `danger` and `primary` announce identically. If the colour is doing semantic work (a quota nearly exhausted), say it in the label.",
    "Style off `data-state` (`indeterminate` / `loading` / `complete`) rather than deriving completion yourself. It is published on the Root by the headless layer, so it is right in both modes and cannot disagree with the ARIA beside it.",
  ],
};
