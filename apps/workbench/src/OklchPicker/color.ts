// The picker's colour string ↔ value bridge (RFC 0010 §4). Every conversion
// crosses into the one Rust engine via harmoni-wasm — there is no JS colour
// library (Principle 1). `parseColor` accepts any CSS colour the engine
// understands (hex, `oklch(...)`, `rgb(...)`, named colours); `formatColor`
// renders a value back to the engine's canonical hex and oklch strings.

import { parse_color, describe_oklch } from "harmoni-wasm";

import type { OklchValue } from "./types";

/**
 * Parses a CSS colour string into an OkLCH value, or `null` when the engine
 * rejects it (so the text field can flag an invalid entry without throwing).
 */
export function parseColor(input: string): OklchValue | null {
  try {
    const { l, c, h } = parse_color(input);
    return { l, c, h };
  } catch {
    return null;
  }
}

/** Renders a value to its engine-canonical `hex` and `oklch` strings. */
export function formatColor(value: OklchValue): { hex: string; oklch: string } {
  const { hex, oklch } = describe_oklch(value.l, value.c, value.h);
  return { hex, oklch };
}
