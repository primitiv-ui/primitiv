import "../styles/primitiv/blockquote/styles.css";
/*
 * Blockquote — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add blockquote`. Renders a
 * <blockquote> with a left-stroke accent bar (`tone` picks the colour) and an
 * optional attribution line (`cite`). Like <Prose>, it carries zero
 * behaviour — it only adds classes — so, unlike the generated wrappers, it
 * composes no headless primitive. Hand-written, so it has no drift-guard
 * test.
 */
import { type ComponentPropsWithRef, type ReactNode } from "react";
import { blockquote, type BlockquoteVariants } from "./blockquote.recipe";

export type BlockquoteProps = Omit<ComponentPropsWithRef<"blockquote">, "cite"> &
  BlockquoteVariants & {
    /**
     * The attribution line, rendered in a `<cite>` beneath the quote. Omitted
     * when not provided.
     *
     * Narrows the native `<blockquote cite>` attribute (a source URL) to a
     * display string — the RFC 0023 sketch's own shape for this component,
     * mirroring the `Omit`-narrowing already used elsewhere in the registry
     * (e.g. `NavigationMenu.Item.value` over `<li value>`).
     */
    cite?: ReactNode;
  };

/**
 * A blockquote with a left-stroke accent bar. `tone` (`default`|`accent`,
 * default `default`) picks the bar colour; `size` (`xs`–`xl`, default `md`)
 * scales the quote and citation type together — never independently (RFC
 * 0012 D12). Pass `cite` for an attribution line.
 *
 * @example
 * ```tsx
 * <Blockquote tone="accent" cite="Author Name">
 *   The stable surface is the contract, not the values.
 * </Blockquote>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/blockquote
 */
export function Blockquote({ tone, size, cite, className, children, ...props }: BlockquoteProps) {
  return (
    <blockquote className={[blockquote({ tone, size }), className].filter(Boolean).join(" ")} {...props}>
      <p className="primitiv-blockquote__quote">{children}</p>
      {cite ? <cite className="primitiv-blockquote__citation">{cite}</cite> : null}
    </blockquote>
  );
}
