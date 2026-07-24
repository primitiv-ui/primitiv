import type { ButtonRootAttributes, ButtonState, ButtonType } from "./types.ts";

/**
 * The `type` a Button falls back to when the consumer doesn't set one.
 *
 * Deliberately `"button"` rather than the DOM's own default of `"submit"`, so
 * a Button placed inside a `<form>` never triggers an accidental submit unless
 * asked to.
 */
export const BUTTON_DEFAULT_TYPE: ButtonType = "button";

/**
 * Derives the DOM attributes a Button root node carries from its state.
 */
export function getButtonRootAttributes(
  state: ButtonState,
): ButtonRootAttributes {
  return { type: state.type ?? BUTTON_DEFAULT_TYPE };
}
