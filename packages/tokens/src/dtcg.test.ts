import { collectionToDtcg, figmaVarsToDtcg } from './dtcg'
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

describe('figmaVarsToDtcg', () => {
  const PRIMITIVES_COLL: FigmaCollection = {
    id: 'cp',
    name: 'Primitives',
    modes: [{ modeId: 'mp', name: 'Value' }],
    defaultModeId: 'mp',
  }
  const COMPACT_COLL: FigmaCollection = {
    id: 'cc',
    name: 'Typography / Compact',
    modes: [{ modeId: 'mc', name: 'Value' }],
    defaultModeId: 'mc',
  }
  const COMFORTABLE_COLL: FigmaCollection = {
    id: 'cf',
    name: 'Typography / Comfortable',
    modes: [{ modeId: 'mf', name: 'Value' }],
    defaultModeId: 'mf',
  }
  const COMPONENTS_COLL: FigmaCollection = {
    id: 'cmp',
    name: 'Components',
    modes: [{ modeId: 'mcmp', name: 'Value' }],
    defaultModeId: 'mcmp',
  }
  const SEMANTIC_COLL: FigmaCollection = {
    id: 'cs',
    name: 'Semantic',
    modes: [{ modeId: 'ms', name: 'Value' }],
    defaultModeId: 'ms',
  }

  it('returns three empty groups when given no collections', () => {
    expect(figmaVarsToDtcg([], [])).toEqual({
      primitives: {},
      semantic: {},
      components: {},
    })
  })

  it('routes a Primitives variable into primitives without a prefix', () => {
    const result = figmaVarsToDtcg(
      [PRIMITIVES_COLL],
      [
        {
          id: 'v1',
          name: 'font-family/sans',
          resolvedType: 'STRING',
          variableCollectionId: 'cp',
          valuesByMode: { mp: 'Asta Sans' },
        },
      ],
    )

    expect(result.primitives).toEqual({
      'font-family': { sans: { $type: 'string', $value: 'Asta Sans' } },
    })
    expect(result.semantic).toEqual({})
    expect(result.components).toEqual({})
  })

  it('routes a Typography / Compact variable into semantic under typography.compact', () => {
    const result = figmaVarsToDtcg(
      [COMPACT_COLL],
      [
        {
          id: 'v1',
          name: 'display/xl/font-size',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cc',
          valuesByMode: { mc: 40 },
        },
      ],
    )

    expect(result.semantic).toEqual({
      typography: {
        compact: {
          display: {
            xl: { 'font-size': { $type: 'number', $value: 40 } },
          },
        },
      },
    })
  })

  it('merges multiple Typography variants under the same typography group', () => {
    const result = figmaVarsToDtcg(
      [COMPACT_COLL, COMFORTABLE_COLL],
      [
        {
          id: 'vc',
          name: 'display/xl/font-size',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cc',
          valuesByMode: { mc: 40 },
        },
        {
          id: 'vf',
          name: 'display/xl/font-size',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cf',
          valuesByMode: { mf: 48 },
        },
      ],
    )

    expect(result.semantic.typography).toEqual({
      compact: { display: { xl: { 'font-size': { $type: 'number', $value: 40 } } } },
      comfortable: { display: { xl: { 'font-size': { $type: 'number', $value: 48 } } } },
    })
  })

  it('routes a Context / Comfortable variable into semantic under context.comfortable', () => {
    const CONTEXT_COMFORTABLE_COLL: FigmaCollection = {
      id: 'cxf',
      name: 'Context / Comfortable',
      modes: [{ modeId: 'mxf', name: 'Mode 1' }],
      defaultModeId: 'mxf',
    }

    const result = figmaVarsToDtcg(
      [CONTEXT_COMFORTABLE_COLL],
      [
        {
          id: 'v1',
          name: 'label/md/font-size',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cxf',
          valuesByMode: { mxf: 16 },
        },
        {
          id: 'v2',
          name: 'framed-control/md/height',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cxf',
          valuesByMode: { mxf: 40 },
        },
      ],
    )

    expect(result.semantic.context).toEqual({
      comfortable: {
        label: {
          md: { 'font-size': { $type: 'number', $value: 16 } },
        },
        'framed-control': {
          md: { height: { $type: 'number', $value: 40 } },
        },
      },
    })
  })

  it('routes a Components variable into components without a prefix', () => {
    const result = figmaVarsToDtcg(
      [COMPONENTS_COLL],
      [
        {
          id: 'v1',
          name: 'button/padding-x',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cmp',
          valuesByMode: { mcmp: 12 },
        },
      ],
    )

    expect(result.components).toEqual({
      button: { 'padding-x': { $type: 'number', $value: 12 } },
    })
  })

  it('routes a post-migration Semantic collection into semantic without a prefix', () => {
    const result = figmaVarsToDtcg(
      [SEMANTIC_COLL],
      [
        {
          id: 'v1',
          name: 'typography/compact/display/xl/font-size',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cs',
          valuesByMode: { ms: 40 },
        },
      ],
    )

    expect(result.semantic).toEqual({
      typography: {
        compact: {
          display: {
            xl: { 'font-size': { $type: 'number', $value: 40 } },
          },
        },
      },
    })
  })

  it('resolves a cross-collection alias to the target variable\'s full prefixed path', () => {
    const result = figmaVarsToDtcg(
      [PRIMITIVES_COLL, COMPACT_COLL],
      [
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
      ],
    )

    expect(result.primitives['font-family']).toEqual({
      sans: { $type: 'string', $value: 'Asta Sans' },
    })
    expect(result.semantic.typography).toEqual({
      compact: {
        display: {
          xl: {
            'font-family': {
              $type: 'string',
              $value: '{font-family.sans}',
            },
          },
        },
      },
    })
  })

  it('resolves an alias to a Typography variable using its semantic.* prefixed path', () => {
    const result = figmaVarsToDtcg(
      [COMPACT_COLL, COMPONENTS_COLL],
      [
        {
          id: 'cv1',
          name: 'display/xl/font-size',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cc',
          valuesByMode: { mc: 40 },
        },
        {
          id: 'cmpv1',
          name: 'hero/font-size',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cmp',
          valuesByMode: { mcmp: { type: 'VARIABLE_ALIAS', id: 'cv1' } },
        },
      ],
    )

    expect(result.components).toEqual({
      hero: {
        'font-size': {
          $type: 'number',
          $value: '{typography.compact.display.xl.font-size}',
        },
      },
    })
  })

  it('silently drops variables whose collection is not in the payload', () => {
    const result = figmaVarsToDtcg(
      [PRIMITIVES_COLL],
      [
        {
          id: 'orphan',
          name: 'orphan/token',
          resolvedType: 'STRING',
          variableCollectionId: 'missing-coll',
          valuesByMode: { mp: 'unused' },
        },
      ],
    )

    expect(result).toEqual({ primitives: {}, semantic: {}, components: {} })
  })

  it('throws when a variable aliases an id not present in the payload', () => {
    expect(() =>
      figmaVarsToDtcg(
        [PRIMITIVES_COLL],
        [
          {
            id: 'pv1',
            name: 'font-family/default',
            resolvedType: 'STRING',
            variableCollectionId: 'cp',
            valuesByMode: {
              mp: { type: 'VARIABLE_ALIAS', id: 'missing-id' },
            },
          },
        ],
      ),
    ).toThrow(/missing-id/)
  })

  it('throws for an unrecognised collection name', () => {
    expect(() =>
      figmaVarsToDtcg(
        [
          {
            id: 'cx',
            name: 'Mystery',
            modes: [{ modeId: 'mx', name: 'Value' }],
            defaultModeId: 'mx',
          },
        ],
        [],
      ),
    ).toThrow(/Mystery/)
  })

  describe('short-form alias synthesis', () => {
    const COMFORTABLE_CTX: FigmaCollection = {
      id: 'cxf',
      name: 'Context / Comfortable',
      modes: [{ modeId: 'mxf', name: 'Mode 1' }],
      defaultModeId: 'mxf',
    }

    it('emits semantic.typography.<role>.<tier>.<leaf> aliases pointing at the comfortable context', () => {
      const result = figmaVarsToDtcg(
        [COMFORTABLE_CTX],
        [
          {
            id: 'v1',
            name: 'label/md/font-size',
            resolvedType: 'FLOAT',
            variableCollectionId: 'cxf',
            valuesByMode: { mxf: 16 },
          },
        ],
      )

      expect(result.semantic.typography).toEqual({
        label: {
          md: {
            'font-size': {
              $type: 'number',
              $value: '{context.comfortable.label.md.font-size}',
            },
          },
        },
      })
    })

    it('groups multiple typography roles under a single typography alias parent', () => {
      const result = figmaVarsToDtcg(
        [COMFORTABLE_CTX],
        [
          {
            id: 'v1',
            name: 'label/md/font-size',
            resolvedType: 'FLOAT',
            variableCollectionId: 'cxf',
            valuesByMode: { mxf: 16 },
          },
          {
            id: 'v2',
            name: 'body/md/font-size',
            resolvedType: 'FLOAT',
            variableCollectionId: 'cxf',
            valuesByMode: { mxf: 14 },
          },
        ],
      )

      expect(result.semantic.typography).toEqual({
        label: {
          md: {
            'font-size': {
              $type: 'number',
              $value: '{context.comfortable.label.md.font-size}',
            },
          },
        },
        body: {
          md: {
            'font-size': {
              $type: 'number',
              $value: '{context.comfortable.body.md.font-size}',
            },
          },
        },
      })
    })

    it('synthesises nothing when the default context is absent', () => {
      const compactOnly: FigmaCollection = {
        ...COMFORTABLE_CTX,
        id: 'cxc',
        name: 'Context / Compact',
      }

      const result = figmaVarsToDtcg(
        [compactOnly],
        [
          {
            id: 'v1',
            name: 'label/md/font-size',
            resolvedType: 'FLOAT',
            variableCollectionId: 'cxc',
            valuesByMode: { mxf: 14 },
          },
        ],
      )

      expect(result.semantic.typography).toBeUndefined()
      expect(result.semantic.anatomy).toBeUndefined()
    })
  })
})
