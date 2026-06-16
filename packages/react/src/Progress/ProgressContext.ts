import { createStrictContext } from "../utils/index.ts";

import { ProgressState } from "./types";

export type ProgressContextValue = {
  value: number | null;
  max: number;
  state: ProgressState;
};

export const [ProgressContext, useProgressContext] =
  createStrictContext<ProgressContextValue>(
    "Progress.Indicator must be rendered inside a <Progress.Root>.",
    "ProgressContext",
  );
