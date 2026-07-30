import "../styles/primitiv/radio-card/styles.css";
/*
 * RadioCard — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC 0004
 * D53 — same shape as Dropdown/Modal).
 *
 * Not generated: RadioCard.Root has no visual anatomy of its own in the
 * headless layer (a plain `<div role="radiogroup">`), so it takes no
 * styling — it's a pure pass-through, like Modal.Root/Dropdown.Trigger. Only
 * Item (the indicator + title + optional-description card) has a shape, and
 * that shape has no generator-emitted form (unlike a single-primitive
 * wrapper), so this file carries no drift-guard test. Keep contract.json +
 * the stylesheet + this file in sync by hand.
 */
import { RadioCard as RadioCardPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type ReactNode } from "react";
import { radioCard, type RadioCardVariants } from "./radio-card.recipe";

/**
 * The group wrapper for a set of `RadioCardItem`s — a plain
 * `role="radiogroup"` with no styling of its own; the whole visual comes
 * from the Items inside it. Pass `orientation` to match whatever layout
 * (row, column, grid) you compose the Items into, so keyboard arrow-key
 * navigation tracks what's actually on screen.
 *
 * @see https://primitiv-ui.dev/docs/components/radio-card
 */
export type RadioCardProps = ComponentPropsWithRef<typeof RadioCardPrimitive.Root>;

export function RadioCard(props: RadioCardProps) {
  return <RadioCardPrimitive.Root {...props} />;
}

export type RadioCardItemProps = Omit<ComponentPropsWithRef<typeof RadioCardPrimitive.Item>, "asChild" | "children"> &
  RadioCardVariants & {
    /** The card's heading. Always present — the required content. */
    title: ReactNode;
    /** The card's supporting text, shown below the title. */
    description?: ReactNode;
    /**
     * Shows or hides `description` without unmounting the title — a
     * separate, skippable subcomponent, not a change to the anatomy.
     * @default true
     */
    showDescription?: boolean;
  };

/**
 * A card/tile-shaped radio item — the individual selectable card in a
 * `RadioCard` group. Composes the headless `RadioCard.Item` primitive
 * (`role="radio"`).
 *
 * @example
 * ```tsx
 * <RadioCard defaultValue="pro" aria-label="Plan">
 *   <RadioCardItem value="starter" title="Starter" description="Free forever" />
 *   <RadioCardItem value="pro" title="Pro" description="$9/month" />
 * </RadioCard>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/radio-card
 */
export function RadioCardItem({
  size,
  title,
  description,
  showDescription = true,
  className,
  ...props
}: RadioCardItemProps) {
  return (
    <RadioCardPrimitive.Item className={[radioCard({ size }), className].filter(Boolean).join(" ")} {...props}>
      <span className="primitiv-radio-card__indicator-wrapper">
        <span className="primitiv-radio-card__indicator">
          {/* Sizing + fill must land on the Indicator itself, not a span
              nested inside it — see checkbox-card.tsx for the full gotcha
              (inline-size/block-size only apply once blockified, which
              needs a DIRECT flex-item child of __indicator). */}
          <RadioCardPrimitive.Indicator forceMount className="primitiv-radio-card__dot" />
        </span>
      </span>
      <span className="primitiv-radio-card__content">
        <span className="primitiv-radio-card__title">{title}</span>
        {showDescription && description != null && (
          <span className="primitiv-radio-card__description">{description}</span>
        )}
      </span>
    </RadioCardPrimitive.Item>
  );
}
