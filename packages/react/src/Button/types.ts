import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Props for {@link Button} — all native `<button>` attributes (with `type`
 * defaulting to `"button"`) plus the `asChild` escape hatch and a typed `ref`.
 *
 * @extends HTMLButtonElement
 */
export type ButtonProps = Omit<ComponentProps<"button">, "type"> & {
  /**
   * The button's native `type` attribute, restricted to the three valid
   * values. Defaults to `"button"` (not the DOM's own default of
   * `"submit"`), so a `Button` placed inside a `<form>` never triggers an
   * accidental submit unless set explicitly.
   * @default "button"
   */
  type?: "button" | "submit" | "reset";
  /**
   * Renders the child element instead of a native `<button>`, merging all
   * props — aria-*, data-*, event handlers, ref — onto it via
   * {@link Slot}. `type` is not forwarded in this mode; the child owns its
   * own type semantics. See the `asChild` example on {@link Button}.
   * @default false
   */
  asChild?: boolean;
  /**
   * Forwarded to the underlying `HTMLButtonElement`, or — under
   * `asChild` — merged onto the rendered child via {@link Slot}.
   */
  ref?: Ref<HTMLButtonElement>;
  /** Button content. Under `asChild`, becomes the single child element `Slot` merges props onto. */
  children?: ReactNode;
};
