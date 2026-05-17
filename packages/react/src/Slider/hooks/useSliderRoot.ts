import { useCallback, useEffect, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { useCollection, useControllableState } from "../../hooks";
import type { SliderContextValue } from "../SliderContext";
import type { SliderDirection, SliderOrientation } from "../types";
import {
  clamp,
  getClosestThumbIndex,
  getPointerValue,
  sortThumbsByDomOrder,
} from "../utils";

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
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const rootRef = useRef<HTMLSpanElement>(null);
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
      const current = valuesRef.current;
      const gap = minStepsBetweenThumbs * step;
      const lowerBound = index > 0 ? current[index - 1] + gap : min;
      const upperBound =
        index < current.length - 1 ? current[index + 1] - gap : max;
      const clamped = clamp(nextValue, lowerBound, upperBound);
      if (current[index] === clamped) {
        return;
      }
      setValues(current.map((entry, i) => (i === index ? clamped : entry)));
    },
    [min, max, step, minStepsBetweenThumbs, setValues],
  );

  const dragRef = useRef<{
    move: (event: PointerEvent) => void;
    up: () => void;
  } | null>(null);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      const rect = rootRef.current!.getBoundingClientRect();
      const pointerValue = getPointerValue(event.clientX, event.clientY, rect, {
        min,
        max,
        step,
        orientation,
      });
      const index = getClosestThumbIndex(pointerValue, valuesRef.current);
      setThumbValue(index, pointerValue);
      itemsRef.current.get(orderedThumbIds[index])?.focus();

      const move = (moveEvent: PointerEvent) => {
        const moveRect = rootRef.current!.getBoundingClientRect();
        setThumbValue(
          index,
          getPointerValue(moveEvent.clientX, moveEvent.clientY, moveRect, {
            min,
            max,
            step,
            orientation,
          }),
        );
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        dragRef.current = null;
      };
      dragRef.current = { move, up };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
      event.preventDefault();
    },
    [min, max, step, orientation, setThumbValue, orderedThumbIds, itemsRef],
  );

  useEffect(
    () => () => {
      if (dragRef.current) {
        document.removeEventListener("pointermove", dragRef.current.move);
        document.removeEventListener("pointerup", dragRef.current.up);
      }
    },
    [],
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

  return { contextValue, rootRef, onPointerDown };
}
