import "../styles/primitiv/checkbox/styles.css";
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
 * A tri-state checkbox with an optional inline label — an independent on/off (or mixed) form selection.
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

export function Checkbox({ size, className, children, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root className={[checkbox({ size }), className].filter(Boolean).join(" ")} {...props}>
      <span className="primitiv-checkbox__control">
        <CheckboxPrimitive.Indicator className="primitiv-checkbox__indicator" />
      </span>
      {children != null && <span className="primitiv-checkbox__label">{children}</span>}
    </CheckboxPrimitive.Root>
  );
}
