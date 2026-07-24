import type { ButtonRootAttributes, ButtonState } from "./types.ts";

/**
 * Derives the DOM attributes a Button root node carries from its state.
 */
export function getButtonRootAttributes(
  _state: ButtonState,
): ButtonRootAttributes {
  return { type: "button" };
}
