import "../styles/primitiv/badge/styles.css";
/*
 * Badge — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add badge`. Renders a styled
 * <span> status/count chip with `tone`, `variant` and `size` props — a
 * read-only leaf, never interactive (RFC 0021). Like <Kbd>, it carries zero
 * behaviour — it only adds classes — so, unlike the generated wrappers, it
 * composes no headless primitive: it renders a <span>, or the consumer's own
 * element via `asChild` (Slot). Hand-written, so it has no drift-guard test.
 */
import { Slot } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type ElementType } from "react";
import { badge, type BadgeVariants } from "./badge.recipe";

export type BadgeProps = ComponentPropsWithRef<"span"> &
  BadgeVariants & {
    /**
     * Render the single child element instead of a wrapping <span>, merging
     * the badge classes onto it — e.g. `<Badge asChild><a>…</a></Badge>`.
     */
    asChild?: boolean;
  };

/**
 * A small status/count chip attached to another element or beside a
 * heading — read-only, never interactive. `variant="label"` (the default)
 * is the low-emphasis tinted treatment for a status word; `variant="counter"`
 * is the high-emphasis solid treatment for a notification count.
 *
 * Circularity is a function of content length, not a variant: 1-2 character
 * content (a count) renders as a true circle, longer content (a status word)
 * widens into a pill — either variant can take either shape.
 *
 * @example
 * ```tsx
 * <Badge tone="success">Shipped</Badge>
 * <Badge tone="danger" variant="counter">3</Badge>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/badge
 */
export function Badge({ asChild = false, tone, variant, size, className, ...props }: BadgeProps) {
  const Comp: ElementType = asChild ? Slot : "span";
  return <Comp className={[badge({ tone, variant, size }), className].filter(Boolean).join(" ")} {...props} />;
}
