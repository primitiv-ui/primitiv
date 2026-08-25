/*
 * Button — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/button/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Button as ButtonPrimitive } from "@primitiv-ui/react";
import { Children, cloneElement, isValidElement, type ComponentPropsWithRef, type ReactNode } from "react";
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
   * - `ghost` — Low-emphasis action; no frame, tints on hover.
   * - `link` — Reads as a link; no frame.
   * @default "primary"
   * @see https://primitiv-ui.dev/docs/components/button
   */
  variant?: "primary" | "secondary" | "danger" | "ghost" | "link";
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

function wrapTextNodes(children: ReactNode, asChild?: boolean): ReactNode {
  // Under `asChild` the child is the CONSUMER's element (a routing <Link>, an
  // <a>), so its text sits one level deeper than `Children.map` reaches and
  // nothing would wrap it — losing the label span's text-box-trim and
  // nowrap. One level only: it covers the real cases and stays predictable.
  if (asChild && isValidElement<{ children?: ReactNode }>(children)) {
    return cloneElement(children, undefined, wrapTextNodes(children.props.children));
  }
  const mapped = Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number"
      ? <span className="primitiv-button__label">{child}</span>
      : child,
  );
  return Array.isArray(mapped) && mapped.length === 1 ? mapped[0] : mapped;
}

export function Button({ variant, size, className, children, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive className={[button({ variant, size }), className].filter(Boolean).join(" ")} {...props}>
      {wrapTextNodes(children, props.asChild)}
    </ButtonPrimitive>
  );
}
