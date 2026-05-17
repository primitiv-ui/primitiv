import { useCallback, useMemo } from "react";

import { useCollection, useControllableState } from "../../hooks";
import type { SliderContextValue } from "../SliderContext";
import type { SliderDirection, SliderOrientation } from "../types";
import { clamp, sortThumbsByDomOrder } from "../utils";

type UseSliderRootArgs = {
  min: number;
  max: number;
  step: number;
  minStepsBetweenThumbs: number;
  orientation: SliderOrientation;
  dir: SliderDirection;
  inverted: boolean;
  defaultValue?: number[];
  value?: number[];
  onValueChange?: (value: number[]) => void;
};

export function useSliderRoot({
  min,
  max,
  step,
  minStepsBetweenThumbs,
  orientation,
  dir,
  inverted,
  defaultValue,
  value,
  onValueChange,
}: UseSliderRootArgs) {
  const [values, setValues] = useControllableState<number[]>(
    value,
    defaultValue ?? [min],
    onValueChange,
  );
  const {
    register: registerThumb,
    itemsRef,
    keys,
  } = useCollection<string, HTMLSpanElement>();

  const orderedThumbIds = useMemo(
    () => sortThumbsByDomOrder(itemsRef.current),
    [keys, itemsRef],
  );

  const setThumbValue = useCallback(
    (index: number, nextValue: number) => {
      const gap = minStepsBetweenThumbs * step;
      const lowerBound = index > 0 ? values[index - 1] + gap : min;
      const upperBound =
        index < values.length - 1 ? values[index + 1] - gap : max;
      const clamped = clamp(nextValue, lowerBound, upperBound);
      if (values[index] === clamped) {
        return;
      }
      setValues(values.map((current, i) => (i === index ? clamped : current)));
    },
    [values, min, max, step, minStepsBetweenThumbs, setValues],
  );

  const contextValue = useMemo<SliderContextValue>(
    () => ({
      values,
      min,
      max,
      step,
      orientation,
      dir,
      inverted,
      registerThumb,
      orderedThumbIds,
      setThumbValue,
    }),
    [
      values,
      min,
      max,
      step,
      orientation,
      dir,
      inverted,
      registerThumb,
      orderedThumbIds,
      setThumbValue,
    ],
  );

  return { contextValue };
}
