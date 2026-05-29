/**
 * Idempotent find-or-create helpers for Figma variable collections,
 * variables, and text styles. Every write-side bootstrap operation
 * goes through these so that reruns mutate in place rather than
 * duplicate — see RFC 0001 §15.6 ("Find or create, mutate in place").
 */

/** Result returned by every find-or-create call. */
export type FindOrCreateResult<T> = { value: T; created: boolean }

/**
 * Returns the mode with the given name in `collection`, or creates it.
 *
 * When the collection has exactly one mode still named Figma's initial
 * default ("Mode 1"), that mode is renamed rather than leaving an
 * unused orphan. Otherwise a new mode is added via `addMode`.
 */
export function findOrCreateMode(
  collection: VariableCollection,
  modeName: string,
): FindOrCreateResult<{ modeId: string; name: string }> {
  const existing = collection.modes.find((m) => m.name === modeName)
  if (existing) return { value: existing, created: false }

  if (collection.modes.length === 1 && collection.modes[0].name === 'Mode 1') {
    const { modeId } = collection.modes[0]
    collection.renameMode(modeId, modeName)
    return { value: { modeId, name: modeName }, created: true }
  }

  const modeId = collection.addMode(modeName)
  return { value: { modeId, name: modeName }, created: true }
}

/**
 * Returns the local variable collection with the given name, or
 * creates a new one when nothing matches.
 */
export async function findOrCreateCollection(
  name: string,
): Promise<FindOrCreateResult<VariableCollection>> {
  const collections =
    await figma.variables.getLocalVariableCollectionsAsync()
  const existing = collections.find((c) => c.name === name)
  if (existing) return { value: existing, created: false }
  return { value: figma.variables.createVariableCollection(name), created: true }
}

/**
 * Returns the local variable with the given name inside the given
 * collection, or creates a new one when nothing matches. Throws when
 * an existing variable has a different `resolvedType` — name clashes
 * across types are operator errors, not silent fixes.
 */
export async function findOrCreateVariable(
  name: string,
  collection: VariableCollection,
  type: VariableResolvedDataType,
): Promise<FindOrCreateResult<Variable>> {
  const all = await figma.variables.getLocalVariablesAsync()
  const existing = all.find(
    (v) => v.variableCollectionId === collection.id && v.name === name,
  )
  if (existing) {
    if (existing.resolvedType !== type) {
      throw new Error(
        `Variable "${name}" in collection "${collection.name}" has type ${existing.resolvedType}, not ${type}`,
      )
    }
    return { value: existing, created: false }
  }
  return {
    value: figma.variables.createVariable(name, collection, type),
    created: true,
  }
}

/**
 * Returns the local text style with the given name, or creates a new
 * one when nothing matches. The created style has its `name` assigned
 * before being returned; the caller is responsible for everything
 * else (font, size, bindings).
 */
export async function findOrCreateTextStyle(
  name: string,
): Promise<FindOrCreateResult<TextStyle>> {
  const styles = await figma.getLocalTextStylesAsync()
  const existing = styles.find((s) => s.name === name)
  if (existing) return { value: existing, created: false }
  const created = figma.createTextStyle()
  created.name = name
  return { value: created, created: true }
}
