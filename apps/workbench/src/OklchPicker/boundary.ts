// The sRGB gamut boundary curve the L×C plane overlays (RFC 0010 §2, §5). It
// sweeps the engine's `max_in_gamut_chroma` across evenly spaced lightness
// samples at the current hue and maps each to a chart point, returning an SVG
// polyline `points` string. Boundary chroma beyond the plane's `cMax` clamps to
// the top edge. The maths is the engine's — one source of truth (Principle 1).

import { max_in_gamut_chroma } from "harmoni-wasm";

import { clamp, axesToPoint } from "./geometry";
import type { Gamut } from "./types";

/**
 * Builds the `points` attribute for a gamut boundary polyline: `samples` points
 * across lightness `0..1` at hue `h`, within a `width`×`height` chart measured
 * against `cMax`, swept against `gamut`. Drawing both the sRGB and the
 * Display-P3 curves shows the sRGB→P3 extended band distinctly (RFC 0010 §7).
 */
export function boundaryPoints(
  h: number,
  width: number,
  height: number,
  cMax: number,
  samples: number,
  gamut: Gamut,
): string {
  const points: string[] = [];
  for (let i = 0; i < samples; i += 1) {
    const l = i / (samples - 1);
    const c = clamp(max_in_gamut_chroma(l, h, gamut), 0, cMax);
    const { x, y } = axesToPoint(l, c, width, height, 1, cMax);
    points.push(`${x},${y}`);
  }
  return points.join(" ");
}

/**
 * The Chroma chart's boundary curve: `samples` points of the max in-gamut chroma
 * swept across hue `0..360` at the fixed lightness `l`, mapped into a
 * `width`×`height` chart measured against `cMax` and clamped to the top edge.
 */
export function chromaBoundaryPoints(
  l: number,
  width: number,
  height: number,
  cMax: number,
  samples: number,
  gamut: Gamut,
): string {
  const points: string[] = [];
  for (let i = 0; i < samples; i += 1) {
    const hue = (i / (samples - 1)) * 360;
    const c = clamp(max_in_gamut_chroma(l, hue, gamut), 0, cMax);
    const { x, y } = axesToPoint(hue, c, width, height, 360, cMax);
    points.push(`${x},${y}`);
  }
  return points.join(" ");
}

/**
 * The Hue chart's boundary curves: at the fixed chroma `c`, the lightness window
 * `[low, high]` that can hold that chroma is found per hue (each hue's max chroma
 * rises then falls with lightness), giving an `upper` and a `lower` polyline
 * across hue `0..360`. Where the chroma is unreachable the limits pinch to the
 * peak lightness; `c <= 0` spans the whole range. `lSteps` lightness samples per
 * hue locate each crossing (refined by linear interpolation).
 */
export function hueBoundaryPoints(
  c: number,
  width: number,
  height: number,
  samples: number,
  gamut: Gamut,
  lSteps: number,
): { upper: string; lower: string } {
  const upper: string[] = [];
  const lower: string[] = [];
  for (let i = 0; i < samples; i += 1) {
    const hue = (i / (samples - 1)) * 360;
    const { low, high } = lightnessWindow(c, hue, gamut, lSteps);
    upper.push(point(hue, high, width, height));
    lower.push(point(hue, low, width, height));
  }
  return { upper: upper.join(" "), lower: lower.join(" ") };
}

/** Maps a (hue, lightness) pair to a Hue-chart point string (hue x, lightness y). */
function point(hue: number, l: number, width: number, height: number): string {
  const { x, y } = axesToPoint(hue, l, width, height, 360, 1);
  return `${x},${y}`;
}

/** The lightness range `[low, high]` that can hold chroma `c` at `hue`. */
function lightnessWindow(
  c: number,
  hue: number,
  gamut: Gamut,
  steps: number,
): { low: number; high: number } {
  if (c <= 0) return { low: 0, high: 1 };

  let prevL = 0;
  let prevM = max_in_gamut_chroma(0, hue, gamut);
  let bestL = 0;
  let bestM = prevM;
  let low: number | null = null;
  let high: number | null = null;

  for (let i = 1; i <= steps; i += 1) {
    const l = i / steps;
    const m = max_in_gamut_chroma(l, hue, gamut);
    if (m > bestM) {
      bestM = m;
      bestL = l;
    }
    if (prevM < c && m >= c) low = interpolate(prevL, prevM, l, m, c);
    if (prevM >= c && m < c) high = interpolate(prevL, prevM, l, m, c);
    prevL = l;
    prevM = m;
  }

  if (low === null || high === null) return { low: bestL, high: bestL };
  return { low, high };
}

/** The point between (l0, m0) and (l1, m1) where the chroma crosses `c`. */
function interpolate(
  l0: number,
  m0: number,
  l1: number,
  m1: number,
  c: number,
): number {
  return l0 + ((c - m0) / (m1 - m0)) * (l1 - l0);
}
