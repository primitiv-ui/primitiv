import { createStrictContext } from "../utils/index.ts";

import type {
  MillerColumnsContextValue,
  MillerColumnsColumnContextValue,
  MillerColumnsItemContextValue,
} from "./types";

export const [MillerColumnsContext, useMillerColumnsContext] =
  createStrictContext<MillerColumnsContextValue>(
    "MillerColumns sub-components must be rendered inside <MillerColumns.Root>.",
    "MillerColumnsContext",
  );

export const [MillerColumnsColumnContext, useMillerColumnsColumnContext] =
  createStrictContext<MillerColumnsColumnContextValue>(
    "MillerColumns.Item must be rendered inside <MillerColumns.Column>.",
    "MillerColumnsColumnContext",
  );

export const [MillerColumnsItemContext, useMillerColumnsItemContext] =
  createStrictContext<MillerColumnsItemContextValue>(
    "MillerColumns.ItemIndicator must be rendered inside <MillerColumns.Item>.",
    "MillerColumnsItemContext",
  );
