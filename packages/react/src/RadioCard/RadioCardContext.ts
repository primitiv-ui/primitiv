import type { Context } from "react";
import { createStrictContext } from "../utils/index.ts";

import { RadioCardOrientation, RadioCardReadingDirection } from "./types";

/** The value shared by `RadioCard.Root` with its items through context: the
 * current selection and setter, the item registry used for roving focus and
 * keyboard navigation, and the resolved orientation/direction. */
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

/** Strict React context carrying the {@link RadioCardContextValue} from
 * `RadioCard.Root` to its items. `null` when read outside a `RadioCard.Root`. */
export const RadioCardContext: Context<RadioCardContextValue | null> =
  radioCardContextPair[0];
/** Reads the {@link RadioCardContextValue}; throws when used outside a
 * `RadioCard.Root`. */
export const useRadioCardContext: () => RadioCardContextValue =
  radioCardContextPair[1];
