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
  const CONTEXT_COMPACT_COLL: FigmaCollection = {
    id: 'cxc',
    name: 'Context / Compact',
    modes: [{ modeId: 'mxc', name: 'Value' }],
    defaultModeId: 'mxc',
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

  it('merges multiple Context collections under the same context group', () => {
    const CONTEXT_COMFORTABLE_COLL: FigmaCollection = {
      id: 'cxf',
      name: 'Context / Comfortable',
      modes: [{ modeId: 'mxf', name: 'Value' }],
      defaultModeId: 'mxf',
    }

    const result = figmaVarsToDtcg(
      [CONTEXT_COMPACT_COLL, CONTEXT_COMFORTABLE_COLL],
      [
        {
          id: 'vc',
          name: 'label/md/font-size',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cxc',
          valuesByMode: { mxc: 14 },
        },
        {
          id: 'vf',
          name: 'label/md/font-size',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cxf',
          valuesByMode: { mxf: 16 },
        },
      ],
    )

    expect(result.semantic.context).toEqual({
      compact: { label: { md: { 'font-size': { $type: 'number', $value: 14 } } } },
      comfortable: { label: { md: { 'font-size': { $type: 'number', $value: 16 } } } },
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

  it('routes an Interaction variable into semantic under interaction.*', () => {
    const INTERACTION_COLL: FigmaCollection = {
      id: 'ci',
      name: 'Interaction',
      modes: [{ modeId: 'mi', name: 'Value' }],
      defaultModeId: 'mi',
    }

    const result = figmaVarsToDtcg(
      [INTERACTION_COLL],
      [
        {
          id: 'v1',
          name: 'hover/opacity',
          resolvedType: 'FLOAT',
          variableCollectionId: 'ci',
          valuesByMode: { mi: 0.9 },
        },
        {
          id: 'v2',
          name: 'focus/ring/width',
          resolvedType: 'FLOAT',
          variableCollectionId: 'ci',
          valuesByMode: { mi: 2 },
        },
      ],
    )

    expect(result.semantic.interaction).toEqual({
      hover: { opacity: { $type: 'number', $value: 0.9 } },
      focus: { ring: { width: { $type: 'number', $value: 2 } } },
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
      [PRIMITIVES_COLL, CONTEXT_COMPACT_COLL],
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
          name: 'label/md/font-family',
          resolvedType: 'STRING',
          variableCollectionId: 'cxc',
          valuesByMode: { mxc: { type: 'VARIABLE_ALIAS', id: 'pv1' } },
        },
      ],
    )

    expect(result.primitives['font-family']).toEqual({
      sans: { $type: 'string', $value: 'Asta Sans' },
    })
    expect(result.semantic.context).toEqual({
      compact: {
        label: {
          md: {
            'font-family': {
              $type: 'string',
              $value: '{font-family.sans}',
            },
          },
        },
      },
    })
  })

  it('resolves an alias to a Context variable using its semantic.* prefixed path', () => {
    const result = figmaVarsToDtcg(
      [CONTEXT_COMPACT_COLL, COMPONENTS_COLL],
      [
        {
          id: 'cv1',
          name: 'label/md/font-size',
          resolvedType: 'FLOAT',
          variableCollectionId: 'cxc',
          valuesByMode: { mxc: 14 },
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
          $value: '{context.compact.label.md.font-size}',
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

  it('routes a Primitives / Palette variable into primitives without a prefix', () => {
    const PALETTE_COLL: FigmaCollection = {
      id: 'cpal',
      name: 'Primitives / Palette',
      modes: [{ modeId: 'mpal', name: 'Value' }],
      defaultModeId: 'mpal',
    }

    const result = figmaVarsToDtcg(
      [PALETTE_COLL],
      [
        {
          id: 'v1',
          name: 'color/neutral/50',
          resolvedType: 'COLOR',
          variableCollectionId: 'cpal',
          valuesByMode: { mpal: { r: 0.98, g: 0.98, b: 0.98, a: 1 } },
        },
      ],
    )

    expect(result.primitives).toEqual({
      color: { neutral: { '50': { $type: 'color', $value: '#fafafa' } } },
    })
    expect(result.semantic).toEqual({})
    expect(result.components).toEqual({})
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

    it('emits semantic.anatomy.<pattern>.<tier>.<leaf> aliases pointing at the comfortable context', () => {
      const result = figmaVarsToDtcg(
        [COMFORTABLE_CTX],
        [
          {
            id: 'v1',
            name: 'framed-control/md/height',
            resolvedType: 'FLOAT',
            variableCollectionId: 'cxf',
            valuesByMode: { mxf: 40 },
          },
        ],
      )

      expect(result.semantic.anatomy).toEqual({
        'framed-control': {
          md: {
            height: {
              $type: 'number',
              $value: '{context.comfortable.framed-control.md.height}',
            },
          },
        },
      })
    })

    it('ignores keys in the default context that are neither typography roles nor anatomy patterns', () => {
      const result = figmaVarsToDtcg(
        [COMFORTABLE_CTX],
        [
          {
            id: 'v1',
            name: 'mystery/md/foo',
            resolvedType: 'STRING',
            variableCollectionId: 'cxf',
            valuesByMode: { mxf: 'bar' },
          },
        ],
      )

      expect(result.semantic.typography).toBeUndefined()
      expect(result.semantic.anatomy).toBeUndefined()
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
