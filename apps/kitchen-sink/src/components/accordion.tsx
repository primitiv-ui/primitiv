import "../styles/primitiv/accordion/styles.css";
/*
 * Accordion — styled wrapper, generated from contract.json with one
 * HAND-AUTHORED deviation (bespoke escape hatch, RFC 0004 D53).
 *
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51). Every part follows
 * the generated shape except AccordionContent: to drive the display:grid
 * open/close transition (styles.css), it force-mounts the panel (so it is never
 * `hidden` and can animate) and wraps its children in a
 * `.primitiv-accordion__content-inner` clip element — the grid item whose
 * overflow the row-track animates over. `forceMount` is therefore not exposed
 * as a prop (it is always on). Keep this file, contract.json, and the
 * stylesheet in sync by hand.
 */
import { Accordion as AccordionPrimitive } from "@primitiv-ui/react";
import { Children, type ComponentPropsWithRef, type ReactNode } from "react";
import { accordion, accordionItem, accordionHeader, accordionTrigger, accordionContent, accordionTriggerIcon } from "./accordion.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A vertically stacked set of collapsible sections — hairline rows with a chevron that flips open→closed (WAI-ARIA Accordion pattern).
 *
 * @see https://primitiv-ui.dev/docs/components/accordion
 */
export type AccordionProps = DistributiveOmit<ComponentPropsWithRef<typeof AccordionPrimitive.Root>, "size"> & {
  /**
   * Control size for the whole widget; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/accordion
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export function Accordion({ size, className, ...props }: AccordionProps) {
  return <AccordionPrimitive.Root className={[accordion({ size }), className].filter(Boolean).join(" ")} {...props} />;
}

export type AccordionItemProps = ComponentPropsWithRef<typeof AccordionPrimitive.Item>;

export function AccordionItem({ className, ...props }: AccordionItemProps) {
  return <AccordionPrimitive.Item className={[accordionItem(), className].filter(Boolean).join(" ")} {...props} />;
}

export type AccordionHeaderProps = ComponentPropsWithRef<typeof AccordionPrimitive.Header>;

export function AccordionHeader({ className, ...props }: AccordionHeaderProps) {
  return <AccordionPrimitive.Header className={[accordionHeader(), className].filter(Boolean).join(" ")} {...props} />;
}

export type AccordionTriggerProps = ComponentPropsWithRef<typeof AccordionPrimitive.Trigger>;

function wrapAccordionTriggerTextNodes(children: ReactNode): ReactNode {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number"
      ? <span className="primitiv-accordion__trigger-label">{child}</span>
      : child,
  );
}

export function AccordionTrigger({ className, children, ...props }: AccordionTriggerProps) {
  return (
    <AccordionPrimitive.Trigger className={[accordionTrigger(), className].filter(Boolean).join(" ")} {...props}>
      {wrapAccordionTriggerTextNodes(children)}
    </AccordionPrimitive.Trigger>
  );
}

export type AccordionContentProps = DistributiveOmit<ComponentPropsWithRef<typeof AccordionPrimitive.Content>, "forceMount">;

export function AccordionContent({ className, children, ...props }: AccordionContentProps) {
  return (
    <AccordionPrimitive.Content className={[accordionContent(), className].filter(Boolean).join(" ")} {...props} forceMount>
      <div className="primitiv-accordion__content-inner">{children}</div>
    </AccordionPrimitive.Content>
  );
}

export type AccordionTriggerIconProps = ComponentPropsWithRef<typeof AccordionPrimitive.TriggerIcon>;

export function AccordionTriggerIcon({ className, ...props }: AccordionTriggerIconProps) {
  return <AccordionPrimitive.TriggerIcon className={[accordionTriggerIcon(), className].filter(Boolean).join(" ")} {...props} />;
}
