"use client";

import { useState } from "react";

import { Button } from "@/components/button";
import {
  Stepper,
  StepperDescription,
  StepperLabel,
  StepperList,
  StepperMarker,
  StepperPanel,
  StepperStep,
} from "@/components/stepper";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Orientation = "horizontal" | "vertical";

/** The three steps every demo reuses, so the prose stays the subject. */
const STEPS = [
  {
    value: "account",
    title: "Account",
    description: "Email and password",
    body: "Create your account — the email you sign in with.",
  },
  {
    value: "profile",
    title: "Profile",
    description: "Name and avatar",
    body: "Tell us who you are. This is what other people see.",
  },
  {
    value: "review",
    title: "Review",
    description: "Confirm and submit",
    body: "Check everything over, then finish signing up.",
  },
] as const;

/** The import block a stepper snippet needs — registry-only, so the copied
 *  parts whichever mode you read (there is no headless counterpart). */
const IMPORTS = [
  `import {`,
  `  Stepper, StepperList, StepperStep, StepperMarker,`,
  `  StepperLabel, StepperDescription, StepperPanel,`,
  `} from "@/components/ui/stepper";`,
].join("\n");

/**
 * A step's marker + label + description, in one place. `state` drives the
 * marker glyph (number → tick → warning) via `StepperStep`; the caller never
 * branches on it.
 */
const stepLines = (indent = "    ") =>
  [
    `${indent}<StepperStep value={step.value} state={step.state}>`,
    `${indent}  <StepperMarker>{i + 1}</StepperMarker>`,
    `${indent}  <StepperLabel>{step.title}</StepperLabel>`,
    `${indent}  <StepperDescription>{step.description}</StepperDescription>`,
    `${indent}</StepperStep>`,
  ].join("\n");

/**
 * The rail + panels, controlled. Clicking a step (or arrowing to it and
 * pressing Enter) selects it — activation is `manual`, so focus alone never
 * changes the step. Reused by the playground and the orientation / compact
 * examples.
 */
const SimpleStepper = ({
  size,
  orientation = "horizontal",
  compact = false,
}: {
  size?: Size;
  orientation?: Orientation;
  compact?: boolean;
}) => {
  const [value, setValue] = useState<string>(STEPS[0].value);
  const index = STEPS.findIndex((s) => s.value === value);

  return (
    <div style={{ inlineSize: "100%" }}>
      <Stepper
        size={size}
        orientation={orientation}
        value={value}
        onValueChange={setValue}
      >
        <StepperList label="Setup progress" compact={compact}>
          {STEPS.map((step, i) => (
            <StepperStep key={step.value} value={step.value}>
              <StepperMarker>{i + 1}</StepperMarker>
              <StepperLabel>{step.title}</StepperLabel>
              <StepperDescription>{step.description}</StepperDescription>
            </StepperStep>
          ))}
        </StepperList>

        {/* Compact hides the markers and labels, so the step's name has to
            come from somewhere — and it is yours to write, because Stepper
            owns no step data model. */}
        {compact && (
          <p className="docs-prop-description">
            Step {index + 1} of {STEPS.length} — {STEPS[index].title}
          </p>
        )}

        {STEPS.map((step) => (
          <StepperPanel key={step.value} value={step.value}>
            {step.body}
          </StepperPanel>
        ))}
      </Stepper>
    </div>
  );
};

/**
 * The canonical wizard: controlled state, Back / Continue driving it, each
 * step marked `complete` once you move past it, and steps you have not reached
 * yet `disabled` so they cannot be skipped.
 */
const WizardStepper = ({ size }: { size?: Size }) => {
  const [current, setCurrent] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const last = STEPS.length - 1;

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), last);
    setFurthest((f) => Math.max(f, clamped));
    setCurrent(clamped);
  };

  return (
    <div style={{ inlineSize: "100%" }}>
      <Stepper
        size={size}
        value={STEPS[current].value}
        onValueChange={(v) => go(STEPS.findIndex((s) => s.value === v))}
      >
        <StepperList label="Sign-up progress">
          {STEPS.map((step, i) => (
            <StepperStep
              key={step.value}
              value={step.value}
              state={i < furthest ? "complete" : "upcoming"}
              disabled={i > furthest}
            >
              <StepperMarker>{i + 1}</StepperMarker>
              <StepperLabel>{step.title}</StepperLabel>
              <StepperDescription>{step.description}</StepperDescription>
            </StepperStep>
          ))}
        </StepperList>

        {STEPS.map((step) => (
          <StepperPanel key={step.value} value={step.value}>
            {step.body}
          </StepperPanel>
        ))}
      </Stepper>

      <div style={{ display: "flex", gap: "0.75rem", marginBlockStart: "1rem" }}>
        <Button
          variant="secondary"
          size={size}
          disabled={current === 0}
          onClick={() => go(current - 1)}
        >
          Back
        </Button>
        <Button
          size={size}
          disabled={current === last}
          onClick={() => go(current + 1)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

/**
 * Stepper's page content.
 *
 * Unlike a lone disclosure, the rail is a real **tablist** built on the
 * headless Tabs — so the keyboard model (roving tabindex, arrows, Home/End,
 * manual activation) is not the platform's and earns a section.
 */
export const stepperSpec: ComponentSpec = {
  playground: {
    component: "Stepper",
    /* `orientation` is a `Tabs.Root` prop, not a contract modifier, so it is
       not one of the contract-derived controls — but it changes the rail's
       whole layout, so it belongs here. `size` and `compact` come from the
       contract. */
    controls: [
      {
        name: "orientation",
        options: ["horizontal", "vertical"],
        defaultValue: "horizontal",
        description: "Direction the rail runs. Vertical places the rail beside the step bodies.",
      },
    ],
    /* Hand-written: this is a compound whose parts are the point, and its
       controls span two parts (`size` on the root, `compact` on the list), so
       the generated `toJsx` would print a childless, mis-propped tag. */
    snippet: (values) =>
      [
        IMPORTS,
        ``,
        `<Stepper size="${values.size}" orientation="${values.orientation}" defaultValue="account">`,
        `  <StepperList label="Setup progress"${values.compact === "true" ? " compact" : ""}>`,
        `    {steps.map((step, i) => (`,
        stepLines(),
        `    ))}`,
        `  </StepperList>`,
        ``,
        `  {steps.map((step) => (`,
        `    <StepperPanel value={step.value}>{step.body}</StepperPanel>`,
        `  ))}`,
        `</Stepper>`,
      ].join("\n"),
    fill: true,
    render: (values) => (
      <SimpleStepper
        /* Remounted when compact/orientation flips so the controlled step
           cannot carry a value the new layout cannot reach. */
        key={`${values.compact}-${values.orientation}`}
        size={values.size as Size}
        orientation={values.orientation as Orientation}
        compact={values.compact === "true"}
      />
    ),
  },

  anatomyMeta:
    "Seven parts over the headless Tabs. **The rail is a tablist** — each `StepperStep` is a real tab, so `aria-selected`, the roving tabindex and Home/End all come from Tabs, restyled as a circle. A step carries **two** independent state hooks: `data-state` (from Tabs) marks the *current* step, `data-step-state` (from `StepperStep`'s `state`) marks the progress it holds *in its own right* — so a failed step keeps its error marker while you stand on a later one. Each `StepperPanel` links to the step of the same `value`.",

  anatomy: [
    {
      label: "Parts",
      code: () =>
        [
          `<Stepper>`,
          `  <StepperList>`,
          `    <StepperStep>`,
          `      <StepperMarker />`,
          `      <StepperLabel />`,
          `      <StepperDescription />`,
          `    </StepperStep>`,
          `  </StepperList>`,
          `  <StepperPanel />`,
          `</Stepper>`,
        ].join("\n"),
    },
  ],

  keyboardMeta:
    "The rail is a tablist, so the steps share **one tab stop** and the arrows move between them. Activation is `manual` (unlike a plain Tabs): arrow keys move focus along the rail and `Enter` / `Space` commits, so browsing the steps never changes step under you and discards what is half-typed in the current panel. Disabled steps are skipped.",

  keyboard: [
    {
      keys: ["ArrowRight", "ArrowLeft"],
      behaviour:
        "Move focus to the next / previous step, when `orientation` is horizontal (the default). Under `dir=\"rtl\"` the pair is mirrored.",
    },
    {
      keys: ["ArrowDown", "ArrowUp"],
      behaviour: "The same, when `orientation` is vertical.",
    },
    { keys: ["Home", "End"], behaviour: "First / last enabled step." },
    { keys: ["Enter", "Space"], behaviour: "Activate the focused step." },
    { keys: ["Tab"], behaviour: "Leave the rail for the step panel — not move within it." },
  ],

  examples: [
    {
      id: "wizard",
      title: "A wizard (Back / Continue)",
      render: () => (
        <InteractiveExample
          caption={"The canonical use: the current step **is** the Stepper value, so a wizard needs no state beyond that one string. Here `Continue` advances it and marks the step behind you `complete` (the marker becomes a tick); steps you have not reached are `disabled` so they cannot be skipped. Drive validation your way — commit a step only once its fields pass, and set `state=\"error\"` on one that fails."}
          code={() =>
            [
              IMPORTS,
              `import { Button } from "@/components/ui/button";`,
              `import { useState } from "react";`,
              ``,
              `const [current, setCurrent] = useState(0);`,
              `const [furthest, setFurthest] = useState(0);`,
              ``,
              `<Stepper`,
              `  value={steps[current].value}`,
              `  onValueChange={(v) => go(steps.findIndex((s) => s.value === v))}`,
              `>`,
              `  <StepperList label="Sign-up progress">`,
              `    {steps.map((step, i) => (`,
              `      <StepperStep`,
              `        value={step.value}`,
              `        state={i < furthest ? "complete" : "upcoming"}`,
              `        disabled={i > furthest}`,
              `      >`,
              `        <StepperMarker>{i + 1}</StepperMarker>`,
              `        <StepperLabel>{step.title}</StepperLabel>`,
              `      </StepperStep>`,
              `    ))}`,
              `  </StepperList>`,
              ``,
              `  {steps.map((step) => (`,
              `    <StepperPanel value={step.value}>{step.body}</StepperPanel>`,
              `  ))}`,
              `</Stepper>`,
              ``,
              `<Button variant="secondary" onClick={() => go(current - 1)}>Back</Button>`,
              `<Button onClick={() => go(current + 1)}>Continue</Button>`,
            ].join("\n")
          }
        >
          {(density) => <WizardStepper size={density === "dense" ? "sm" : "md"} />}
        </InteractiveExample>
      ),
    },
    {
      id: "step-states",
      title: "Step states",
      render: () => (
        <InteractiveExample
          caption={"`state` is what a step carries **in its own right**, independent of which step is current: `complete` swaps the number for a tick, `error` for a warning glyph, `upcoming` keeps the number. It is deliberately separate from `data-state=\"active\"` (the current step, owned by Tabs) — so a step that failed validation keeps its error marker while you stand on a later one, which a single merged flag could not express."}
          code={() =>
            [
              IMPORTS,
              ``,
              `<Stepper defaultValue="review">`,
              `  <StepperList label="Checkout progress">`,
              `    <StepperStep value="cart" state="complete">`,
              `      <StepperMarker>1</StepperMarker>`,
              `      <StepperLabel>Cart</StepperLabel>`,
              `    </StepperStep>`,
              `    <StepperStep value="payment" state="error">`,
              `      <StepperMarker>2</StepperMarker>`,
              `      <StepperLabel>Payment</StepperLabel>`,
              `    </StepperStep>`,
              `    <StepperStep value="review" state="upcoming">`,
              `      <StepperMarker>3</StepperMarker>`,
              `      <StepperLabel>Review</StepperLabel>`,
              `    </StepperStep>`,
              `  </StepperList>`,
              `  {/* panels ... */}`,
              `</Stepper>`,
            ].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Stepper defaultValue="review">
                <StepperList label="Checkout progress">
                  <StepperStep value="cart" state="complete">
                    <StepperMarker>1</StepperMarker>
                    <StepperLabel>Cart</StepperLabel>
                    <StepperDescription>2 items</StepperDescription>
                  </StepperStep>
                  <StepperStep value="payment" state="error">
                    <StepperMarker>2</StepperMarker>
                    <StepperLabel>Payment</StepperLabel>
                    <StepperDescription>Card declined</StepperDescription>
                  </StepperStep>
                  <StepperStep value="review" state="upcoming">
                    <StepperMarker>3</StepperMarker>
                    <StepperLabel>Review</StepperLabel>
                    <StepperDescription>Confirm order</StepperDescription>
                  </StepperStep>
                </StepperList>
                <StepperPanel value="cart">Your cart has 2 items.</StepperPanel>
                <StepperPanel value="payment">
                  Your card was declined — try another.
                </StepperPanel>
                <StepperPanel value="review">
                  Review your order before submitting.
                </StepperPanel>
              </Stepper>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "vertical",
      title: "A vertical rail",
      render: () => (
        <InteractiveExample
          caption={"`orientation=\"vertical\"` runs the rail top-to-bottom and places the step bodies beside it. The arrow keys follow suit — `ArrowUp` / `ArrowDown` move between steps — and it is the shape to reach for when the labels are long or the container is tall and narrow."}
          code={() =>
            [
              IMPORTS,
              ``,
              `<Stepper orientation="vertical" defaultValue="account">`,
              `  <StepperList label="Setup progress">`,
              `    {/* steps ... */}`,
              `  </StepperList>`,
              `  {/* panels ... */}`,
              `</Stepper>`,
            ].join("\n")
          }
        >
          {(density) => (
            <SimpleStepper
              size={density === "dense" ? "sm" : "md"}
              orientation="vertical"
            />
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "compact",
      title: "Compact (progress bar)",
      render: () => (
        <InteractiveExample
          caption={"`compact` on `StepperList` collapses the rail into a segmented progress bar — the **same** steps, with their markers and labels hidden, for a container too narrow for a labelled rail. Drive it from the consumer side (e.g. `useMediaQuery`). The steps stay in the DOM, so every panel keeps its `aria-labelledby` pointing at a real trigger; because the labels are hidden, pair it with your own \"Step N of M\" line — you already have the index."}
          code={() =>
            [
              IMPORTS,
              `import { useMediaQuery } from "@primitiv-ui/react";`,
              ``,
              `const narrow = useMediaQuery("(max-width: 40rem)");`,
              ``,
              `<Stepper value={step} onValueChange={setStep}>`,
              `  <StepperList label="Setup progress" compact={narrow}>`,
              `    {/* steps ... */}`,
              `  </StepperList>`,
              ``,
              `  {narrow && <p>Step {index + 1} of {steps.length} — {steps[index].title}</p>}`,
              ``,
              `  {/* panels ... */}`,
              `</Stepper>`,
            ].join("\n")
          }
        >
          {(density) => (
            <SimpleStepper size={density === "dense" ? "sm" : "md"} compact />
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "The rail is a real tablist and every step a tab, so `aria-selected`, the roving tabindex and Home/End all come from the headless Tabs — nothing here reimplements them. `StepperList` requires `label` or `ariaLabelledBy`: a tablist with no accessible name gives a screen-reader user no idea what the steps belong to.",
    "Activation is `manual`. Arrow keys move focus along the rail and `Enter` / `Space` commits, so browsing the steps with the keyboard never changes step under the user and discards what is half-typed in the current panel.",
    "A step the user cannot reach yet is a `disabled` step — already a `Tabs.Trigger` prop, already correct for keyboard and screen readers, so it stays discoverable while being skipped by the arrows. There is no separate `linear` prop.",
    "`StepperMarker`'s tick and warning glyphs are `aria-hidden` decoration — the marker does not announce a step's `complete` / `error` state. Surface a failed step where it can be acted on: `aria-invalid` and error text on the fields inside its panel, which is also where a screen-reader user is when they hit the problem.",
    "`compact` keeps the steps in the DOM (only the markers and labels are hidden with `display: none`), so each panel's `aria-labelledby` still points at a real trigger. Swapping the rail out for a hand-rolled bar at narrow widths breaks that reference on exactly the viewport where it is least likely to be noticed.",
  ],
};
