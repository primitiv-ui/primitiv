/*
 * DemoToggle — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/r/demo-toggle/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { DemoToggle as DemoTogglePrimitive, type DemoToggleProps as DemoTogglePrimitiveProps } from "@primitiv-ui/react";
import { demoToggle } from "./demo-toggle.recipe";

/**
 * A demo on/off toggle.
 *
 * @see https://example.test/demo-toggle
 */
export type DemoToggleProps = DemoTogglePrimitiveProps;

export function DemoToggle({ className, ...props }: DemoToggleProps) {
  return (
    <DemoTogglePrimitive.Root className={[demoToggle(), className].filter(Boolean).join(" ")} {...props}>
      <DemoTogglePrimitive.Thumb className="primitiv-demo-toggle__thumb" />
    </DemoTogglePrimitive.Root>
  );
}
