import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Props for {@link Input} — all native `<input>` attributes (with `type`
 * defaulting to `"text"`) plus the `asChild` escape hatch and a typed `ref`.
 */
export type InputProps = ComponentProps<"input"> & {
  /**
   * Renders the child element instead of a native `<input>`, merging all
   * props — `aria-*`, `data-*`, event handlers, `ref` — onto it via
   * {@link Slot}. Event handlers compose (child runs first). `type` is
   * not forwarded in this mode; the child owns its own type semantics.
   * See the `asChild` example on {@link Input}.
   * @default false
   */
  asChild?: boolean;
  /**
   * Forwarded to the underlying `HTMLInputElement`. Under `asChild`,
   * merged onto the rendered child via {@link Slot}.
   */
  ref?: Ref<HTMLInputElement>;
  /**
   * Under `asChild`, becomes the single child element `Slot` merges props
   * onto. Not rendered by the native `<input>` path (inputs are void
   * elements in HTML).
   */
  children?: ReactNode;
};
