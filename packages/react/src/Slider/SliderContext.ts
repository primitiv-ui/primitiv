import type { Context } from "react";
import { createStrictContext } from "../utils/index.ts";

import type { SliderDirection, SliderOrientation } from "./types";

/**
 * Shared state published by {@link SliderRoot | `Slider.Root`} to its
 * sub-components: the current values, range/step bounds, orientation and
 * direction, thumb registration, and the value-change / value-commit
 * callbacks. Read it with {@link useSliderContext}; it throws when a
 * sub-component is rendered outside a `<Slider.Root>`.
 */
export type SliderContextValue = {
  /** The current value array — one entry per registered thumb, in order. */
  values: number[];
  /** Lowest value (track start edge). */
  min: number;
  /** Highest value (track end edge). */
  max: number;
  /** Granularity; every value snaps to a multiple of this anchored at `min`. */
  step: number;
  /** Resolved layout axis; see {@link SliderOrientation}. */
  orientation: SliderOrientation;
  /** Resolved reading direction (after inheriting from `DirectionProvider`); see {@link SliderDirection}. */
  dir: SliderDirection;
  /** Whether the axis is reversed relative to its natural direction. */
  inverted: boolean;
  /** Whether interaction is disabled across every part. */
  disabled: boolean;
  /**
   * Registers (or, with `null`, unregisters) a thumb by its stable id so Root
   * can order the thumbs and focus them on pointer interaction. Called from
   * each {@link SliderThumb | `Slider.Thumb`} on mount/unmount.
   */
  registerThumb: (id: string, element: HTMLSpanElement | null) => void;
  /** Registered thumb ids in DOM order; a thumb's index into `values` is its position here. */
  orderedThumbIds: string[];
  /**
   * Sets the thumb at `index` to `value`, clamped between its neighbours (plus
   * `minStepsBetweenThumbs`) and the `[min, max]` bounds. Returns the next
   * value array when it changed, or `null` when the clamped value was
   * unchanged (so callers can skip a redundant commit).
   */
  setThumbValue: (index: number, value: number) => number[] | null;
  /** Fires `onValueCommit` with the settled array at the end of an interaction. */
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
