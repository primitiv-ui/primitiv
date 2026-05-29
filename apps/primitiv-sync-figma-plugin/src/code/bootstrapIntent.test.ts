import { bootstrapIntent } from './bootstrapIntent'
import { INTENT_SPEC } from './intentSpec'
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
    modes: [{ modeId: 'pal:0', name: 'Light' }],
    defaultModeId: 'pal:0',
    variableIds: [],
  } as unknown as VariableCollection
  const targets = new Set(INTENT_SPEC.variables.map((v) => v.aliasTo))
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

function buildIntentCollection(name: string, modes: { modeId: string; name: string }[]) {
  return {
    id: 'INT',
    name,
    modes,
    defaultModeId: modes[0].modeId,
    variableIds: [],
    renameMode: vi.fn((modeId: string, newName: string) => {
      const m = modes.find((m) => m.modeId === modeId)
      if (m) m.name = newName
    }),
    addMode: vi.fn((modeName: string) => {
      const modeId = `mode-${modes.length}`
      modes.push({ modeId, name: modeName })
      return modeId
    }),
  } as unknown as VariableCollection
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

describe('bootstrapIntent', () => {
  it('bails when Primitives / Palette collection does not exist', async () => {
    stubFigma()
    await expect(bootstrapIntent()).rejects.toThrow(/Primitives \/ Palette/i)
  })

  it('creates a new Intent collection when none exists', async () => {
    const { collection, vars } = buildPaletteCollection()
    const figmaMock = stubFigma({ collections: [collection], variables: vars })

    await bootstrapIntent()

    expect(figmaMock.variables.createVariableCollection).toHaveBeenCalledWith('Intent')
  })

  it('renames an existing Intent / Light collection to Intent', async () => {
    const { collection, vars } = buildPaletteCollection()
    const modes = [{ modeId: 'il:0', name: 'Mode 1' }]
    const legacy = buildIntentCollection('Intent / Light', modes)
    const figmaMock = stubFigma({ collections: [collection, legacy], variables: vars })

    await bootstrapIntent()

    expect(figmaMock.variables.createVariableCollection).not.toHaveBeenCalled()
    expect(legacy.name).toBe('Intent')
  })

  it('reuses an existing Intent collection without renaming', async () => {
    const { collection, vars } = buildPaletteCollection()
    const modes = [{ modeId: 'il:0', name: 'Light' }, { modeId: 'il:1', name: 'Dark' }]
    const existing = buildIntentCollection('Intent', modes)
    const figmaMock = stubFigma({ collections: [collection, existing], variables: vars })

    await bootstrapIntent()

    expect(figmaMock.variables.createVariableCollection).not.toHaveBeenCalled()
    expect(existing.name).toBe('Intent')
  })

  it('adds a Dark mode when collection only has Light', async () => {
    const { collection, vars } = buildPaletteCollection()
    const modes = [{ modeId: 'il:0', name: 'Light' }]
    const existing = buildIntentCollection('Intent', modes)
    stubFigma({ collections: [collection, existing], variables: vars })

    await bootstrapIntent()

    expect(existing.addMode).toHaveBeenCalledWith('Dark')
  })

  it('sets alias values for both Light and Dark modes on each variable', async () => {
    const { collection, vars } = buildPaletteCollection()
    const figmaMock = stubFigma({ collections: [collection], variables: vars })

    await bootstrapIntent()

    const spec = INTENT_SPEC.variables.find((v) => v.name === 'action/primary/default')!
    const target = vars.find((v) => v.name === spec.aliasTo)!
    const createdVar = figmaMock.variables.createVariable.mock.results
      .map((r) => r.value)
      .find((v: { name: string }) => v.name === 'action/primary/default')!

    // Called twice — once for Light, once for Dark
    expect(createdVar.setValueForMode).toHaveBeenCalledTimes(2)
    expect(createdVar.setValueForMode).toHaveBeenCalledWith(
      expect.any(String),
      { type: 'VARIABLE_ALIAS', id: target.id },
    )
  })

  it('updates existing intent variables in place on a rerun', async () => {
    const { collection, vars } = buildPaletteCollection()
    const modes = [{ modeId: 'il:0', name: 'Light' }, { modeId: 'il:1', name: 'Dark' }]
    const existingCollection = buildIntentCollection('Intent', modes)
    const setValueForMode = vi.fn()
    const existingVars = INTENT_SPEC.variables
      .filter((v) => vars.some((pv) => pv.name === v.aliasTo))
      .map((v) => ({
        id: `INT-${v.name}`,
        name: v.name,
        resolvedType: 'COLOR' as const,
        variableCollectionId: 'INT',
        valuesByMode: {},
        setValueForMode,
      }))

    const figmaMock = stubFigma({
      collections: [collection, existingCollection],
      variables: [...vars, ...(existingVars as unknown as PaletteVar[])],
    })

    const result = await bootstrapIntent()

    expect(figmaMock.variables.createVariable).not.toHaveBeenCalled()
    expect(result.variablesCreated).toBe(0)
    expect(result.variablesUpdated).toBeGreaterThan(0)
  })

  it('skips variables whose alias target is missing and reports them in warnings', async () => {
    const firstTarget = INTENT_SPEC.variables[0].aliasTo
    const { collection, vars } = buildPaletteCollection([firstTarget])
    const figmaMock = stubFigma({ collections: [collection], variables: vars })

    const result = await bootstrapIntent()

    const createdNames = figmaMock.variables.createVariable.mock.calls.map(
      (call) => call[0],
    )
    const skipped = INTENT_SPEC.variables
      .filter((v) => v.aliasTo === firstTarget)
      .map((v) => v.name)
    for (const name of skipped) {
      expect(createdNames).not.toContain(name)
    }
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})
