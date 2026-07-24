/*
 * Collapsible — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/collapsible/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Collapsible as CollapsiblePrimitive } from "@primitiv-ui/react";
import { Children, type ComponentPropsWithRef, type ReactNode } from "react";
import { collapsible, collapsibleTrigger, collapsibleContent, collapsibleTriggerIcon } from "./collapsible.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A single disclosure widget pairing a trigger with a panel that expands and collapses — the single-item analogue of Accordion.
 *
 * @see https://primitiv-ui.dev/docs/components/collapsible
 */
export type CollapsibleProps = DistributiveOmit<ComponentPropsWithRef<typeof CollapsiblePrimitive.Root>, "variant" | "size"> & {
  /**
   * Visual style of the widget.
   * - `plain` — No frame — a bare trigger row above a frameless panel.
   * - `card` — A bordered, padded box enclosing both the trigger and the panel.
   * - `inline` — A text-flow trigger (reads as a link) over continuous prose — the read-more pattern.
   * @default "plain"
   * @see https://primitiv-ui.dev/docs/components/collapsible
   */
  variant?: "plain" | "card" | "inline";
  /**
   * Control size for the whole widget; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/collapsible
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export function Collapsible({ variant, size, className, ...props }: CollapsibleProps) {
  return <CollapsiblePrimitive.Root className={[collapsible({ variant, size }), className].filter(Boolean).join(" ")} {...props} />;
}

export type CollapsibleTriggerProps = ComponentPropsWithRef<typeof CollapsiblePrimitive.Trigger>;

function wrapCollapsibleTriggerTextNodes(children: ReactNode): ReactNode {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number"
      ? <span className="primitiv-collapsible__trigger-label">{child}</span>
      : child,
  );
}

export function CollapsibleTrigger({ className, children, ...props }: CollapsibleTriggerProps) {
  return (
    <CollapsiblePrimitive.Trigger className={[collapsibleTrigger(), className].filter(Boolean).join(" ")} {...props}>
      {wrapCollapsibleTriggerTextNodes(children)}
    </CollapsiblePrimitive.Trigger>
  );
}

export type CollapsibleContentProps = ComponentPropsWithRef<typeof CollapsiblePrimitive.Content>;

export function CollapsibleContent({ className, ...props }: CollapsibleContentProps) {
  return <CollapsiblePrimitive.Content className={[collapsibleContent(), className].filter(Boolean).join(" ")} {...props} />;
}

export type CollapsibleTriggerIconProps = ComponentPropsWithRef<typeof CollapsiblePrimitive.TriggerIcon>;

export function CollapsibleTriggerIcon({ className, ...props }: CollapsibleTriggerIconProps) {
  return <CollapsiblePrimitive.TriggerIcon className={[collapsibleTriggerIcon(), className].filter(Boolean).join(" ")} {...props} />;
}
