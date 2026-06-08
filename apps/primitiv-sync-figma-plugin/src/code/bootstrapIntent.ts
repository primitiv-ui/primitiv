/**
 * Tier-2 Bootstrap Intent action per RFC 0001 §4 / RFC 0002 §3.
 *
 * Creates (or reuses) the `Intent` variable collection and populates all
 * intent variables with aliases into `Primitives / Palette` for both the
 * Light and Dark modes.
 *
 * If the legacy `Intent / Light` single-mode collection exists it is
 * renamed to `Intent` in place — all existing variable IDs (and therefore
 * all component fill/stroke bindings) are preserved.
 *
 * Idempotent — reruns mutate the same nodes in place.
 */

import { findOrCreateVariable } from './figmaIdempotent'
import { INTENT_SPEC } from './intentSpec'
import type { BootstrapIntentResult } from '../shared/messages'

export type { BootstrapIntentResult }

async function resolveCollection(): Promise<{
  collection: VariableCollection
  lightModeId: string
  darkModeId: string
}> {
  const allCollections = await figma.variables.getLocalVariableCollectionsAsync()

  let collection =
    allCollections.find((c) => c.name === INTENT_SPEC.collection) ??
    allCollections.find((c) => c.name === INTENT_SPEC.legacyCollection)

  if (!collection) {
    collection = figma.variables.createVariableCollection(INTENT_SPEC.collection)
  } else if (collection.name === INTENT_SPEC.legacyCollection) {
    collection.name = INTENT_SPEC.collection
  }

  const lightMode = collection.modes.find((m) => m.name === INTENT_SPEC.lightModeName)
  const lightModeId = lightMode
    ? lightMode.modeId
    : (collection.renameMode(collection.modes[0].modeId, INTENT_SPEC.lightModeName),
       collection.modes[0].modeId)

  const darkMode = collection.modes.find((m) => m.name === INTENT_SPEC.darkModeName)
  const darkModeId = darkMode
    ? darkMode.modeId
    : collection.addMode(INTENT_SPEC.darkModeName)

  return { collection, lightModeId, darkModeId }
}

export async function bootstrapIntent(): Promise<BootstrapIntentResult> {
  const allCollections = await figma.variables.getLocalVariableCollectionsAsync()
  const paletteCollection = allCollections.find(
    (c) => c.name === INTENT_SPEC.aliasCollection,
  )
  if (!paletteCollection) {
    throw new Error(
      `${INTENT_SPEC.aliasCollection} collection not found — run Apply palette in the Harmoni plugin first`,
    )
  }

  const foregroundCollection = allCollections.find(
    (c) => c.name === INTENT_SPEC.foregroundCollection,
  )

  const allVars = await figma.variables.getLocalVariablesAsync()
  const paletteByName = new Map<string, Variable>()
  const foregroundByName = new Map<string, Variable>()
  for (const v of allVars) {
    if (v.variableCollectionId === paletteCollection.id) paletteByName.set(v.name, v)
    if (foregroundCollection && v.variableCollectionId === foregroundCollection.id) {
      foregroundByName.set(v.name, v)
    }
  }

  const { collection, lightModeId, darkModeId } = await resolveCollection()

  const warnings: string[] = []
  let variablesCreated = 0
  let variablesUpdated = 0

  for (const spec of INTENT_SPEC.variables) {
    const byName = spec.from === 'foreground' ? foregroundByName : paletteByName
    const lightTarget = byName.get(spec.aliasTo)
    if (!lightTarget) {
      warnings.push(
        `Palette variable "${spec.aliasTo}" missing — skipped "${spec.name}"`,
      )
      continue
    }
    const darkAliasTo = spec.darkAliasTo ?? spec.aliasTo
    const darkTarget = byName.get(darkAliasTo) ?? lightTarget

    const varResult = await findOrCreateVariable(spec.name, collection, spec.type)
    varResult.value.setValueForMode(lightModeId, {
      type: 'VARIABLE_ALIAS',
      id: lightTarget.id,
    })
    varResult.value.setValueForMode(darkModeId, {
      type: 'VARIABLE_ALIAS',
      id: darkTarget.id,
    })

    if (varResult.created) variablesCreated++
    else variablesUpdated++
  }

  return {
    collection: 'updated',
    variablesCreated,
    variablesUpdated,
    warnings,
  }
}
