/**
 * Tier-2 *Bootstrap context* action per RFC 0001 §15.10.
 *
 * For the given context this creates (or reuses) the `Context / <Name>`
 * variable collection, populates it with every typography role +
 * `framed-control` anatomy variable from `contextSpec`, and authors a
 * bound text style per role × tier. Each variable is an alias into the
 * Primitives collection; missing primitive targets are collected as
 * warnings and the corresponding variables are skipped (the §15.6
 * "errors loudly and bails" rule applies to the Primitives precondition,
 * not to individual missing aliases, so the operator sees the full set
 * of gaps in one run).
 *
 * Idempotent per §15.6 — reruns mutate the same nodes in place.
 */

import {
  findOrCreateCollection,
  findOrCreateTextStyle,
  findOrCreateVariable,
} from './figmaIdempotent'
import { CONTEXT_SPECS, type TextStyleSpec } from './contextSpec'
import type { BootstrapResult, ContextName } from '../shared/messages'

export type { BootstrapResult }

const CONTEXT_LABEL: Record<ContextName, string> = {
  comfortable: 'Comfortable',
}

export async function bootstrapContext(options: {
  context: ContextName
}): Promise<BootstrapResult> {
  const { context } = options
  const spec = CONTEXT_SPECS[context]
  const contextLabel = CONTEXT_LABEL[context]

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

  const collectionResult = await findOrCreateCollection(
    `Context / ${contextLabel}`,
  )
  const contextCollection = collectionResult.value
  const modeId = contextCollection.defaultModeId

  const warnings: string[] = []
  const createdByName = new Map<string, Variable>()
  let variablesCreated = 0
  let variablesUpdated = 0

  for (const variableSpec of spec.variables) {
    const target = primitiveByName.get(variableSpec.aliasTo)
    if (!target) {
      warnings.push(
        `Primitive "${variableSpec.aliasTo}" missing — skipped variable "${variableSpec.name}"`,
      )
      continue
    }
    const varResult = await findOrCreateVariable(
      variableSpec.name,
      contextCollection,
      variableSpec.type,
    )
    varResult.value.setValueForMode(modeId, {
      type: 'VARIABLE_ALIAS',
      id: target.id,
    })
    createdByName.set(variableSpec.name, varResult.value)
    if (varResult.created) variablesCreated++
    else variablesUpdated++
  }

  await loadFontsFor(spec.textStyles)

  let textStylesCreated = 0
  let textStylesUpdated = 0

  for (const styleSpec of spec.textStyles) {
    const styleResult = await findOrCreateTextStyle(styleSpec.name)
    const style = styleResult.value
    style.fontName = styleSpec.fontName
    style.fontSize = styleSpec.defaultFontSize
    style.lineHeight = {
      value: styleSpec.defaultLineHeight,
      unit: 'PIXELS',
    }

    bindIfPresent(style, 'fontFamily', createdByName.get(styleSpec.bindings.fontFamily))
    bindIfPresent(style, 'fontStyle', createdByName.get(styleSpec.bindings.fontStyle))
    bindIfPresent(style, 'fontSize', createdByName.get(styleSpec.bindings.fontSize))
    bindIfPresent(style, 'lineHeight', createdByName.get(styleSpec.bindings.lineHeight))

    if (styleResult.created) textStylesCreated++
    else textStylesUpdated++
  }

  return {
    context,
    collection: collectionResult.created ? 'created' : 'updated',
    variablesCreated,
    variablesUpdated,
    textStylesCreated,
    textStylesUpdated,
    warnings,
  }
}

async function loadFontsFor(styles: TextStyleSpec[]): Promise<void> {
  const seen = new Set<string>()
  const fonts: { family: string; style: string }[] = []
  for (const s of styles) {
    const key = `${s.fontName.family}::${s.fontName.style}`
    if (seen.has(key)) continue
    seen.add(key)
    fonts.push(s.fontName)
  }
  await Promise.all(fonts.map((f) => figma.loadFontAsync(f)))
}

function bindIfPresent(
  style: TextStyle,
  field: VariableBindableTextField,
  variable: Variable | undefined,
): void {
  if (variable) style.setBoundVariable(field, variable)
}
