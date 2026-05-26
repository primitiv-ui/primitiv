import { bootstrapInteraction } from './bootstrapInteraction'
import { INTERACTION_SPEC } from './interactionSpec'
import { createFigmaMock, type FigmaMock } from './figma.mock'

type PrimVar = {
  id: string
  name: string
  resolvedType: 'FLOAT'
  variableCollectionId: string
  valuesByMode: Record<string, unknown>
}

function buildPrimitives(
  drop: string[] = [],
): { collection: VariableCollection; vars: PrimVar[] } {
  const collection = {
    id: 'PRIM',
    name: 'Primitives',
    modes: [{ modeId: 'p:0', name: 'Value' }],
    defaultModeId: 'p:0',
    variableIds: [],
  } as unknown as VariableCollection
  const targets = new Set(INTERACTION_SPEC.variables.map((v) => v.aliasTo))
  const vars: PrimVar[] = [...targets]
    .filter((path) => !drop.includes(path))
    .map((path) => ({
      id: `PRIM-${path}`,
      name: path,
      resolvedType: 'FLOAT',
      variableCollectionId: 'PRIM',
      valuesByMode: {},
    }))
  return { collection, vars }
}

function stubFigma(opts: {
  collections?: VariableCollection[]
  variables?: PrimVar[]
} = {}): FigmaMock {
  const mock = createFigmaMock()
  mock.variables.getLocalVariableCollectionsAsync.mockResolvedValue(
    opts.collections ?? [],
  )
  mock.variables.getLocalVariablesAsync.mockResolvedValue(opts.variables ?? [])
  vi.stubGlobal('figma', mock)
  return mock
}

describe('bootstrapInteraction', () => {
  it('bails when the Primitives collection does not exist', async () => {
    stubFigma()

    await expect(bootstrapInteraction()).rejects.toThrow(/Primitives/i)
  })

  it('creates the Interaction collection when none exists', async () => {
    const { collection, vars } = buildPrimitives()
    const figmaMock = stubFigma({ collections: [collection], variables: vars })

    await bootstrapInteraction()

    expect(figmaMock.variables.createVariableCollection).toHaveBeenCalledWith(
      'Interaction',
    )
  })

  it('reuses the Interaction collection when one already exists', async () => {
    const { collection, vars } = buildPrimitives()
    const existing = {
      id: 'INT',
      name: 'Interaction',
      modes: [{ modeId: 'i:0', name: 'Mode 1' }],
      defaultModeId: 'i:0',
      variableIds: [],
    } as unknown as VariableCollection
    const figmaMock = stubFigma({
      collections: [collection, existing],
      variables: vars,
    })

    const result = await bootstrapInteraction()

    expect(figmaMock.variables.createVariableCollection).not.toHaveBeenCalled()
    expect(result.collection).toBe('updated')
  })

  it('creates one variable per spec leaf and aliases it to the matching primitive', async () => {
    const { collection, vars } = buildPrimitives()
    const figmaMock = stubFigma({ collections: [collection], variables: vars })

    await bootstrapInteraction()

    expect(figmaMock.variables.createVariable).toHaveBeenCalledTimes(
      INTERACTION_SPEC.variables.length,
    )
    const hover = INTERACTION_SPEC.variables.find(
      (v) => v.name === 'hover/opacity',
    )!
    const target = vars.find((v) => v.name === hover.aliasTo)!
    const newHover = figmaMock.variables.createVariable.mock.results
      .map((r) => r.value)
      .find((v: { name: string }) => v.name === 'hover/opacity')!
    expect(newHover.setValueForMode).toHaveBeenCalledWith(
      expect.any(String),
      { type: 'VARIABLE_ALIAS', id: target.id },
    )
  })

  it('updates existing interaction variables in place on a rerun', async () => {
    const { collection, vars } = buildPrimitives()
    const existingCollection = {
      id: 'INT',
      name: 'Interaction',
      modes: [{ modeId: 'i:0', name: 'Mode 1' }],
      defaultModeId: 'i:0',
      variableIds: [],
    } as unknown as VariableCollection
    const setValueForMode = vi.fn()
    const existingVars = INTERACTION_SPEC.variables.map((v) => ({
      id: `INT-${v.name}`,
      name: v.name,
      resolvedType: 'FLOAT' as const,
      variableCollectionId: 'INT',
      valuesByMode: {},
      setValueForMode,
    }))

    const figmaMock = stubFigma({
      collections: [collection, existingCollection],
      variables: [...vars, ...(existingVars as unknown as PrimVar[])],
    })

    const result = await bootstrapInteraction()

    expect(figmaMock.variables.createVariable).not.toHaveBeenCalled()
    expect(result.variablesCreated).toBe(0)
    expect(result.variablesUpdated).toBe(INTERACTION_SPEC.variables.length)
  })

  it('skips variables whose alias target is missing and reports them in warnings', async () => {
    const { collection, vars } = buildPrimitives(['opacity/90'])
    const figmaMock = stubFigma({ collections: [collection], variables: vars })

    const result = await bootstrapInteraction()

    const created = figmaMock.variables.createVariable.mock.calls.map(
      (call) => call[0],
    )
    expect(created).not.toContain('hover/opacity')
    expect(result.warnings).toEqual([
      expect.stringMatching(/opacity\/90.*hover\/opacity/),
    ])
  })
})
