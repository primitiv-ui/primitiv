import "../styles/primitiv/box/styles.css";
/*
 * Box — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add box`. The escape hatch (RFC
 * 0022): a bare polymorphic element with no visual opinion, so a consumer has
 * something to attach a custom property or a one-off style to without
 * reaching for a raw <div>. Like <Prose>, it carries zero behaviour — so,
 * unlike the generated wrappers, it composes no headless primitive: it
 * renders a <div>, or the consumer's own element via `asChild` (Slot).
 * Hand-written, so it has no drift-guard test.
 */
import { Slot } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type ElementType } from "react";
import { box } from "./box.recipe";

export type BoxProps = ComponentPropsWithRef<"div"> & {
  /**
   * Render the single child element instead of a wrapping <div>, merging the
   * box class onto it — e.g. `<Box asChild><section>...</section></Box>`.
   */
  asChild?: boolean;
};

/**
 * The escape hatch — a bare polymorphic element with no visual opinion.
 * Attach a custom property or a one-off style without reaching for a raw
 * `<div>`; compose your own semantic element via `asChild`.
 *
 * @example
 * ```tsx
 * <Box style={{ "--primitiv-space-space-16": "1.25rem" }}>
 *   <Card />
 * </Box>
 *
 * <Box asChild>
 *   <section aria-label="Summary">...</section>
 * </Box>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/box
 */
export function Box({ asChild = false, className, ...props }: BoxProps) {
  const Comp: ElementType = asChild ? Slot : "div";
  return <Comp className={[box(), className].filter(Boolean).join(" ")} {...props} />;
}
