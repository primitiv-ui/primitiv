/*
 * Switch — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/switch/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Switch as SwitchPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { switchRecipe } from "./switch.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * An on/off toggle with an optional inline label — a native switch input for an immediate binary setting.
 *
 * @see https://primitiv-ui.dev/docs/components/switch
 */
export type SwitchProps = DistributiveOmit<ComponentPropsWithRef<typeof SwitchPrimitive.Root>, "size"> & {
  /**
   * Control size; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/switch
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export function Switch({ size, className, children, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root className={[switchRecipe({ size }), className].filter(Boolean).join(" ")} {...props}>
      <span className="primitiv-switch__control">
        <SwitchPrimitive.Thumb className="primitiv-switch__thumb" />
      </span>
      {children != null && <span className="primitiv-switch__label">{children}</span>}
    </SwitchPrimitive.Root>
  );
}
