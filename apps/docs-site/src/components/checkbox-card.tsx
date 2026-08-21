import "../styles/primitiv/checkbox-card/styles.css";
/*
 * CheckboxCard — styled wrapper, HAND-AUTHORED (composes the headless
 * CheckboxCard primitive).
 *
 * Not generated: the indicator + title + optional-description anatomy has
 * no generator-emitted shape (unlike a single-primitive wrapper), so —
 * like `alert` — this file carries no drift-guard test. Keep contract.json
 * + the stylesheet + this file in sync by hand.
 */
import { CheckboxCard as CheckboxCardPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type ReactNode } from "react";
import { checkboxCard, type CheckboxCardVariants } from "./checkbox-card.recipe";

// Root's props are a controlled/uncontrolled discriminated union (checked +
// onCheckedChange together, or defaultChecked, never mixed) — DistributiveOmit
// maps Omit over each union member individually so the discriminant survives;
// a plain Omit would collapse it into a single non-discriminated shape.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type CheckboxCardProps = DistributiveOmit<ComponentPropsWithRef<typeof CheckboxCardPrimitive.Root>, "asChild" | "children"> &
  CheckboxCardVariants & {
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
 * A card/tile-shaped checkbox — the whole bordered surface is the
 * interactive element, not a small control plus a separate label.
 * Composes the headless `CheckboxCard` primitive (`role="checkbox"`,
 * independent tri-state unchecked/checked/indeterminate — no grouping with
 * siblings).
 *
 * Layout (stacking cards vertically, in a row, or in a grid; the indented
 * "select all" parent-plus-children pattern) is deliberately not baked in —
 * compose with `Stack` or a plain grid wrapper.
 *
 * @example
 * ```tsx
 * <CheckboxCard
 *   defaultChecked
 *   aria-label="Enable dark mode"
 *   title="Dark mode"
 *   description="Switch the interface to a dark colour scheme."
 * />
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/checkbox-card
 */
export function CheckboxCard({
  size,
  title,
  description,
  showDescription = true,
  className,
  ...props
}: CheckboxCardProps) {
  return (
    <CheckboxCardPrimitive.Root className={[checkboxCard({ size }), className].filter(Boolean).join(" ")} {...props}>
      <span className="primitiv-checkbox-card__indicator-wrapper">
        <span className="primitiv-checkbox-card__indicator">
          {/* text-box-trim/inline-size gotcha: the mark's sizing + clip-path
              must land on the Indicator itself, not a span nested inside it —
              inline-size/block-size only apply once an element is blockified,
              which only happens for a DIRECT flex-item child of __indicator.
              A span one level deeper (inside this unstyled Indicator) stays a
              plain inline box and silently collapses to zero size. */}
          <CheckboxCardPrimitive.Indicator forceMount className="primitiv-checkbox-card__mark" />
        </span>
      </span>
      <span className="primitiv-checkbox-card__content">
        <span className="primitiv-checkbox-card__title">{title}</span>
        {showDescription && description != null && (
          <span className="primitiv-checkbox-card__description">{description}</span>
        )}
      </span>
    </CheckboxCardPrimitive.Root>
  );
}
