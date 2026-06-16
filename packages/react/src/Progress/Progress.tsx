import { useMemo } from "react";
import type { ReactElement } from "react";

import { Slot } from "../Slot/index.ts";

import { ProgressContext } from "./ProgressContext";
import { useProgressContext, useProgressRoot } from "./hooks/index.ts";
import { ProgressIndicatorProps, ProgressRootProps } from "./types";

function defaultGetValueLabel(value: number, max: number): string {
  return `${Math.round((value / max) * 100)}%`;
}

/**
 * The root of a Progress bar — a `<div role="progressbar">` that resolves
 * `value` / `max` into a {@link ProgressState} and provides
 * {@link ProgressContext} to a descendant
 * {@link ProgressIndicator | `Progress.Indicator`}.
 *
 * Progress is a **display-only** component: it has no internal state and is
 * never interactive. The `value` prop is always consumer-driven — there is
 * no controlled/uncontrolled split.
 *
 * **Indeterminate.** Omit `value` (or pass `null`) when the completion ratio
 * is unknown. `aria-valuenow` / `aria-valuetext` are dropped and
 * `data-state="indeterminate"`.
 *
 * **ARIA.** `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax`, and —
 * when determinate — `aria-valuenow` and `aria-valuetext` are set
 * automatically. Provide an accessible name via `aria-label` or
 * `aria-labelledby`.
 *
 * **Styling hooks.** `data-state="indeterminate" | "loading" | "complete"`,
 * plus `data-value` (determinate only) and `data-max` on the root.
 *
 * @example Determinate
 * ```tsx
 * <Progress.Root value={60} aria-label="Upload progress">
 *   <Progress.Indicator />
 * </Progress.Root>
 * ```
 *
 * @example Indeterminate
 * ```tsx
 * <Progress.Root aria-label="Loading">
 *   <Progress.Indicator />
 * </Progress.Root>
 * ```
 */
export function ProgressRoot({
  value,
  max,
  getValueLabel = defaultGetValueLabel,
  asChild = false,
  children,
  ...rest
}: ProgressRootProps): ReactElement {
  const resolved = useProgressRoot({ value, max });
  const { state } = resolved;

  const contextValue = useMemo(
    () => ({ value: resolved.value, max: resolved.max, state }),
    [resolved.value, resolved.max, state],
  );

  const valueProps =
    resolved.value === null
      ? {}
      : {
          "aria-valuenow": resolved.value,
          "aria-valuetext": getValueLabel(resolved.value, resolved.max),
          "data-value": resolved.value,
        };

  const rootProps = {
    ...rest,
    role: "progressbar" as const,
    "aria-valuemin": 0,
    "aria-valuemax": resolved.max,
    "data-state": state,
    "data-max": resolved.max,
    ...valueProps,
  };

  return (
    <ProgressContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...rootProps}>{children}</Slot>
      ) : (
        <div {...rootProps}>{children}</div>
      )}
    </ProgressContext.Provider>
  );
}

/** @internal */
ProgressRoot.displayName = "ProgressRoot";

/**
 * The visual fill of a Progress bar — a decorative `<div>` that mirrors the
 * parent {@link ProgressRoot}'s state via `data-*` attributes so consumers
 * can drive its width with pure CSS.
 *
 * **Styling hooks.** `data-state="indeterminate" | "loading" | "complete"`,
 * plus `data-value` (determinate only) and `data-max`. Compute the fill
 * width from these — e.g. `width: calc(var(--value) / var(--max) * 100%)` via
 * a CSS custom property, or an inline `style` set by the consumer.
 *
 * **`asChild` prop.** Pass `asChild` to render the consumer's own element as
 * the indicator, with the `data-*` hooks merged in.
 *
 * @example
 * ```tsx
 * <Progress.Root value={75} aria-label="Upload progress">
 *   <Progress.Indicator />
 * </Progress.Root>
 * ```
 *
 * @throws if rendered outside a `Progress.Root`.
 */
export function ProgressIndicator({
  asChild = false,
  children,
  ...rest
}: ProgressIndicatorProps): ReactElement {
  const { value, max, state } = useProgressContext();
  const indicatorProps = {
    ...rest,
    "data-state": state,
    "data-value": value === null ? undefined : value,
    "data-max": max,
  };
  if (asChild) {
    return <Slot {...indicatorProps}>{children}</Slot>;
  }
  return <div {...indicatorProps}>{children}</div>;
}

/** @internal */
ProgressIndicator.displayName = "ProgressIndicator";

/** Type of the {@link Progress} compound: the root callable plus its attached sub-components. */
export type TProgressCompound = typeof ProgressRoot & {
  Root: typeof ProgressRoot;
  Indicator: typeof ProgressIndicator;
};

/**
 * Headless, accessible **Progress** — a compound component implementing the
 * [WAI-ARIA progressbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/meter/)
 * on a `<div role="progressbar">`. Display-only and non-interactive: it
 * reflects a consumer-supplied `value`. Zero styles ship.
 *
 * `Progress` is both callable (an alias of
 * {@link ProgressRoot | `Progress.Root`}) and carries its sub-components as
 * static properties.
 *
 * - {@link ProgressRoot | `Progress.Root`} — `role="progressbar"`, value
 *   resolution, context provider.
 * - {@link ProgressIndicator | `Progress.Indicator`} — decorative fill;
 *   width driven by `data-*` via CSS.
 *
 * @example Minimal usage
 * ```tsx
 * import { Progress } from "@primitiv-ui/react";
 *
 * <Progress.Root value={40} aria-label="Upload progress">
 *   <Progress.Indicator />
 * </Progress.Root>
 * ```
 *
 * @see {@link ProgressRoot} for value resolution and ARIA details.
 * @see {@link ProgressIndicator} for styling the fill.
 */
const ProgressCompound: TProgressCompound = Object.assign(ProgressRoot, {
  Root: ProgressRoot,
  Indicator: ProgressIndicator,
});

/** @internal */
ProgressCompound.displayName = "Progress";

export { ProgressCompound as Progress };
