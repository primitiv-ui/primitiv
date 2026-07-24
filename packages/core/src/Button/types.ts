/**
 * The button's native `type` attribute, restricted to the three valid values.
 *
 * Framework adapters re-export this rather than re-declaring the union, so the
 * set of legal values has exactly one definition across every adapter.
 */
export type ButtonType = "button" | "submit" | "reset";

/**
 * The framework-agnostic input to {@link getButtonRootAttributes} — the subset
 * of a Button's props that actually *derives* something. Everything else a
 * consumer passes (`aria-*`, `data-*`, event handlers, `class`, `ref`) is
 * forwarded verbatim by the adapter and never reaches core.
 */
export type ButtonState = {
  /**
   * The button's native `type`. Defaults to {@link BUTTON_DEFAULT_TYPE} when
   * omitted.
   */
  type?: ButtonType;
  /** Whether the button is disabled. */
  disabled?: boolean;
  /**
   * Whether the adapter is delegating rendering to a consumer-supplied element
   * rather than emitting its own `<button>` (React's `asChild`, Vue/Svelte's
   * equivalent). When set, `type` is left out of the returned attributes — the
   * host element owns its own type semantics.
   */
  asChild?: boolean;
};

/**
 * The DOM attributes a Button root node carries, as plain data.
 *
 * Keys are omitted rather than set to `undefined` so the object is safe to
 * apply imperatively (`for (const [k, v] of Object.entries(attrs))
 * el.setAttribute(k, v)`) — the shape a Svelte action, an Angular directive or
 * a vanilla-JS adapter needs. Frameworks that spread declaratively (React, Vue,
 * Solid) treat an omitted key and an `undefined` value identically, so the
 * stricter shape costs them nothing.
 */
export type ButtonRootAttributes = {
  /** Present unless {@link ButtonState.asChild} is set. */
  type?: ButtonType;
  /** Present only when the button is disabled. */
  disabled?: true;
  /** Styling hook — present only when the button is disabled. */
  "data-disabled"?: "";
};
