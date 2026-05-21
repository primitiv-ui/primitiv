import { createContext, RefObject } from "react";

/**
 * Content-scoped context provided by {@link ContextMenuContent} and
 * {@link ContextMenuSubContent}. Holds a ref to a single "currently open
 * direct-child sub" close callback so that sibling items can dismiss the
 * open sub on hover, mirroring the keyboard contract (focus returning to
 * the parent menu closes the sub).
 */
export type ContextMenuContentContextValue = {
  closeOpenSubRef: RefObject<(() => void) | null>;
};

export const ContextMenuContentContext =
  createContext<ContextMenuContentContextValue | null>(null);
