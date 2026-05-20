import { planMigration } from './migrate'
import type { MigrationInput } from './migrate'

const PRIMITIVES = {
  id: 'cp',
  name: 'Primitives',
  modes: [{ modeId: 'mp', name: 'Value' }],
  defaultModeId: 'mp',
  variableIds: [],
}
const COMPACT = {
  id: 'cc',
  name: 'Typography / Compact',
  modes: [{ modeId: 'mc', name: 'Value' }],
  defaultModeId: 'mc',
  variableIds: ['cv1'],
}
const COMFORTABLE = {
  id: 'cf',
  name: 'Typography / Comfortable',
  modes: [{ modeId: 'mf', name: 'Value' }],
  defaultModeId: 'mf',
  variableIds: ['fv1'],
}
const SPACIOUS = {
  id: 'cx',
  name: 'Typography / Spacious',
  modes: [{ modeId: 'mx', name: 'Value' }],
  defaultModeId: 'mx',
  variableIds: ['xv1'],
}
const COMPONENTS = {
  id: 'cm',
  name: 'Components',
  modes: [{ modeId: 'mm', name: 'Value' }],
  defaultModeId: 'mm',
  variableIds: [],
}
const SEMANTIC = {
  id: 'cs',
  name: 'Semantic',
  modes: [{ modeId: 'ms', name: 'Value' }],
  defaultModeId: 'ms',
  variableIds: [],
}

describe('planMigration', () => {
  it('returns an empty plan when there are no Typography collections', () => {
    const input: MigrationInput = {
      collections: [PRIMITIVES, COMPONENTS],
      variables: [],
    }

    const plan = planMigration(input)

    expect(plan.newVariables).toEqual([])
    expect(plan.deletedCollectionIds).toEqual([])
  })

  it('signals that the Semantic collection must be created when none exists', () => {
    const plan = planMigration({
      collections: [PRIMITIVES, COMPACT],
      variables: [],
    })

    expect(plan.semantic.needsCreate).toBe(true)
    expect(plan.semantic.existingId).toBeUndefined()
    expect(plan.semantic.modeName).toBe('Value')
  })

  it('signals that the Semantic collection already exists if one is in the payload', () => {
    const plan = planMigration({
      collections: [SEMANTIC, COMPACT],
      variables: [],
    })

    expect(plan.semantic.needsCreate).toBe(false)
    expect(plan.semantic.existingId).toBe('cs')
  })

  it('emits a new variable for every Typography variable, prefixed with typography/<variant>', () => {
    const plan = planMigration({
      collections: [COMPACT, COMFORTABLE, SPACIOUS],
      variables: [
        {
          id: 'cv1',
          name: 'display/xl/font-family',
          resolvedType: 'STRING',
          variableCollectionId: 'cc',
          valuesByMode: { mc: 'Asta Sans' },
        },
        {
          id: 'fv1',
          name: 'display/xl/font-size',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cf',
          valuesByMode: { mf: 48 },
        },
        {
          id: 'xv1',
          name: 'body/lg/line-height',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cx',
          valuesByMode: { mx: 28 },
        },
      ],
    })

    expect(plan.newVariables).toEqual([
      {
        name: 'typography/compact/display/xl/font-family',
        resolvedType: 'STRING',
        sourceVariableId: 'cv1',
        sourceCollectionId: 'cc',
      },
      {
        name: 'typography/comfortable/display/xl/font-size',
        resolvedType: 'FLOAT',
        sourceVariableId: 'fv1',
        sourceCollectionId: 'cf',
      },
      {
        name: 'typography/spacious/body/lg/line-height',
        resolvedType: 'FLOAT',
        sourceVariableId: 'xv1',
        sourceCollectionId: 'cx',
      },
    ])
  })

  it('lists every Typography collection id as deletable', () => {
    const plan = planMigration({
      collections: [PRIMITIVES, COMPACT, COMFORTABLE, SPACIOUS, COMPONENTS],
      variables: [],
    })

    expect(plan.deletedCollectionIds).toEqual(['cc', 'cf', 'cx'])
  })

  it('ignores variables that do not belong to a Typography collection', () => {
    const plan = planMigration({
      collections: [PRIMITIVES, COMPACT, COMPONENTS],
      variables: [
        {
          id: 'pv1',
          name: 'font-family/sans',
          resolvedType: 'STRING',
          variableCollectionId: 'cp',
          valuesByMode: { mp: 'Asta Sans' },
        },
        {
          id: 'cv1',
          name: 'display/xl/font-family',
          resolvedType: 'STRING',
          variableCollectionId: 'cc',
          valuesByMode: { mc: { type: 'VARIABLE_ALIAS', id: 'pv1' } },
        },
        {
          id: 'mv1',
          name: 'button/padding-x',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cm',
          valuesByMode: { mm: 12 },
        },
      ],
    })

    expect(plan.newVariables).toEqual([
      {
        name: 'typography/compact/display/xl/font-family',
        resolvedType: 'STRING',
        sourceVariableId: 'cv1',
        sourceCollectionId: 'cc',
      },
    ])
  })
})
