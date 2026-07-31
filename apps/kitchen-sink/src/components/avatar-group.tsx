import "../styles/primitiv/avatar-group/styles.css";
/*
 * AvatarGroup — styled wrapper, HAND-AUTHORED (composes the registry Avatar).
 *
 * Copied into the consumer repo by `primitiv add avatar-group`. It owns no
 * keyboard model, focus management or state, so there is nothing for a
 * `packages/react` primitive to own — only the truncation arithmetic, which
 * is a pure function of the children. Carries no drift-guard test; keep
 * contract.json + the stylesheet + this file in sync by hand.
 *
 * The overflow counter is an Avatar, NOT a Badge. Badge ships only
 * success | warning | info | danger with no neutral, so it would force a
 * semantic colour onto something that is not a status — and a counter Badge
 * is a dot beside a 40px avatar. An Avatar-shaped counter inherits the ring,
 * size, shape and radius for free. (RFC 0021 says "overflow badge"; that
 * wording is superseded — see the Figma "Avatar Group — exploration" §5.)
 *
 * Stacking: each face gets a descending inline z-index so the FIRST face
 * paints on top, and the counter sits above all of them. The Figma master
 * needs two nested auto-layout stacks to express this, because
 * itemReverseZIndex is all-or-nothing and a flat list buries either the first
 * face or the counter. CSS has real z-index, so one flat row does it.
 */
import { Children, isValidElement, type ComponentPropsWithRef, type ReactNode } from "react";
import { Avatar, AvatarFallback } from "./avatar";
import { avatarGroup, type AvatarGroupVariants } from "./avatar-group.recipe";

function cx(...v: Array<string | undefined | false>): string {
  return v.filter(Boolean).join(" ");
}

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Direction = "ltr" | "rtl";

export type AvatarGroupProps = ComponentPropsWithRef<"div"> &
  Omit<AvatarGroupVariants, "size" | "direction"> & {
    /**
     * Matches the nested Avatars' size. Pass the same value to each `Avatar`
     * — the group cannot set it for them, since they are your elements.
     * @default "md"
     */
    size?: Size;
    /**
     * Which way the stack advances. Also decides which end the overflow
     * counter lands on; `rtl` is the mirrored form an RTL locale wants.
     * @default "ltr"
     */
    direction?: Direction;
    /**
     * Show at most this many faces, replacing the remainder with a `+N`
     * counter. Omit to show every child and no counter.
     */
    max?: number;
    /**
     * Accessible label for the overflow counter, given the count. The counter
     * is decorative-by-default otherwise.
     * @default (n) => `${n} more`
     */
    overflowLabel?: (count: number) => string;
    /** The `Avatar` elements. */
    children?: ReactNode;
  };

/**
 * An overlapping row of Avatars with an optional `+N` overflow counter — the
 * collaborators/attendees pattern.
 *
 * Tooltips are deliberately not owned here: naming faces would mean the group
 * owning member data, which no Primitiv composite does (RFC 0019 §4c). Wrap
 * each `Avatar` in your own `Tooltip` when you need names.
 *
 * @example
 * ```tsx
 * <AvatarGroup size="md" max={4}>
 *   {members.map((m) => (
 *     <Avatar key={m.id} size="md">
 *       <AvatarImage src={m.avatar} alt="" />
 *       <AvatarFallback>{m.initials}</AvatarFallback>
 *     </Avatar>
 *   ))}
 * </AvatarGroup>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/avatar-group
 */
export function AvatarGroup({
  size,
  direction,
  max,
  overflowLabel = (n) => `${n} more`,
  className,
  children,
  ...props
}: AvatarGroupProps) {
  const faces = Children.toArray(children).filter(isValidElement);
  const shown = max != null && max >= 0 && faces.length > max ? faces.slice(0, max) : faces;
  const overflow = faces.length - shown.length;

  return (
    <div className={cx(avatarGroup({ size, direction }), className)} {...props}>
      {shown.map((face, i) => (
        // Descending z-index: the first face paints on top of the second, and
        // so on — "a stack you count into" rather than a queue.
        <span key={i} className="primitiv-avatar-group__item" style={{ zIndex: shown.length - i }}>
          {face}
        </span>
      ))}
      {overflow > 0 && (
        <span className="primitiv-avatar-group__item primitiv-avatar-group__item--counter">
          <Avatar size={size} shape="circle" className="primitiv-avatar-group__counter">
            <AvatarFallback aria-label={overflowLabel(overflow)}>+{overflow}</AvatarFallback>
          </Avatar>
        </span>
      )}
    </div>
  );
}
