import type { Context, Provider } from "react";

import { createStrictContext } from "../utils/index.ts";

import type { ListboxContextValue, ListboxGroupContextValue } from "./types";

const listboxContextPair = createStrictContext<ListboxContextValue>(
  "Listbox.Option must be rendered as a child of Listbox.Root",
    // Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
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

const listboxGroupContextPair = createStrictContext<ListboxGroupContextValue>(
  "Listbox.GroupLabel must be rendered as a child of Listbox.Group",
    // Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
  "ListboxGroupContext",
);

/** Strict React context carrying the {@link ListboxGroupContextValue} from
 * `Listbox.Group` to its label. `null` outside a Group. */
export const ListboxGroupContext: Context<ListboxGroupContextValue | null> =
  listboxGroupContextPair[0];

/** Reads the {@link ListboxGroupContextValue}; throws outside a
 * `Listbox.Group`. */
export const useListboxGroupContext: () => ListboxGroupContextValue =
  listboxGroupContextPair[1];

/** Provider for {@link ListboxGroupContext}, used by `Listbox.Group`. */
const ListboxGroupProvider: Provider<ListboxGroupContextValue | null> =
  ListboxGroupContext.Provider;

export { ListboxGroupProvider };
