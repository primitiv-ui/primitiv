import { createStrictContext } from "../utils/index.ts";

export type SegmentedControlContextValue = {
  value: string | undefined;
  registerItem: (
    value: string,
    element: HTMLButtonElement | null,
    disabled?: boolean,
  ) => void;
  itemValues: string[];
  disabledValues: Set<string>;
  /** Whether the whole control is disabled (Root's `disabled` prop). */
  disabled: boolean;
};

export const [SegmentedControlContext, useSegmentedControlContext] =
  createStrictContext<SegmentedControlContextValue>(
    "SegmentedControl sub-components must be rendered inside a <SegmentedControl.Root>.",
  );
