/**
 * Figma API side effects for the Typography → Semantic migration.
 *
 * Accepts the plan produced by `planMigration` and the variable snapshot
 * used to build it, then performs the mutations: creates or reuses the
 * Semantic collection, creates each new variable with its source value,
 * and removes the Typography collections.
 *
 * Keeping this separate from `migrate.ts` lets `planMigration` stay
 * trivially testable without any Figma globals.
 */

import type { MigrationPlan } from '../shared/messages'
import type { MigrationInput } from './migrate'

const SEMANTIC_COLLECTION_NAME = 'Semantic'

/** Executes a migration plan against the live Figma file. */
export async function executeMigration(
  plan: MigrationPlan,
  input: MigrationInput,
): Promise<void> {
  // 1. Resolve the Semantic collection node
  const semanticCollection = plan.semantic.needsCreate
    ? figma.variables.createVariableCollection(SEMANTIC_COLLECTION_NAME)
    : await figma.variables.getVariableCollectionByIdAsync(plan.semantic.existingId!)

  // Build lookup maps from the snapshot so we don't need extra Figma reads
  const variableById = new Map(input.variables.map((v) => [v.id, v]))
  const collectionById = new Map(input.collections.map((c) => [c.id, c]))

  // Build a set of variable names already in the Semantic collection so the
  // execution is idempotent — re-running after a partial migration won't fail
  // with a duplicate-name error.
  const existingVars = await figma.variables.getLocalVariablesAsync()
  const existingNames = new Set(
    existingVars
      .filter((v) => v.variableCollectionId === semanticCollection.id)
      .map((v) => v.name),
  )

  // 2. Create each new variable and copy its source value
  for (const planned of plan.newVariables) {
    if (existingNames.has(planned.name)) continue

    const newVar = figma.variables.createVariable(
      planned.name,
      semanticCollection,
      planned.resolvedType,
    )

    const sourceVar = variableById.get(planned.sourceVariableId)
    const sourceCollection = collectionById.get(planned.sourceCollectionId)
    if (sourceVar !== undefined && sourceCollection !== undefined) {
      const value = sourceVar.valuesByMode[sourceCollection.defaultModeId]
      newVar.setValueForMode(semanticCollection.defaultModeId, value)
    }
  }

  // 3. Remove each Typography collection
  for (const collectionId of plan.deletedCollectionIds) {
    const collection =
      await figma.variables.getVariableCollectionByIdAsync(collectionId)
    collection.remove()
  }
}
