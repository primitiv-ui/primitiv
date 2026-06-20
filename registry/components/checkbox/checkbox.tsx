/*
 * Checkbox — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/checkbox/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Checkbox as CheckboxPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { checkbox } from "./checkbox.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A tri-state checkbox — an independent on/off (or mixed) form selection.
 *
 * @see https://primitiv-ui.dev/docs/components/checkbox
 */
export type CheckboxProps = DistributiveOmit<ComponentPropsWithRef<typeof CheckboxPrimitive.Root>, "size"> & {
  /**
   * Control size; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/checkbox
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export function Checkbox({ size, className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root className={[checkbox({ size }), className].filter(Boolean).join(" ")} {...props}>
      <CheckboxPrimitive.Indicator className="primitiv-checkbox__indicator" />
    </CheckboxPrimitive.Root>
  );
}
