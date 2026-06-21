// The L / C / H numeric-field model (RFC 0010 §2). Each channel carries its
// valid range, a sane spinner step, and a display precision so the fields clamp
// typed values into range, round engine floats to a readable form, and step by
// a friendly amount. Range-clamping (not gamut-clamping) is deliberate: a value
// inside its channel range but outside the sRGB gamut is kept, so the chart's
// cursor can sit beyond the boundary and show the colour is unreachable — the
// pad clamps to gamut on interaction, the numeric fields do not.

import { C_MAX, clamp } from "./geometry";

export type Channel = "l" | "c" | "h";

type ChannelMeta = { min: number; max: number; step: number; precision: number };

export const CHANNELS: Record<Channel, ChannelMeta> = {
  l: { min: 0, max: 1, step: 0.01, precision: 3 },
  c: { min: 0, max: C_MAX, step: 0.005, precision: 3 },
  h: { min: 0, max: 360, step: 1, precision: 1 },
};

/** Clamps a typed `value` into the channel's valid range. */
export function clampChannel(channel: Channel, value: number): number {
  const { min, max } = CHANNELS[channel];
  return clamp(value, min, max);
}

/** Rounds an engine float to the channel's display precision. */
export function roundChannel(channel: Channel, value: number): number {
  const factor = 10 ** CHANNELS[channel].precision;
  return Math.round(value * factor) / factor;
}
