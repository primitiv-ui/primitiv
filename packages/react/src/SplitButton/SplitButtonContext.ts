import type { Context, Provider } from "react";

import { createStrictContext } from "../utils/index.ts";

import type { SplitButtonContextValue } from "./types";

const splitButtonContextPair = createStrictContext<SplitButtonContextValue>(
  "SplitButton sub-components must be rendered inside a <SplitButton.Root>.",
  "SplitButtonContext",
);

/** Strict React context carrying the {@link SplitButtonContextValue} from
 * `SplitButton.Root` to its Action and Trigger. `null` outside a Root. */
export const SplitButtonContext: Context<SplitButtonContextValue | null> =
  splitButtonContextPair[0];

/** Reads the {@link SplitButtonContextValue}; throws outside a
 * `SplitButton.Root`. */
export const useSplitButtonContext: () => SplitButtonContextValue =
  splitButtonContextPair[1];

/** Provider for {@link SplitButtonContext}, used by `SplitButton.Root`. */
const SplitButtonProvider: Provider<SplitButtonContextValue | null> =
  SplitButtonContext.Provider;

export { SplitButtonProvider };
