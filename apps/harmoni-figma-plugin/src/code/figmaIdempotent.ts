/** Result returned by every find-or-create call. */
export type FindOrCreateResult<T> = { value: T; created: boolean }

export async function findOrCreateCollection(
  name: string,
): Promise<FindOrCreateResult<VariableCollection>> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync()
  const existing = collections.find((c) => c.name === name)
  if (existing) return { value: existing, created: false }
  return { value: figma.variables.createVariableCollection(name), created: true }
}

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
