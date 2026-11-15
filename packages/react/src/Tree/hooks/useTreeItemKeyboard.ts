import type { KeyboardEvent } from "react";

import { useTreeContext } from "../TreeContext";

/**
 * The keydown handler for a Tree treeitem: the shared controller's tree
 * keymap — ArrowRight / ArrowLeft expand, collapse and move to a child or the
 * parent, the vertical arrows, Home and End move through the enabled visible
 * items, and Enter / Space activate (a branch toggles as it is selected).
 * Disabled items ignore the branch keys and activation but let Home / End
 * escape them.
 */
export function useTreeItemKeyboard(value: string) {
  const { controller } = useTreeContext();
  // The synthetic event itself, not `nativeEvent`: treeitems nest, so a key on a
  // child bubbles through every enclosing branch's handler, and only the
  // synthetic event's own `preventDefault()` flips the `defaultPrevented` that
  // stops each outer branch handling it again. The controller reads nothing
  // else from it but `key`.
  return (event: KeyboardEvent<HTMLElement>) =>
    controller.keydown(value, event as unknown as globalThis.KeyboardEvent);
}
