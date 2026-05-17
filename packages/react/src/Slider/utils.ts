import type { CSSProperties } from "react";

import type { SliderDirection, SliderOrientation } from "./types";

type Edge = "left" | "right" | "top" | "bottom";

export type SliderAxisArgs = {
  orientation: SliderOrientation;
  dir: SliderDirection;
  inverted: boolean;
};

export type SliderKeyAction = "increase" | "decrease" | "min" | "max";

const OPPOSITE_EDGE: Record<Edge, Edge> = {
  left: "right",
  right: "left",
  top: "bottom",
  bottom: "top",
};

/** Constrain `value` to the inclusive `[min, max]` range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Map a value onto its 0–100 position within the `[min, max]` range. */
export function valueToPercent(value: number, min: number, max: number): number {
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

/** Round a value to the nearest step, anchored at `min`, at step precision. */
export function snapToStep(value: number, min: number, step: number): number {
  const snapped = min + Math.round((value - min) / step) * step;
  const decimals = (String(step).split(".")[1] ?? "").length;
  return Number(snapped.toFixed(decimals));
}

/**
 * Resolve which physical edge a thumb's offset is anchored to, accounting
 * for orientation, reading direction, and the `inverted` flag.
 */
export function getOffsetEdge({ orientation, dir, inverted }: SliderAxisArgs): Edge {
  const base: Edge =
    orientation === "vertical" ? "bottom" : dir === "rtl" ? "right" : "left";
  return inverted ? OPPOSITE_EDGE[base] : base;
}

/** Inline style positioning a thumb at its value along the track. */
export function getThumbStyle(
  value: number,
  min: number,
  max: number,
  edgeArgs: SliderAxisArgs,
): CSSProperties {
  const edge = getOffsetEdge(edgeArgs);
  return { position: "absolute", [edge]: `${valueToPercent(value, min, max)}%` };
}

/**
 * Inline style stretching the range between the lowest and highest thumb
 * (or from the track start to the single thumb).
 */
export function getRangeStyle(
  values: number[],
  min: number,
  max: number,
  edgeArgs: SliderAxisArgs,
): CSSProperties {
  const edge = getOffsetEdge(edgeArgs);
  const percents = values.map((value) => valueToPercent(value, min, max));
  const startPercent = values.length > 1 ? Math.min(...percents) : 0;
  const endPercent = Math.max(...percents);
  return {
    position: "absolute",
    [edge]: `${startPercent}%`,
    [OPPOSITE_EDGE[edge]]: `${100 - endPercent}%`,
  };
}

type PointerValueArgs = SliderAxisArgs & {
  min: number;
  max: number;
  step: number;
};

/** Resolve the value at a pointer's position on the track. */
export function getPointerValue(
  clientX: number,
  clientY: number,
  rect: { left: number; width: number; bottom: number; height: number },
  { min, max, step, orientation, dir, inverted }: PointerValueArgs,
): number {
  let percent =
    orientation === "vertical"
      ? (rect.bottom - clientY) / rect.height
      : (clientX - rect.left) / rect.width;
  const reversed =
    orientation === "vertical" ? inverted : (dir === "ltr") === inverted;
  if (reversed) {
    percent = 1 - percent;
  }
  percent = clamp(percent, 0, 1);
  return clamp(snapToStep(min + percent * (max - min), min, step), min, max);
}

/**
 * Map a key press to an abstract value action, accounting for orientation,
 * reading direction, and the `inverted` flag. Returns `null` for keys the
 * slider does not handle.
 */
export function getKeyAction(
  key: string,
  { orientation, dir, inverted }: SliderAxisArgs,
): SliderKeyAction | null {
  switch (key) {
    case "Home":
      return "min";
    case "End":
      return "max";
    case "PageUp":
      return "increase";
    case "PageDown":
      return "decrease";
    case "ArrowUp":
    case "ArrowDown": {
      const upIncreases = orientation === "vertical" ? !inverted : true;
      const increases = key === "ArrowUp" ? upIncreases : !upIncreases;
      return increases ? "increase" : "decrease";
    }
    case "ArrowRight":
    case "ArrowLeft": {
      const rightIncreases =
        orientation === "vertical" ? true : (dir === "ltr") !== inverted;
      const increases = key === "ArrowRight" ? rightIncreases : !rightIncreases;
      return increases ? "increase" : "decrease";
    }
    default:
      return null;
  }
}

/** Index of the thumb whose value sits nearest to `value` (ties favour the first). */
export function getClosestThumbIndex(value: number, values: number[]): number {
  let closestIndex = 0;
  let smallestDistance = Infinity;
  values.forEach((thumbValue, index) => {
    const distance = Math.abs(thumbValue - value);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestIndex = index;
    }
  });
  return closestIndex;
}
