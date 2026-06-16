import type { Context } from "react";
import { createStrictContext } from "../utils/index.ts";

import { CheckedState } from "./types";

export type CheckboxCardContextValue = {
  checked: CheckedState;
};

const checkboxCardContextPair = createStrictContext<CheckboxCardContextValue>(
  "CheckboxCard sub-components must be rendered inside a <CheckboxCard.Root>.",
);

export const CheckboxCardContext: Context<CheckboxCardContextValue | null> =
  checkboxCardContextPair[0];
export const useCheckboxCardContext: () => CheckboxCardContextValue =
  checkboxCardContextPair[1];
