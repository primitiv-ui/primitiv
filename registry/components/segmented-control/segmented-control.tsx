/*
 * SegmentedControl — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/segmented-control/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { SegmentedControl as SegmentedControlPrimitive } from "@primitiv-ui/react";
import { Children, cloneElement, isValidElement, type ComponentPropsWithRef, type ReactNode } from "react";
import { segmentedControl, segmentedControlItem } from "./segmented-control.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A single-select segmented control — a linear strip of segments where exactly one is selected. The selected segment is brand-filled; the rest are secondary.
 *
 * @see https://primitiv-ui.dev/docs/components/segmented-control
 */
export type SegmentedControlProps = DistributiveOmit<ComponentPropsWithRef<typeof SegmentedControlPrimitive.Root>, "size" | "justify"> & {
  /**
   * Control size for the whole control; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/segmented-control
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * Whether segments share the track width equally or size to their content.
   * - `content` — Segments size to their content — opt out of the default equal-width layout.
   * - `justified` — Segments share the track width equally, matching the widest one (the default) — the classic equal-width segmented control.
   * @default "justified"
   * @see https://primitiv-ui.dev/docs/components/segmented-control
   */
  justify?: "content" | "justified";
};

export function SegmentedControl({ size, justify, className, ...props }: SegmentedControlProps) {
  return <SegmentedControlPrimitive.Root className={[segmentedControl({ size, justify }), className].filter(Boolean).join(" ")} {...props} />;
}

export type SegmentedControlItemProps = ComponentPropsWithRef<typeof SegmentedControlPrimitive.Item>;

function wrapSegmentedControlItemTextNodes(children: ReactNode, asChild?: boolean): ReactNode {
  // Under `asChild` the child is the CONSUMER's element (a routing <Link>, an
  // <a>), so its text sits one level deeper than `Children.map` reaches and
  // nothing would wrap it — losing the label span's text-box-trim and
  // nowrap. One level only: it covers the real cases and stays predictable.
  if (asChild && isValidElement<{ children?: ReactNode }>(children)) {
    return cloneElement(children, undefined, wrapSegmentedControlItemTextNodes(children.props.children));
  }
  const mapped = Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number"
      ? <span className="primitiv-segmented-control__item-label">{child}</span>
      : child,
  );
  return Array.isArray(mapped) && mapped.length === 1 ? mapped[0] : mapped;
}

export function SegmentedControlItem({ className, children, ...props }: SegmentedControlItemProps) {
  return (
    <SegmentedControlPrimitive.Item className={[segmentedControlItem(), className].filter(Boolean).join(" ")} {...props}>
      {wrapSegmentedControlItemTextNodes(children, props.asChild)}
    </SegmentedControlPrimitive.Item>
  );
}
