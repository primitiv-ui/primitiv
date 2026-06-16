import type { Context } from "react";
import { createStrictContext } from "../utils/index.ts";

import type { CheckedState } from "../Checkbox/types";

/** The value shared by `CheckboxCard.Root` with its `CheckboxCard.Indicator`,
 * exposing the current checked state. */
export type CheckboxCardContextValue = {
  /** Current checked state of the card. */
  checked: CheckedState;
};

const checkboxCardContextPair = createStrictContext<CheckboxCardContextValue>(
  "CheckboxCard sub-components must be rendered inside a <CheckboxCard.Root>.",
);

/** Strict React context carrying the {@link CheckboxCardContextValue} from
 * `CheckboxCard.Root` to its indicator. `null` when read outside a
 * `CheckboxCard.Root`. */
export const CheckboxCardContext: Context<CheckboxCardContextValue | null> =
  checkboxCardContextPair[0];
/** Reads the {@link CheckboxCardContextValue}; throws when used outside a
 * `CheckboxCard.Root`. */
export const useCheckboxCardContext: () => CheckboxCardContextValue =
  checkboxCardContextPair[1];
