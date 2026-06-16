import { createStrictContext } from "../utils/index.ts";

import { CheckedState } from "./types";

export type CheckboxContextValue = {
  checked: CheckedState;
};

export const [CheckboxContext, useCheckboxContext] =
  createStrictContext<CheckboxContextValue>(
    "Checkbox sub-components must be rendered inside a <Checkbox.Root>.",
  );
