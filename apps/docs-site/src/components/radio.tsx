import "../styles/primitiv/radio/styles.css";
/*
 * Radio — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/radio/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Radio as RadioPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { radio } from "./radio.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A single native radio input with an optional inline label, grouped with a shared `name`.
 *
 * @see https://primitiv-ui.dev/docs/components/radio
 */
export type RadioProps = DistributiveOmit<ComponentPropsWithRef<typeof RadioPrimitive.Root>, "size"> & {
  /**
   * Control size; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/radio
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export function Radio({ size, className, children, ...props }: RadioProps) {
  return (
    <RadioPrimitive.Root className={[radio({ size }), className].filter(Boolean).join(" ")} {...props}>
      <span className="primitiv-radio__control">
        <RadioPrimitive.Indicator className="primitiv-radio__indicator" />
      </span>
      {children != null && <span className="primitiv-radio__label">{children}</span>}
    </RadioPrimitive.Root>
  );
}
