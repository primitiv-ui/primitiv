import { ComponentProps } from "react";

/**
 * The lifecycle state of a progress bar, derived from `value` and `max`.
 *
 * - `"indeterminate"` — `value` is `null` / omitted; the operation's
 *   completion ratio is unknown.
 * - `"loading"` — `value` is a number below `max`.
 * - `"complete"` — `value` has reached `max`.
 */
export type ProgressState = "indeterminate" | "loading" | "complete";

/**
 * Props for {@link Progress.Root} — all `<div>` attributes except the ones
 * the component derives itself (`role` and the `aria-value*` family), plus
 * the progress-specific props.
 */
export type ProgressRootProps = Omit<
  ComponentProps<"div">,
  "role" | "aria-valuemin" | "aria-valuemax" | "aria-valuenow" | "aria-valuetext"
> & {
  /**
   * Current progress, between `0` and `max`. Pass `null` (or omit) for an
   * indeterminate progress bar whose completion ratio is unknown.
   */
  value?: number | null;
  /** Upper bound of `value`. Must be a positive finite number. Defaults to `100`. */
  max?: number;
  /**
   * Produces the human-readable `aria-valuetext`. Receives the resolved
   * `value` and `max`. Defaults to a rounded percentage (e.g. `"42%"`).
   * Not called while indeterminate.
   */
  getValueLabel?: (value: number, max: number) => string;
  /** Render the consumer's own element instead of the native `<div>`. */
  asChild?: boolean;
};

/** Props for {@link Progress.Indicator} — all `<div>` attributes plus `asChild`. */
export type ProgressIndicatorProps = ComponentProps<"div"> & {
  /** Render the consumer's own element instead of the native `<div>`. */
  asChild?: boolean;
};
