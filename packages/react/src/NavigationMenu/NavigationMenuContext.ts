import type { Context, Provider } from "react";

import { createStrictContext } from "../utils/index.ts";

import type {
  NavigationMenuContextValue,
  NavigationMenuItemContextValue,
} from "./types";

const navigationMenuContextPair = createStrictContext<NavigationMenuContextValue>(
  "Component must be rendered as a child of NavigationMenu.Root",
  "NavigationMenuContext",
);

/** Strict React context carrying the {@link NavigationMenuContextValue} from
 * `NavigationMenu.Root` to its descendants. `null` outside a Root. */
export const NavigationMenuContext: Context<NavigationMenuContextValue | null> =
  navigationMenuContextPair[0];
/** Reads the {@link NavigationMenuContextValue}; throws outside a
 * `NavigationMenu.Root`. */
export const useNavigationMenuContext: () => NavigationMenuContextValue =
  navigationMenuContextPair[1];

/** Provider for {@link NavigationMenuContext}, used by `NavigationMenu.Root`. */
const NavigationMenuProvider: Provider<NavigationMenuContextValue | null> =
  NavigationMenuContext.Provider;

export { NavigationMenuProvider };

const navigationMenuItemContextPair =
  createStrictContext<NavigationMenuItemContextValue>(
    "Component must be rendered as a child of NavigationMenu.Item",
    "NavigationMenuItemContext",
  );

/** Strict React context carrying the {@link NavigationMenuItemContextValue}
 * from `NavigationMenu.Item` to its Trigger and Content. `null` outside an
 * Item. */
export const NavigationMenuItemContext: Context<NavigationMenuItemContextValue | null> =
  navigationMenuItemContextPair[0];
/** Reads the {@link NavigationMenuItemContextValue}; throws outside a
 * `NavigationMenu.Item`. */
export const useNavigationMenuItemContext: () => NavigationMenuItemContextValue =
  navigationMenuItemContextPair[1];

/** Provider for {@link NavigationMenuItemContext}, used by
 * `NavigationMenu.Item`. */
const NavigationMenuItemProvider: Provider<NavigationMenuItemContextValue | null> =
  NavigationMenuItemContext.Provider;

export { NavigationMenuItemProvider };
