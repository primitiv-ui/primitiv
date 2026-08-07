import { useContext, useMemo } from "react";

import { MillerColumnsColumnContext } from "../MillerColumnsContext";

import type { MillerColumnsColumnContextValue } from "../types";

import { useMillerColumnsContext } from "./useMillerColumnsContext";

export function useMillerColumnsColumn() {
  const { slots, columnWidths, getColumnItems } = useMillerColumnsContext();
  const parentColumn = useContext(MillerColumnsColumnContext);
  const depth = parentColumn ? parentColumn.depth + 1 : 0;

  const slot = slots.get(depth) ?? null;
  const width = columnWidths.get(depth);
  // Selecting a childless branch opens a column with nothing in it; the
  // styling layer needs to know so it can say so rather than show a void.
  const empty = getColumnItems(depth).length === 0;

  const columnContextValue = useMemo<MillerColumnsColumnContextValue>(
    () => ({ depth }),
    [depth],
  );

  return { slot, depth, width, empty, columnContextValue };
}
