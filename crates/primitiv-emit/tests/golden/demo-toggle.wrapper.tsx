/*
 * DemoToggle — styled wrapper, generated from contract.json.
 *
 * Yours to edit once `primitiv add` copies it into your project — re-running
 * `add` keeps your changes unless you pass --force. (In the Primitiv repo,
 * edit registry/components/demo-toggle/contract.json and regenerate instead.)
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { DemoToggle as DemoTogglePrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { demoToggle } from "./demo-toggle.recipe";

/**
 * A demo on/off toggle.
 *
 * @see https://example.test/demo-toggle
 */
export type DemoToggleProps = ComponentPropsWithRef<typeof DemoTogglePrimitive.Root>;

export function DemoToggle({ className, ...props }: DemoToggleProps) {
  return (
    <DemoTogglePrimitive.Root className={[demoToggle(), className].filter(Boolean).join(" ")} {...props}>
      <DemoTogglePrimitive.Thumb className="primitiv-demo-toggle__thumb" />
    </DemoTogglePrimitive.Root>
  );
}
