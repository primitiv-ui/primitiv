import { createContext } from "react";

export type ContextMenuGroupContextValue = {
  labelId: string;
};

export const ContextMenuGroupContext =
  createContext<ContextMenuGroupContextValue | null>(null);
