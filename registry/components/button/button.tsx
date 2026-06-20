/*
 * Button — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/button/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Button as ButtonPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { button } from "./button.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A clickable action — a button, or a link styled as one via `asChild`.
 *
 * @see https://primitiv-ui.dev/docs/components/button
 */
export type ButtonProps = DistributiveOmit<ComponentPropsWithRef<typeof ButtonPrimitive>, "variant" | "size"> & {
  /**
   * Visual intent / emphasis.
   * - `primary` — High-emphasis primary action.
   * - `secondary` — Medium-emphasis secondary action.
   * - `danger` — Destructive action — delete, remove.
   * - `link` — Reads as a link; no frame.
   * @default "primary"
   * @see https://primitiv-ui.dev/docs/components/button
   */
  variant?: "primary" | "secondary" | "danger" | "link";
  /**
   * Control size; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/button
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <ButtonPrimitive className={[button({ variant, size }), className].filter(Boolean).join(" ")} {...props} />;
}
