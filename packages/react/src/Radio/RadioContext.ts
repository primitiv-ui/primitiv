import { createStrictContext } from "../utils/index.ts";

export type RadioContextValue = {
  /**
   * Best-effort mirror of the input's checked state, for the `data-state`
   * hook on the visual parts. Accurate in controlled mode and for self-clicks;
   * may go stale when the browser silently deselects a grouped sibling, which
   * is why the shipped CSS keys visibility off the input's native `:checked`,
   * not off `data-state`.
   */
  checked: boolean;
  /** Whether the radio is disabled, for the `data-disabled` hook. */
  disabled: boolean;
};

export const [RadioContext, useRadioContext] =
  createStrictContext<RadioContextValue>(
    "Radio sub-components must be rendered inside a <Radio.Root>.",
  );
