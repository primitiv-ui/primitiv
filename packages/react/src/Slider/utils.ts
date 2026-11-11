import type { CSSProperties } from "react";

import { sliderRangeInsets, sliderThumbInset, type SliderAxis, type SliderInset } from "@primitiv-ui/core";

/** The inline style that places a part at `insets` along the track. */
function placed(insets: readonly SliderInset[]): CSSProperties {
  return {
    position: "absolute",
    ...Object.fromEntries(insets.map(({ edge, percent }) => [edge, `${percent}%`])),
  };
}

/** A thumb's inline position: its value's distance from the track's start edge (core's rule). */
export function getThumbStyle(value: number, min: number, max: number, axis: SliderAxis): CSSProperties {
  return placed([sliderThumbInset(value, { min, max }, axis)]);
}

/** The range's inline position: from the start edge to one thumb, or between the outermost of several. */
export function getRangeStyle(values: number[], min: number, max: number, axis: SliderAxis): CSSProperties {
  const { start, end } = sliderRangeInsets(values, { min, max }, axis);
  return placed([start, end]);
}
