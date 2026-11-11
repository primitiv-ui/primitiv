/** Layout axis of the slider. */
export type SliderOrientation = "horizontal" | "vertical";

/** Reading direction. Under `"rtl"` a horizontal slider runs right to left. */
export type SliderReadingDirection = "ltr" | "rtl";

/** Which way a slider runs: its axis, reading direction, and whether it is inverted. */
export type SliderAxis = {
  orientation: SliderOrientation;
  dir: SliderReadingDirection;
  /** Run from the opposite end: max at the start edge. */
  inverted: boolean;
};

/** The values a slider takes: `min` to `max` in `step`s. */
export type SliderScale = { min: number; max: number; step: number };

/** A physical edge of the track. */
export type SliderEdge = "left" | "right" | "top" | "bottom";

/** A distance from one edge of the track, as a percentage of its length. */
export type SliderInset = { edge: SliderEdge; percent: number };

const OPPOSITE: Record<SliderEdge, SliderEdge> = { left: "right", right: "left", top: "bottom", bottom: "top" };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** `value` rounded to the nearest step counted from `min`, at the step's own precision. */
export function sliderSnap(value: number, min: number, step: number): number {
  const snapped = min + Math.round((value - min) / step) * step;
  const decimals = String(step).split(".")[1]?.length ?? 0;
  return Number(snapped.toFixed(decimals));
}

/** Where `value` sits between `min` and `max`, as a percentage clamped to 0–100. */
export function sliderPercent(value: number, min: number, max: number): number {
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

/**
 * The edge a slider measures from — where its `min` sits: the left (right under
 * RTL) of a horizontal track, the bottom of a vertical one, and the opposite
 * edge when inverted.
 */
export function sliderEdge({ orientation, dir, inverted }: SliderAxis): SliderEdge {
  const start: SliderEdge = orientation === "vertical" ? "bottom" : dir === "rtl" ? "right" : "left";
  return inverted ? OPPOSITE[start] : start;
}

/** Where a thumb at `value` sits: its distance from the start edge. */
export function sliderThumbInset(
  value: number,
  { min, max }: Pick<SliderScale, "min" | "max">,
  axis: SliderAxis,
): SliderInset {
  return { edge: sliderEdge(axis), percent: sliderPercent(value, min, max) };
}

/**
 * Where the filled range sits: from the start edge to a single thumb, or between
 * the outermost of several — as its two insets, from the start edge and from the
 * opposite one.
 */
export function sliderRangeInsets(
  values: readonly number[],
  { min, max }: Pick<SliderScale, "min" | "max">,
  axis: SliderAxis,
): { start: SliderInset; end: SliderInset } {
  const edge = sliderEdge(axis);
  const percents = values.map((value) => sliderPercent(value, min, max));
  const start = values.length > 1 ? Math.min(...percents) : 0;
  return { start: { edge, percent: start }, end: { edge: OPPOSITE[edge], percent: 100 - Math.max(...percents) } };
}

/**
 * The value under a pointer at `point` on a track whose box is `rect`: read
 * along the axis from the start edge, clamped to the track, snapped to the step
 * and kept within the scale.
 */
export function sliderPointerValue(
  point: { x: number; y: number },
  rect: { left: number; width: number; bottom: number; height: number },
  { min, max, step, orientation, dir, inverted }: SliderScale & SliderAxis,
): number {
  const vertical = orientation === "vertical";
  const fromStart = vertical ? (rect.bottom - point.y) / rect.height : (point.x - rect.left) / rect.width;
  const reversed = vertical ? inverted : (dir === "rtl") !== inverted;
  const percent = clamp(reversed ? 1 - fromStart : fromStart, 0, 1);
  return clamp(sliderSnap(min + percent * (max - min), min, step), min, max);
}

/**
 * The WAI-ARIA slider keys for a thumb at `value`: the arrows step one `step`
 * (up and toward the end increase, mirrored under RTL and when inverted),
 * Page Up / Page Down ten, Home / End jump to `min` / `max`. The result is
 * snapped to the step but not clamped — the thumb's own bounds do that. `null`
 * for any other key.
 */
export function sliderKeyValue(
  key: string,
  value: number,
  { min, max, step, orientation, dir, inverted }: SliderScale & SliderAxis,
): number | null {
  if (key === "Home") return min;
  if (key === "End") return max;
  let increases: boolean;
  if (key === "PageUp" || key === "PageDown") {
    increases = key === "PageUp";
  } else if (key === "ArrowUp" || key === "ArrowDown") {
    increases = (key === "ArrowUp") !== (orientation === "vertical" && inverted);
  } else if (key === "ArrowRight" || key === "ArrowLeft") {
    const rightIncreases = orientation === "vertical" || (dir === "ltr") !== inverted;
    increases = (key === "ArrowRight") === rightIncreases;
  } else {
    return null;
  }
  const magnitude = key.startsWith("Page") ? step * 10 : step;
  return sliderSnap(value + (increases ? magnitude : -magnitude), min, step);
}

/**
 * Every thumb's value after moving thumb `index` to `value`: kept within the
 * scale and between its neighbours, `minStepsBetweenThumbs` steps apart. `null`
 * when the thumb would not move, so no change is reported.
 */
export function sliderSetThumb(
  values: readonly number[],
  index: number,
  value: number,
  { min, max, step, minStepsBetweenThumbs }: SliderScale & { minStepsBetweenThumbs: number },
): number[] | null {
  const gap = minStepsBetweenThumbs * step;
  const lower = index > 0 ? values[index - 1] + gap : min;
  const upper = index < values.length - 1 ? values[index + 1] - gap : max;
  const next = clamp(value, lower, upper);
  if (values[index] === next) return null;
  return values.map((entry, i) => (i === index ? next : entry));
}

/** The index of the thumb nearest `value`, the first on a tie. */
export function sliderClosestThumb(value: number, values: readonly number[]): number {
  let closest = 0;
  values.forEach((thumb, index) => {
    if (Math.abs(thumb - value) < Math.abs(values[closest] - value)) closest = index;
  });
  return closest;
}
