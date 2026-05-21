import { executeMigration } from './migrate-execute'
import { createFigmaMock } from './figma.mock'
import type { MigrationPlan } from '../shared/messages'
import type { MigrationInput } from './migrate'

const COMPACT_COLLECTION = {
  id: 'cc',
  name: 'Typography / Compact',
  modes: [{ modeId: 'mc', name: 'Value' }],
  defaultModeId: 'mc',
  variableIds: ['cv1'],
}

const SOURCE_VARIABLE = {
  id: 'cv1',
  name: 'display/xl/font-family',
  resolvedType: 'STRING' as const,
  variableCollectionId: 'cc',
  valuesByMode: { mc: 'Asta Sans' },
}

const PLAN: MigrationPlan = {
  semantic: { needsCreate: true, modeName: 'Value' },
  newVariables: [
    {
      name: 'typography/compact/display/xl/font-family',
      resolvedType: 'STRING',
      sourceVariableId: 'cv1',
      sourceCollectionId: 'cc',
    },
  ],
  deletedCollectionIds: ['cc'],
}

const INPUT: MigrationInput = {
  collections: [COMPACT_COLLECTION],
  variables: [SOURCE_VARIABLE],
}

describe('executeMigration', () => {
  it('creates a Semantic collection when the plan requires it', async () => {
    const figmaMock = createFigmaMock()
    vi.stubGlobal('figma', figmaMock)

    await executeMigration(PLAN, INPUT)

    expect(figmaMock.variables.createVariableCollection).toHaveBeenCalledWith('Semantic')
  })

  it('does not create a Semantic collection when one already exists', async () => {
    const figmaMock = createFigmaMock()
    vi.stubGlobal('figma', figmaMock)

    const plan: MigrationPlan = {
      ...PLAN,
      semantic: { needsCreate: false, existingId: 'cs', modeName: 'Value' },
    }

    await executeMigration(plan, INPUT)

    expect(figmaMock.variables.createVariableCollection).not.toHaveBeenCalled()
  })

  it('creates a variable for each entry in newVariables', async () => {
    const figmaMock = createFigmaMock()
    vi.stubGlobal('figma', figmaMock)

    await executeMigration(PLAN, INPUT)

    expect(figmaMock.variables.createVariable).toHaveBeenCalledWith(
      'typography/compact/display/xl/font-family',
      expect.objectContaining({ id: 'new-semantic-id' }),
      'STRING',
    )
  })

  it('copies the source variable value into the new variable', async () => {
    const figmaMock = createFigmaMock()
    const mockVar = { id: 'nv1', setValueForMode: vi.fn() }
    figmaMock.variables.createVariable.mockReturnValue(mockVar)
    vi.stubGlobal('figma', figmaMock)

    await executeMigration(PLAN, INPUT)

    expect(mockVar.setValueForMode).toHaveBeenCalledWith(
      'new-semantic-mode-id',
      'Asta Sans',
    )
  })

  it('skips creating a variable that already exists in the Semantic collection', async () => {
    const figmaMock = createFigmaMock()
    figmaMock.variables.getLocalVariablesAsync.mockResolvedValue([
      {
        id: 'existing-v1',
        name: 'typography/compact/display/xl/font-family',
        resolvedType: 'STRING',
        variableCollectionId: 'new-semantic-id',
        valuesByMode: {},
        description: '',
        key: 'k',
        remote: false,
        scopes: [],
      },
    ])
    vi.stubGlobal('figma', figmaMock)

    await executeMigration(PLAN, INPUT)

    expect(figmaMock.variables.createVariable).not.toHaveBeenCalled()
  })

  it('still creates variables that do not yet exist when some do', async () => {
    const figmaMock = createFigmaMock()
    figmaMock.variables.getLocalVariablesAsync.mockResolvedValue([
      {
        id: 'existing-v1',
        name: 'typography/compact/display/xl/font-family',
        resolvedType: 'STRING',
        variableCollectionId: 'new-semantic-id',
        valuesByMode: {},
        description: '',
        key: 'k',
        remote: false,
        scopes: [],
      },
    ])
    vi.stubGlobal('figma', figmaMock)

    const plan: MigrationPlan = {
      ...PLAN,
      newVariables: [
        {
          name: 'typography/compact/display/xl/font-family',
          resolvedType: 'STRING',
          sourceVariableId: 'cv1',
          sourceCollectionId: 'cc',
        },
        {
          name: 'typography/compact/display/xl/font-size',
          resolvedType: 'FLOAT',
          sourceVariableId: 'cv2',
          sourceCollectionId: 'cc',
        },
      ],
    }
    const input: MigrationInput = {
      collections: [COMPACT_COLLECTION],
      variables: [
        SOURCE_VARIABLE,
        {
          id: 'cv2',
          name: 'display/xl/font-size',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cc',
          valuesByMode: { mc: 48 },
        },
      ],
    }

    await executeMigration(plan, input)

    expect(figmaMock.variables.createVariable).toHaveBeenCalledOnce()
    expect(figmaMock.variables.createVariable).toHaveBeenCalledWith(
      'typography/compact/display/xl/font-size',
      expect.objectContaining({ id: 'new-semantic-id' }),
      'FLOAT',
    )
  })

  it('rebinds a VARIABLE_ALIAS that points at a source Typography variable', async () => {
    const figmaMock = createFigmaMock()
    const mockComponentVar = {
      id: 'component-v1',
      name: 'button/font-family',
      resolvedType: 'STRING',
      variableCollectionId: 'cm',
      valuesByMode: { mm: { type: 'VARIABLE_ALIAS', id: 'cv1' } },
      setValueForMode: vi.fn(),
    }
    figmaMock.variables.getLocalVariablesAsync.mockResolvedValue([mockComponentVar])
    const newSemanticVar = { id: 'nv1', setValueForMode: vi.fn() }
    figmaMock.variables.createVariable.mockReturnValue(newSemanticVar)
    vi.stubGlobal('figma', figmaMock)

    await executeMigration(PLAN, INPUT)

    expect(mockComponentVar.setValueForMode).toHaveBeenCalledWith(
      'mm',
      { type: 'VARIABLE_ALIAS', id: 'nv1' },
    )
  })

  it('does not rebind aliases pointing at unrelated variables', async () => {
    const figmaMock = createFigmaMock()
    const mockComponentVar = {
      id: 'component-v1',
      name: 'button/color',
      resolvedType: 'COLOR',
      variableCollectionId: 'cm',
      valuesByMode: { mm: { type: 'VARIABLE_ALIAS', id: 'unrelated-id' } },
      setValueForMode: vi.fn(),
    }
    figmaMock.variables.getLocalVariablesAsync.mockResolvedValue([mockComponentVar])
    vi.stubGlobal('figma', figmaMock)

    await executeMigration(PLAN, INPUT)

    expect(mockComponentVar.setValueForMode).not.toHaveBeenCalled()
  })

  it('rebinds aliases for already-existing Semantic variables on a re-run', async () => {
    const figmaMock = createFigmaMock()
    const existingSemanticVar = {
      id: 'existing-nv1',
      name: 'typography/compact/display/xl/font-family',
      resolvedType: 'STRING',
      variableCollectionId: 'new-semantic-id',
      valuesByMode: {},
    }
    const mockComponentVar = {
      id: 'component-v1',
      name: 'button/font-family',
      resolvedType: 'STRING',
      variableCollectionId: 'cm',
      valuesByMode: { mm: { type: 'VARIABLE_ALIAS', id: 'cv1' } },
      setValueForMode: vi.fn(),
    }
    figmaMock.variables.getLocalVariablesAsync.mockResolvedValue([
      existingSemanticVar,
      mockComponentVar,
    ])
    vi.stubGlobal('figma', figmaMock)

    await executeMigration(PLAN, INPUT)

    // No new variable created (duplicate), but the alias is still rebound
    expect(figmaMock.variables.createVariable).not.toHaveBeenCalled()
    expect(mockComponentVar.setValueForMode).toHaveBeenCalledWith(
      'mm',
      { type: 'VARIABLE_ALIAS', id: 'existing-nv1' },
    )
  })

  it('removes each Typography collection listed as deletable', async () => {
    const figmaMock = createFigmaMock()
    const mockCollection = { id: 'cc', defaultModeId: 'mc', remove: vi.fn() }
    figmaMock.variables.getVariableCollectionByIdAsync.mockResolvedValue(mockCollection)
    vi.stubGlobal('figma', figmaMock)

    await executeMigration(PLAN, INPUT)

    expect(figmaMock.variables.getVariableCollectionByIdAsync).toHaveBeenCalledWith('cc')
    expect(mockCollection.remove).toHaveBeenCalledOnce()
  })

  describe('node boundVariables rebinding', () => {
    it('rebinds a scalar node field that aliases a source Typography variable', async () => {
      const figmaMock = createFigmaMock()
      const newSemanticVar = { id: 'nv1', setValueForMode: vi.fn() }
      figmaMock.variables.createVariable.mockReturnValue(newSemanticVar)
      const fetchedVar = { id: 'nv1' }
      figmaMock.variables.getVariableByIdAsync.mockResolvedValue(fetchedVar)
      const mockNode = {
        boundVariables: { opacity: { type: 'VARIABLE_ALIAS', id: 'cv1' } },
        setBoundVariable: vi.fn(),
      }
      figmaMock.root.findAll.mockReturnValue([mockNode])
      vi.stubGlobal('figma', figmaMock)

      await executeMigration(PLAN, INPUT)

      expect(figmaMock.variables.getVariableByIdAsync).toHaveBeenCalledWith('nv1')
      expect(mockNode.setBoundVariable).toHaveBeenCalledWith('opacity', fetchedVar)
    })

    it('rebinds a text array field that aliases a source Typography variable', async () => {
      const figmaMock = createFigmaMock()
      const newSemanticVar = { id: 'nv1', setValueForMode: vi.fn() }
      figmaMock.variables.createVariable.mockReturnValue(newSemanticVar)
      const fetchedVar = { id: 'nv1' }
      figmaMock.variables.getVariableByIdAsync.mockResolvedValue(fetchedVar)
      const mockNode = {
        boundVariables: {
          fontSize: [{ type: 'VARIABLE_ALIAS', id: 'cv1' }],
        },
        setBoundVariable: vi.fn(),
      }
      figmaMock.root.findAll.mockReturnValue([mockNode])
      vi.stubGlobal('figma', figmaMock)

      await executeMigration(PLAN, INPUT)

      expect(mockNode.setBoundVariable).toHaveBeenCalledWith('fontSize', fetchedVar)
    })

    it('does not rebind node fields pointing at unrelated variables', async () => {
      const figmaMock = createFigmaMock()
      const mockNode = {
        boundVariables: {
          fontSize: [{ type: 'VARIABLE_ALIAS', id: 'unrelated-id' }],
        },
        setBoundVariable: vi.fn(),
      }
      figmaMock.root.findAll.mockReturnValue([mockNode])
      vi.stubGlobal('figma', figmaMock)

      await executeMigration(PLAN, INPUT)

      expect(mockNode.setBoundVariable).not.toHaveBeenCalled()
    })

    it('skips nodes without boundVariables', async () => {
      const figmaMock = createFigmaMock()
      figmaMock.root.findAll.mockReturnValue([{ id: 'plain-node' }])
      vi.stubGlobal('figma', figmaMock)

      await expect(executeMigration(PLAN, INPUT)).resolves.toBeUndefined()
    })

    it('caches getVariableByIdAsync calls for the same new variable id', async () => {
      const figmaMock = createFigmaMock()
      const newSemanticVar = { id: 'nv1', setValueForMode: vi.fn() }
      figmaMock.variables.createVariable.mockReturnValue(newSemanticVar)
      figmaMock.variables.getVariableByIdAsync.mockResolvedValue({ id: 'nv1' })
      const mockNodes = [
        {
          boundVariables: { opacity: { type: 'VARIABLE_ALIAS', id: 'cv1' } },
          setBoundVariable: vi.fn(),
        },
        {
          boundVariables: { visible: { type: 'VARIABLE_ALIAS', id: 'cv1' } },
          setBoundVariable: vi.fn(),
        },
      ]
      figmaMock.root.findAll.mockReturnValue(mockNodes)
      vi.stubGlobal('figma', figmaMock)

      await executeMigration(PLAN, INPUT)

      expect(figmaMock.variables.getVariableByIdAsync).toHaveBeenCalledOnce()
    })
  })

  it('creates variables for all planned entries', async () => {
    const figmaMock = createFigmaMock()
    vi.stubGlobal('figma', figmaMock)

    const multiPlan: MigrationPlan = {
      ...PLAN,
      newVariables: [
        {
          name: 'typography/compact/display/xl/font-family',
          resolvedType: 'STRING',
          sourceVariableId: 'cv1',
          sourceCollectionId: 'cc',
        },
        {
          name: 'typography/compact/display/xl/font-size',
          resolvedType: 'FLOAT',
          sourceVariableId: 'cv2',
          sourceCollectionId: 'cc',
        },
      ],
    }
    const multiInput: MigrationInput = {
      collections: [COMPACT_COLLECTION],
      variables: [
        SOURCE_VARIABLE,
        {
          id: 'cv2',
          name: 'display/xl/font-size',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cc',
          valuesByMode: { mc: 48 },
        },
      ],
    }

    await executeMigration(multiPlan, multiInput)

    expect(figmaMock.variables.createVariable).toHaveBeenCalledTimes(2)
  })
})
