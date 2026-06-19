/*
 * DemoBox — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/demo-box/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { DemoBox as DemoBoxPrimitive, type DemoBoxProps as DemoBoxPrimitiveProps } from "@primitiv-ui/react";
import { demoBox } from "./demo-box.recipe";

/**
 * A demo box control.
 *
 * @see https://example.test/demo-box
 */
export type DemoBoxProps = DemoBoxPrimitiveProps & {
  /**
   * Visual intent.
   * - `primary` — Primary action.
   * - `ghost` — Low-emphasis ghost.
   * @default "primary"
   * @see https://example.test/demo-box
   */
  variant?: "primary" | "ghost";
  /**
   * Control size.
   * - `sm` — Small.
   * - `md` — Medium.
   * @default "md"
   * @see https://example.test/demo-box
   */
  size?: "sm" | "md";
};

export function DemoBox({ variant, size, className, ...props }: DemoBoxProps) {
  return <DemoBoxPrimitive className={[demoBox({ variant, size }), className].filter(Boolean).join(" ")} {...props} />;
}
