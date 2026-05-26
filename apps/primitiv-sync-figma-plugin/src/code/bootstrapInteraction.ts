/**
 * Tier-2 *Bootstrap interaction* action per RFC 0001 §8 / §15.10.
 *
 * Creates (or reuses) the `Interaction` variable collection and populates
 * the five state/focus variables from `INTERACTION_SPEC`. Each variable
 * is a FLOAT alias into Primitives; missing primitive targets land in
 * `warnings` and the variable is skipped (the §15.6 "errors loudly and
 * bails" rule applies to the Primitives precondition only).
 *
 * Idempotent per §15.6 — reruns mutate the same nodes in place.
 */

import {
  findOrCreateCollection,
  findOrCreateVariable,
} from './figmaIdempotent'
import { INTERACTION_SPEC } from './interactionSpec'
import type { BootstrapInteractionResult } from '../shared/messages'

export type { BootstrapInteractionResult }

export async function bootstrapInteraction(): Promise<BootstrapInteractionResult> {
  const allCollections =
    await figma.variables.getLocalVariableCollectionsAsync()
  const primitives = allCollections.find((c) => c.name === 'Primitives')
  if (!primitives) {
    throw new Error(
      'Primitives collection not found — bootstrap requires Primitives to alias into',
    )
  }

  const allVars = await figma.variables.getLocalVariablesAsync()
  const primitiveByName = new Map<string, Variable>()
  for (const v of allVars) {
    if (v.variableCollectionId === primitives.id) primitiveByName.set(v.name, v)
  }

  const collectionResult = await findOrCreateCollection('Interaction')
  const interactionCollection = collectionResult.value
  const modeId = interactionCollection.defaultModeId

  const warnings: string[] = []
  let variablesCreated = 0
  let variablesUpdated = 0

  for (const variableSpec of INTERACTION_SPEC.variables) {
    const target = primitiveByName.get(variableSpec.aliasTo)
    if (!target) {
      warnings.push(
        `Primitive "${variableSpec.aliasTo}" missing — skipped variable "${variableSpec.name}"`,
      )
      continue
    }
    const varResult = await findOrCreateVariable(
      variableSpec.name,
      interactionCollection,
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
