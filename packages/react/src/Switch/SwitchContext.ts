import type { Context } from "react";
import { createStrictContext } from "../utils/index.ts";

export type SwitchContextValue = {
  checked: boolean;
};

const switchContextPair = createStrictContext<SwitchContextValue>(
  "Switch.Thumb must be rendered inside a <Switch.Root>.",
);

export const SwitchContext: Context<SwitchContextValue | null> =
  switchContextPair[0];
export const useSwitchContext: () => SwitchContextValue = switchContextPair[1];
