import { createStrictContext } from "../utils/index.ts";

import type { TooltipContextValue, TooltipProviderContextValue } from "./types";

export const [TooltipProviderContext, useTooltipProviderContext] =
  createStrictContext<TooltipProviderContextValue>(
    "Tooltip sub-components must be rendered inside a <Tooltip.Provider>.",
    "TooltipProviderContext",
  );

export const [TooltipContext, useTooltipContext] =
  createStrictContext<TooltipContextValue>(
    "Tooltip sub-components must be rendered inside a <Tooltip.Root>.",
    "TooltipContext",
  );

const TooltipProviderProvider = TooltipProviderContext.Provider;
const TooltipProvider = TooltipContext.Provider;

export { TooltipProviderProvider, TooltipProvider };
