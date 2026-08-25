import "../styles/primitiv/toggle-group/styles.css";
/*
 * ToggleGroup — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/toggle-group/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { ToggleGroup as ToggleGroupPrimitive } from "@primitiv-ui/react";
import { Children, cloneElement, isValidElement, type ComponentPropsWithRef, type ReactNode } from "react";
import { toggleGroup, toggleGroupItem } from "./toggle-group.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A segmented control — a recessed pill track holding borderless items; single- or multi-select. Pressed items lift into a raised thumb.
 *
 * @see https://primitiv-ui.dev/docs/components/toggle-group
 */
export type ToggleGroupProps = DistributiveOmit<ComponentPropsWithRef<typeof ToggleGroupPrimitive.Root>, "size" | "justify"> & {
  /**
   * Control size for the whole widget; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/toggle-group
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * Whether items size to their content or share the track width equally.
   * - `content` — Items size to their content — e.g. a B / I / U formatting toolbar (the default).
   * - `justified` — Items share the track width equally — a true segmented control (e.g. Day / Week / Month).
   * @default "content"
   * @see https://primitiv-ui.dev/docs/components/toggle-group
   */
  justify?: "content" | "justified";
};

export function ToggleGroup({ size, justify, className, ...props }: ToggleGroupProps) {
  return <ToggleGroupPrimitive.Root className={[toggleGroup({ size, justify }), className].filter(Boolean).join(" ")} {...props} />;
}

export type ToggleGroupItemProps = ComponentPropsWithRef<typeof ToggleGroupPrimitive.Item>;

function wrapToggleGroupItemTextNodes(children: ReactNode, asChild?: boolean): ReactNode {
  // Under `asChild` the child is the CONSUMER's element (a routing <Link>, an
  // <a>), so its text sits one level deeper than `Children.map` reaches and
  // nothing would wrap it — losing the label span's text-box-trim and
  // nowrap. One level only: it covers the real cases and stays predictable.
  if (asChild && isValidElement<{ children?: ReactNode }>(children)) {
    return cloneElement(children, undefined, wrapToggleGroupItemTextNodes(children.props.children));
  }
  const mapped = Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number"
      ? <span className="primitiv-toggle-group__item-label">{child}</span>
      : child,
  );
  return Array.isArray(mapped) && mapped.length === 1 ? mapped[0] : mapped;
}

export function ToggleGroupItem({ className, children, ...props }: ToggleGroupItemProps) {
  return (
    <ToggleGroupPrimitive.Item className={[toggleGroupItem(), className].filter(Boolean).join(" ")} {...props}>
      {wrapToggleGroupItemTextNodes(children, props.asChild)}
    </ToggleGroupPrimitive.Item>
  );
}
