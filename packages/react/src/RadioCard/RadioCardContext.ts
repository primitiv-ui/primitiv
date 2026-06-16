import type { Context } from "react";
import { createStrictContext } from "../utils/index.ts";

import { RadioCardOrientation, RadioCardReadingDirection } from "./types";

export type RadioCardContextValue = {
  value: string | undefined;
  select: (value: string) => void;
  registerItem: (
    value: string,
    element: HTMLButtonElement | null,
    disabled?: boolean,
  ) => void;
  itemValues: string[];
  disabledValues: Set<string>;
  focusItem: (value: string) => void;
  orientation: RadioCardOrientation;
  dir: RadioCardReadingDirection;
};

const radioCardContextPair = createStrictContext<RadioCardContextValue>(
  "RadioCard sub-components must be rendered inside a <RadioCard.Root>.",
);

export const RadioCardContext: Context<RadioCardContextValue | null> =
  radioCardContextPair[0];
export const useRadioCardContext: () => RadioCardContextValue =
  radioCardContextPair[1];
