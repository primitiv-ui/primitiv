/**
 * The postMessage contract between the sync plugin's two contexts.
 *
 * A Figma plugin runs as two separate programs: the sandbox (`code.ts`,
 * which owns the `figma` global) and the UI (`<iframe>`, which owns the
 * DOM). They communicate only by passing the messages typed below, so
 * both sides import this module.
 */

import type { FigmaResolvedType } from '@primitiv/tokens'

/** Context options the Bootstrap context action accepts. */
export type ContextName = 'comfortable'

/** Result returned by the Bootstrap context action. */
export type BootstrapResult = {
  context: ContextName
  collection: 'created' | 'updated'
  variablesCreated: number
  variablesUpdated: number
  textStylesCreated: number
  textStylesUpdated: number
  warnings: string[]
}

/** A serialisable summary of a Figma variable collection. */
export type CollectionSummary = {
  id: string
  name: string
  modes: { modeId: string; name: string }[]
  defaultModeId: string
  variableIds: string[]
}

/** A serialisable summary of a Figma variable. */
export type VariableSummary = {
  id: string
  name: string
  resolvedType: FigmaResolvedType
  variableCollectionId: string
  valuesByMode: Record<string, unknown>
}

/** A message posted from the sandbox to the UI. */
export type SandboxMessage =
  | { type: 'plugin-ready'; pageName: string }
  | {
      type: 'inspect-variables-result'
      collections: CollectionSummary[]
      variables: VariableSummary[]
    }
  | {
      type: 'export-tokens-result'
      collections: CollectionSummary[]
      variables: VariableSummary[]
    }
  | { type: 'bootstrap-context-result'; result: BootstrapResult }
  | {
      type: 'bootstrap-context-error'
      context: ContextName
      message: string
    }

/** A message posted from the UI back to the sandbox. */
export type UiMessage =
  | { type: 'ui-ready' }
  | { type: 'inspect-variables-request' }
  | { type: 'export-tokens-request' }
  | { type: 'bootstrap-context-request'; context: ContextName }
  | { type: 'close' }
