import { createStrictContext } from "../utils/index.ts";

import {
  SegmentedControlOrientation,
  SegmentedControlReadingDirection,
} from "./types";

export type SegmentedControlContextValue = {
  value: string | undefined;
  select: (value: string) => void;
  registerItem: (
    value: string,
    element: HTMLButtonElement | null,
    disabled?: boolean,
  ) => void;
  itemValues: string[];
  disabledValues: Set<string>;
  focusItem: (value: string) => void;
  orientation: SegmentedControlOrientation;
  dir: SegmentedControlReadingDirection;
  /** Whether the whole control is disabled (Root's `disabled` prop). */
  disabled: boolean;
};

export const [SegmentedControlContext, useSegmentedControlContext] =
  createStrictContext<SegmentedControlContextValue>(
    "SegmentedControl sub-components must be rendered inside a <SegmentedControl.Root>.",
  );
