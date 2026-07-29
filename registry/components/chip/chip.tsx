/*
 * Chip — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add chip`. Renders an
 * interactive, removable label chip: an optional leading icon, a label, and
 * a trailing remove button that is core to the anatomy, not optional (RFC
 * 0021 — the Figma "Chip" component set's rough-exploration decision). Hand-
 * written — it carries real behaviour (the remove button + its own hover/
 * active/focus states via CSS, see styles.css) — so, like `code-block`, it
 * composes no headless primitive and has no drift-guard test. The remove
 * glyph is inlined from @primitiv-ui/icons' `Close` so the component
 * installs no extra package, matching `code-block`'s Copy/Check glyphs.
 */
import { type ComponentPropsWithRef, type ReactNode } from "react";
import { chip, type ChipVariants } from "./chip.recipe";

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.06 19 19 20.06 3.94 5 5 3.94z" />
      <path d="M20.06 5 5 20.06 3.94 19 19 3.94z" />
    </svg>
  );
}

export type ChipProps = Omit<ComponentPropsWithRef<"span">, "children"> &
  ChipVariants & {
    /** The chip's label content. */
    children: ReactNode;
    /**
     * An optional icon or avatar rendered before the label — e.g.
     * `<Chip leadingIcon={<User />}>Jane Doe</Chip>`.
     */
    leadingIcon?: ReactNode;
    /**
     * Called when the remove button is activated. Required: removability is
     * core to a Chip's anatomy, not an optional affordance — use `Tag` for a
     * non-removable label.
     */
    onRemove: () => void;
    /**
     * `aria-label` for the remove button.
     * @default `Remove ${children}` when `children` is a string, else `"Remove"`.
     */
    removeLabel?: string;
    /** Disables the remove button and dims the whole chip. */
    disabled?: boolean;
  };

/**
 * An interactive, removable label chip — filter bars, multi-select fields,
 * inputs. The root `<span>` itself isn't clickable (avoiding a nested-button
 * a11y problem); only the trailing remove button is a real interactive
 * element, though the whole pill's hover/active/focus styling responds to
 * it (see styles.css).
 *
 * @example
 * ```tsx
 * <Chip onRemove={() => removeFilter("status")}>Status: Active</Chip>
 * <Chip leadingIcon={<User />} onRemove={() => removeAssignee()}>Jane Doe</Chip>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/chip
 */
export function Chip({
  size,
  leadingIcon,
  children,
  onRemove,
  removeLabel,
  disabled = false,
  className,
  ...props
}: ChipProps) {
  const resolvedRemoveLabel = removeLabel ?? (typeof children === "string" ? `Remove ${children}` : "Remove");
  return (
    <span className={[chip({ size }), className].filter(Boolean).join(" ")} {...props}>
      {leadingIcon && <span className="primitiv-chip__leading-icon">{leadingIcon}</span>}
      <span className="primitiv-chip__label">{children}</span>
      <button
        type="button"
        className="primitiv-chip__remove"
        onClick={onRemove}
        disabled={disabled}
        aria-label={resolvedRemoveLabel}
      >
        <CloseGlyph />
      </button>
    </span>
  );
}
