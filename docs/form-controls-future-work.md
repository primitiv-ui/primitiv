# Form controls — future work

The headless text-input story is complete: `Input`, `InputGroup`,
`Field`, and the `FieldContext` opt-in for `Input` / `Textarea` /
`Select`. This doc captures what's deferred so the next session can
pick it up cold.

## What shipped

| Primitive    | Role                                                        | Field-aware |
| ------------ | ----------------------------------------------------------- | ----------- |
| `Input`      | Native `<input>` wrapper with `asChild`, `data-disabled`.   | ✓           |
| `InputGroup` | Framed wrapper with leading / trailing adornment slots.     | n/a         |
| `Field`      | `id` / `aria-describedby` / state cascade coordinator.      | provider    |
| `Textarea`   | Native `<textarea>` wrapper (refactored to read Field).     | ✓           |
| `Select`     | Native `<select>` wrapper (refactored to read Field).       | ✓           |

The merge contract lives in `packages/react/src/Field/hooks/useFieldProps.ts`.
Any future control opts in by calling `useFieldProps(consumerProps)`
before spreading onto the DOM element — consumer props always win,
`aria-describedby` composes.

## Deferred — `Form` primitive

Not strictly necessary for the current scope but the natural next
coordinator. The design conversation hasn't started; this is a
sketch, not a plan.

### Sketch

```tsx
<Form.Root onSubmit={…} validation="native" | "react-hook-form" | "custom">
  <Field.Root>…</Field.Root>
  <Field.Root>…</Field.Root>
  <Form.Submit>Save</Form.Submit>
  <Form.Reset>Cancel</Form.Reset>
</Form.Root>
```

### Open questions

- **Validation contract.** Three plausible tiers:
  1. Pass-through (`<form>` with no extra logic) — barely worth a
     primitive.
  2. Native constraint validation surfaced via a `useFormState()` hook
     (read `ValidityState` for every named field).
  3. Library-agnostic shape that react-hook-form / Formik / Zod
     resolvers can adapt to.
- **Submit / Reset.** Are these their own primitives (`Form.Submit`,
  `Form.Reset`) or just decorated `<Button>`s? The headless Button
  already covers form-button semantics — Form.Submit might be redundant.
- **Field discovery.** Does Form auto-discover nested Fields via
  context (so it can report which fields are invalid), or does it stay
  ignorant and let each Field own its own state?
- **`noValidate` policy.** Should Form default `noValidate` for the
  react-hook-form path (so the React-driven error UI runs) and leave
  it off for the native path?

### Why deferred

Each of those questions deserves its own kickoff conversation. The
existing primitives compose into a working form right now — you can
build a real form against Input / InputGroup / Field today; the only
thing you write yourself is the `<form onSubmit>` wrapper.

## Deferred — specialised input primitives

Everything below is in `ROADMAP.md`'s Forms section, deliberately
deferred from the current Input cycle. Each is a real component, not a
polish item.

### Tier ordering by effort

| Component               | Effort   | Built on              | Notes                                                            |
| ----------------------- | -------- | --------------------- | ---------------------------------------------------------------- |
| `PasswordInput`         | Small    | Input + InputGroup    | Visibility-toggle state + Eye/EyeOff swap. Pattern proven in the workbench. |
| `Editable`              | Small    | Input + Button        | Inline edit with display ↔ edit toggle.                          |
| `SegmentedControl`      | Small    | ToggleGroup           | Mostly a ToggleGroup styling preset; consider whether it warrants its own primitive. |
| `Rating`                | Small    | RadioGroup-style      | Star/heart rating; keyboard nav similar to RadioGroup.           |
| `PinInput` / `OTPField` | Medium   | Multi-Input array     | Array of single-character inputs with auto-advance focus, paste handling, masking. Probably one component with `mask?: boolean` and `length` props. |
| `NumberInput`           | Medium   | Input + Button steppers | Increment / decrement triggers, min / max / step, wheel handling, locale formatting (open question — see below). |
| `TagsInput`             | Medium   | Input + chip rendering | Token chips inside an input, controlled / uncontrolled tag list, keyboard backspace to delete. |
| `FileUpload`            | Medium   | `<input type="file">` | Native file picker + optional drag-drop zone + file list rendering. |
| `ColorPicker`           | Large    | Standalone             | Its own design surface — gradients, eyedropper, hex/HSL/OKLCH inputs, swatches. Should pair with the `harmoni` palette engine. |
| `DatePicker`            | Large    | Needs `Calendar` primitive first | Popover-anchored calendar with month grid, range selection, keyboard nav, locale formatting. |

### Open design questions per component

These are the architectural decisions that need to be made BEFORE
implementation, not during it.

#### `PasswordInput`

- Always render as Input + InputGroup composite, or accept the
  visibility-toggle button as a slot for consumers who want their own
  layout?
- Should the visibility toggle be auto-hidden until the input has a
  value (UX choice — opinion varies)?

#### `NumberInput`

- **Locale formatting.** Tricky. Use `Intl.NumberFormat` and accept
  `locale` / `formatOptions` props, or stay locale-naive and let
  consumers wrap with their own formatter? The latter is more headless
  but loses keyboard parsing.
- **Wheel scrolling.** Default on or off? Off is safer (avoids
  accidental edits when scrolling a long form); on matches native
  browser behaviour.
- **Stepper variants.** Inline (left/right) or stacked (up/down arrows)?
  Probably both via composition.
- **`type` choice.** `type="number"` (native, has implicit min/max
  parsing) or `type="text" inputMode="decimal"` (more controllable but
  loses native validation)? Most modern libraries pick the latter.

#### `DatePicker`

- **Needs `Calendar` primitive first.** Calendar is a non-trivial
  component on its own — month/year grid, keyboard nav, focused-date
  state. Probably worth shipping `Calendar` as a separate primitive
  before stitching it into `DatePicker`.
- **Locale handling.** Same question as NumberInput.
- **Range selection.** Single-date primitive first, then a separate
  range primitive (`DateRangePicker`), rather than one prop-toggled
  component.
- **Time selection.** Out of scope for the first cycle. Separate
  `TimePicker` primitive if/when needed.

#### `PinInput` / `OTPField`

- Are these one component or two? OTP is just PIN with a masking flag
  and an `inputMode="numeric"` default. Probably **one** component
  with `mask` and `inputMode` props, exported under both names if the
  vocabulary matters.
- Auto-submit on completion — opt-in via prop, or always callback to
  `onComplete`?

#### `TagsInput`

- Controlled / uncontrolled tag list — both modes (mirror Tabs /
  Checkbox patterns).
- Tag rendering — slot via composition (`<TagsInput.Tag>`) or pure
  data-driven (`renderTag={…}`)?
- Validation per-tag — accept a `validate(tag): boolean | string`
  callback that the component runs on tag commit?

#### `ColorPicker`

- Major component. Probably benefits from a dedicated planning
  conversation. Should pair with `harmoni` for the colour transforms;
  see `crates/harmoni-core` for the engine surface.

#### `Editable`

- Whether "edit mode" is controlled / uncontrolled / both.
- Submit behaviour on Enter / blur — opt-in via prop.

#### `FileUpload`

- Drag-drop is the main reason to ship this — bare
  `<input type="file">` is already trivial. Probably a compound:
  `FileUpload.Root` (dropzone), `FileUpload.Input` (the actual `<input
  type="file">`), `FileUpload.List` (file list), `FileUpload.Item`
  (one file with remove button).

## Open Field/InputGroup polish

Not committed to but worth tracking:

- **`Field.Control` asChild wrapper.** Currently controls opt into
  `FieldContext` directly. Adding a `Field.Control asChild` wrapper
  would let consumers wire third-party non-aware controls into the
  same context. Small, additive — write when you hit a control that
  can't be modified (e.g., react-day-picker, third-party combobox).
- **Description-mounted gating.** Field always exposes `descriptionId`
  in context even if no `Field.Description` is rendered. Input then
  emits `aria-describedby="...-description"` pointing at nothing.
  Harmless but mildly wrong. To fix properly: track mount of
  `Field.Description` via context setter + state. Defer until it
  causes a real problem.
- **`Field.Required` indicator sub-component.** A `<span aria-hidden>`
  rendered only when `field.required` — common UI pattern for the
  asterisk next to the label. Easy add when wanted.
