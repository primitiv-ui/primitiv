import type { Context } from "react";

import { createStrictContext } from "../utils/index.ts";
import { PopoverContextValue } from "./types";

const popoverContext = createStrictContext<PopoverContextValue>(
  "Popover sub-components must be rendered inside a <Popover.Root>.",
  "PopoverContext",
);

export const PopoverContext: Context<PopoverContextValue | null> =
  popoverContext[0];
export const usePopoverContext: () => PopoverContextValue = popoverContext[1];
