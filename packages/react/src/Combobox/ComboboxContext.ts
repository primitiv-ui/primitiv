import type { Context, Provider } from "react";

import { createStrictContext } from "../utils/index.ts";

import type { ComboboxContextValue } from "./types";

const comboboxContextPair = createStrictContext<ComboboxContextValue>(
  "Combobox sub-components must be rendered as children of Combobox.Root",
  // Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
  "ComboboxContext",
);

/** Strict React context carrying the {@link ComboboxContextValue} from
 * `Combobox.Root` to its parts. `null` outside a Root. */
export const ComboboxContext: Context<ComboboxContextValue | null> = comboboxContextPair[0];

/** Reads the {@link ComboboxContextValue}; throws outside a `Combobox.Root`. */
export const useComboboxContext: () => ComboboxContextValue = comboboxContextPair[1];

/** Provider for {@link ComboboxContext}, used by `Combobox.Root`. */
const ComboboxProvider: Provider<ComboboxContextValue | null> = ComboboxContext.Provider;

export { ComboboxProvider };
