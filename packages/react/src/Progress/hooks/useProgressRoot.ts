import { ProgressState } from "../types";

const DEFAULT_MAX = 100;

type UseProgressRootArgs = {
  value?: number | null;
  max?: number;
};

type UseProgressRootResult = {
  value: number | null;
  max: number;
  state: ProgressState;
};

/**
 * Resolves a Progress root's `value` / `max` props into the canonical
 * `{ value, max, state }` triple consumed by the Root element and shared
 * through {@link ProgressContext}.
 */
export function useProgressRoot({
  value = null,
  max = DEFAULT_MAX,
}: UseProgressRootArgs): UseProgressRootResult {
  const isIndeterminate = value == null;
  const state: ProgressState = isIndeterminate
    ? "indeterminate"
    : value >= max
      ? "complete"
      : "loading";

  return { value: isIndeterminate ? null : value, max, state };
}
