/**
 * Pure transform from Figma-shaped variable data to DTCG-shaped tokens.
 *
 * Inputs mirror what the sync plugin's sandbox extracts from the Figma
 * Plugin Variables API; outputs follow the Design Token Community Group
 * spec. This module is import-only — it does not read the filesystem or
 * the network. The HTTP server that persists the output lives alongside
 * it but is a separate module.
 */

export type FigmaCollection = {
  id: string
  name: string
  modes: { modeId: string; name: string }[]
  defaultModeId: string
}

export type FigmaResolvedType = 'BOOLEAN' | 'COLOR' | 'FLOAT' | 'STRING'

export type FigmaRgba = { r: number; g: number; b: number; a: number }

export type FigmaAlias = { type: 'VARIABLE_ALIAS'; id: string }

export type FigmaVariable = {
  id: string
  name: string
  resolvedType: FigmaResolvedType
  variableCollectionId: string
  valuesByMode: Record<string, unknown>
}

export type DtcgType = 'string' | 'number' | 'color' | 'boolean'

export type DtcgValue = string | number | boolean

export type DtcgToken = {
  $type: DtcgType
  $value: DtcgValue
}

export type DtcgGroup = { [key: string]: DtcgGroup | DtcgToken }

/** Resolves a Figma variable id to the DTCG path segments of its token. */
export type AliasResolver = (variableId: string) => string[]

/**
 * Builds a DTCG group from one Figma collection's variables.
 *
 * Variables whose `variableCollectionId` does not match are skipped, so
 * callers can pass the full variable list. Slash-separated names become
 * nested objects (`font-family/sans` → `{ "font-family": { sans: {…} } }`).
 * Values are read from the collection's `defaultModeId`; multi-mode
 * support is deferred until DTCG token sets land.
 *
 * Aliases (`{ type: 'VARIABLE_ALIAS', id }`) become DTCG reference
 * strings (`{group.sub.name}`). The default resolver looks the target
 * up within `variables` by id; cross-collection callers pass a custom
 * resolver that knows about other collections' DTCG path prefixes.
 */
export function collectionToDtcg(
  collection: FigmaCollection,
  variables: FigmaVariable[],
  resolveAlias: AliasResolver = defaultResolver(variables),
): DtcgGroup {
  const root: DtcgGroup = {}
  const modeId = collection.defaultModeId

  for (const variable of variables) {
    if (variable.variableCollectionId !== collection.id) continue
    const rawValue = variable.valuesByMode[modeId]
    const token = buildToken(variable.resolvedType, rawValue, resolveAlias)
    insertAt(root, variable.name.split('/'), token)
  }

  return root
}

function defaultResolver(variables: FigmaVariable[]): AliasResolver {
  return (id) => {
    const target = variables.find((v) => v.id === id)
    if (!target) {
      throw new Error(`Alias targets unknown variable: ${id}`)
    }
    return target.name.split('/')
  }
}

function buildToken(
  type: FigmaResolvedType,
  value: unknown,
  resolveAlias: AliasResolver,
): DtcgToken {
  const $type = dtcgTypeOf(type)
  const $value = isAlias(value)
    ? `{${resolveAlias(value.id).join('.')}}`
    : dtcgValueOf(type, value)
  return { $type, $value }
}

function isAlias(v: unknown): v is FigmaAlias {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as { type?: unknown }).type === 'VARIABLE_ALIAS'
  )
}

function dtcgTypeOf(type: FigmaResolvedType): DtcgType {
  switch (type) {
    case 'STRING':
      return 'string'
    case 'FLOAT':
      return 'number'
    case 'BOOLEAN':
      return 'boolean'
    case 'COLOR':
      return 'color'
  }
}

function dtcgValueOf(type: FigmaResolvedType, value: unknown): DtcgValue {
  switch (type) {
    case 'STRING':
      return value as string
    case 'FLOAT':
      return value as number
    case 'BOOLEAN':
      return value as boolean
    case 'COLOR':
      return rgbaToHex(value as FigmaRgba)
  }
}

function rgbaToHex({ r, g, b, a }: FigmaRgba): string {
  const rr = channel(r)
  const gg = channel(g)
  const bb = channel(b)
  if (a >= 1) return `#${rr}${gg}${bb}`
  return `#${rr}${gg}${bb}${channel(a)}`
}

function channel(c: number): string {
  return Math.round(c * 255)
    .toString(16)
    .padStart(2, '0')
}

function insertAt(root: DtcgGroup, path: string[], token: DtcgToken): void {
  let cursor: DtcgGroup = root
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    const next = cursor[key]
    if (next === undefined) {
      const child: DtcgGroup = {}
      cursor[key] = child
      cursor = child
    } else {
      cursor = next as DtcgGroup
    }
  }
  cursor[path[path.length - 1]] = token
}
