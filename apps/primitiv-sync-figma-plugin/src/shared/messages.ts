/**
 * The postMessage contract between the sync plugin's two contexts.
 *
 * A Figma plugin runs as two separate programs: the sandbox (`code.ts`,
 * which owns the `figma` global) and the UI (`<iframe>`, which owns the
 * DOM). They communicate only by passing the messages typed below, so
 * both sides import this module.
 */

/** A message posted from the sandbox to the UI. */
export type SandboxMessage = {
  type: 'plugin-ready'
  pageName: string
}

/** A message posted from the UI back to the sandbox. */
export type UiMessage = {
  type: 'close'
}
