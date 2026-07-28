import "../styles/primitiv/center/styles.css";
/*
 * Center — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add center`. Renders a single-
 * or both-axis Flexbox centring box (RFC 0022). Like <Box>, it carries zero
 * behaviour — it only adds classes — so, unlike the generated wrappers, it
 * composes no headless primitive: it renders a <div>, or the consumer's own
 * element via `asChild` (Slot). Hand-written, so it has no drift-guard test.
 */
import { Slot } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type ElementType } from "react";
import { center, type CenterVariants } from "./center.recipe";

export type CenterProps = ComponentPropsWithRef<"div"> &
  CenterVariants & {
    /**
     * Render the single child element instead of a wrapping <div>, merging
     * the center classes onto it — e.g. `<Center asChild><section>…</section></Center>`.
     */
    asChild?: boolean;
  };

/**
 * A single- or both-axis Flexbox centring box. `axis` (`"both"|"horizontal"|
 * "vertical"`, default `"both"`) picks which axis (or axes) to centre
 * content along; the uncentred axis stays content-driven, never stretched.
 *
 * @example
 * ```tsx
 * <Center style={{ blockSize: "100vh" }}>
 *   <Spinner />
 * </Center>
 *
 * <Center axis="horizontal">
 *   <Logo />
 * </Center>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/center
 */
export function Center({ axis, asChild = false, className, ...props }: CenterProps) {
  const Comp: ElementType = asChild ? Slot : "div";
  return <Comp className={[center({ axis }), className].filter(Boolean).join(" ")} {...props} />;
}
