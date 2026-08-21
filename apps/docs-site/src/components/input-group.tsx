import "../styles/primitiv/input-group/styles.css";
/*
 * InputGroup — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/input-group/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { InputGroup as InputGroupPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { inputGroup, inputGroupLeadingAdornment, inputGroupTrailingAdornment } from "./input-group.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A framed control with leading / trailing adornment slots — wraps an Input for icons, prefixes, clear buttons, and reveal toggles.
 *
 * @see https://primitiv-ui.dev/docs/components/input-group
 */
export type InputGroupProps = DistributiveOmit<ComponentPropsWithRef<typeof InputGroupPrimitive.Root>, "size"> & {
  /**
   * Frame size; `data-density` scales each size further. Match the wrapped control's size.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/input-group
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export function InputGroup({ size, className, ...props }: InputGroupProps) {
  return <InputGroupPrimitive.Root className={[inputGroup({ size }), className].filter(Boolean).join(" ")} {...props} />;
}

export type InputGroupLeadingAdornmentProps = ComponentPropsWithRef<typeof InputGroupPrimitive.LeadingAdornment>;

export function InputGroupLeadingAdornment({ className, ...props }: InputGroupLeadingAdornmentProps) {
  return <InputGroupPrimitive.LeadingAdornment className={[inputGroupLeadingAdornment(), className].filter(Boolean).join(" ")} {...props} />;
}

export type InputGroupTrailingAdornmentProps = ComponentPropsWithRef<typeof InputGroupPrimitive.TrailingAdornment>;

export function InputGroupTrailingAdornment({ className, ...props }: InputGroupTrailingAdornmentProps) {
  return <InputGroupPrimitive.TrailingAdornment className={[inputGroupTrailingAdornment(), className].filter(Boolean).join(" ")} {...props} />;
}
