import type { CSSProperties } from "react";

import type { SliderDirection, SliderOrientation } from "./types";

type Edge = "left" | "right" | "top" | "bottom";

type EdgeArgs = {
  orientation: SliderOrientation;
  dir: SliderDirection;
  inverted: boolean;
};

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
  if (max <= min) {
    return 0;
  }
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

/** Round a value to the nearest step, anchored at `min`, at step precision. */
export function snapToStep(value: number, min: number, step: number): number {
  if (step <= 0) {
    return value;
  }
  const snapped = min + Math.round((value - min) / step) * step;
  const decimals = (String(step).split(".")[1] ?? "").length;
  return Number(snapped.toFixed(decimals));
}

/**
 * Resolve which physical edge a thumb's offset is anchored to, accounting
 * for orientation, reading direction, and the `inverted` flag.
 */
export function getOffsetEdge({ orientation, dir, inverted }: EdgeArgs): Edge {
  const base: Edge =
    orientation === "vertical" ? "bottom" : dir === "rtl" ? "right" : "left";
  return inverted ? OPPOSITE_EDGE[base] : base;
}

/** Inline style positioning a thumb at its value along the track. */
export function getThumbStyle(
  value: number | undefined,
  min: number,
  max: number,
  edgeArgs: EdgeArgs,
): CSSProperties {
  if (value === undefined) {
    return { position: "absolute" };
  }
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
  edgeArgs: EdgeArgs,
): CSSProperties {
  const edge = getOffsetEdge(edgeArgs);
  const percents = values.map((value) => valueToPercent(value, min, max));
  const startPercent = values.length > 1 ? Math.min(...percents) : 0;
  const endPercent = percents.length > 0 ? Math.max(...percents) : 0;
  return {
    position: "absolute",
    [edge]: `${startPercent}%`,
    [OPPOSITE_EDGE[edge]]: `${100 - endPercent}%`,
  };
}

type PointerValueArgs = {
  min: number;
  max: number;
  step: number;
  orientation: SliderOrientation;
};

/** Resolve the value at a pointer's position on the track. */
export function getPointerValue(
  clientX: number,
  clientY: number,
  rect: { left: number; width: number; bottom: number; height: number },
  { min, max, step, orientation }: PointerValueArgs,
): number {
  const percent =
    orientation === "vertical"
      ? clamp((rect.bottom - clientY) / rect.height, 0, 1)
      : clamp((clientX - rect.left) / rect.width, 0, 1);
  return clamp(snapToStep(min + percent * (max - min), min, step), min, max);
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

/** Order registered thumb ids by their position in the DOM. */
export function sortThumbsByDomOrder(
  thumbs: Map<string, HTMLElement>,
): string[] {
  return Array.from(thumbs.entries())
    .sort(([, a], [, b]) => {
      const position = a.compareDocumentPosition(b);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      }
      if (position & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }
      return 0;
    })
    .map(([id]) => id);
}
