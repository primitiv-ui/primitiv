/*
 * DemoLabelled — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/demo-labelled/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { DemoLabelled as DemoLabelledPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { demoLabelled } from "./demo-labelled.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A demo labelled control.
 *
 * @see https://example.test/demo-labelled
 */
export type DemoLabelledProps = DistributiveOmit<ComponentPropsWithRef<typeof DemoLabelledPrimitive.Root>, "size"> & {
  /**
   * Control size.
   * - `sm` — Small.
   * - `md` — Medium.
   * @default "md"
   * @see https://example.test/demo-labelled
   */
  size?: "sm" | "md";
};

export function DemoLabelled({ size, className, children, ...props }: DemoLabelledProps) {
  return (
    <DemoLabelledPrimitive.Root className={[demoLabelled({ size }), className].filter(Boolean).join(" ")} {...props}>
      <span className="primitiv-demo-labelled__control">
        <DemoLabelledPrimitive.Indicator className="primitiv-demo-labelled__indicator" />
      </span>
      {children != null && <span className="primitiv-demo-labelled__label">{children}</span>}
    </DemoLabelledPrimitive.Root>
  );
}
