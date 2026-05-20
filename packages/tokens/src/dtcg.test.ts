import { collectionToDtcg } from './dtcg'
import type { FigmaCollection, FigmaVariable } from './dtcg'

const PRIMITIVES: FigmaCollection = {
  id: 'c1',
  name: 'Primitives',
  modes: [{ modeId: 'm1', name: 'Value' }],
  defaultModeId: 'm1',
}

function variable(overrides: Partial<FigmaVariable>): FigmaVariable {
  return {
    id: 'v1',
    name: 'token',
    resolvedType: 'STRING',
    variableCollectionId: 'c1',
    valuesByMode: { m1: '' },
    ...overrides,
  }
}

describe('collectionToDtcg', () => {
  it('emits a string token for a STRING variable', () => {
    const result = collectionToDtcg(PRIMITIVES, [
      variable({
        id: 'v1',
        name: 'font-family/sans',
        resolvedType: 'STRING',
        valuesByMode: { m1: 'Asta Sans' },
      }),
    ])

    expect(result).toEqual({
      'font-family': {
        sans: { $type: 'string', $value: 'Asta Sans' },
      },
    })
  })

  it('emits a number token for a FLOAT variable', () => {
    const result = collectionToDtcg(PRIMITIVES, [
      variable({
        id: 'v1',
        name: 'font-size/40',
        resolvedType: 'FLOAT',
        valuesByMode: { m1: 40 },
      }),
    ])

    expect(result).toEqual({
      'font-size': {
        '40': { $type: 'number', $value: 40 },
      },
    })
  })

  it('emits a boolean token for a BOOLEAN variable', () => {
    const result = collectionToDtcg(PRIMITIVES, [
      variable({
        id: 'v1',
        name: 'flags/enabled',
        resolvedType: 'BOOLEAN',
        valuesByMode: { m1: true },
      }),
    ])

    expect(result).toEqual({
      flags: {
        enabled: { $type: 'boolean', $value: true },
      },
    })
  })

  it('emits a color token as hex for a fully opaque COLOR variable', () => {
    const result = collectionToDtcg(PRIMITIVES, [
      variable({
        id: 'v1',
        name: 'color/red',
        resolvedType: 'COLOR',
        valuesByMode: { m1: { r: 1, g: 0, b: 0, a: 1 } },
      }),
    ])

    expect(result).toEqual({
      color: {
        red: { $type: 'color', $value: '#ff0000' },
      },
    })
  })

  it('appends alpha to the hex when a COLOR variable is translucent', () => {
    const result = collectionToDtcg(PRIMITIVES, [
      variable({
        id: 'v1',
        name: 'color/red-50',
        resolvedType: 'COLOR',
        valuesByMode: { m1: { r: 1, g: 0, b: 0, a: 0.5 } },
      }),
    ])

    expect(result).toEqual({
      color: {
        'red-50': { $type: 'color', $value: '#ff000080' },
      },
    })
  })

  it('nests multiple slash-separated names under shared parents', () => {
    const result = collectionToDtcg(PRIMITIVES, [
      variable({
        id: 'v1',
        name: 'font-family/sans',
        resolvedType: 'STRING',
        valuesByMode: { m1: 'Asta Sans' },
      }),
      variable({
        id: 'v2',
        name: 'font-family/serif',
        resolvedType: 'STRING',
        valuesByMode: { m1: 'Crimson Pro' },
      }),
      variable({
        id: 'v3',
        name: 'font-size/40',
        resolvedType: 'FLOAT',
        valuesByMode: { m1: 40 },
      }),
    ])

    expect(result).toEqual({
      'font-family': {
        sans: { $type: 'string', $value: 'Asta Sans' },
        serif: { $type: 'string', $value: 'Crimson Pro' },
      },
      'font-size': {
        '40': { $type: 'number', $value: 40 },
      },
    })
  })

  it('ignores variables that belong to a different collection', () => {
    const result = collectionToDtcg(PRIMITIVES, [
      variable({
        id: 'v1',
        name: 'font-family/sans',
        resolvedType: 'STRING',
        valuesByMode: { m1: 'Asta Sans' },
      }),
      variable({
        id: 'v2',
        name: 'display/xl/font-size',
        resolvedType: 'FLOAT',
        variableCollectionId: 'c2',
        valuesByMode: { m1: 40 },
      }),
    ])

    expect(result).toEqual({
      'font-family': {
        sans: { $type: 'string', $value: 'Asta Sans' },
      },
    })
  })

  it('reads the value from the collection default mode', () => {
    const result = collectionToDtcg(
      {
        ...PRIMITIVES,
        modes: [
          { modeId: 'm1', name: 'Value' },
          { modeId: 'm2', name: 'Other' },
        ],
        defaultModeId: 'm2',
      },
      [
        variable({
          id: 'v1',
          name: 'font-family/sans',
          resolvedType: 'STRING',
          valuesByMode: { m1: 'ignored', m2: 'Asta Sans' },
        }),
      ],
    )

    expect(result).toEqual({
      'font-family': {
        sans: { $type: 'string', $value: 'Asta Sans' },
      },
    })
  })

  describe('aliases', () => {
    it('emits a DTCG reference for an alias to another variable in the same collection', () => {
      const result = collectionToDtcg(PRIMITIVES, [
        variable({
          id: 'v1',
          name: 'font-family/sans',
          resolvedType: 'STRING',
          valuesByMode: { m1: 'Asta Sans' },
        }),
        variable({
          id: 'v2',
          name: 'font-family/default',
          resolvedType: 'STRING',
          valuesByMode: { m1: { type: 'VARIABLE_ALIAS', id: 'v1' } },
        }),
      ])

      expect(result).toEqual({
        'font-family': {
          sans: { $type: 'string', $value: 'Asta Sans' },
          default: { $type: 'string', $value: '{font-family.sans}' },
        },
      })
    })

    it('preserves the $type of the source variable for an aliased FLOAT', () => {
      const result = collectionToDtcg(PRIMITIVES, [
        variable({
          id: 'v1',
          name: 'font-size/40',
          resolvedType: 'FLOAT',
          valuesByMode: { m1: 40 },
        }),
        variable({
          id: 'v2',
          name: 'font-size/default',
          resolvedType: 'FLOAT',
          valuesByMode: { m1: { type: 'VARIABLE_ALIAS', id: 'v1' } },
        }),
      ])

      expect(result['font-size']).toEqual({
        '40': { $type: 'number', $value: 40 },
        default: { $type: 'number', $value: '{font-size.40}' },
      })
    })

    it('uses the resolver to look up an alias that targets another collection', () => {
      const resolveAlias = (id: string): string[] => {
        if (id === 'primitives-v1') return ['font-family', 'sans']
        throw new Error(`unexpected lookup ${id}`)
      }

      const compact: FigmaCollection = {
        id: 'c-typo-compact',
        name: 'Typography / Compact',
        modes: [{ modeId: 'm1', name: 'Value' }],
        defaultModeId: 'm1',
      }

      const result = collectionToDtcg(
        compact,
        [
          variable({
            id: 'compact-v1',
            name: 'display/xl/font-family',
            resolvedType: 'STRING',
            variableCollectionId: 'c-typo-compact',
            valuesByMode: {
              m1: { type: 'VARIABLE_ALIAS', id: 'primitives-v1' },
            },
          }),
        ],
        resolveAlias,
      )

      expect(result).toEqual({
        display: {
          xl: {
            'font-family': {
              $type: 'string',
              $value: '{font-family.sans}',
            },
          },
        },
      })
    })

    it('throws when an alias points to a variable the resolver cannot find', () => {
      expect(() =>
        collectionToDtcg(PRIMITIVES, [
          variable({
            id: 'v1',
            name: 'font-family/default',
            resolvedType: 'STRING',
            valuesByMode: { m1: { type: 'VARIABLE_ALIAS', id: 'missing' } },
          }),
        ]),
      ).toThrow(/missing/)
    })
  })
})
