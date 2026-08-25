"use client";

import { useState } from "react";

import { Button } from "@/components/button";
import { Stack } from "@/components/stack";
import { Switch } from "@/components/switch";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: readonly Size[] = ["xs", "sm", "md", "lg", "xl"];

const imports = (mode: Mode) => importBlock({ mode, component: "Switch", componentId: "switch" });

/** Composed into two examples, so their snippets must import them too. */
const stackImports = (mode: Mode) => importBlock({ mode, component: "Stack", componentId: "stack" });
const buttonImports = (mode: Mode) =>
  importBlock({ mode, component: "Button", componentId: "button" });

/**
 * One switch, in the shape of the current mode.
 *
 * The two surfaces differ in STRUCTURE, not just naming, so this cannot be a
 * `partNamer` call at the point of use: the copied file exports a single
 * `Switch` that renders the track, the thumb and the label span for you, while
 * the headless compound exports `Root` and `Thumb` and expects you to place the
 * thumb yourself. `partNamer(mode, "Switch")` would cheerfully print
 * `SwitchThumb` under Styled, and the copied file exports no such symbol.
 *
 * The label is a plain text child either way — `Switch.Root` renders the
 * `<label>`, so text inside it is the label in both modes.
 */
const switchLines = (
  mode: Mode,
  label: string,
  { attrs = "", indent = "" }: { attrs?: string; indent?: string } = {},
) => {
  const p = partNamer(mode, "Switch");
  if (mode === "headless") {
    return [
      `${indent}<${p("Root")}${attrs}>`,
      `${indent}  <${p("Thumb")} />`,
      `${indent}  ${label}`,
      `${indent}</${p("Root")}>`,
    ];
  }
  return [`${indent}<Switch${attrs}>${label}</Switch>`];
};

/** The controlled example's live half. */
const ControlledExample = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <Stack gap="sm">
      <Switch checked={enabled} onCheckedChange={setEnabled}>
        Email notifications
      </Switch>
      <Stack direction="row" gap="sm">
        <Button size="sm" variant="secondary" onClick={() => setEnabled(true)}>
          Turn on
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setEnabled(false)}>
          Turn off
        </Button>
      </Stack>
    </Stack>
  );
};

/**
 * Switch's page content.
 *
 * The interesting thing about this component is that it is a REAL native
 * `<input type="checkbox" role="switch">` that happens to be invisible — which
 * is why the examples lead with form participation and with the reset caveat,
 * neither of which a props table can tell you.
 *
 * Anatomy earns its place for the reason Checkbox's does: the two surfaces have
 * a different SHAPE, not just different names, so a reader cannot infer one from
 * the other. Keyboard is included even though every key is native, because the
 * useful row is a negative one — `Enter` does not toggle it.
 */
export const switchSpec: ComponentSpec = {
  playground: {
    component: "Switch",
    /*
     * Not the generated `toJsx`: it printed `<Switch>Email notifications</Switch>`
     * under Headless, which renders a track with NO THUMB — the headless
     * compound expects you to place `Switch.Thumb` yourself. The two surfaces
     * differ in shape here, so the snippet has to be built per mode.
     */
    snippet: (values, mode) =>
      [
        imports(mode),
        ``,
        ...switchLines(mode, "Email notifications", {
          attrs: contractAttr({ mode, prop: "size", value: values.size }),
        }),
      ].join("\n"),
    render: (values) => <Switch size={values.size as Size}>Email notifications</Switch>,
  },

  anatomyMeta:
    "The same shape difference `Checkbox` has, for the same reason. `@primitiv-ui/react` exports `Root` and `Thumb` and leaves you to place the thumb; the copied file exports a single `Switch` that renders the track, the thumb and the label span itself — so there is no `SwitchThumb` to import under Styled. Either way the Root renders a real `<label>` wrapping a visually-hidden `<input type=\"checkbox\" role=\"switch\">`.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        const p = partNamer(mode, "Switch");
        if (mode === "headless") {
          return [`<${p("Root")}>`, `  <${p("Thumb")} />`, `  Email notifications`, `</${p("Root")}>`].join(
            "\n",
          );
        }
        return `<Switch>Email notifications</Switch>`;
      },
    },
  ],

  examples: [
    {
      id: "sizes",
      title: "Sizes and density",
      render: () => (
        <InteractiveExample
          caption="Five sizes, each rescaling again with the nearest `data-density` ancestor. The track height is deliberately the same as `Checkbox`'s and `Radio`'s box at every size and density, so a column mixing all three keeps one baseline — change the density above and the whole ramp shifts together."
          code={(density, mode) =>
            [
              imports(mode),
              ``,
              `<div data-density="${density}">`,
              ...SIZES.flatMap((s) =>
                switchLines(mode, "Email notifications", {
                  attrs: contractAttr({ mode, prop: "size", value: s, headlessClass: `switch--${s}` }),
                  indent: "  ",
                }),
              ),
              `</div>`,
            ].join("\n")
          }
        >
          {() =>
            SIZES.map((size) => (
              <Switch key={size} size={size}>
                Email notifications
              </Switch>
            ))
          }
        </InteractiveExample>
      ),
    },
    {
      id: "uncontrolled",
      title: "In a form (uncontrolled)",
      render: () => (
        <InteractiveExample
          caption="A switch is a real, visually-hidden `<input type=&quot;checkbox&quot;>`, so with `name` and `value` it submits and resets like any native control — no wiring, no hidden field. Pass `defaultChecked` and let the browser own the state. Press Reset: the switch returns to its default **and no React event fires**, which is exactly why the shipped stylesheet paints the on/off look from the input's native `:checked` rather than from `data-state`."
          code={(_density, mode) =>
            [
              imports(mode),
              buttonImports(mode),
              ``,
              `<form>`,
              ...switchLines(mode, "Email notifications", {
                attrs: ` name="notify" value="on" defaultChecked`,
                indent: "  ",
              }),
              `  <Button type="reset" variant="secondary">Reset</Button>`,
              `</form>`,
            ].join("\n")
          }
        >
          {() => (
            <form>
              <Stack gap="sm" align="start">
                <Switch name="notify" value="on" defaultChecked>
                  Email notifications
                </Switch>
                <Button type="reset" size="sm" variant="secondary">
                  Reset
                </Button>
              </Stack>
            </form>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "controlled",
      title: "Controlled",
      render: () => (
        <InteractiveExample
          caption="Pass `checked` and `onCheckedChange` together and the parent owns the value. The two are a **pair**: the props table flattens the controlled and uncontrolled shapes into one list, but TypeScript accepts only one of them at a time — `checked` with `onCheckedChange`, or `defaultChecked` alone. Mixing them is a type error, not a runtime surprise."
          code={(_density, mode) =>
            [
              `import { useState } from "react";`,
              imports(mode),
              ``,
              `const [enabled, setEnabled] = useState(false);`,
              ``,
              ...switchLines(mode, "Email notifications", {
                attrs: ` checked={enabled} onCheckedChange={setEnabled}`,
              }),
            ].join("\n")
          }
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
          caption="`disabled` on the root sets the native attribute on the hidden input, so the switch stops responding to clicks and leaves the tab order — the platform does the work, not a handler that returns early. `data-disabled` lands on the track for styling. A disabled switch still submits nothing, exactly as a disabled checkbox does."
          code={(_density, mode) =>
            [
              imports(mode),
              stackImports(mode),
              ``,
              `<Stack gap="sm">`,
              ...switchLines(mode, "Email notifications", { attrs: ` disabled`, indent: "  " }),
              ...switchLines(mode, "Push notifications", {
                attrs: ` disabled defaultChecked`,
                indent: "  ",
              }),
              `</Stack>`,
            ].join("\n")
          }
        >
          {() => (
            <>
              <Switch disabled>Email notifications</Switch>
              <Switch disabled defaultChecked>
                Push notifications
              </Switch>
            </>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "without-a-label",
      title: "Without a visible label",
      render: () => (
        <InteractiveExample
          caption="Omit the children and you get the bare track — for a switch in a table row or a toolbar, where a neighbouring cell or heading already names it. It then **needs** an `aria-label`, because nothing else does: the label span is where the accessible name normally comes from, and a switch announced as just “switch, off” tells you nothing about what it controls."
          code={(_density, mode) =>
            [
              imports(mode),
              ``,
              ...(mode === "headless"
                ? [
                    `<${partNamer(mode, "Switch")("Root")} aria-label="Email notifications">`,
                    `  <${partNamer(mode, "Switch")("Thumb")} />`,
                    `</${partNamer(mode, "Switch")("Root")}>`,
                  ]
                : [`<Switch aria-label="Email notifications" />`]),
            ].join("\n")
          }
        >
          {() => <Switch aria-label="Email notifications" />}
        </InteractiveExample>
      ),
    },
  ],

  keyboardMeta:
    "Entirely native, because the control really is a checkbox — which makes the useful row the one that is *absent*.",
  keyboard: [
    { keys: ["Space"], behaviour: "Toggle the switch." },
    { keys: ["Tab"], behaviour: "Move focus to or from the switch. A `disabled` switch is skipped." },
    {
      keys: ["Enter"],
      behaviour:
        "Does **nothing**. A checkbox-based control responds to `Space` only, and this one is a real checkbox — so a switch inside a `<form>` will not submit it either.",
    },
  ],

  accessibility: [
    "The hidden input carries `role=\"switch\"`, so it is announced as on/off rather than checked/unchecked. That is the whole reason to reach for this over `Checkbox`: a switch is an **immediate action**, a checkbox is a **selection** that takes effect when the form is submitted. If the setting only applies after a Save button, you want a checkbox.",
    "The input is visually hidden, not `display: none` — a hidden-by-`display` input is removed from the accessibility tree and from form submission entirely. It stays focusable and reachable by every assistive technology.",
    "A visible label is a real `<label>` wrapping the input, so clicking the text toggles the switch and the accessible name comes for free. With no visible label you must supply `aria-label` yourself.",
    "`disabled` uses the native attribute rather than `aria-disabled`, so the switch leaves the tab order. That is right for a setting that is genuinely unavailable; if you need it to stay discoverable, keep it enabled and explain the constraint in nearby text.",
    "Do not put the on/off state in the label text. The role already announces it, so “Email notifications: on” is read twice — label the *thing*, and let the switch report its own state.",
    "`data-state` on the track is a best-effort mirror for CSS, and it is **not** authoritative: a native form reset changes the input without firing a React event. Key visual state off `:checked` (the shipped stylesheet uses `:has(> input:checked)`), which stays correct through a reset.",
  ],
};
