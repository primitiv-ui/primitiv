/** An OkLCH colour: lightness `0..1`, chroma `0..~0.4`, hue `0..360`. */
export type OklchValue = {
  l: number;
  c: number;
  h: number;
};

/**
 * The display gamut a chart renders against (RFC 0010 §7). The string values
 * match the engine's `Gamut` wasm enum, so a value flows straight into the
 * `paint_*` / `max_in_gamut_chroma` calls without a mapping layer.
 */
export type Gamut = "Srgb" | "DisplayP3";
