import { useCallback, useMemo } from "react";

import { useCollection, useControllableState } from "../../hooks";
import type { SliderContextValue } from "../SliderContext";
import type { SliderDirection, SliderOrientation } from "../types";
import { clamp, sortThumbsByDomOrder } from "../utils";

type UseSliderRootArgs = {
  min: number;
  max: number;
  step: number;
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
      const clamped = clamp(nextValue, min, max);
      if (values[index] === clamped) {
        return;
      }
      setValues(values.map((current, i) => (i === index ? clamped : current)));
    },
    [values, min, max, setValues],
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
