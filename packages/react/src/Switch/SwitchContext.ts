import type { Context } from "react";
import { createStrictContext } from "../utils/index.ts";

/** Value shared from `Switch.Root` to `Switch.Thumb` through context. */
export type SwitchContextValue = {
  /** Whether the switch is currently checked (best-effort mirror of the input). */
  checked: boolean;
  /** Whether the switch is disabled, for the `data-disabled` hook. */
  disabled: boolean;
};

const switchContextPair = createStrictContext<SwitchContextValue>(
  "Switch.Thumb must be rendered inside a <Switch.Root>.",
);

/** React context carrying the {@link SwitchContextValue} for `Switch.Thumb`. */
export const SwitchContext: Context<SwitchContextValue | null> =
  switchContextPair[0];
/** Read the nearest {@link SwitchContextValue}; throws outside `Switch.Root`. */
export const useSwitchContext: () => SwitchContextValue = switchContextPair[1];
