import type { Context, Provider } from "react";

import { createStrictContext } from "../utils/index.ts";

import type { ListboxContextValue } from "./types";

const listboxContextPair = createStrictContext<ListboxContextValue>(
  "Listbox.Option must be rendered as a child of Listbox.Root",
  "ListboxContext",
);

/** Strict React context carrying the {@link ListboxContextValue} from
 * `Listbox.Root` to its options. `null` outside a Root. */
export const ListboxContext: Context<ListboxContextValue | null> =
  listboxContextPair[0];

/** Reads the {@link ListboxContextValue}; throws outside a `Listbox.Root`. */
export const useListboxContext: () => ListboxContextValue =
  listboxContextPair[1];

/** Provider for {@link ListboxContext}, used by `Listbox.Root`. */
const ListboxProvider: Provider<ListboxContextValue | null> =
  ListboxContext.Provider;

export { ListboxProvider };
