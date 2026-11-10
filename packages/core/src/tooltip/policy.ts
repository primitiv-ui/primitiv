/**
 * How long the pointer has, after leaving a tooltip's trigger, to cross onto
 * the tooltip itself before it closes — so hoverable content can be reached.
 */
export const TOOLTIP_GRACE_MS: number = 100;

/** What the open delay depends on. */
export type TooltipDelayState = {
  /** Whether a tooltip in the same group closed within the group's skip-delay window. */
  groupOpen: boolean;
  /** The delay before opening on hover, in milliseconds. */
  delay: number;
};

/**
 * The delay before a hovered tooltip opens: its own delay, or none while the
 * group is still in its skip-delay window — so moving along a row of triggers
 * opens each next tooltip at once rather than waiting every time.
 */
export function tooltipOpenDelay({ groupOpen, delay }: TooltipDelayState): number {
  return groupOpen ? 0 : delay;
}
