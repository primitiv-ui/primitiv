/**
 * Pure migration plan computation for the Typography → Semantic move.
 *
 * Given a snapshot of the file's collections and variables, this
 * returns a typed description of what would need to happen, without
 * touching the Figma file: how the Semantic collection should be
 * sourced or created, which new variables would replace each
 * Typography variable, and which Typography collections would be
 * deletable once references are rebound. The actual figma.variables.*
 * side effects live in a later module so this function stays trivially
 * testable.
 */

import type {
  CollectionSummary,
  MigrationPlan,
  PlannedVariable,
  VariableSummary,
} from '../shared/messages'

const SEMANTIC_COLLECTION_NAME = 'Semantic'
const SEMANTIC_DEFAULT_MODE_NAME = 'Value'
const TYPOGRAPHY_PATTERN = /^Typography\s*\/\s*(.+)$/

export interface MigrationInput {
  collections: CollectionSummary[]
  variables: VariableSummary[]
}

/** Builds a migration plan from a Figma export snapshot. */
export function planMigration(input: MigrationInput): MigrationPlan {
  const semantic = input.collections.find(
    (c) => c.name === SEMANTIC_COLLECTION_NAME,
  )
  const typographyByCollectionId = new Map<string, string>()
  const deletedCollectionIds: string[] = []

  for (const collection of input.collections) {
    const variant = typographyVariant(collection.name)
    if (variant === null) continue
    typographyByCollectionId.set(collection.id, variant)
    deletedCollectionIds.push(collection.id)
  }

  const newVariables: PlannedVariable[] = []
  for (const variable of input.variables) {
    const variant = typographyByCollectionId.get(variable.variableCollectionId)
    if (variant === undefined) continue
    newVariables.push({
      name: ['typography', variant, ...variable.name.split('/')].join('/'),
      resolvedType: variable.resolvedType,
      sourceVariableId: variable.id,
      sourceCollectionId: variable.variableCollectionId,
    })
  }

  return {
    semantic: {
      needsCreate: semantic === undefined,
      existingId: semantic?.id,
      modeName: SEMANTIC_DEFAULT_MODE_NAME,
    },
    newVariables,
    deletedCollectionIds,
  }
}

function typographyVariant(collectionName: string): string | null {
  const match = collectionName.match(TYPOGRAPHY_PATTERN)
  return match === null ? null : match[1].toLowerCase()
}
