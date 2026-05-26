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

/** The three DTCG files emitted per export. */
export type DtcgFiles = {
  primitives: DtcgGroup
  semantic: DtcgGroup
  components: DtcgGroup
}

/** Where a Figma collection lands in the DTCG output. */
type Routing = { file: keyof DtcgFiles; prefix: string[] }

/**
 * The v1 default context whose values back the short-form alias layer
 * (`semantic.typography.*`, `semantic.anatomy.*`). Changing this is the
 * one-line switch for the default — components keep referencing the
 * short-form names.
 */
const DEFAULT_CONTEXT = 'comfortable'

/** Typography roles per RFC 0001 §5.1. Routed under `semantic.typography.*`. */
const TYPOGRAPHY_ROLES = [
  'label',
  'body',
  'heading',
  'display',
  'overline',
  'mono',
]

/** Anatomy patterns per RFC 0001 §6.1. Routed under `semantic.anatomy.*`. */
const ANATOMY_PATTERNS = [
  'framed-control',
  'label-control',
  'nav-item',
  'container',
]

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

/**
 * Builds the three DTCG output groups from a whole Figma export.
 *
 * Each collection is routed to one of `primitives` / `semantic` /
 * `components` with an optional path prefix. `Context / <name>` collections
 * fold into `semantic.context.<name>`, and the short-form alias layer
 * (`semantic.typography.*`, `semantic.anatomy.*`) is synthesised at the
 * end of the transform from the default context.
 *
 * A master alias resolver knows the full DTCG path of every variable in
 * the payload (prefix + name), so cross-collection aliases produce the
 * correct reference string even when the source and target live in
 * different output files.
 */
export function figmaVarsToDtcg(
  collections: FigmaCollection[],
  variables: FigmaVariable[],
): DtcgFiles {
  const files: DtcgFiles = { primitives: {}, semantic: {}, components: {} }
  const routes = new Map<string, Routing>(
    collections.map((c) => [c.id, routeCollection(c.name)]),
  )

  const variablePaths = new Map<string, string[]>()
  for (const variable of variables) {
    const routing = routes.get(variable.variableCollectionId)
    if (!routing) continue
    variablePaths.set(variable.id, [
      ...routing.prefix,
      ...variable.name.split('/'),
    ])
  }

  const resolveAlias: AliasResolver = (id) => {
    const path = variablePaths.get(id)
    if (!path) {
      throw new Error(`Alias targets unknown variable: ${id}`)
    }
    return path
  }

  for (const collection of collections) {
    const routing = routes.get(collection.id)!
    const group = collectionToDtcg(collection, variables, resolveAlias)
    mergeIntoPrefix(files[routing.file], routing.prefix, group)
  }

  synthesiseShortFormAliases(files.semantic)

  return files
}

/**
 * Emits `semantic.typography.*` and `semantic.anatomy.*` as DTCG aliases
 * pointing at the default context's typography roles and anatomy patterns.
 * Components consume the short forms so they stay context-agnostic;
 * switching the default is changing {@link DEFAULT_CONTEXT}.
 */
function synthesiseShortFormAliases(semantic: DtcgGroup): void {
  const contextRoot = semantic.context as DtcgGroup | undefined
  if (!contextRoot) return
  const defaultCtx = contextRoot[DEFAULT_CONTEXT] as DtcgGroup | undefined
  if (!defaultCtx) return

  for (const [key, value] of Object.entries(defaultCtx)) {
    if (TYPOGRAPHY_ROLES.includes(key)) {
      const typography = ensureGroup(semantic, 'typography')
      typography[key] = aliasGroup(value as DtcgGroup, [
        'context',
        DEFAULT_CONTEXT,
        key,
      ])
    } else if (ANATOMY_PATTERNS.includes(key)) {
      const anatomy = ensureGroup(semantic, 'anatomy')
      anatomy[key] = aliasGroup(value as DtcgGroup, [
        'context',
        DEFAULT_CONTEXT,
        key,
      ])
    }
  }
}

function ensureGroup(parent: DtcgGroup, key: string): DtcgGroup {
  let existing = parent[key] as DtcgGroup | undefined
  if (!existing) {
    existing = {}
    parent[key] = existing
  }
  return existing
}

function aliasGroup(source: DtcgGroup, sourcePath: string[]): DtcgGroup {
  const result: DtcgGroup = {}
  for (const [key, value] of Object.entries(source)) {
    if (isDtcgToken(value)) {
      result[key] = {
        $type: value.$type,
        $value: `{${[...sourcePath, key].join('.')}}`,
      }
    } else {
      result[key] = aliasGroup(value as DtcgGroup, [...sourcePath, key])
    }
  }
  return result
}

function isDtcgToken(value: unknown): value is DtcgToken {
  return (
    typeof value === 'object' &&
    value !== null &&
    '$type' in value &&
    '$value' in value
  )
}

function routeCollection(name: string): Routing {
  if (name === 'Primitives') return { file: 'primitives', prefix: [] }
  if (name === 'Semantic') return { file: 'semantic', prefix: [] }
  if (name === 'Components') return { file: 'components', prefix: [] }
  const ctx = name.match(/^Context\s*\/\s*(.+)$/)
  if (ctx) {
    return { file: 'semantic', prefix: ['context', ctx[1].toLowerCase()] }
  }
  throw new Error(`Unrecognised collection name: ${name}`)
}

function mergeIntoPrefix(
  target: DtcgGroup,
  prefix: string[],
  source: DtcgGroup,
): void {
  let cursor = target
  for (const key of prefix) {
    if (cursor[key] === undefined) cursor[key] = {}
    cursor = cursor[key] as DtcgGroup
  }
  Object.assign(cursor, source)
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
