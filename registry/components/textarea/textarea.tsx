/*
 * Textarea — styled wrapper, generated from contract.json.
 *
 * Yours to edit once `primitiv add` copies it into your project — re-running
 * `add` keeps your changes unless you pass --force. (In the Primitiv repo,
 * edit registry/components/textarea/contract.json and regenerate instead.)
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Textarea as TextareaPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { textarea } from "./textarea.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A multi-line text input — the framed field consumers type longer content into.
 *
 * @see https://primitiv-ui.dev/docs/components/textarea
 */
export type TextareaProps = DistributiveOmit<ComponentPropsWithRef<typeof TextareaPrimitive>, "size"> & {
  /**
   * Control size; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/textarea
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export function Textarea({ size, className, ...props }: TextareaProps) {
  return <TextareaPrimitive className={[textarea({ size }), className].filter(Boolean).join(" ")} {...props} />;
}
