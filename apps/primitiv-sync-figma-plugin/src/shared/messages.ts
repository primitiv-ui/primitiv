/**
 * The postMessage contract between the sync plugin's two contexts.
 *
 * A Figma plugin runs as two separate programs: the sandbox (`code.ts`,
 * which owns the `figma` global) and the UI (`<iframe>`, which owns the
 * DOM). They communicate only by passing the messages typed below, so
 * both sides import this module.
 */

import type { FigmaResolvedType } from '@primitiv/tokens'

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

/** One variable the migration would create inside Semantic. */
export type PlannedVariable = {
  name: string
  resolvedType: FigmaResolvedType
  sourceVariableId: string
  sourceCollectionId: string
}

/** The plan computed for a Typography → Semantic migration. */
export type MigrationPlan = {
  semantic: {
    needsCreate: boolean
    existingId?: string
    modeName: string
  }
  newVariables: PlannedVariable[]
  deletedCollectionIds: string[]
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
  | { type: 'migrate-preview-result'; plan: MigrationPlan }
  | { type: 'migrate-execute-result'; success: boolean; error?: string }

/** A message posted from the UI back to the sandbox. */
export type UiMessage =
  | { type: 'ui-ready' }
  | { type: 'inspect-variables-request' }
  | { type: 'export-tokens-request' }
  | { type: 'migrate-preview-request' }
  | { type: 'migrate-execute-request' }
  | { type: 'close' }
