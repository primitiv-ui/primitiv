import type { Context } from "react";
import { createStrictContext } from "../utils/index.ts";

/** The value shared by `RadioCard.Root` with its items through context: the
 * current selection and the item registry the roving tab stop and the shared
 * controller read. */
export type RadioCardContextValue = {
  value: string | undefined;
  registerItem: (
    value: string,
    element: HTMLButtonElement | null,
    disabled?: boolean,
  ) => void;
  itemValues: string[];
  disabledValues: Set<string>;
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
