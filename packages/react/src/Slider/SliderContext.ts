import { createStrictContext } from "../utils/index.ts";

import type { SliderDirection, SliderOrientation } from "./types";

export type SliderContextValue = {
  values: number[];
  min: number;
  max: number;
  step: number;
  orientation: SliderOrientation;
  dir: SliderDirection;
  inverted: boolean;
  disabled: boolean;
  registerThumb: (id: string, element: HTMLSpanElement | null) => void;
  orderedThumbIds: string[];
  setThumbValue: (index: number, value: number) => number[] | null;
  commit: (values: number[]) => void;
};

export const [SliderContext, useSliderContext] =
  createStrictContext<SliderContextValue>(
    "Slider sub-components must be rendered inside a <Slider.Root>.",
    "SliderContext",
  );
