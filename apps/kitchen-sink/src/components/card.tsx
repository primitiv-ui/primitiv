import "../styles/primitiv/card/styles.css";
/*
 * Card — styled wrapper, HAND-AUTHORED (composes no headless primitive).
 *
 * Copied into the consumer repo by `primitiv add card`. Card is structure
 * and styling only — it has no keyboard model, focus management or open/
 * close state, so there is nothing for a `packages/react` primitive to own
 * (contrast Modal, which ConfirmDialog composes for exactly those reasons).
 * Like `badge`/`tag`/`chip` it renders plain elements, or the consumer's own
 * via `asChild` (Slot), and carries no drift-guard test — keep contract.json
 * + the stylesheet + this file in sync by hand.
 *
 * Compound by design: a card's content is arbitrary, so the parts are
 * exported individually rather than driven by props. The one structural
 * rule is that `CardContent` owns ALL the padding — `CardHeader`,
 * `CardDescription` and `CardFooter` carry none of their own. An earlier
 * Figma build gave each region its own full padding and every seam between
 * them was doubled; do not reintroduce per-region padding.
 *
 * `CardMedia` is a sibling of `CardContent`, never a child, in all three
 * layouts — `inset` is a pure CSS concern (a margin plus a radius), not a
 * different DOM shape. That is what keeps one markup structure working for
 * flush and inset media alike.
 */
import { Slot } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type CSSProperties, type ReactNode } from "react";
import {
  card,
  cardFooter,
  cardMedia,
  type CardFooterVariants,
  type CardVariants,
} from "./card.recipe";

function cx(...values: Array<string | undefined | false>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * Explicit literal unions rather than the `class-variance-authority`-derived
 * `CardVariants`, whose inference can widen to a bare `string` depending on
 * how the recipe was declared (same reasoning as `alert`).
 */
type Layout = "vertical" | "horizontal" | "cover";
type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Elevation = "flat" | "raised";
type Scrim = "soft" | "medium" | "strong";
type Justify = "start" | "center" | "end";
type CoverForeground = "white" | "black";

export type CardProps = ComponentPropsWithRef<"div"> &
  Omit<CardVariants, "layout" | "size" | "elevation" | "scrim"> & {
    /**
     * How the media region relates to the content.
     * @default "vertical"
     */
    layout?: Layout;
    /**
     * Card size; `data-density` scales each size further.
     * @default "md"
     */
    size?: Size;
    /**
     * Resting shadow depth.
     * @default "flat"
     */
    elevation?: Elevation;
    /**
     * Strength of the legibility gradient drawn over the media. Only has an
     * effect when `layout="cover"` — the scrim is a pseudo-element on the
     * card itself, so it costs no DOM in the other layouts.
     * @default "medium"
     */
    scrim?: Scrim;
    /**
     * The title/description colour while the app is in **light** theme.
     * Only has an effect when `layout="cover"`. Limited to the two absolute
     * (non-theme-flipping) tones — the scrim itself is always
     * `color/absolute-black` regardless of theme, so `"white"` is legible
     * against it in every case except an unusually bright photo. Set this
     * independently of `coverForegroundDark`: a given photo's legibility
     * doesn't necessarily track the app's own light/dark switch.
     * @default "white"
     */
    coverForegroundLight?: CoverForeground;
    /**
     * The title/description colour while the app is in **dark** theme. Only
     * has an effect when `layout="cover"`. See {@link coverForegroundLight}.
     * @default "white"
     */
    coverForegroundDark?: CoverForeground;
    /**
     * Render the single child element instead of a wrapping `<div>`, merging
     * the card classes onto it — e.g. `<Card asChild><a href="…">…</a></Card>`
     * for a card that is itself one link.
     */
    asChild?: boolean;
  };

/**
 * A content container — an optional media region plus a padded content block
 * holding a header, description and footer.
 *
 * @example
 * ```tsx
 * <Card layout="vertical">
 *   <CardMedia><img src={src} alt="" /></CardMedia>
 *   <CardContent>
 *     <CardHeader><CardTitle>Winter light</CardTitle></CardHeader>
 *     <CardDescription>Shot in the Cairngorms.</CardDescription>
 *     <CardFooter><Button>View</Button></CardFooter>
 *   </CardContent>
 * </Card>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/card
 */
export function Card({
  asChild = false,
  layout,
  size,
  elevation,
  scrim,
  coverForegroundLight,
  coverForegroundDark,
  className,
  style,
  ...props
}: CardProps) {
  const Component = asChild ? Slot : "div";
  return (
    <Component
      className={cx(card({ layout, size, elevation, scrim }), className)}
      style={
        {
          ...style,
          ...(coverForegroundLight === undefined
            ? {}
            : { "--primitiv-card-cover-foreground-light": `var(--primitiv-color-absolute-${coverForegroundLight})` }),
          ...(coverForegroundDark === undefined
            ? {}
            : { "--primitiv-card-cover-foreground-dark": `var(--primitiv-color-absolute-${coverForegroundDark})` }),
        } as CSSProperties
      }
      {...props}
    />
  );
}

export type CardMediaProps = ComponentPropsWithRef<"div"> & {
  /**
   * Inset the media from the card edge and round its corners, instead of
   * bleeding it flush to the border.
   *
   * Flush media is deliberately square-cornered — the card's own
   * `overflow: hidden` supplies the outer radius, so giving the media its
   * own would also round the inner seam where it meets the content and
   * leave a visible notch.
   * @default false
   */
  inset?: boolean;
  /**
   * The image, `<picture>`, `<video>` or `<svg>` to show. It is sized to
   * cover the region, so it needs no sizing of its own.
   */
  children?: ReactNode;
};

/**
 * The card's media region. A sibling of `CardContent` in every layout — for
 * `layout="cover"` it is positioned behind the content automatically.
 */
export function CardMedia({ inset = false, className, ...props }: CardMediaProps) {
  return <div className={cx(cardMedia({ inset }), className)} {...props} />;
}

export type CardContentProps = ComponentPropsWithRef<"div">;

/**
 * The padded content block. Owns all of the card's padding and the gap
 * between header, description and footer — those parts carry none of their
 * own.
 */
export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cx("primitiv-card__content", className)} {...props} />;
}

export type CardHeaderProps = ComponentPropsWithRef<"div">;

/**
 * The header row — a flex row for a title plus optional leading and trailing
 * content (an `Avatar`, a `Badge`, an icon button). The title stretches; the
 * slots hug.
 */
export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cx("primitiv-card__header", className)} {...props} />;
}

export type CardTitleProps = ComponentPropsWithRef<"h3"> & {
  /**
   * Render the single child element instead of a wrapping `<h3>`, merging
   * the title classes onto it — use this to set the correct heading level
   * for the surrounding document outline.
   */
  asChild?: boolean;
};

/**
 * The card's title. Defaults to an `<h3>`; use `asChild` to pick the heading
 * level that fits the page's outline.
 */
export function CardTitle({ asChild = false, className, ...props }: CardTitleProps) {
  const Component = asChild ? Slot : "h3";
  return <Component className={cx("primitiv-card__title", className)} {...props} />;
}

export type CardDescriptionProps = ComponentPropsWithRef<"p"> & {
  /** Render the single child element instead of a wrapping `<p>`. */
  asChild?: boolean;
};

/** The card's body copy. */
export function CardDescription({ asChild = false, className, ...props }: CardDescriptionProps) {
  const Component = asChild ? Slot : "p";
  return <Component className={cx("primitiv-card__description", className)} {...props} />;
}

export type CardFooterProps = ComponentPropsWithRef<"div"> &
  Omit<CardFooterVariants, "justify"> & {
    /**
     * Horizontal alignment of the footer's actions. Button alignment is a
     * real per-composition decision, so it is a prop rather than a fixed
     * house rule.
     * @default "end"
     */
    justify?: Justify;
  };

/** The card's action row. */
export function CardFooter({ justify, className, ...props }: CardFooterProps) {
  return <div className={cx(cardFooter({ justify }), className)} {...props} />;
}
