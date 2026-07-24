import "../styles/primitiv/collapsible/styles.css";
/*
 * Collapsible — styled wrapper, generated from contract.json with one
 * HAND-AUTHORED deviation (bespoke escape hatch, RFC 0004 D53).
 *
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51). Every part follows
 * the generated shape except CollapsibleContent: to drive the display:grid
 * open/close transition (styles.css), it force-mounts the panel (so it is never
 * `hidden` and can animate) and wraps its children in three nested elements — a
 * `.primitiv-collapsible__content-inner` clip (the `overflow: hidden` grid item
 * the row-track collapses), a `.primitiv-collapsible__content-body` inside it
 * that carries the panel padding (mirrors AccordionContent), and a sibling
 * `.primitiv-collapsible__content-fade` overlay that reads the `collapsedHeight`
 * prop and fades away once the panel is fully open. `forceMount` is therefore
 * not exposed as a prop (it is always on). Keep this file, contract.json, and
 * the stylesheet in sync by hand.
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

export type CollapsibleContentProps = DistributiveOmit<ComponentPropsWithRef<typeof CollapsiblePrimitive.Content>, "forceMount">;

export function CollapsibleContent({ className, children, ...props }: CollapsibleContentProps) {
  return (
    <CollapsiblePrimitive.Content className={[collapsibleContent(), className].filter(Boolean).join(" ")} {...props} forceMount>
      <div className="primitiv-collapsible__content-inner">
        <div className="primitiv-collapsible__content-body">{children}</div>
        <div className="primitiv-collapsible__content-fade" aria-hidden="true" />
      </div>
    </CollapsiblePrimitive.Content>
  );
}

export type CollapsibleTriggerIconProps = ComponentPropsWithRef<typeof CollapsiblePrimitive.TriggerIcon>;

export function CollapsibleTriggerIcon({ className, ...props }: CollapsibleTriggerIconProps) {
  return <CollapsiblePrimitive.TriggerIcon className={[collapsibleTriggerIcon(), className].filter(Boolean).join(" ")} {...props} />;
}
