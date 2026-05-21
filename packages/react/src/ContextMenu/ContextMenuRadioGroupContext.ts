import { createContext } from "react";

export type ContextMenuRadioGroupContextValue = {
  value: string | undefined;
  select: (value: string) => void;
};

export const ContextMenuRadioGroupContext =
  createContext<ContextMenuRadioGroupContextValue | null>(null);
