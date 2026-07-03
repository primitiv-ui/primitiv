/*
 * Inline Code — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add inline-code`. Renders a styled
 * <code> chip with an `xs`–`xl` `size` prop. Like <Prose>, it carries zero
 * behaviour — it only adds classes — so, unlike the generated wrappers, it
 * composes no headless primitive: it renders a <code>, or the consumer's own
 * element via `asChild` (Slot). Hand-written, so it has no drift-guard test.
 */
import { Slot } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type ElementType } from "react";
import { inlineCode, type InlineCodeVariants } from "./inline-code.recipe";

export type InlineCodeProps = ComponentPropsWithRef<"code"> &
  InlineCodeVariants & {
    /**
     * Render the single child element instead of a wrapping <code>, merging the
     * inline-code classes onto it — e.g. `<InlineCode asChild><kbd>…</kbd></InlineCode>`.
     */
    asChild?: boolean;
  };

/**
 * An inline code fragment — a `<code>` set in the mono face on a tinted,
 * hairline-bordered chip. The `size` prop (`xs`–`xl`, default `md`) scales the
 * type so a snippet tracks the surrounding text; a `data-density` ancestor
 * scales each size further.
 *
 * @example
 * ```tsx
 * <p>Call <InlineCode>useState</InlineCode> at the top level.</p>
 * <InlineCode size="sm">npm i</InlineCode>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/inline-code
 */
export function InlineCode({ asChild = false, size, className, ...props }: InlineCodeProps) {
  const Comp: ElementType = asChild ? Slot : "code";
  return <Comp className={[inlineCode({ size }), className].filter(Boolean).join(" ")} {...props} />;
}
