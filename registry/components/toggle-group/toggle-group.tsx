/*
 * ToggleGroup — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/toggle-group/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { ToggleGroup as ToggleGroupPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { toggleGroup, toggleGroupItem } from "./toggle-group.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A segmented control — a recessed pill track holding borderless items; single- or multi-select (WAI-ARIA, roving tabindex).
 *
 * @see https://primitiv-ui.dev/docs/components/toggle-group
 */
export type ToggleGroupProps = DistributiveOmit<
  ComponentPropsWithRef<typeof ToggleGroupPrimitive.Root>,
  "size" | "justify"
> & {
  /**
   * Control size for the whole widget; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * Whether items size to their content or share the track width equally.
   * - `content` — Items size to their content, e.g. a B / I / U toolbar (the default).
   * - `justified` — Items share the track width equally, a true segmented control.
   * @default "content"
   */
  justify?: "content" | "justified";
};

export function ToggleGroup({ size, justify, className, ...props }: ToggleGroupProps) {
  return (
    <ToggleGroupPrimitive.Root
      className={[toggleGroup({ size, justify }), className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export type ToggleGroupItemProps = ComponentPropsWithRef<typeof ToggleGroupPrimitive.Item>;

export function ToggleGroupItem({ className, ...props }: ToggleGroupItemProps) {
  return (
    <ToggleGroupPrimitive.Item
      className={[toggleGroupItem(), className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
