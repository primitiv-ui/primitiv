import type { Context } from "react";
import { createStrictContext } from "../utils/index.ts";

import { ProgressState } from "./types";

export type ProgressContextValue = {
  value: number | null;
  max: number;
  state: ProgressState;
};

const progressContextPair = createStrictContext<ProgressContextValue>(
  "Progress.Indicator must be rendered inside a <Progress.Root>.",
  "ProgressContext",
);

export const ProgressContext: Context<ProgressContextValue | null> =
  progressContextPair[0];
export const useProgressContext: () => ProgressContextValue =
  progressContextPair[1];
