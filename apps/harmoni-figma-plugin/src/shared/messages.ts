/**
 * The postMessage contract between the plugin's two contexts.
 *
 * A Figma plugin runs as two separate programs: the sandbox (`code.ts`,
 * which owns the `figma` global) and the UI (`<iframe>`, which owns the
 * DOM and the harmoni-wasm engine). They communicate only by passing the
 * messages typed below, so both sides import this module.
 */

/** A message posted from the sandbox to the UI. */
export type SandboxMessage = {
  type: 'plugin-ready'
  pageName: string
}

export type RgbaColor = { r: number; g: number; b: number; a: number }

/**
 * Which tier of the engine's contrast audit produced a swatch's foreground.
 * Mirrors `harmoni-wasm`'s `ForegroundSource`; carried per swatch so the
 * sandbox can write a `Primitives / Foreground` alias to the matching palette
 * variable (the ramp's own 50/900, or a white/black anchor) per RFC 0003.
 */
export type ForegroundSource =
  | 'Step900'
  | 'Step50'
  | 'SoftWhite'
  | 'SoftBlack'
  | 'PureWhite'
  | 'PureBlack'

export type SwatchData = {
  step: string
  rgba: RgbaColor
  foregroundSource?: ForegroundSource
}

/** A ramp with separate light and dark mode swatches. Omit `dark` to reuse light values in dark mode. */
export type PairedRampData = {
  name: string
  light: SwatchData[]
  dark?: SwatchData[]
}

/** A single colour variable written identically to both Light and Dark modes. */
export type SingleColorData = {
  name: string
  rgba: RgbaColor
}

/** A message posted from the UI back to the sandbox. */
export type UiMessage =
  | { type: 'close' }
  | { type: 'apply-palette'; ramps: PairedRampData[]; singles: SingleColorData[] }
