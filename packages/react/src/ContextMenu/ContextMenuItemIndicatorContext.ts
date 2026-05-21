import { createContext } from "react";

export type ContextMenuItemIndicatorContextValue = {
  checked: boolean | "indeterminate";
};

export const ContextMenuItemIndicatorContext =
  createContext<ContextMenuItemIndicatorContextValue | null>(null);
