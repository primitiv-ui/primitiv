/*
 * Input — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/input/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Input as InputPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { input } from "./input.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A single-line text input — the framed field consumers type into.
 *
 * @see https://primitiv-ui.dev/docs/components/input
 */
export type InputProps = DistributiveOmit<ComponentPropsWithRef<typeof InputPrimitive>, "size"> & {
  /**
   * Control size; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/input
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export function Input({ size, className, ...props }: InputProps) {
  return <InputPrimitive className={[input({ size }), className].filter(Boolean).join(" ")} {...props} />;
}
