import "../styles/primitiv/tag/styles.css";
/*
 * Tag — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add tag`. Renders a styled
 * <span> label chip with `tone` and `size` props — a read-only leaf, never
 * interactive (RFC 0021). Like <Badge>, it carries zero behaviour — it only
 * adds classes — so, unlike the generated wrappers, it composes no headless
 * primitive: it renders a <span>, or the consumer's own element via
 * `asChild` (Slot). Hand-written, so it has no drift-guard test.
 */
import { Slot } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type ElementType } from "react";
import { tag, type TagVariants } from "./tag.recipe";

export type TagProps = ComponentPropsWithRef<"span"> &
  TagVariants & {
    /**
     * Render the single child element instead of a wrapping <span>, merging
     * the tag classes onto it — e.g. `<Tag asChild><a>…</a></Tag>`.
     */
    asChild?: boolean;
  };

/**
 * A small label chip that tags content by category, topic, or status —
 * typically shown in a horizontal group. Read-only, never interactive.
 * `tone="neutral"` (the default) is the plain grey treatment for an
 * ordinary label; the four semantic tones are reserved for status.
 *
 * @example
 * ```tsx
 * <Tag>Design</Tag>
 * <Tag>Rust</Tag>
 * <Tag tone="success">Shipped</Tag>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/tag
 */
export function Tag({ asChild = false, tone, size, className, ...props }: TagProps) {
  const Comp: ElementType = asChild ? Slot : "span";
  return <Comp className={[tag({ tone, size }), className].filter(Boolean).join(" ")} {...props} />;
}
