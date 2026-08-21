import "../styles/primitiv/divider/styles.css";
/*
 * Divider — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/divider/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Divider as DividerPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { divider } from "./divider.recipe";

/**
 * A separator between content sections — a `<span role="separator">` whose `aria-orientation` drives a horizontal or vertical rule.
 *
 * @see https://primitiv-ui.dev/docs/components/divider
 */
export type DividerProps = ComponentPropsWithRef<typeof DividerPrimitive>;

export function Divider({ className, ...props }: DividerProps) {
  return <DividerPrimitive className={[divider(), className].filter(Boolean).join(" ")} {...props} />;
}
