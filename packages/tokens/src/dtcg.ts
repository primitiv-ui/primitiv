/**
 * Pure transform from Figma-shaped variable data to DTCG-shaped tokens.
 *
 * Inputs mirror what the sync plugin's sandbox extracts from the Figma
 * Plugin Variables API; outputs follow the Design Token Community Group
 * spec. This module is import-only — it does not read the filesystem or
 * the network. The HTTP server that persists the output lives alongside
 * it but is a separate module.
 */

/** A Figma variable collection as surfaced by the Plugin Variables API — its modes and default mode. */
export type FigmaCollection = {
  id: string
  name: string
  modes: { modeId: string; name: string }[]
  defaultModeId: string
}

/** The resolved primitive type of a Figma variable. */
export type FigmaResolvedType = 'BOOLEAN' | 'COLOR' | 'FLOAT' | 'STRING'

/** An RGBA colour as Figma reports it — each channel in the 0–1 range. */
export type FigmaRgba = { r: number; g: number; b: number; a: number }

/** A Figma variable alias — a reference to another variable by id. */
export type FigmaAlias = { type: 'VARIABLE_ALIAS'; id: string }

/** A single Figma variable with its per-mode values. */
export type FigmaVariable = {
  id: string
  name: string
  resolvedType: FigmaResolvedType
  variableCollectionId: string
  valuesByMode: Record<string, unknown>
}

/** A DTCG token `$type`. */
export type DtcgType = 'string' | 'number' | 'color' | 'boolean'

/** A resolved DTCG token `$value`. */
export type DtcgValue = string | number | boolean

/** A DTCG token — a `$type` / `$value` pair. */
export type DtcgToken = {
  $type: DtcgType
  $value: DtcgValue
}

/** A DTCG group — a tree of nested groups and tokens. */
export type DtcgGroup = { [key: string]: DtcgGroup | DtcgToken }

/** One DTCG file per Figma collection. */
export type DtcgFiles = {
  primitives: DtcgGroup
  palette: DtcgGroup
  foreground: DtcgGroup
  intent: DtcgGroup
  context: DtcgGroup
  interaction: DtcgGroup
}

/** Where a single-mode Figma collection lands in the DTCG output. */
type Routing = { file: keyof DtcgFiles; prefix: string[] }

/** Resolves a Figma variable id to the DTCG path segments of its token. */
export type AliasResolver = (variableId: string) => string[]

/**
 * Builds a DTCG group from one Figma collection's variables.
 *
 * Variables whose `variableCollectionId` does not match are skipped, so
 * callers can pass the full variable list. Slash-separated names become
 * nested objects (`font-family/heading` → `{ "font-family": { heading: {…} } }`).
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
  modeId: string = collection.defaultModeId,
  exclude: ReadonlySet<string> = new Set(),
): DtcgGroup {
  const root: DtcgGroup = {}

  for (const variable of variables) {
    if (variable.variableCollectionId !== collection.id) continue
    if (exclude.has(variable.name)) continue
    const rawValue = variable.valuesByMode[modeId]
    const token = buildToken(variable.resolvedType, rawValue, resolveAlias)
    insertAt(root, variable.name.split('/'), token)
  }

  return root
}

/**
 * Builds one DTCG output group per Figma collection.
 *
 * Single-mode collections (`Primitives`, `Interaction`) route directly to
 * their own file. Multi-mode collections (`Primitives / Palette`, `Intent`,
 * `Context`) are iterated per-mode, with the lowercase mode name as the
 * top-level key in their file.
 *
 * Alias resolution uses each variable's natural name path so cross-collection
 * references produce stable DTCG reference strings regardless of which file
 * the variable lives in.
 */
export function figmaVarsToDtcg(
  collections: FigmaCollection[],
  variables: FigmaVariable[],
): DtcgFiles {
  const files: DtcgFiles = {
    primitives: {},
    palette: {},
    foreground: {},
    intent: {},
    context: {},
    interaction: {},
  }

  const palette     = collections.find((c) => c.name === 'Primitives / Palette')
  const foreground  = collections.find((c) => c.name === 'Primitives / Foreground')
  const intent      = collections.find((c) => c.name === 'Intent')
  const context     = collections.find((c) => c.name === 'Context')
  const singleMode  = collections.filter((c) => c.name in SINGLE_MODE_FILES)

  const routes = new Map<string, Routing>(
    singleMode.map((c) => [
      c.id,
      { file: SINGLE_MODE_FILES[c.name], prefix: [] },
    ]),
  )

  // All variables are addressable by their natural name path — no collection prefix.
  // Variable names are unique across the system, so cross-collection alias references
  // resolve correctly without knowing which file a variable lives in.
  const variablePaths = new Map<string, string[]>()
  for (const variable of variables) {
    variablePaths.set(variable.id, variable.name.split('/'))
  }

  const resolveAlias: AliasResolver = (id) => {
    const path = variablePaths.get(id)
    if (!path) throw new Error(`Alias targets unknown variable: ${id}`)
    return path
  }

  // Single-mode collections
  for (const col of singleMode) {
    const routing = routes.get(col.id)!
    const group = collectionToDtcg(col, variables, resolveAlias)
    mergeIntoPrefix(files[routing.file], routing.prefix, group)
  }

  // color/absolute-white and color/absolute-black are design-system constants
  // that Harmoni never writes — exclude them from the palette backup.
  const PALETTE_CONSTANTS: ReadonlySet<string> = new Set([
    'color/absolute-white',
    'color/absolute-black',
  ])

  // Primitives / Palette — per mode, lowercase mode name as top-level key
  if (palette) {
    for (const mode of palette.modes) {
      const group = collectionToDtcg(palette, variables, resolveAlias, mode.modeId, PALETTE_CONSTANTS)
      mergeIntoPrefix(files.palette, [mode.name.toLowerCase()], group)
    }
  }

  // Primitives / Foreground — per mode; a thin alias layer over the palette
  // carrying each ramp step's contrast-chosen foreground (RFC 0003).
  if (foreground) {
    for (const mode of foreground.modes) {
      const group = collectionToDtcg(foreground, variables, resolveAlias, mode.modeId)
      mergeIntoPrefix(files.foreground, [mode.name.toLowerCase()], group)
    }
  }

  // Intent — per mode, lowercase mode name as top-level key
  if (intent) {
    for (const mode of intent.modes) {
      const group = collectionToDtcg(intent, variables, resolveAlias, mode.modeId)
      mergeIntoPrefix(files.intent, [mode.name.toLowerCase()], group)
    }
  }

  // Context — per mode, lowercase mode name as top-level key
  if (context) {
    for (const mode of context.modes) {
      const group = collectionToDtcg(context, variables, resolveAlias, mode.modeId)
      mergeIntoPrefix(files.context, [mode.name.toLowerCase()], group)
    }
  }

  return files
}

/**
 * Single-mode collection names mapped to their output file. The keys are the
 * single source of truth for both the `singleMode` filter and the routing
 * lookup, so the two can never drift apart.
 */
const SINGLE_MODE_FILES: Record<string, keyof DtcgFiles> = {
  Primitives: 'primitives',
  Interaction: 'interaction',
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
