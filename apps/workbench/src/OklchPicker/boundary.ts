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
