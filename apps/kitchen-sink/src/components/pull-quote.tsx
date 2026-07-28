import "../styles/primitiv/pull-quote/styles.css";
/*
 * Pull Quote — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add pull-quote`. Renders a
 * large, centred editorial quote — no accent bar, no attribution, distinct
 * from Blockquote (RFC 0012 D13). Like <Prose>, it carries zero behaviour —
 * it only adds classes — so, unlike the generated wrappers, it composes no
 * headless primitive. Hand-written, so it has no drift-guard test.
 */
import { type ComponentPropsWithRef } from "react";
import { pullQuote, type PullQuoteVariants } from "./pull-quote.recipe";

export type PullQuoteProps = ComponentPropsWithRef<"blockquote"> &
  PullQuoteVariants & {
    /**
     * Show the decorative open-quote mark above the text.
     * @default false
     */
    marks?: boolean;
  };

/**
 * A large, centred editorial pull quote. `size` (`xs`–`xl`, default `md`)
 * rides the existing `heading/*` type scale (xs→h5 … xl→h1); `marks` toggles
 * a decorative open-quote glyph above the text.
 *
 * @example
 * ```tsx
 * <PullQuote marks size="lg">
 *   A large editorial pull quote.
 * </PullQuote>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/pull-quote
 */
export function PullQuote({ marks = false, size, className, children, ...props }: PullQuoteProps) {
  return (
    <blockquote
      className={[pullQuote({ size }), className].filter(Boolean).join(" ")}
      data-marks={marks ? "" : undefined}
      {...props}
    >
      {marks ? (
        <span className="primitiv-pull-quote__mark" aria-hidden="true">
          &ldquo;
        </span>
      ) : null}
      <p className="primitiv-pull-quote__text">{children}</p>
    </blockquote>
  );
}
