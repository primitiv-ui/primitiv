# Stepper

A step rail for a multi-step form — numbered markers joined by connectors, with
a panel per step. Installed by `primitiv add stepper`.

**Each step is a real tab.** The rail is the headless
[`Tabs`](https://primitiv-ui.dev/docs/components/tabs) primitive restyled: every
marker is a `Tabs.Trigger`, so activation, `aria-selected`, the roving
tabindex, `Home`/`End` and `disabled` all arrive correct without this component
implementing any of them. Activation is `manual` by default — automatic
activation would change step the moment focus lands and discard whatever is
half-typed in the panel.

## Usage

```tsx
import {
  Stepper,
  StepperList,
  StepperStep,
  StepperMarker,
  StepperLabel,
  StepperDescription,
  StepperPanel,
} from "@/components/stepper";

const [step, setStep] = useState("account");

<Stepper value={step} onValueChange={setStep} size="md">
  <StepperList label="Sign-up progress">
    <StepperStep value="account" state="complete">
      <StepperMarker>1</StepperMarker>
      <StepperLabel>Account</StepperLabel>
      <StepperDescription>Email and password</StepperDescription>
    </StepperStep>
    <StepperStep value="profile">
      <StepperMarker>2</StepperMarker>
      <StepperLabel>Profile</StepperLabel>
    </StepperStep>
    <StepperStep value="review" disabled>
      <StepperMarker>3</StepperMarker>
      <StepperLabel>Review</StepperLabel>
    </StepperStep>
  </StepperList>

  <StepperPanel value="account">…</StepperPanel>
  <StepperPanel value="profile">…</StepperPanel>
  <StepperPanel value="review">…</StepperPanel>
</Stepper>;
```

`Stepper` owns no step data model — you write the steps, exactly as
`breadcrumb-overflow` takes children rather than a `label`/`href` array. Every
part is exported individually so a step can hold whatever it needs.

## Two state hooks, deliberately separate

| Hook | Set by | Means |
|---|---|---|
| `data-state="active"` | `Tabs` | This is the **current** step. |
| `data-step-state` | `StepperStep`'s `state` prop | What progress the step carries **in its own right** — `upcoming` (default), `complete` or `error`. |

They are separate because a failed step keeps its error marker while you stand
on a later one. One merged "active" flag could not express that.

`StepperMarker` renders its children — the step number — but swaps in a tick or
a warning glyph once the step reports `complete` or `error`, so you write the
number once and never branch on state. Both glyphs are inlined, so installing
Stepper pulls in no icon package.

## Guarding steps the user has not reached

There is no `linear` prop. A step the user cannot reach yet is a `disabled`
`StepperStep` — which is a `Tabs.Trigger` prop, already correct for keyboard and
screen readers. A strictly linear wizard disables every step past the current
one; a lenient one disables nothing and lets people jump back to anything
completed.

## Orientation

`orientation="vertical"` on `Stepper` runs the rail down the leading edge with
labels beside the markers. Tabs publishes `data-orientation`, which is what the
stylesheet keys off — nothing extra is passed.

## Motion

Three transitions, all decoration over state that is already carried by colour
and glyph:

- the **connector fills** on a `scale` transform from the leading edge, so
  advancing runs the line into the marker rather than repainting it;
- the **halo blooms** out from the marker as a step becomes current;
- the **active panel fades up** on arrival.

All of it is disabled under `prefers-reduced-motion: reduce`.

## Layout

The rail is a grid of **equal cells** — every step takes the same fraction of
the width, so a long label can never collide with its neighbour. Rejected during
design: markers flush to both ends with even pitch, which leaves the outer
labels with no cell of their own.

The connector is a **pseudo-element on the step**, not a component: a segment is
filled when the step to its *right* has been reached, so hanging it off that
step (`::before` for the track, `::after` for the fill) keeps the rule local and
means CSS never has to look forward at a sibling.

A marker is smaller than the 44px minimum touch target at every size below
`lg`, so the hit area is a transparent pseudo-element centred on the marker
rather than padding — padding would push the label away from the marker and
break the rail's even cells.

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the `.primitiv-stepper` root, its parts, the `--xs…--xl` modifiers, the `data-state`/`data-step-state`/`data-orientation` hooks and every `--primitiv-stepper-*` custom property. |
| `styles.css` | **authored** | The default theme: rail layout, marker/halo/connector anatomy, the size modifiers, and the state + motion rules. |
| `styles.scss` | **authored** | `styles.css` verbatim plus the `$primitiv-stepper-*` alias block. |
| `stepper.recipe.ts` | **authored** | `cva` per part; only the root carries a modifier group, because a step's appearance is driven by data attributes rather than variant classes. |
| `stepper.tsx` | **authored** | The seven parts, over the headless `Tabs`. |

Because the structure is bespoke rather than generator-emitted, `stepper.tsx` /
`stepper.recipe.ts` carry **no drift-guard test** (contrast the generated
wrappers, D53). They are still type-checked in CI by
`scripts/check-registry-types.mjs`.

## Dependencies

- [`@primitiv-ui/react`](https://www.npmjs.com/package/@primitiv-ui/react) — the
  headless `Tabs` primitive.
- [`class-variance-authority`](https://cva.style) — the recipes.
- The **token layer** (`primitiv tokens`) — for the `--primitiv-stepper-*`
  family plus `--primitiv-action-*`, `--primitiv-content-*`,
  `--primitiv-border-*`, `--primitiv-feedback-*`, `--primitiv-framed-control-*`,
  `--primitiv-focus-ring-*`, `--primitiv-label-*`, `--primitiv-body-*`,
  `--primitiv-panel-*`, `--primitiv-size-*`, `--primitiv-space-*`,
  `--primitiv-opacity-*` and `--primitiv-motion-*`.
