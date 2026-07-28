/*
 * Progress — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/progress/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Progress as ProgressPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type CSSProperties } from "react";
import { progress, progressIndicator } from "./progress.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A progress bar — a track with a fill that reports completion, or an animated indeterminate state when the ratio is unknown.
 *
 * @see https://primitiv-ui.dev/docs/components/progress
 */
export type ProgressProps = DistributiveOmit<ComponentPropsWithRef<typeof ProgressPrimitive.Root>, "size"> & {
  /**
   * Track height; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/progress
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export function Progress({ size, value, max, className, style, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      className={[progress({ size }), className].filter(Boolean).join(" ")}
      style={{ ...style, ...(value === undefined ? {} : { "--primitiv-progress-value": value }), ...(max === undefined ? {} : { "--primitiv-progress-max": max }) } as CSSProperties}
      value={value} max={max}
      {...props}
    />
  );
}

export type ProgressIndicatorProps = ComponentPropsWithRef<typeof ProgressPrimitive.Indicator>;

export function ProgressIndicator({ className, ...props }: ProgressIndicatorProps) {
  return <ProgressPrimitive.Indicator className={[progressIndicator(), className].filter(Boolean).join(" ")} {...props} />;
}
