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

  it('removes each Typography collection listed as deletable', async () => {
    const figmaMock = createFigmaMock()
    const mockCollection = { id: 'cc', defaultModeId: 'mc', remove: vi.fn() }
    figmaMock.variables.getVariableCollectionByIdAsync.mockResolvedValue(mockCollection)
    vi.stubGlobal('figma', figmaMock)

    await executeMigration(PLAN, INPUT)

    expect(figmaMock.variables.getVariableCollectionByIdAsync).toHaveBeenCalledWith('cc')
    expect(mockCollection.remove).toHaveBeenCalledOnce()
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
