import { panelPlacement, TOOLTIP_GRACE_MS, tooltipOpenDelay } from "@primitiv-ui/core";

import { write } from "../internal/element.ts";

import type { TooltipGroup } from "./TooltipGroup.ts";

/**
 * What a {@link TooltipController} asks of whoever hosts it. The controller
 * owns behaviour and never owns state (RFC 0033 D28): the custom elements keep
 * the open state in a reflected `open` attribute, the React adapter keeps it in
 * React, and each answers these calls from wherever it keeps it.
 */
export type TooltipControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** Whether the tooltip is open. */
    open: boolean;
  };
  /**
   * Apply a change: `open` is the state afterwards. A close is reported every
   * time it is asked for, already closed or not, so the host decides what a
   * repeat means.
   */
  change(open: boolean): void;
  /** The delay before opening on hover, in milliseconds. */
  delay(): number;
  /** The group whose skip-delay window this tooltip shares. */
  tooltipGroup(): TooltipGroup;
  /** The tooltip's content, so a press inside it is not a press outside. */
  content(): HTMLElement | null;
  /**
   * The element the tooltip is anchored to, to measure which side of it the
   * tooltip landed on. Optional: without it no placement is marked.
   */
  anchor?(): HTMLElement | null;
  /** Escape was pressed while open. Call `preventDefault()` on `event` to keep it open. Optional. */
  escapeKeyDown?(event: KeyboardEvent): void;
  /** A pointer went down outside the content while open. Call `preventDefault()` to keep it open. Optional. */
  pointerDownOutside?(event: PointerEvent): void;
};

/**
 * The behaviour of a tooltip: hover intent and dismissal. Its host wires the
 * trigger's and the content's own events to the intents below, so the React
 * adapter keeps composing them with its consumers' handlers as it always has;
 * the controller owns the timers, and the document-wide Escape and outside
 * press while open (WAI-ARIA tooltip pattern).
 *
 * - {@link TooltipController.hoverStart | `hoverStart`} — open after the
 *   delay, or at once while the group is in its skip-delay window.
 * - {@link TooltipController.hoverEnd | `hoverEnd`} — close after a short
 *   grace period, long enough for the pointer to reach hoverable content.
 * - {@link TooltipController.holdOpen | `holdOpen`} — the pointer reached the
 *   content: cancel that grace close.
 * - {@link TooltipController.openNow | `openNow`} / {@link TooltipController.closeNow | `closeNow`} —
 *   focus and blur, Escape on the trigger, the pointer leaving the content.
 * - {@link TooltipController.sync | `sync`} — listen for Escape and outside
 *   presses while open, and mark the tooltip's `data-side` and `data-align`
 *   (where it landed against its anchor, after any flip) as it opens and on
 *   every scroll and resize; a host calls it whenever the state may have
 *   changed, after showing the tooltip.
 */
export class TooltipController {
  readonly #host: TooltipControllerHost;
  #opening: ReturnType<typeof setTimeout> | null = null;
  #grace: ReturnType<typeof setTimeout> | null = null;
  // The document listeners, added and removed by hand rather than through an
  // AbortSignal, so a host can see the very handler removed. Adding the same
  // function twice is a no-op, so syncing open again never stacks them.
  readonly #onKeydown = (event: KeyboardEvent): void => this.#keydown(event);
  readonly #onPointerdown = (event: PointerEvent): void => this.#pointerdown(event);
  /** The scroll and resize listeners that re-measure the placement, while open. */
  #following: AbortController | null = null;

  constructor(host: TooltipControllerHost) {
    this.#host = host;
  }

  /** Open now, cancelling a pending hover open. */
  openNow(): void {
    this.#cancelOpening();
    this.#host.change(true);
    this.#host.tooltipGroup().opened();
  }

  /** Open after the delay, or at once while the group is in its skip-delay window. */
  hoverStart(): void {
    const delay = tooltipOpenDelay({ groupOpen: this.#host.tooltipGroup().isOpen(), delay: this.#host.delay() });
    if (delay === 0) {
      this.openNow();
      return;
    }
    this.#opening = setTimeout(() => {
      this.openNow();
      this.#opening = null;
    }, delay);
  }

  /** Close now, cancelling a pending grace close. */
  closeNow(): void {
    this.holdOpen();
    this.#host.change(false);
    this.#host.tooltipGroup().closed();
  }

  /** Close after the grace period, cancelling a pending hover open. */
  hoverEnd(): void {
    this.#cancelOpening();
    this.#grace = setTimeout(() => {
      this.#host.change(false);
      this.#host.tooltipGroup().closed();
      this.#grace = null;
    }, TOOLTIP_GRACE_MS);
  }

  /** The pointer reached the content: cancel a pending grace close. */
  holdOpen(): void {
    // Stryker disable next-line ConditionalExpression: equivalent — clearTimeout(null) is a spec'd no-op, so forcing this guard true is harmless when no grace close is pending.
    if (this.#grace !== null) {
      clearTimeout(this.#grace);
      this.#grace = null;
    }
  }

  /** Listen for Escape and outside presses while open, and only then. */
  sync(): void {
    const { open } = this.#host.state();
    if (open) {
      document.addEventListener("keydown", this.#onKeydown);
      document.addEventListener("pointerdown", this.#onPointerdown);
      if (!this.#following) this.#follow();
    } else {
      this.#stopListening();
    }
  }

  /** Measure the placement now, and again on every scroll and resize until it closes. */
  #follow(): void {
    this.#following = new AbortController();
    const options = { capture: true, passive: true, signal: this.#following.signal };
    window.addEventListener("scroll", () => this.#place(), options);
    window.addEventListener("resize", () => this.#place(), options);
    this.#place();
  }

  /** Mark the side and alignment the tooltip landed on, against its anchor. */
  #place(): void {
    const content = this.#host.content();
    const anchor = this.#host.anchor?.();
    if (!content || !anchor) return;
    const { side, align } = panelPlacement(content.getBoundingClientRect(), anchor.getBoundingClientRect());
    write(content, "data-side", side);
    write(content, "data-align", align);
  }

  #stopListening(): void {
    document.removeEventListener("keydown", this.#onKeydown);
    document.removeEventListener("pointerdown", this.#onPointerdown);
    this.#following?.abort();
    this.#following = null;
  }

  /** Cancel every timer and stop listening, so nothing outlives the host. */
  disconnect(): void {
    this.#cancelOpening();
    this.holdOpen();
    this.#stopListening();
  }

  #cancelOpening(): void {
    // Stryker disable next-line ConditionalExpression: equivalent — clearTimeout(null) is a spec'd no-op, so forcing this guard true is harmless when no hover open is pending.
    if (this.#opening !== null) {
      clearTimeout(this.#opening);
      this.#opening = null;
    }
  }

  #keydown(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    this.#host.escapeKeyDown?.(event);
    if (!event.defaultPrevented) this.closeNow();
  }

  #pointerdown(event: PointerEvent): void {
    if (this.#host.content()?.contains(event.target as Node)) return;
    this.#host.pointerDownOutside?.(event);
    if (!event.defaultPrevented) this.closeNow();
  }
}
