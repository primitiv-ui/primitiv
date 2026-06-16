import type { Context } from "react";
import { createStrictContext } from "../utils/index.ts";

import type { SliderDirection, SliderOrientation } from "./types";

/** Shared state published by `Slider.Root` to its sub-components: the current values, range/step bounds, orientation and direction, thumb registration, and value-commit callbacks. */
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

const sliderContextPair = createStrictContext<SliderContextValue>(
  "Slider sub-components must be rendered inside a <Slider.Root>.",
  "SliderContext",
);

/** React context carrying the {@link SliderContextValue} shared by the slider's sub-components. */
export const SliderContext: Context<SliderContextValue | null> =
  sliderContextPair[0];
/** Hook returning the {@link SliderContextValue}; throws when used outside a `<Slider.Root>`. */
export const useSliderContext: () => SliderContextValue = sliderContextPair[1];
