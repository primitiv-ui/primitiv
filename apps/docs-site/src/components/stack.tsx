import "../styles/primitiv/stack/styles.css";
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
import { type ComponentPropsWithRef, type ElementType } from "react";
import { stack, type StackVariants } from "./stack.recipe";

export type StackProps = ComponentPropsWithRef<"div"> &
  StackVariants & {
    /**
     * Render the single child element instead of a wrapping <div>, merging
     * the stack classes onto it — e.g. `<Stack asChild><ul>…</ul></Stack>`.
     */
    asChild?: boolean;
  };

/**
 * A Flexbox stack. `direction` (`column`|`row`|`column-reverse`|`row-reverse`,
 * default `column`) sets the axis and order; `gap` (`none`–`xl`, default
 * `md`) resolves against the space-* scale;
 * `wrap` (`nowrap`|`wrap`, default `nowrap`) lets children break onto
 * additional lines instead of overflowing the main axis; `align`
 * (`start`|`center`|`end`|`stretch`|`baseline`, default `stretch`) and
 * `justify` (`start`|`center`|`end`|`between`|`around`|`evenly`, default
 * `start`) set the alignment. Every prop is a modifier class — `Stack` writes
 * no inline styles.
 *
 * @example
 * ```tsx
 * <Stack gap="sm">
 *   <Field />
 *   <Field />
 * </Stack>
 *
 * <Stack direction="row" gap="xs" align="center" justify="between">
 *   <Avatar />
 *   <span>Jane Cooper</span>
 * </Stack>
 *
 * <Stack direction="row" wrap="wrap" gap="md">
 *   <Button>One</Button>
 *   <Button>Two</Button>
 * </Stack>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/stack
 */
export function Stack({
  direction,
  gap,
  wrap,
  align,
  justify,
  asChild = false,
  className,
  ...props
}: StackProps) {
  const Comp: ElementType = asChild ? Slot : "div";
  return (
    <Comp
      className={[stack({ direction, gap, wrap, align, justify }), className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
