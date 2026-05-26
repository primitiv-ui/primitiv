import { bootstrapContext } from './bootstrapContext'
import { CONTEXT_SPECS } from './contextSpec'
import { createFigmaMock, type FigmaMock } from './figma.mock'

type PrimVar = {
  id: string
  name: string
  resolvedType: 'FLOAT' | 'STRING'
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
  const targets = new Set(
    CONTEXT_SPECS.comfortable.variables.map((v) => v.aliasTo),
  )
  const vars: PrimVar[] = [...targets]
    .filter((path) => !drop.includes(path))
    .map((path) => ({
      id: `PRIM-${path}`,
      name: path,
      resolvedType: path.startsWith('font-family/') ? 'STRING' : 'FLOAT',
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

describe('bootstrapContext (comfortable)', () => {
  it('bails when the Primitives collection does not exist', async () => {
    stubFigma()

    await expect(bootstrapContext({ context: 'comfortable' })).rejects.toThrow(
      /Primitives/i,
    )
  })

  it('creates the Context / Comfortable collection when none exists', async () => {
    const { collection, vars } = buildPrimitives()
    const figmaMock = stubFigma({ collections: [collection], variables: vars })

    await bootstrapContext({ context: 'comfortable' })

    expect(
      figmaMock.variables.createVariableCollection,
    ).toHaveBeenCalledWith('Context / Comfortable')
  })

  it('reuses the Context / Comfortable collection when one already exists', async () => {
    const { collection, vars } = buildPrimitives()
    const existing = {
      id: 'CTX',
      name: 'Context / Comfortable',
      modes: [{ modeId: 'c:0', name: 'Mode 1' }],
      defaultModeId: 'c:0',
      variableIds: [],
    } as unknown as VariableCollection
    const figmaMock = stubFigma({
      collections: [collection, existing],
      variables: vars,
    })

    const result = await bootstrapContext({ context: 'comfortable' })

    expect(
      figmaMock.variables.createVariableCollection,
    ).not.toHaveBeenCalled()
    expect(result.collection).toBe('updated')
  })

  it('creates one variable per spec leaf and points it at the matching primitive via VARIABLE_ALIAS', async () => {
    const { collection, vars } = buildPrimitives()
    const figmaMock = stubFigma({ collections: [collection], variables: vars })

    await bootstrapContext({ context: 'comfortable' })

    const specVars = CONTEXT_SPECS.comfortable.variables
    expect(figmaMock.variables.createVariable).toHaveBeenCalledTimes(
      specVars.length,
    )
    const fontSizeMd = specVars.find((v) => v.name === 'label/md/font-size')!
    const target = vars.find((v) => v.name === fontSizeMd.aliasTo)!
    const newSizeVar = figmaMock.variables.createVariable.mock.results
      .map((r) => r.value)
      .find((v: { name: string }) => v.name === 'label/md/font-size')!
    expect(newSizeVar.setValueForMode).toHaveBeenCalledWith(
      expect.any(String),
      { type: 'VARIABLE_ALIAS', id: target.id },
    )
  })

  it('skips variables whose alias target is missing and reports them in warnings', async () => {
    const { collection, vars } = buildPrimitives(['font-size/12'])
    const figmaMock = stubFigma({ collections: [collection], variables: vars })

    const result = await bootstrapContext({ context: 'comfortable' })

    const created = figmaMock.variables.createVariable.mock.calls.map(
      (c: unknown[]) => c[0],
    )
    expect(created).not.toContain('label/xs/font-size')
    expect(created).not.toContain('body/xs/font-size')
    expect(
      result.warnings.some((w) => w.includes('font-size/12')),
    ).toBe(true)
  })

  it('loads each unique (family, style) combination needed by the text styles', async () => {
    const { collection, vars } = buildPrimitives()
    const figmaMock = stubFigma({ collections: [collection], variables: vars })

    await bootstrapContext({ context: 'comfortable' })

    const calls = figmaMock.loadFontAsync.mock.calls.map(
      (c: unknown[]) => c[0],
    )
    expect(calls).toContainEqual({ family: 'Khand', style: 'SemiBold' })
    expect(calls).toContainEqual({ family: 'Khand', style: 'Medium' })
    expect(calls).toContainEqual({ family: 'Asta Sans', style: 'Regular' })
  })

  it('creates a text style for every text-style spec leaf', async () => {
    const { collection, vars } = buildPrimitives()
    const figmaMock = stubFigma({ collections: [collection], variables: vars })

    await bootstrapContext({ context: 'comfortable' })

    expect(figmaMock.createTextStyle).toHaveBeenCalledTimes(
      CONTEXT_SPECS.comfortable.textStyles.length,
    )
  })

  it('binds fontFamily, fontSize and lineHeight on each created text style', async () => {
    const { collection, vars } = buildPrimitives()
    const figmaMock = stubFigma({ collections: [collection], variables: vars })

    await bootstrapContext({ context: 'comfortable' })

    const styles = figmaMock.createTextStyle.mock.results.map(
      (r: { value: { setBoundVariable: ReturnType<typeof vi.fn> } }) => r.value,
    )
    for (const style of styles) {
      const fields = style.setBoundVariable.mock.calls.map((c: string[]) => c[0])
      expect(fields).toContain('fontFamily')
      expect(fields).toContain('fontSize')
      expect(fields).toContain('lineHeight')
    }
  })

  it('returns created/updated counts and the warnings array', async () => {
    const { collection, vars } = buildPrimitives()
    stubFigma({ collections: [collection], variables: vars })

    const result = await bootstrapContext({ context: 'comfortable' })

    const specVars = CONTEXT_SPECS.comfortable.variables.length
    const specStyles = CONTEXT_SPECS.comfortable.textStyles.length
    expect(result).toEqual({
      context: 'comfortable',
      collection: 'created',
      variablesCreated: specVars,
      variablesUpdated: 0,
      textStylesCreated: specStyles,
      textStylesUpdated: 0,
      warnings: [],
    })
  })
})
