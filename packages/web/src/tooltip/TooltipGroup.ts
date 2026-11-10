/**
 * A set of tooltips that share a skip-delay window (React's `Tooltip.Provider`):
 * once one has opened, the next to be hovered opens at once rather than
 * waiting its delay, until the group has been quiet for the skip delay. The
 * React Provider and the custom elements each hold one.
 */
export class TooltipGroup {
  readonly #skipDelay: () => number;
  #open = false;
  #closing: ReturnType<typeof setTimeout> | null = null;

  /** `skipDelay` is read each time a tooltip closes, so a changed value applies. */
  constructor(skipDelay: () => number) {
    this.#skipDelay = skipDelay;
  }

  /** Whether a tooltip in the group is open, or closed within the skip delay. */
  isOpen(): boolean {
    return this.#open;
  }

  /** A tooltip in the group opened: the window is open, and any pending close is off. */
  opened(): void {
    // Stryker disable next-line ConditionalExpression: equivalent — clearTimeout(null) is a spec'd no-op, so forcing this guard true is harmless when no close is pending.
    if (this.#closing !== null) {
      clearTimeout(this.#closing);
      this.#closing = null;
    }
    this.#open = true;
  }

  /**
   * A tooltip in the group closed: the window stays open for the skip delay.
   * A second close restarts it, cancelling the first timer rather than
   * orphaning it — two closes in a row are routine (Escape, then a blur).
   */
  closed(): void {
    clearTimeout(this.#closing ?? undefined);
    this.#closing = setTimeout(() => {
      this.#open = false;
      this.#closing = null;
    }, this.#skipDelay());
  }

  /** Cancel a pending close, so no timer outlives the group's host. */
  dispose(): void {
    clearTimeout(this.#closing ?? undefined);
  }
}
