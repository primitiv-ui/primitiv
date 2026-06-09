import { Slot } from "../Slot";
import { InputGroupAdornmentProps, InputGroupRootProps } from "./types";

/**
 * The root of an InputGroup — a stateless `<div>` wrapper that frames a
 * single form control alongside optional leading and trailing adornments.
 *
 * `InputGroup` is intentionally **layout-and-anatomy only**. It owns no
 * state, provides no context, and does not know which control sits
 * inside it. Use CSS `:focus-within` and `:has(input:disabled)` /
 * `:has(input[aria-invalid="true"])` to style the frame in response to
 * the inner control's state — no JS coordination required.
 *
 * **Styling hook.** `data-input-group=""` on the root.
 *
 * **`asChild` composition.** Pass `asChild` to render the consumer's
 * element instead of `<div>` — e.g. a `<label>` so a click anywhere on
 * the frame focuses the wrapped input.
 *
 * @example Basic frame with no adornments
 * ```tsx
 * <InputGroup>
 *   <Input aria-label="Search" type="search" />
 * </InputGroup>
 * ```
 *
 * @example Frame rendered as a <label> so the whole frame is clickable
 * ```tsx
 * <InputGroup asChild>
 *   <label>
 *     <InputGroup.LeadingAdornment><SearchIcon /></InputGroup.LeadingAdornment>
 *     <Input type="search" />
 *   </label>
 * </InputGroup>
 * ```
 */
function InputGroupRoot({
  asChild = false,
  children,
  ref,
  ...rest
}: InputGroupRootProps) {
  const rootProps = {
    ...rest,
    ref,
    "data-input-group": "",
  };

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }

  return <div {...rootProps}>{children}</div>;
}

InputGroupRoot.displayName = "InputGroupRoot";

/**
 * A leading adornment slot — a `<span>` positioned at the start of the
 * frame for icons, currency symbols, prefix text, or interactive
 * buttons.
 *
 * **Styling hook.** `data-input-group-adornment="leading"` on the
 * adornment element.
 *
 * **Accessibility.** No `aria-hidden` is set automatically — the
 * adornment is just a positioned slot. Mark decorative icons
 * `aria-hidden="true"` yourself (or wrap with `AccessibleIcon`), and
 * give interactive children a proper accessible name.
 *
 * **`asChild` composition.** Pass `asChild` to render an interactive
 * element such as `<button>` — for a clickable icon that triggers a
 * search, opens a colour picker, or any other action. Event handlers
 * compose (child runs first); refs forward to the consumer element.
 *
 * @example Decorative leading icon
 * ```tsx
 * <InputGroup.LeadingAdornment>
 *   <SearchIcon aria-hidden="true" />
 * </InputGroup.LeadingAdornment>
 * ```
 *
 * @example Interactive leading button via asChild
 * ```tsx
 * <InputGroup.LeadingAdornment asChild>
 *   <button type="button" aria-label="Open colour picker" onClick={open}>
 *     <ColourSwatch />
 *   </button>
 * </InputGroup.LeadingAdornment>
 * ```
 */
function InputGroupLeadingAdornment({
  asChild = false,
  children,
  ref,
  ...rest
}: InputGroupAdornmentProps) {
  const adornmentProps = {
    ...rest,
    ref,
    "data-input-group-adornment": "leading" as const,
  };

  if (asChild) {
    return <Slot {...adornmentProps}>{children}</Slot>;
  }

  return <span {...adornmentProps}>{children}</span>;
}

InputGroupLeadingAdornment.displayName = "InputGroupLeadingAdornment";

/**
 * A trailing adornment slot — a `<span>` positioned at the end of the
 * frame for icons, suffix text, clear buttons, or password-reveal
 * toggles.
 *
 * **Styling hook.** `data-input-group-adornment="trailing"` on the
 * adornment element.
 *
 * **Accessibility.** No `aria-hidden` is set automatically — the
 * adornment is just a positioned slot. Mark decorative icons
 * `aria-hidden="true"` yourself (or wrap with `AccessibleIcon`), and
 * give interactive children a proper accessible name.
 *
 * **`asChild` composition.** Pass `asChild` to render an interactive
 * element such as `<button>`. Event handlers compose (child runs
 * first); refs forward to the consumer element.
 *
 * @example Trailing clear button via asChild
 * ```tsx
 * <InputGroup.TrailingAdornment asChild>
 *   <button type="button" aria-label="Clear" onClick={clear}>
 *     <XIcon aria-hidden="true" />
 *   </button>
 * </InputGroup.TrailingAdornment>
 * ```
 */
function InputGroupTrailingAdornment({
  asChild = false,
  children,
  ref,
  ...rest
}: InputGroupAdornmentProps) {
  const adornmentProps = {
    ...rest,
    ref,
    "data-input-group-adornment": "trailing" as const,
  };

  if (asChild) {
    return <Slot {...adornmentProps}>{children}</Slot>;
  }

  return <span {...adornmentProps}>{children}</span>;
}

InputGroupTrailingAdornment.displayName = "InputGroupTrailingAdornment";

type TInputGroupCompound = typeof InputGroupRoot & {
  Root: typeof InputGroupRoot;
  LeadingAdornment: typeof InputGroupLeadingAdornment;
  TrailingAdornment: typeof InputGroupTrailingAdornment;
};

/**
 * Headless, accessible **InputGroup** — a stateless compound that frames
 * a single form control alongside optional leading and trailing
 * adornments. Zero styles ship.
 *
 * `InputGroup` is intentionally **not** input-specific. It maps directly
 * to the `framed-control/*` design-token anatomy (height,
 * padding-inline, gap, icon-size, radius) and works just as well around
 * a `<Textarea>`, a future `NumberInput.Control`, or any other framed
 * control — the only thing tying it to `<Input>` is the name.
 *
 * `InputGroup` is both callable (an alias of `InputGroup.Root`) and
 * carries its sub-components as static properties:
 *
 * - {@link InputGroupRoot | `InputGroup.Root`} — the wrapping `<div>`,
 *   `data-input-group=""` styling hook.
 * - {@link InputGroupLeadingAdornment | `InputGroup.LeadingAdornment`} —
 *   leading slot, `data-input-group-adornment="leading"`.
 * - {@link InputGroupTrailingAdornment | `InputGroup.TrailingAdornment`} —
 *   trailing slot, `data-input-group-adornment="trailing"`.
 *
 * **State coordination.** None. CSS handles disabled / invalid /
 * focus-within styling via `:has()` and `:focus-within`. When `Field`
 * lands it will sit *outside* `InputGroup` and own label / error /
 * description wiring without InputGroup needing to change.
 *
 * @example Leading search icon
 * ```tsx
 * import { InputGroup, Input } from "@primitiv-ui/react";
 *
 * <InputGroup>
 *   <InputGroup.LeadingAdornment>
 *     <SearchIcon aria-hidden="true" />
 *   </InputGroup.LeadingAdornment>
 *   <Input aria-label="Search" type="search" />
 * </InputGroup>
 * ```
 *
 * @example Trailing clear button
 * ```tsx
 * <InputGroup>
 *   <Input value={q} onChange={onChange} aria-label="Search" />
 *   <InputGroup.TrailingAdornment asChild>
 *     <button type="button" aria-label="Clear" onClick={clear}>
 *       <XIcon aria-hidden="true" />
 *     </button>
 *   </InputGroup.TrailingAdornment>
 * </InputGroup>
 * ```
 *
 * @see {@link InputGroupRoot} for frame anatomy and `asChild` on Root.
 * @see {@link InputGroupLeadingAdornment} for leading-slot semantics.
 * @see {@link InputGroupTrailingAdornment} for trailing-slot semantics.
 */
const InputGroupCompound: TInputGroupCompound = Object.assign(InputGroupRoot, {
  Root: InputGroupRoot,
  LeadingAdornment: InputGroupLeadingAdornment,
  TrailingAdornment: InputGroupTrailingAdornment,
});

InputGroupCompound.displayName = "InputGroup";

export { InputGroupCompound as InputGroup };
