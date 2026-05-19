import { createContext, useContext } from "react";

import { Direction } from "./types";

export const DirectionContext = createContext<Direction>("ltr");

/**
 * Reads the current reading direction from the nearest
 * {@link DirectionProvider} ancestor.
 *
 * Falls back to `"ltr"` when no provider is present, so it is always safe
 * to call — components use it as the default for an omitted `dir` prop.
 *
 * @example Fall back to the inherited direction
 * ```tsx
 * const resolvedDir = dir ?? useDirection();
 * ```
 */
export function useDirection(): Direction {
  return useContext(DirectionContext);
}
