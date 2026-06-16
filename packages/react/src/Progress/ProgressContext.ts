import type { Context } from "react";
import { createStrictContext } from "../utils/index.ts";

import { ProgressState } from "./types";

/**
 * Context value published by {@link Progress.Root} and consumed by
 * {@link Progress.Indicator} — the current `value` (or `null` while
 * indeterminate), the `max`, and the derived loading `state`.
 */
export type ProgressContextValue = {
  value: number | null;
  max: number;
  state: ProgressState;
};

const progressContextPair = createStrictContext<ProgressContextValue>(
  "Progress.Indicator must be rendered inside a <Progress.Root>.",
  "ProgressContext",
);

/** React context carrying the {@link ProgressContextValue}; `null` when no provider is present. */
export const ProgressContext: Context<ProgressContextValue | null> =
  progressContextPair[0];
/** Reads the {@link ProgressContextValue}; throws if used outside a {@link Progress.Root}. */
export const useProgressContext: () => ProgressContextValue =
  progressContextPair[1];
