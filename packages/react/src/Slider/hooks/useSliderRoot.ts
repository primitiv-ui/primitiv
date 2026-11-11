import { useCallback, useMemo } from "react";

import { SliderController } from "@primitiv-ui/web";

import { useCollection, useControllableState, useHostedController } from "../../hooks/index.ts";
import type { SliderContextValue } from "../SliderContext";
import type { SliderDirection, SliderOrientation } from "../types";

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

type ThumbMeta = { element: HTMLSpanElement; disabled: boolean };

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
  const [values, setValues] = useControllableState<number[]>(value, defaultValue ?? [min], onValueChange);

  const { register, itemsRef, keys: orderedThumbIds } = useCollection<string, ThumbMeta>();

  const registerThumb = useCallback(
    (id: string, element: HTMLSpanElement | null) => {
      // A thumb is never disabled on its own: the controller reads the slider's
      // `disabled` from Root, so the flag the collection carries goes unread.
      // Stryker disable next-line BooleanLiteral: equivalent — SliderController never reads a thumb's own disabled flag.
      register(id, element ? { element, disabled: false } : null);
    },
    // `register` is a stable useCollection callback (its own deps never
    // change), so emptying this array yields the identical memoised function.
    // Stryker disable next-line ArrayDeclaration: equivalent — stable dependency.
    [register],
  );

  // The keys and the press-and-drag run in the shared SliderController
  // (@primitiv-ui/web, RFC 0033 D30) — the code <primitiv-slider> runs. React
  // keeps the values and answers it; every change goes through
  // `onValueChange`, and the end of an interaction through `onValueCommit`.
  const rootRef = useHostedController<
    {
      values: number[];
      min: number;
      max: number;
      step: number;
      minStepsBetweenThumbs: number;
      orientation: SliderOrientation;
      dir: SliderDirection;
      inverted: boolean;
      disabled: boolean;
      setValues: typeof setValues;
      onValueCommit: typeof onValueCommit;
    },
    HTMLSpanElement
  >(
    { values, min, max, step, minStepsBetweenThumbs, orientation, dir, inverted, disabled, setValues, onValueCommit },
    (root, latest) =>
      new SliderController(root, {
        state: () => latest(),
        change: (next) => latest().setValues(next),
        commit: (next) => latest().onValueCommit?.(next),
      }),
    { itemsRef, keys: orderedThumbIds },
  );

  const contextValue = useMemo<SliderContextValue>(
    () => ({ values, min, max, orientation, dir, inverted, disabled, registerThumb, orderedThumbIds }),
    [values, min, max, orientation, dir, inverted, disabled, registerThumb, orderedThumbIds],
  );

  if (min >= max) {
    throw new Error(`Slider: \`min\` (${min}) must be less than \`max\` (${max}).`);
  }
  if (step <= 0) {
    throw new Error(`Slider: \`step\` (${step}) must be greater than 0.`);
  }

  return { contextValue, rootRef };
}
