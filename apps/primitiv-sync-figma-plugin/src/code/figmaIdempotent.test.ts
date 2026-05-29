import {
  findOrCreateCollection,
  findOrCreateMode,
  findOrCreateTextStyle,
  findOrCreateVariable,
} from './figmaIdempotent'
import { createFigmaMock } from './figma.mock'

describe('findOrCreateCollection', () => {
  it('returns the existing collection when one with the given name exists', async () => {
    const figmaMock = createFigmaMock()
    const existing = {
      id: 'cc',
      name: 'Context / Comfortable',
      modes: [{ modeId: '1:0', name: 'Mode 1' }],
      defaultModeId: '1:0',
      variableIds: [],
      key: 'k',
      remote: false,
    }
    figmaMock.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
      existing,
    ])
    vi.stubGlobal('figma', figmaMock)

    const result = await findOrCreateCollection('Context / Comfortable')

    expect(result).toEqual({ value: existing, created: false })
    expect(
      figmaMock.variables.createVariableCollection,
    ).not.toHaveBeenCalled()
  })

  it('creates a new collection when no name matches', async () => {
    const figmaMock = createFigmaMock()
    figmaMock.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
      {
        id: 'other',
        name: 'Primitives',
        modes: [{ modeId: 'm', name: 'Value' }],
        defaultModeId: 'm',
        variableIds: [],
      },
    ])
    vi.stubGlobal('figma', figmaMock)

    const result = await findOrCreateCollection('Context / Comfortable')

    expect(result.created).toBe(true)
    expect(result.value.name).toBe('Context / Comfortable')
    expect(
      figmaMock.variables.createVariableCollection,
    ).toHaveBeenCalledWith('Context / Comfortable')
  })
})

describe('findOrCreateVariable', () => {
  const collection = {
    id: 'cc',
    name: 'Context / Comfortable',
    modes: [{ modeId: '1:0', name: 'Mode 1' }],
    defaultModeId: '1:0',
    variableIds: [],
  } as unknown as VariableCollection

  it('returns the existing variable when one with the given name exists in the collection', async () => {
    const figmaMock = createFigmaMock()
    const existing = {
      id: 'v1',
      name: 'label/md/font-size',
      resolvedType: 'FLOAT',
      variableCollectionId: 'cc',
      valuesByMode: { '1:0': 16 },
    }
    figmaMock.variables.getLocalVariablesAsync.mockResolvedValue([existing])
    vi.stubGlobal('figma', figmaMock)

    const result = await findOrCreateVariable(
      'label/md/font-size',
      collection,
      'FLOAT',
    )

    expect(result).toEqual({ value: existing, created: false })
    expect(figmaMock.variables.createVariable).not.toHaveBeenCalled()
  })

  it('creates a new variable when no name match in the collection', async () => {
    const figmaMock = createFigmaMock()
    figmaMock.variables.getLocalVariablesAsync.mockResolvedValue([])
    vi.stubGlobal('figma', figmaMock)

    const result = await findOrCreateVariable(
      'label/md/font-size',
      collection,
      'FLOAT',
    )

    expect(result.created).toBe(true)
    expect(result.value.name).toBe('label/md/font-size')
    expect(figmaMock.variables.createVariable).toHaveBeenCalledWith(
      'label/md/font-size',
      collection,
      'FLOAT',
    )
  })

  it('ignores variables with the same name in a different collection', async () => {
    const figmaMock = createFigmaMock()
    figmaMock.variables.getLocalVariablesAsync.mockResolvedValue([
      {
        id: 'v1',
        name: 'label/md/font-size',
        resolvedType: 'FLOAT',
        variableCollectionId: 'OTHER',
        valuesByMode: {},
      },
    ])
    vi.stubGlobal('figma', figmaMock)

    const result = await findOrCreateVariable(
      'label/md/font-size',
      collection,
      'FLOAT',
    )

    expect(result.created).toBe(true)
    expect(figmaMock.variables.createVariable).toHaveBeenCalledOnce()
  })

  it('throws when an existing variable has a different resolved type', async () => {
    const figmaMock = createFigmaMock()
    figmaMock.variables.getLocalVariablesAsync.mockResolvedValue([
      {
        id: 'v1',
        name: 'label/md/font-size',
        resolvedType: 'STRING',
        variableCollectionId: 'cc',
        valuesByMode: {},
      },
    ])
    vi.stubGlobal('figma', figmaMock)

    await expect(
      findOrCreateVariable('label/md/font-size', collection, 'FLOAT'),
    ).rejects.toThrow(/type/i)
  })
})

describe('findOrCreateMode', () => {
  function makeCol(modes: { modeId: string; name: string }[]) {
    const col = {
      modes,
      renameMode: vi.fn((id: string, newName: string) => {
        const m = col.modes.find((m) => m.modeId === id)
        if (m) m.name = newName
      }),
      addMode: vi.fn((name: string) => {
        const modeId = `mode-${col.modes.length}`
        col.modes.push({ modeId, name })
        return modeId
      }),
    }
    return col as unknown as VariableCollection
  }

  it('returns the existing mode when one with the given name exists', () => {
    const col = makeCol([
      { modeId: 'dense', name: 'Dense' },
      { modeId: 'comfortable', name: 'Comfortable' },
    ])
    const result = findOrCreateMode(col, 'Comfortable')
    expect(result).toEqual({
      value: { modeId: 'comfortable', name: 'Comfortable' },
      created: false,
    })
    expect((col as any).renameMode).not.toHaveBeenCalled()
    expect((col as any).addMode).not.toHaveBeenCalled()
  })

  it('renames the default "Mode 1" when the collection has only that mode', () => {
    const col = makeCol([{ modeId: 'm:0', name: 'Mode 1' }])
    const result = findOrCreateMode(col, 'Comfortable')
    expect(result).toEqual({
      value: { modeId: 'm:0', name: 'Comfortable' },
      created: true,
    })
    expect((col as any).renameMode).toHaveBeenCalledWith('m:0', 'Comfortable')
    expect((col as any).addMode).not.toHaveBeenCalled()
  })

  it('adds a new mode when multiple modes exist and none match', () => {
    const col = makeCol([
      { modeId: 'dense', name: 'Dense' },
      { modeId: 'compact', name: 'Compact' },
    ])
    const result = findOrCreateMode(col, 'Comfortable')
    expect(result.created).toBe(true)
    expect(result.value.name).toBe('Comfortable')
    expect((col as any).addMode).toHaveBeenCalledWith('Comfortable')
    expect((col as any).renameMode).not.toHaveBeenCalled()
  })
})

describe('findOrCreateTextStyle', () => {
  it('returns the existing text style when one with the given name exists', async () => {
    const figmaMock = createFigmaMock()
    const existing = { id: 's1', name: 'Comfortable / Label / md' }
    figmaMock.getLocalTextStylesAsync.mockResolvedValue([existing])
    vi.stubGlobal('figma', figmaMock)

    const result = await findOrCreateTextStyle('Comfortable / Label / md')

    expect(result).toEqual({ value: existing, created: false })
    expect(figmaMock.createTextStyle).not.toHaveBeenCalled()
  })

  it('creates a new text style and assigns the name when no match exists', async () => {
    const figmaMock = createFigmaMock()
    figmaMock.getLocalTextStylesAsync.mockResolvedValue([])
    vi.stubGlobal('figma', figmaMock)

    const result = await findOrCreateTextStyle('Comfortable / Label / md')

    expect(result.created).toBe(true)
    expect(result.value.name).toBe('Comfortable / Label / md')
    expect(figmaMock.createTextStyle).toHaveBeenCalledOnce()
  })
})
