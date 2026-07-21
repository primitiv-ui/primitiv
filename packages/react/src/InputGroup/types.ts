import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Props for {@link InputGroupRoot | `InputGroup.Root`} — the frame
 * wrapper. Extends the native `<div>` attributes plus the `asChild`
 * escape hatch and a typed `ref`.
 */
export type InputGroupRootProps = ComponentProps<"div"> & {
  /** Render the consumer's element instead of `<div>` via the
   * {@link Slot} pattern — e.g. a `<label>` so the whole frame is
   * clickable. The `data-input-group` hook is preserved.
   * @default false */
  asChild?: boolean;
  /** Forwarded to the underlying `HTMLDivElement` (or the `asChild`
   * element). */
  ref?: Ref<HTMLDivElement>;
  /** The wrapped control and its optional leading / trailing
   * adornments. */
  children?: ReactNode;
};

/**
 * Props shared by
 * {@link InputGroupLeadingAdornment | `InputGroup.LeadingAdornment`} and
 * {@link InputGroupTrailingAdornment | `InputGroup.TrailingAdornment`} —
 * the positioned adornment slots. Extends the native `<span>` attributes
 * plus the `asChild` escape hatch and a typed `ref`.
 */
export type InputGroupAdornmentProps = ComponentProps<"span"> & {
  /** Render the consumer's element instead of `<span>` via the
   * {@link Slot} pattern — e.g. an interactive `<button>`. Event
   * handlers compose (child runs first) and the `data-input-group-adornment`
   * hook is preserved.
   * @default false */
  asChild?: boolean;
  /** Forwarded to the underlying `HTMLSpanElement` (or the `asChild`
   * element). */
  ref?: Ref<HTMLSpanElement>;
  /** The adornment content — a decorative icon (mark it
   * `aria-hidden="true"`), suffix text, or an interactive control with an
   * accessible name. */
  children?: ReactNode;
};
