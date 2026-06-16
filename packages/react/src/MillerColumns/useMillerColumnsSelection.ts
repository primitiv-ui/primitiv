import { useMillerColumnsContext } from "./hooks/index.ts";

import type { MillerColumnsSelection } from "./types";

/**
 * Reads the current MillerColumns selection — the active path and the
 * deepest selected item id.
 *
 * Intended for consumer content rendered inside a `MillerColumns.Root`
 * (typically within a `MillerColumns.PreviewPanel`) that needs to know
 * what is selected without owning the selection state itself. Works for
 * both controlled and uncontrolled roots.
 *
 * Throws when called outside a `MillerColumns.Root`.
 *
 * @example
 * ```tsx
 * function FilePreview() {
 *   const { selectedValue } = useMillerColumnsSelection();
 *   return selectedValue ? <Preview id={selectedValue} /> : null;
 * }
 * ```
 */
export function useMillerColumnsSelection(): MillerColumnsSelection {
  const { activePath } = useMillerColumnsContext();

  return {
    path: activePath,
    selectedValue: activePath.at(-1),
  };
}
