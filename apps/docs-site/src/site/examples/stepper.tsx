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
import type { StepState } from "@/components/stepper";

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
 * The same stepper as Elements markup (RFC 0033): the `<primitiv-tabs>`
 * elements wearing the stepper classes, in the shape `primitiv add stepper
 * --surface elements` prints. Stepper adds no element of its own — Tabs' script
 * defines everything — so a step's progress is a `data-step-state` attribute on
 * its `<button>`, and its marker holds what that state shows, as React's
 * `StepperMarker` renders it: the number, the tick span, or the warning glyph.
 */
type ElementsStep = {
  readonly value: string;
  readonly title: string;
  readonly description?: string;
  readonly body: string;
  readonly state?: StepState;
  readonly disabled?: boolean;
};

/** The warning glyph `StepperMarker` inlines for an errored step. */
const ERROR_GLYPH =
  `<svg class="primitiv-stepper__marker-error" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="10.2" y="3.6" width="3.6" height="10.6" rx="1.8" /><circle cx="12" cy="18.6" r="2" /></svg>`;

const markerGlyph = (state: StepState, n: number) =>
  state === "complete"
    ? `<span class="primitiv-stepper__marker-mark"></span>`
    : state === "error"
      ? ERROR_GLYPH
      : `<span class="primitiv-stepper__marker-number">${n}</span>`;

const elementsTree = ({
  size = "md",
  orientation = "horizontal",
  compact = false,
  label = "Setup progress",
  value,
  steps = STEPS,
  descriptions = true,
  between = [],
}: {
  size?: string;
  orientation?: string;
  compact?: boolean;
  label?: string;
  /** The current step; defaults to the first. Only its panel is not `hidden`. */
  value?: string;
  steps?: readonly ElementsStep[];
  descriptions?: boolean;
  /** Lines between the list and the panels — compact's "Step N of M". */
  between?: readonly string[];
} = {}) => {
  const current = value ?? steps[0].value;
  return [
    `<primitiv-tabs value="${current}" activation-mode="manual"${orientation === "vertical" ? ` orientation="vertical"` : ""} class="primitiv-stepper primitiv-stepper--${size}">`,
    `  <primitiv-tabs-list label="${label}" class="primitiv-stepper__list${compact ? " primitiv-stepper__list--compact" : ""}">`,
    ...steps.flatMap((step, i) => {
      const state = step.state ?? "upcoming";
      return [
        `    <primitiv-tabs-trigger value="${step.value}"${step.disabled ? " disabled" : ""}>`,
        `      <button type="button" class="primitiv-stepper__step" data-step-state="${state}">`,
        `        <span class="primitiv-stepper__marker">${markerGlyph(state, i + 1)}</span>`,
        `        <span class="primitiv-stepper__label">${step.title}</span>`,
        ...(descriptions && step.description
          ? [`        <span class="primitiv-stepper__description">${step.description}</span>`]
          : []),
        `      </button>`,
        `    </primitiv-tabs-trigger>`,
      ];
    }),
    `  </primitiv-tabs-list>`,
    ...between.map((line) => `  ${line}`),
    ...steps.map(
      (step) =>
        `  <primitiv-tabs-content value="${step.value}" class="primitiv-stepper__panel"${step.value === current ? "" : " hidden"}>${step.body}</primitiv-tabs-content>`,
    ),
    `</primitiv-tabs>`,
  ].join("\n");
};

/** The wizard's opening state: on the first step, the later two locked. */
const WIZARD_STEPS: readonly ElementsStep[] = STEPS.map((step, i) => ({
  ...step,
  disabled: i > 0,
}));

const WIZARD_BUTTONS = [
  `<div>`,
  `  <button type="button" class="primitiv-button primitiv-button--secondary primitiv-button--md" data-back disabled>`,
  `    <span class="primitiv-button__label">Back</span>`,
  `  </button>`,
  `  <button type="button" class="primitiv-button primitiv-button--primary primitiv-button--md" data-continue>`,
  `    <span class="primitiv-button__label">Continue</span>`,
  `  </button>`,
  `</div>`,
];

const wizardMarkup = () =>
  [elementsTree({ label: "Sign-up progress", steps: WIZARD_STEPS, descriptions: false }), ``, ...WIZARD_BUTTONS].join(
    "\n",
  );

/**
 * A preview fills the card, as React's demos do with their full-width wrapper:
 * a stepper's root otherwise shrinks to its content inside the preview, and a
 * rail of equal cells — or a compact bar — then spans a fraction of the card.
 */
const filling = (markup: string) => [`<div class="docs-example-stack">`, markup, `</div>`].join("\n");

/** The preview's copy: the docs' own row spaces the buttons, as a consumer's layout would. */
const wizardPreview = () =>
  filling(wizardMarkup().replace("\n<div>\n", `\n<div class="docs-example-row">\n`));

/**
 * The wizard's script — what the code tab prints, and what `wireWizard` runs.
 * Class-agnostic on purpose: the headless code tab is this same text with the
 * markup's classes stripped, so the script must find its parts by element and
 * attribute, and the glyph swap is skipped where there is no styled marker.
 */
const WIZARD_SCRIPT = [
  `<script type="module">`,
  `  const stepper = document.querySelector("primitiv-tabs");`,
  `  const triggers = [...stepper.querySelectorAll("primitiv-tabs-trigger")];`,
  `  const back = document.querySelector("[data-back]");`,
  `  const next = document.querySelector("[data-continue]");`,
  `  const sync = () => {`,
  `    const i = triggers.findIndex((t) => t.getAttribute("value") === stepper.value);`,
  `    back.disabled = i === 0;`,
  `    next.disabled = i === triggers.length - 1;`,
  `  };`,
  `  const go = (by) => {`,
  `    const i = triggers.findIndex((t) => t.getAttribute("value") === stepper.value);`,
  `    const target = triggers[i + by];`,
  `    if (!target) return;`,
  `    if (by > 0) {`,
  `      // The step behind you is done; the one ahead is unlocked.`,
  `      const step = triggers[i].querySelector("button");`,
  `      step.dataset.stepState = "complete";`,
  `      const tick = document.createElement("span");`,
  `      tick.className = "primitiv-stepper__marker-mark";`,
  `      step.querySelector(".primitiv-stepper__marker")?.replaceChildren(tick);`,
  `      target.removeAttribute("disabled");`,
  `    }`,
  `    stepper.value = target.getAttribute("value");`,
  `    sync();`,
  `  };`,
  `  back.addEventListener("click", () => go(-1));`,
  `  next.addEventListener("click", () => go(1));`,
  `  stepper.addEventListener("primitiv-tabs-change", () => queueMicrotask(sync));`,
  `</script>`,
].join("\n");

/** Runs `WIZARD_SCRIPT` against the preview, scoped to its root. */
const wireWizard = (root: HTMLElement) => {
  const stepper = root.querySelector<HTMLElement & { value: string }>("primitiv-tabs");
  const back = root.querySelector<HTMLButtonElement>("[data-back]");
  const next = root.querySelector<HTMLButtonElement>("[data-continue]");
  if (!stepper || !back || !next) return;
  const triggers = [...stepper.querySelectorAll("primitiv-tabs-trigger")];
  const index = () => triggers.findIndex((t) => t.getAttribute("value") === stepper.getAttribute("value"));
  const sync = () => {
    back.disabled = index() === 0;
    next.disabled = index() === triggers.length - 1;
  };
  const go = (by: number) => {
    const i = index();
    const target = triggers[i + by];
    if (!target) return;
    if (by > 0) {
      const step = triggers[i].querySelector("button");
      if (step) {
        step.dataset.stepState = "complete";
        const marker = step.querySelector(".primitiv-stepper__marker");
        if (marker) marker.innerHTML = `<span class="primitiv-stepper__marker-mark"></span>`;
      }
      target.removeAttribute("disabled");
    }
    stepper.setAttribute("value", target.getAttribute("value") ?? "");
    sync();
  };
  const onBack = () => go(-1);
  const onNext = () => go(1);
  const onChange = () => queueMicrotask(sync);
  back.addEventListener("click", onBack);
  next.addEventListener("click", onNext);
  stepper.addEventListener("primitiv-tabs-change", onChange);
  return () => {
    back.removeEventListener("click", onBack);
    next.removeEventListener("click", onNext);
    stepper.removeEventListener("primitiv-tabs-change", onChange);
  };
};

const COMPACT_STATUS = `<p data-step-status>Step 1 of ${STEPS.length} — ${STEPS[0].title}</p>`;

const compactMarkup = () => elementsTree({ compact: true, between: [COMPACT_STATUS] });

/** The preview's copy, the status line in the docs' own caption type, as React's demo has it. */
const compactPreview = () =>
  filling(compactMarkup()).replace("<p data-step-status>", `<p class="docs-prop-description" data-step-status>`);

/** Keeps the "Step N of M" line on the current step, as the code tab's script does. */
const wireCompact = (root: HTMLElement) => {
  const stepper = root.querySelector("primitiv-tabs");
  const status = root.querySelector("[data-step-status]");
  if (!stepper || !status) return;
  const onChange = (event: Event) => {
    const value = (event as CustomEvent<{ value: string }>).detail.value;
    const i = STEPS.findIndex((step) => step.value === value);
    status.textContent = `Step ${i + 1} of ${STEPS.length} — ${STEPS[i].title}`;
  };
  stepper.addEventListener("primitiv-tabs-change", onChange);
  return () => stepper.removeEventListener("primitiv-tabs-change", onChange);
};

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
    snippet: (values, mode) =>
      mode === "elements"
        ? elementsTree({
            size: values.size,
            orientation: values.orientation,
            compact: values.compact === "true",
          })
        : [
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
      code: (mode) =>
        mode === "elements"
          ? [
              `<primitiv-tabs class="primitiv-stepper">`,
              `  <primitiv-tabs-list class="primitiv-stepper__list">`,
              `    <primitiv-tabs-trigger>`,
              `      <button class="primitiv-stepper__step" data-step-state>`,
              `        <span class="primitiv-stepper__marker"></span>`,
              `        <span class="primitiv-stepper__label"></span>`,
              `        <span class="primitiv-stepper__description"></span>`,
              `      </button>`,
              `    </primitiv-tabs-trigger>`,
              `  </primitiv-tabs-list>`,
              `  <primitiv-tabs-content class="primitiv-stepper__panel"></primitiv-tabs-content>`,
              `</primitiv-tabs>`,
            ].join("\n")
          : [
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
          elementsPreview={wizardPreview}
          wire={wireWizard}
          elementsCaption={"The current step **is** the `value` attribute on `<primitiv-tabs>`, so a wizard needs no state beyond that one string. Here Continue marks the step behind you `data-step-state=\"complete\"` (and swaps its number for the tick), removes `disabled` from the trigger ahead and sets `value`; steps you have not reached keep `disabled`, so they cannot be skipped. Listen for `primitiv-tabs-change` to follow a click on the rail — it is cancelable, so `preventDefault()` keeps the user on a step whose fields have not passed. Set `data-step-state=\"error\"` on one that fails."}
          caption={"The canonical use: the current step **is** the Stepper value, so a wizard needs no state beyond that one string. Here `Continue` advances it and marks the step behind you `complete` (the marker becomes a tick); steps you have not reached are `disabled` so they cannot be skipped. Drive validation your way — commit a step only once its fields pass, and set `state=\"error\"` on one that fails."}
          code={(_density, mode) =>
            mode === "elements"
              ? [wizardMarkup(), ``, WIZARD_SCRIPT].join("\n")
              : [
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
          elementsPreview={(_density, code) => filling(code)}
          elementsCaption={"`data-step-state` on a step's `<button>` is what it carries **in its own right**, independent of which step is current: `upcoming` keeps the number, `complete` the tick, `error` the warning glyph — write the glyph its state calls for into the marker. It is deliberately separate from `data-state=\"active\"`, which the Tabs elements write on the current step, so a step that failed validation keeps its error marker while you stand on a later one."}
          caption={"`state` is what a step carries **in its own right**, independent of which step is current: `complete` swaps the number for a tick, `error` for a warning glyph, `upcoming` keeps the number. It is deliberately separate from `data-state=\"active\"` (the current step, owned by Tabs) — so a step that failed validation keeps its error marker while you stand on a later one, which a single merged flag could not express."}
          code={(_density, mode) =>
            mode === "elements"
              ? elementsTree({
                  label: "Checkout progress",
                  value: "review",
                  steps: [
                    { value: "cart", title: "Cart", description: "2 items", body: "Your cart has 2 items.", state: "complete" },
                    { value: "payment", title: "Payment", description: "Card declined", body: "Your card was declined — try another.", state: "error" },
                    { value: "review", title: "Review", description: "Confirm order", body: "Review your order before submitting." },
                  ],
                })
              : [
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
          elementsPreview={(_density, code) => filling(code)}
          elementsCaption={"`orientation=\"vertical\"` on `<primitiv-tabs>` runs the rail top-to-bottom and places the step bodies beside it. The arrow keys follow suit — `ArrowUp` / `ArrowDown` move between steps — and it is the shape to reach for when the labels are long or the container is tall and narrow."}
          caption={"`orientation=\"vertical\"` runs the rail top-to-bottom and places the step bodies beside it. The arrow keys follow suit — `ArrowUp` / `ArrowDown` move between steps — and it is the shape to reach for when the labels are long or the container is tall and narrow."}
          code={(density, mode) =>
            mode === "elements"
              ? elementsTree({ size: density === "dense" ? "sm" : "md", orientation: "vertical" })
              : [
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
          elementsPreview={compactPreview}
          wire={wireCompact}
          elementsCaption={"The `primitiv-stepper__list--compact` class on the list collapses the rail into a segmented progress bar — the **same** steps, with their markers and labels hidden, for a container too narrow for a labelled rail. Toggle it from a media or container query, or a script. The steps stay in the page, so every panel keeps its `aria-labelledby` pointing at a real tab; because the labels are hidden, write your own \"Step N of M\" line and keep it current from `primitiv-tabs-change`."}
          caption={"`compact` on `StepperList` collapses the rail into a segmented progress bar — the **same** steps, with their markers and labels hidden, for a container too narrow for a labelled rail. Drive it from the consumer side (e.g. `useMediaQuery`). The steps stay in the DOM, so every panel keeps its `aria-labelledby` pointing at a real trigger; because the labels are hidden, pair it with your own \"Step N of M\" line — you already have the index."}
          code={(_density, mode) =>
            mode === "elements"
              ? [
                  compactMarkup(),
                  ``,
                  `<script type="module">`,
                  `  const stepper = document.querySelector("primitiv-tabs");`,
                  `  const status = document.querySelector("[data-step-status]");`,
                  `  const titles = ${JSON.stringify(STEPS.map((step) => step.title))};`,
                  `  const values = ${JSON.stringify(STEPS.map((step) => step.value))};`,
                  `  stepper.addEventListener("primitiv-tabs-change", (event) => {`,
                  `    const i = values.indexOf(event.detail.value);`,
                  `    status.textContent = \`Step \${i + 1} of \${titles.length} — \${titles[i]}\`;`,
                  `  });`,
                  `</script>`,
                ].join("\n")
              : [
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

  elements: {
    description:
      "A step rail for a multi-step form — numbered markers joined by connectors. In plain markup it is the `<primitiv-tabs>` elements wearing the stepper classes, so it loads Tabs' script and adds no element of its own: each marker is a real tab, so activation, `aria-selected`, the roving `tabindex`, `Home` / `End` and `disabled` all come from Tabs, restyled as a circle. The current step is the `value` attribute; the progress a step carries is `data-step-state` on its `<button>`.",
    anatomyMeta:
      "No elements of its own: the Tabs elements, arranged. `<primitiv-tabs>` holds the current step in `value`; each `<primitiv-tabs-trigger>` wraps the `<button>` that becomes the tab, holding the marker, label and description spans; each `<primitiv-tabs-content>` is the step's body for the trigger of the same `value`. A step carries **two** independent state hooks: `data-state` (written by the elements) marks the *current* step, `data-step-state` (written by you) the progress it holds *in its own right*. Its attributes and events are Tabs', listed below.",
    keyboardMeta:
      "The rail is a tablist, so the steps share **one tab stop** and the arrows move between them. Write `activation-mode=\"manual\"` on `<primitiv-tabs>`, as the examples do: arrow keys then move focus along the rail and `Enter` / `Space` commits, so browsing the steps never changes step under you and discards what is half-typed in the current panel. A trigger with `disabled` is skipped.",
    keyboard: [
      {
        keys: ["ArrowRight", "ArrowLeft"],
        behaviour:
          "Move focus to the next / previous step in a horizontal rail. They swap under right-to-left: set `dir=\"rtl\"` on the stepper or any ancestor.",
      },
      {
        keys: ["ArrowDown", "ArrowUp"],
        behaviour: "The same, when `orientation=\"vertical\"`.",
      },
      { keys: ["Home", "End"], behaviour: "First / last enabled step." },
      { keys: ["Enter", "Space"], behaviour: "Activate the focused step." },
      { keys: ["Tab"], behaviour: "Leave the rail for the step panel — not move within it." },
    ],
    accessibility: [
      "The rail is a real tablist and every step a tab: the Tabs elements write `role=\"tablist\"` on the list, `role=\"tab\"` with `aria-selected` and `aria-controls` on the `<button>` inside each trigger, and `role=\"tabpanel\"` with `aria-labelledby` on each content. Give `<primitiv-tabs-list>` a `label` or `aria-labelledby` — an unnamed tablist gives a screen-reader user no idea what the steps belong to.",
      "Write `activation-mode=\"manual\"`. Arrow keys then move focus along the rail and `Enter` / `Space` commits, so browsing the steps with the keyboard never changes step under the user and discards what is half-typed in the current panel.",
      "A step the user cannot reach yet is a trigger with `disabled`: its tab gets `aria-disabled` and `data-disabled`, stays discoverable, and is skipped by the arrows. Remove the attribute to unlock it.",
      "The tick and warning glyphs are decoration — the marker does not announce a step's `complete` / `error` state. Surface a failed step where it can be acted on: `aria-invalid` and error text on the fields inside its panel, which is also where a screen-reader user is when they hit the problem.",
      "Inactive panels stay in the page with `hidden`, so a half-filled form keeps its values as the user moves around the rail. Render `hidden` on them in your own markup too, so the page is correct before the script loads.",
      "The compact class keeps the steps in the page (only the markers and labels are hidden with `display: none`), so each panel's `aria-labelledby` still points at a real tab. Swapping the rail out for a hand-rolled bar at narrow widths breaks that reference on exactly the viewport where it is least likely to be noticed.",
    ],
  },

  accessibility: [
    "The rail is a real tablist and every step a tab, so `aria-selected`, the roving tabindex and Home/End all come from the headless Tabs — nothing here reimplements them. `StepperList` requires `label` or `ariaLabelledBy`: a tablist with no accessible name gives a screen-reader user no idea what the steps belong to.",
    "Activation is `manual`. Arrow keys move focus along the rail and `Enter` / `Space` commits, so browsing the steps with the keyboard never changes step under the user and discards what is half-typed in the current panel.",
    "A step the user cannot reach yet is a `disabled` step — already a `Tabs.Trigger` prop, already correct for keyboard and screen readers, so it stays discoverable while being skipped by the arrows. There is no separate `linear` prop.",
    "`StepperMarker`'s tick and warning glyphs are `aria-hidden` decoration — the marker does not announce a step's `complete` / `error` state. Surface a failed step where it can be acted on: `aria-invalid` and error text on the fields inside its panel, which is also where a screen-reader user is when they hit the problem.",
    "`compact` keeps the steps in the DOM (only the markers and labels are hidden with `display: none`), so each panel's `aria-labelledby` still points at a real trigger. Swapping the rail out for a hand-rolled bar at narrow widths breaks that reference on exactly the viewport where it is least likely to be noticed.",
  ],
};
