import { createStrictContext } from "../utils/index.ts";

import { CheckedState } from "./types";

export type CheckboxContextValue = {
  /**
   * Best-effort mirror of the input's tri-state value, for the `data-state`
   * hook on the indicator. The shipped CSS reveals the mark off the input's
   * native `:checked` / `:indeterminate` instead, so it stays correct through
   * a form reset; `data-state` is a convenience mirror.
   */
  checked: CheckedState;
  /** Whether the checkbox is disabled, for the `data-disabled` hook. */
  disabled: boolean;
};

export const [CheckboxContext, useCheckboxContext] =
  createStrictContext<CheckboxContextValue>(
    "Checkbox sub-components must be rendered inside a <Checkbox.Root>.",
  );
