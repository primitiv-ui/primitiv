import type { Context } from "react";
import { createStrictContext } from "../utils/index.ts";

/** The value shared by `RadioCard.Item` with its `RadioCard.Indicator`,
 * exposing whether the item is currently selected. */
export type RadioCardItemContextValue = {
  /** Whether the enclosing item is the selected card. */
  checked: boolean;
};

const radioCardItemContextPair = createStrictContext<RadioCardItemContextValue>(
  "RadioCard.Indicator must be rendered inside a <RadioCard.Item>.",
);

/** Strict React context carrying the {@link RadioCardItemContextValue} from
 * `RadioCard.Item` to its indicator. `null` when read outside a
 * `RadioCard.Item`. */
export const RadioCardItemContext: Context<RadioCardItemContextValue | null> =
  radioCardItemContextPair[0];
/** Reads the {@link RadioCardItemContextValue}; throws when used outside a
 * `RadioCard.Item`. */
export const useRadioCardItemContext: () => RadioCardItemContextValue =
  radioCardItemContextPair[1];
