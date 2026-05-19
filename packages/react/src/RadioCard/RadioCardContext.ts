import { createStrictContext } from "../utils";

import { RadioCardOrientation } from "./types";

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
};

export const [RadioCardContext, useRadioCardContext] =
  createStrictContext<RadioCardContextValue>(
    "RadioCard sub-components must be rendered inside a <RadioCard.Root>.",
  );
