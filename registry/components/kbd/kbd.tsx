/*
 * Kbd — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add kbd`. Renders a styled
 * <kbd> key cap with an `xs`–`xl` `size` prop — the raised-key sibling of
 * Inline Code (RFC 0012 D17). Like <InlineCode>, it carries zero behaviour —
 * it only adds classes — so, unlike the generated wrappers, it composes no
 * headless primitive: it renders a <kbd>, or the consumer's own element via
 * `asChild` (Slot). Hand-written, so it has no drift-guard test.
 */
import { Slot } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type ElementType } from "react";
import { kbd, type KbdVariants } from "./kbd.recipe";

export type KbdProps = ComponentPropsWithRef<"kbd"> &
  KbdVariants & {
    /**
     * Render the single child element instead of a wrapping <kbd>, merging
     * the kbd classes onto it — e.g. `<Kbd asChild><span>…</span></Kbd>`.
     */
    asChild?: boolean;
  };

/**
 * A keyboard-shortcut key cap — a `<kbd>` set in the mono face on a raised,
 * bordered box, so it reads as a physical key rather than a tinted code
 * span. The `size` prop (`xs`–`xl`, default `md`) scales the type so a
 * shortcut tracks the surrounding text; a `data-density` ancestor scales
 * each size further.
 *
 * @example
 * ```tsx
 * <p>Press <Kbd>Esc</Kbd> to close.</p>
 * <p><Kbd size={size}>Ctrl</Kbd> + <Kbd size={size}>K</Kbd></p>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/kbd
 */
export function Kbd({ asChild = false, size, className, ...props }: KbdProps) {
  const Comp: ElementType = asChild ? Slot : "kbd";
  return <Comp className={[kbd({ size }), className].filter(Boolean).join(" ")} {...props} />;
}
