import { createStrictContext } from "../utils/index.ts";

import { CheckedState } from "./types";

export type CheckboxCardContextValue = {
  checked: CheckedState;
};

export const [CheckboxCardContext, useCheckboxCardContext] =
  createStrictContext<CheckboxCardContextValue>(
    "CheckboxCard sub-components must be rendered inside a <CheckboxCard.Root>.",
  );
