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

  // Load all local variables once — used for duplicate-name check,
  // reference rebinding, and idempotent re-run support.
  const allVars = await figma.variables.getLocalVariablesAsync()
  const existingNames = new Set(
    allVars
      .filter((v) => v.variableCollectionId === semanticCollection.id)
      .map((v) => v.name),
  )

  // 2. Create each new variable and copy its source value.
  // Track sourceVariableId → newVariableId for reference rebinding.
  // When a variable already exists (re-run), resolve its id from allVars
  // so rebinding still works correctly.
  const sourceToNewId = new Map<string, string>()

  for (const planned of plan.newVariables) {
    if (existingNames.has(planned.name)) {
      const existing = allVars.find(
        (v) =>
          v.variableCollectionId === semanticCollection.id &&
          v.name === planned.name,
      )
      if (existing !== undefined) {
        sourceToNewId.set(planned.sourceVariableId, existing.id)
      }
      continue
    }

    const newVar = figma.variables.createVariable(
      planned.name,
      semanticCollection,
      planned.resolvedType,
    )
    sourceToNewId.set(planned.sourceVariableId, newVar.id)

    const sourceVar = variableById.get(planned.sourceVariableId)
    const sourceCollection = collectionById.get(planned.sourceCollectionId)
    if (sourceVar !== undefined && sourceCollection !== undefined) {
      const value = sourceVar.valuesByMode[sourceCollection.defaultModeId]
      newVar.setValueForMode(semanticCollection.defaultModeId, value)
    }
  }

  // 3. Rebind VARIABLE_ALIAS references that point at source Typography
  // variables to their new Semantic counterparts, before collections are
  // deleted — otherwise referencing variables are left with broken aliases.
  for (const variable of allVars) {
    for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
      if (isVariableAlias(value) && sourceToNewId.has(value.id)) {
        variable.setValueForMode(modeId, {
          type: 'VARIABLE_ALIAS',
          id: sourceToNewId.get(value.id)!,
        })
      }
    }
  }

  // 4. Rebind node-level boundVariables across the whole document.
  // Typography variables are typically bound to text fields (fontSize,
  // lineHeight, etc.) which store VariableAlias[], and to scalar node fields
  // which store a single VariableAlias. Both are handled uniformly below.
  // getVariableByIdAsync is called at most once per new variable id.
  const fetchedVarCache = new Map<string, unknown>()
  async function fetchNewVar(id: string): Promise<unknown> {
    if (!fetchedVarCache.has(id)) {
      fetchedVarCache.set(id, await figma.variables.getVariableByIdAsync(id))
    }
    return fetchedVarCache.get(id)
  }

  const allNodes = figma.root.findAll()
  for (const node of allNodes) {
    const bound = (node as Record<string, unknown>)['boundVariables']
    if (!bound || typeof bound !== 'object') continue

    for (const [field, aliasOrAliases] of Object.entries(
      bound as Record<string, unknown>,
    )) {
      const aliases = Array.isArray(aliasOrAliases)
        ? aliasOrAliases
        : [aliasOrAliases]

      for (const alias of aliases) {
        if (isVariableAlias(alias) && sourceToNewId.has(alias.id)) {
          const newVar = await fetchNewVar(sourceToNewId.get(alias.id)!)
          if (newVar != null) {
            ;(node as Record<string, (f: string, v: unknown) => void>)[
              'setBoundVariable'
            ](field, newVar)
          }
        }
      }
    }
  }

  // 5. Remove each Typography collection
  for (const collectionId of plan.deletedCollectionIds) {
    const collection =
      await figma.variables.getVariableCollectionByIdAsync(collectionId)
    collection.remove()
  }
}

function isVariableAlias(
  value: unknown,
): value is { type: 'VARIABLE_ALIAS'; id: string } {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as Record<string, unknown>)['type'] === 'VARIABLE_ALIAS' &&
    typeof (value as Record<string, unknown>)['id'] === 'string'
  )
}
