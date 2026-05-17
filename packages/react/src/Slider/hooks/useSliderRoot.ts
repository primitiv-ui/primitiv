import { useCallback, useEffect, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { useCollection, useControllableState } from "../../hooks";
import type { SliderContextValue } from "../SliderContext";
import type { SliderDirection, SliderOrientation } from "../types";
import { clamp, getClosestThumbIndex, getPointerValue } from "../utils";

type UseSliderRootArgs = {
  min: number;
  max: number;
  step: number;
  minStepsBetweenThumbs: number;
  orientation: SliderOrientation;
  dir: SliderDirection;
  inverted: boolean;
  disabled: boolean;
  defaultValue?: number[];
  value?: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
};

export function useSliderRoot({
  min,
  max,
  step,
  minStepsBetweenThumbs,
  orientation,
  dir,
  inverted,
  disabled,
  defaultValue,
  value,
  onValueChange,
  onValueCommit,
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
    keys: orderedThumbIds,
  } = useCollection<string, HTMLSpanElement>();

  const setThumbValue = useCallback(
    (index: number, nextValue: number): number[] | null => {
      const current = valuesRef.current;
      const gap = minStepsBetweenThumbs * step;
      const lowerBound = index > 0 ? current[index - 1] + gap : min;
      const upperBound =
        index < current.length - 1 ? current[index + 1] - gap : max;
      const clamped = clamp(nextValue, lowerBound, upperBound);
      if (current[index] === clamped) {
        return null;
      }
      const next = current.map((entry, i) => (i === index ? clamped : entry));
      setValues(next);
      return next;
    },
    [min, max, step, minStepsBetweenThumbs, setValues],
  );

  const commit = useCallback(
    (committed: number[]) => {
      onValueCommit?.(committed);
    },
    [onValueCommit],
  );

  const dragRef = useRef<{
    move: (event: PointerEvent) => void;
    up: () => void;
  } | null>(null);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      if (disabled) {
        return;
      }
      const rect = rootRef.current!.getBoundingClientRect();
      const pointerValue = getPointerValue(event.clientX, event.clientY, rect, {
        min,
        max,
        step,
        orientation,
        dir,
        inverted,
      });
      const index = getClosestThumbIndex(pointerValue, valuesRef.current);
      let pendingCommit = setThumbValue(index, pointerValue);
      itemsRef.current.get(orderedThumbIds[index])?.focus();

      const move = (moveEvent: PointerEvent) => {
        const moveRect = rootRef.current!.getBoundingClientRect();
        const next = setThumbValue(
          index,
          getPointerValue(moveEvent.clientX, moveEvent.clientY, moveRect, {
            min,
            max,
            step,
            orientation,
            dir,
            inverted,
          }),
        );
        if (next) {
          pendingCommit = next;
        }
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        dragRef.current = null;
        if (pendingCommit) {
          commit(pendingCommit);
        }
      };
      dragRef.current = { move, up };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
      event.preventDefault();
    },
    [
      min,
      max,
      step,
      orientation,
      dir,
      inverted,
      disabled,
      setThumbValue,
      commit,
      orderedThumbIds,
      itemsRef,
    ],
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
      disabled,
      registerThumb,
      orderedThumbIds,
      setThumbValue,
      commit,
    }),
    [
      values,
      min,
      max,
      step,
      orientation,
      dir,
      inverted,
      disabled,
      registerThumb,
      orderedThumbIds,
      setThumbValue,
      commit,
    ],
  );

  if (min >= max) {
    throw new Error(
      `Slider: \`min\` (${min}) must be less than \`max\` (${max}).`,
    );
  }
  if (step <= 0) {
    throw new Error(`Slider: \`step\` (${step}) must be greater than 0.`);
  }

  return { contextValue, rootRef, onPointerDown };
}
