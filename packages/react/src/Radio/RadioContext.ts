import { createStrictContext } from "../utils/index.ts";

export type RadioContextValue = {
  checked: boolean;
};

export const [RadioContext, useRadioContext] =
  createStrictContext<RadioContextValue>(
    "Radio sub-components must be rendered inside a <Radio.Root>.",
  );
