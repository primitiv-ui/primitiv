/**
 * Tier-2 *Bootstrap Intent / Light* action per RFC 0001 §4 / RFC 0002 §3.
 *
 * Creates (or reuses) the `Intent / Light` variable collection and populates
 * all intent variables from `INTENT_LIGHT_SPEC`. Each variable is a COLOR
 * alias into `Primitives / Palette` (produced by the Harmoni plugin Phase A).
 *
 * Missing alias targets land in `warnings` and the variable is skipped
 * (consistent with the §15.6 idempotence rule). Danger ramp variables will
 * warn until a danger palette is added to Primitives / Palette.
 *
 * Idempotent — reruns mutate the same nodes in place.
 */

import {
  findOrCreateCollection,
  findOrCreateVariable,
} from './figmaIdempotent'
import { INTENT_LIGHT_SPEC } from './intentLightSpec'
import type { BootstrapIntentLightResult } from '../shared/messages'

export type { BootstrapIntentLightResult }

export async function bootstrapIntentLight(): Promise<BootstrapIntentLightResult> {
  const allCollections =
    await figma.variables.getLocalVariableCollectionsAsync()
  const paletteCollection = allCollections.find(
    (c) => c.name === INTENT_LIGHT_SPEC.aliasCollection,
  )
  if (!paletteCollection) {
    throw new Error(
      `${INTENT_LIGHT_SPEC.aliasCollection} collection not found — bootstrap requires palette variables to alias into`,
    )
  }

  const allVars = await figma.variables.getLocalVariablesAsync()
  const paletteByName = new Map<string, Variable>()
  for (const v of allVars) {
    if (v.variableCollectionId === paletteCollection.id)
      paletteByName.set(v.name, v)
  }

  const collectionResult = await findOrCreateCollection(
    INTENT_LIGHT_SPEC.collection,
  )
  const intentCollection = collectionResult.value
  const modeId = intentCollection.defaultModeId

  const warnings: string[] = []
  let variablesCreated = 0
  let variablesUpdated = 0

  for (const variableSpec of INTENT_LIGHT_SPEC.variables) {
    const target = paletteByName.get(variableSpec.aliasTo)
    if (!target) {
      warnings.push(
        `Palette variable "${variableSpec.aliasTo}" missing — skipped intent variable "${variableSpec.name}"`,
      )
      continue
    }
    const varResult = await findOrCreateVariable(
      variableSpec.name,
      intentCollection,
      variableSpec.type,
    )
    varResult.value.setValueForMode(modeId, {
      type: 'VARIABLE_ALIAS',
      id: target.id,
    })
    if (varResult.created) variablesCreated++
    else variablesUpdated++
  }

  return {
    collection: collectionResult.created ? 'created' : 'updated',
    variablesCreated,
    variablesUpdated,
    warnings,
  }
}
