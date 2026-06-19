/*
 * Bare — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/bare/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Bare as BarePrimitive, type BareProps as BarePrimitiveProps } from "@primitiv-ui/react";
import { bare } from "./bare.recipe";

/**
 * A bare control.
 */
export type BareProps = BarePrimitiveProps & {
  /**
   * Tone.
   * - `neutral` — Neutral.
   * - `accent` — Accent.
   * @default "neutral"
   */
  tone?: "neutral" | "accent";
};

export function Bare({ tone, className, ...props }: BareProps) {
  return <BarePrimitive className={[bare({ tone }), className].filter(Boolean).join(" ")} {...props} />;
}
