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

export type SwatchData = {
  step: string
  rgba: RgbaColor
}

export type RampData = {
  name: string
  swatches: SwatchData[]
}

/** A message posted from the UI back to the sandbox. */
export type UiMessage =
  | { type: 'close' }
  | { type: 'apply-palette'; ramps: RampData[] }
