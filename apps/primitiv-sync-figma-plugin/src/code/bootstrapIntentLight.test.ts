import { bootstrapIntentLight } from './bootstrapIntentLight'
import { INTENT_LIGHT_SPEC } from './intentLightSpec'
import { createFigmaMock, type FigmaMock } from './figma.mock'

type PaletteVar = {
  id: string
  name: string
  resolvedType: 'COLOR'
  variableCollectionId: string
  valuesByMode: Record<string, unknown>
}

function buildPaletteCollection(
  drop: string[] = [],
): { collection: VariableCollection; vars: PaletteVar[] } {
  const collection = {
    id: 'PAL',
    name: 'Primitives / Palette',
    modes: [{ modeId: 'pal:0', name: 'Value' }],
    defaultModeId: 'pal:0',
    variableIds: [],
  } as unknown as VariableCollection
  const targets = new Set(INTENT_LIGHT_SPEC.variables.map((v) => v.aliasTo))
  const vars: PaletteVar[] = [...targets]
    .filter((path) => !drop.includes(path))
    .map((path) => ({
      id: `PAL-${path}`,
      name: path,
      resolvedType: 'COLOR',
      variableCollectionId: 'PAL',
      valuesByMode: {},
    }))
  return { collection, vars }
}

function stubFigma(opts: {
  collections?: VariableCollection[]
  variables?: PaletteVar[]
} = {}): FigmaMock {
  const mock = createFigmaMock()
  mock.variables.getLocalVariableCollectionsAsync.mockResolvedValue(
    opts.collections ?? [],
  )
  mock.variables.getLocalVariablesAsync.mockResolvedValue(opts.variables ?? [])
  vi.stubGlobal('figma', mock)
  return mock
}

describe('bootstrapIntentLight', () => {
  it('bails when the Primitives / Palette collection does not exist', async () => {
    stubFigma()

    await expect(bootstrapIntentLight()).rejects.toThrow(/Primitives \/ Palette/i)
  })

  it('creates the Intent / Light collection when none exists', async () => {
    const { collection, vars } = buildPaletteCollection()
    const figmaMock = stubFigma({ collections: [collection], variables: vars })

    await bootstrapIntentLight()

    expect(figmaMock.variables.createVariableCollection).toHaveBeenCalledWith(
      'Intent / Light',
    )
  })

  it('reuses the Intent / Light collection when one already exists', async () => {
    const { collection, vars } = buildPaletteCollection()
    const existing = {
      id: 'INT-L',
      name: 'Intent / Light',
      modes: [{ modeId: 'il:0', name: 'Mode 1' }],
      defaultModeId: 'il:0',
      variableIds: [],
    } as unknown as VariableCollection
    const figmaMock = stubFigma({
      collections: [collection, existing],
      variables: vars,
    })

    const result = await bootstrapIntentLight()

    expect(figmaMock.variables.createVariableCollection).not.toHaveBeenCalled()
    expect(result.collection).toBe('updated')
  })

  it('creates one variable per spec leaf and aliases it to the matching palette variable', async () => {
    const { collection, vars } = buildPaletteCollection()
    const figmaMock = stubFigma({ collections: [collection], variables: vars })

    await bootstrapIntentLight()

    const primaryDefault = INTENT_LIGHT_SPEC.variables.find(
      (v) => v.name === 'action/primary/default',
    )!
    const target = vars.find((v) => v.name === primaryDefault.aliasTo)!
    const createdVar = figmaMock.variables.createVariable.mock.results
      .map((r) => r.value)
      .find((v: { name: string }) => v.name === 'action/primary/default')!
    expect(createdVar.setValueForMode).toHaveBeenCalledWith(
      expect.any(String),
      { type: 'VARIABLE_ALIAS', id: target.id },
    )
  })

  it('updates existing intent variables in place on a rerun', async () => {
    const { collection, vars } = buildPaletteCollection()
    const existingCollection = {
      id: 'INT-L',
      name: 'Intent / Light',
      modes: [{ modeId: 'il:0', name: 'Mode 1' }],
      defaultModeId: 'il:0',
      variableIds: [],
    } as unknown as VariableCollection
    const setValueForMode = vi.fn()
    const existingVars = INTENT_LIGHT_SPEC.variables
      .filter((v) => vars.some((pv) => pv.name === v.aliasTo))
      .map((v) => ({
        id: `INT-L-${v.name}`,
        name: v.name,
        resolvedType: 'COLOR' as const,
        variableCollectionId: 'INT-L',
        valuesByMode: {},
        setValueForMode,
      }))

    const figmaMock = stubFigma({
      collections: [collection, existingCollection],
      variables: [...vars, ...(existingVars as unknown as PaletteVar[])],
    })

    const result = await bootstrapIntentLight()

    expect(figmaMock.variables.createVariable).not.toHaveBeenCalled()
    expect(result.variablesCreated).toBe(0)
    expect(result.variablesUpdated).toBeGreaterThan(0)
  })

  it('skips variables whose alias target is missing and reports them in warnings', async () => {
    const firstTarget = INTENT_LIGHT_SPEC.variables[0].aliasTo
    const { collection, vars } = buildPaletteCollection([firstTarget])
    const figmaMock = stubFigma({ collections: [collection], variables: vars })

    const result = await bootstrapIntentLight()

    const createdNames = figmaMock.variables.createVariable.mock.calls.map(
      (call) => call[0],
    )
    const skipped = INTENT_LIGHT_SPEC.variables
      .filter((v) => v.aliasTo === firstTarget)
      .map((v) => v.name)
    for (const name of skipped) {
      expect(createdNames).not.toContain(name)
    }
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})
