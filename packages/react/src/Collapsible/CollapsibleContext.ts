import { createStrictContext } from "../utils/index.ts";
import { CollapsibleContextValue } from "./types";

export const [CollapsibleContext, useCollapsibleContext] =
  createStrictContext<CollapsibleContextValue>(
    "Collapsible sub-components must be rendered inside a <Collapsible.Root>.",
  );
