/*
 * Stack — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add stack`. Renders a Flexbox
 * container that stacks its children in a column (default) or a row, with a
 * `gap` prop resolved against the space-* scale (RFC 0022) — continuing RFC
 * 0016's "gap is the tool for component-internal spacing." Like <Prose>, it
 * carries zero behaviour — it only adds classes — so, unlike the generated
 * wrappers, it composes no headless primitive: it renders a <div>, or the
 * consumer's own element via `asChild` (Slot). Hand-written, so it has no
 * drift-guard test.
 */
import { Slot } from "@primitiv-ui/react";
import { type CSSProperties, type ComponentPropsWithRef, type ElementType } from "react";
import { stack, type StackVariants } from "./stack.recipe";

export type StackProps = ComponentPropsWithRef<"div"> &
  StackVariants & {
    /**
     * `align-items` — a plain Flexbox keyword, not a design token, so it
     * passes through as an inline style rather than a modifier class.
     * @default "stretch"
     */
    align?: CSSProperties["alignItems"];
    /**
     * `justify-content` — a plain Flexbox keyword, not a design token, so it
     * passes through as an inline style rather than a modifier class.
     * @default "flex-start"
     */
    justify?: CSSProperties["justifyContent"];
    /**
     * Render the single child element instead of a wrapping <div>, merging
     * the stack classes onto it — e.g. `<Stack asChild><ul>…</ul></Stack>`.
     */
    asChild?: boolean;
  };

/**
 * A Flexbox stack. `direction` (`column`|`row`, default `column`) sets the
 * axis; `gap` (`none`–`xl`, default `md`) resolves against the space-* scale.
 * `align`/`justify` are plain Flexbox keywords passed straight through as
 * inline styles.
 *
 * @example
 * ```tsx
 * <Stack gap="sm">
 *   <Field />
 *   <Field />
 * </Stack>
 *
 * <Stack direction="row" gap="xs" align="center">
 *   <Avatar />
 *   <span>Jane Cooper</span>
 * </Stack>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/stack
 */
export function Stack({
  direction,
  gap,
  align,
  justify,
  asChild = false,
  className,
  style,
  ...props
}: StackProps) {
  const Comp: ElementType = asChild ? Slot : "div";
  return (
    <Comp
      className={[stack({ direction, gap }), className].filter(Boolean).join(" ")}
      style={{
        ...(align ? { "--primitiv-stack-align": align } : null),
        ...(justify ? { "--primitiv-stack-justify": justify } : null),
        ...style,
      } as CSSProperties}
      {...props}
    />
  );
}
