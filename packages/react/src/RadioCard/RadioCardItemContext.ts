import type { Context } from "react";
import { createStrictContext } from "../utils/index.ts";

export type RadioCardItemContextValue = {
  checked: boolean;
};

const radioCardItemContextPair = createStrictContext<RadioCardItemContextValue>(
  "RadioCard.Indicator must be rendered inside a <RadioCard.Item>.",
);

export const RadioCardItemContext: Context<RadioCardItemContextValue | null> =
  radioCardItemContextPair[0];
export const useRadioCardItemContext: () => RadioCardItemContextValue =
  radioCardItemContextPair[1];
