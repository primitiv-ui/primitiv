import { createStrictContext } from "../utils/index.ts";

import { ToggleGroupContextValue } from "./types";

export const [ToggleGroupContext, useToggleGroupContext] =
  createStrictContext<ToggleGroupContextValue>(
    "ToggleGroup.Item must be rendered inside a ToggleGroup.Root",
    "ToggleGroupContext",
  );
