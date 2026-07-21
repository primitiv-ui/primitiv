import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Props for {@link Textarea} — all native `<textarea>` attributes (with `ref`
 * typed as `Ref<HTMLTextAreaElement>`) plus the `asChild` escape hatch.
 */
export type TextareaProps = Omit<ComponentProps<"textarea">, "ref"> & {
  /**
   * Renders the child element instead of a native `<textarea>`, merging all
   * props — aria-*, data-*, event handlers, ref — onto it via {@link Slot}.
   * Event handlers compose (child runs first). Use this to wrap a third-party
   * autosizing textarea while keeping this component's prop contract.
   * @default false
   */
  asChild?: boolean;
  /**
   * Forwarded to the underlying `HTMLTextAreaElement`. Under `asChild`, merged
   * onto the rendered child via {@link Slot}.
   */
  ref?: Ref<HTMLTextAreaElement>;
  /**
   * Child content. Under `asChild`, must be a single React element that
   * {@link Slot} merges props onto. Not used when rendering a native
   * `<textarea>` (the element's content is controlled by `value` /
   * `defaultValue`, not children).
   */
  children?: ReactNode;
};
