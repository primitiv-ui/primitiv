import "../styles/primitiv/container/styles.css";
/*
 * Container — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add container`. The centred,
 * max-width content column (RFC 0022, build-order step 3): it caps its width
 * against the breakpoint scale and pads its inline edges from a density-scaled
 * gutter ramp. Like <Prose>, it carries zero behaviour — it only adds classes —
 * so, unlike the generated wrappers, it composes no headless primitive: it
 * renders a <div>, or the consumer's own element via `asChild` (Slot).
 * Hand-written, so it has no drift-guard test.
 *
 * Container centres *itself*; centring content *within* it is <Center>'s job,
 * which is why there is no `centerContent` prop (Chakra has one).
 */
import { Slot } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type ElementType } from "react";
import { container, type ContainerVariants } from "./container.recipe";

export type ContainerProps = ComponentPropsWithRef<"div"> &
  ContainerVariants & {
    /**
     * Render the single child element instead of a wrapping <div>, merging the
     * container classes onto it — e.g. `<Container asChild><main>...</main></Container>`.
     */
    asChild?: boolean;
  };

/**
 * A centred, max-width content column. `size` (`xs`–`2xl`|`full`, default
 * `lg`) caps the width against the breakpoint scale, so `size="lg"` stops
 * growing exactly where the `lg` breakpoint begins; `gutter`
 * (`responsive`|`none`|`sm`|`md`|`lg`, default `responsive`) sets the inline
 * padding, escalating across breakpoints unless pinned to a fixed step. Both
 * props are modifier classes — `Container` writes no inline styles.
 *
 * Full-bleed is two knobs rather than one: `size="full"` drops the width cap
 * but keeps the gutters (a full-width band with readable edges), and
 * `gutter="none"` drops the padding. True edge-to-edge is both together.
 *
 * @example
 * ```tsx
 * <Container>
 *   <Prose>...</Prose>
 * </Container>
 *
 * <Container size="xl" asChild>
 *   <main>...</main>
 * </Container>
 *
 * <Container size="full" gutter="none">
 *   <img src="/hero.jpg" alt="" />
 * </Container>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/container
 */
export function Container({
  size,
  gutter,
  asChild = false,
  className,
  ...props
}: ContainerProps) {
  const Comp: ElementType = asChild ? Slot : "div";
  return (
    <Comp
      className={[container({ size, gutter }), className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
