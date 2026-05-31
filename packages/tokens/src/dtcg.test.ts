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
        name: 'font-family/heading',
        resolvedType: 'STRING',
        valuesByMode: { m1: 'Asta Sans' },
      }),
    ])

    expect(result).toEqual({
      'font-family': {
        heading: { $type: 'string', $value: 'Asta Sans' },
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
        name: 'font-family/heading',
        resolvedType: 'STRING',
        valuesByMode: { m1: 'Asta Sans' },
      }),
      variable({
        id: 'v2',
        name: 'font-family/text',
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
        heading: { $type: 'string', $value: 'Asta Sans' },
        text: { $type: 'string', $value: 'Crimson Pro' },
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
        name: 'font-family/heading',
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
        heading: { $type: 'string', $value: 'Asta Sans' },
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
          name: 'font-family/heading',
          resolvedType: 'STRING',
          valuesByMode: { m1: 'ignored', m2: 'Asta Sans' },
        }),
      ],
    )

    expect(result).toEqual({
      'font-family': {
        heading: { $type: 'string', $value: 'Asta Sans' },
      },
    })
  })

  it('reads from an explicit modeId rather than the collection default', () => {
    const multiMode = {
      ...PRIMITIVES,
      modes: [
        { modeId: 'dense', name: 'Dense' },
        { modeId: 'comfortable', name: 'Comfortable' },
      ],
      defaultModeId: 'comfortable',
    }

    const result = collectionToDtcg(
      multiMode,
      [
        variable({
          id: 'v1',
          name: 'framed-control/md/height',
          resolvedType: 'FLOAT',
          valuesByMode: { dense: 24, comfortable: 40 },
        }),
      ],
      undefined,
      'dense',
    )

    expect(result).toEqual({
      'framed-control': { md: { height: { $type: 'number', $value: 24 } } },
    })
  })

  describe('aliases', () => {
    it('emits a DTCG reference for an alias to another variable in the same collection', () => {
      const result = collectionToDtcg(PRIMITIVES, [
        variable({
          id: 'v1',
          name: 'font-family/heading',
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
          heading: { $type: 'string', $value: 'Asta Sans' },
          default: { $type: 'string', $value: '{font-family.heading}' },
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
        if (id === 'primitives-v1') return ['font-family', 'heading']
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
              $value: '{font-family.heading}',
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
  const INTERACTION_COLL: FigmaCollection = {
    id: 'ci',
    name: 'Interaction',
    modes: [{ modeId: 'mi', name: 'Value' }],
    defaultModeId: 'mi',
  }
  const PALETTE_COLL: FigmaCollection = {
    id: 'cpal',
    name: 'Primitives / Palette',
    modes: [
      { modeId: 'light', name: 'Light' },
      { modeId: 'dark',  name: 'Dark' },
    ],
    defaultModeId: 'light',
  }
  const INTENT_COLL: FigmaCollection = {
    id: 'cint',
    name: 'Intent',
    modes: [
      { modeId: 'light', name: 'Light' },
      { modeId: 'dark',  name: 'Dark' },
    ],
    defaultModeId: 'light',
  }
  const CONTEXT_COLL: FigmaCollection = {
    id: 'ctx',
    name: 'Context',
    modes: [
      { modeId: 'dense',       name: 'Dense' },
      { modeId: 'compact',     name: 'Compact' },
      { modeId: 'comfortable', name: 'Comfortable' },
      { modeId: 'spacious',    name: 'Spacious' },
    ],
    defaultModeId: 'comfortable',
  }

  it('returns five empty groups when given no collections', () => {
    expect(figmaVarsToDtcg([], [])).toEqual({
      primitives: {},
      palette: {},
      intent: {},
      context: {},
      interaction: {},
    })
  })

  it('routes a Primitives variable into primitives without a prefix', () => {
    const result = figmaVarsToDtcg(
      [PRIMITIVES_COLL],
      [{ id: 'v1', name: 'font-family/heading', resolvedType: 'STRING', variableCollectionId: 'cp', valuesByMode: { mp: 'Asta Sans' } }],
    )

    expect(result.primitives).toEqual({
      'font-family': { heading: { $type: 'string', $value: 'Asta Sans' } },
    })
    expect(result.palette).toEqual({})
    expect(result.intent).toEqual({})
    expect(result.context).toEqual({})
    expect(result.interaction).toEqual({})
  })

  it('routes an Interaction variable into interaction without a prefix', () => {
    const result = figmaVarsToDtcg(
      [INTERACTION_COLL],
      [
        { id: 'v1', name: 'hover/opacity',   resolvedType: 'FLOAT', variableCollectionId: 'ci', valuesByMode: { mi: 0.9 } },
        { id: 'v2', name: 'focus/ring/width', resolvedType: 'FLOAT', variableCollectionId: 'ci', valuesByMode: { mi: 2 } },
      ],
    )

    expect(result.interaction).toEqual({
      hover: { opacity: { $type: 'number', $value: 0.9 } },
      focus: { ring: { width: { $type: 'number', $value: 2 } } },
    })
    expect(result.primitives).toEqual({})
  })

  it('routes Primitives / Palette per-mode into palette with mode name as top-level key', () => {
    const result = figmaVarsToDtcg(
      [PALETTE_COLL],
      [
        {
          id: 'v1',
          name: 'color/neutral/50',
          resolvedType: 'COLOR',
          variableCollectionId: 'cpal',
          valuesByMode: {
            light: { r: 0.98, g: 0.98, b: 0.98, a: 1 },
            dark:  { r: 0.05, g: 0.05, b: 0.05, a: 1 },
          },
        },
      ],
    )

    expect(result.palette).toEqual({
      light: { color: { neutral: { '50': { $type: 'color', $value: '#fafafa' } } } },
      dark:  { color: { neutral: { '50': { $type: 'color', $value: '#0d0d0d' } } } },
    })
    expect(result.primitives).toEqual({})
  })

  it('routes Intent per-mode into intent with mode name as top-level key', () => {
    const result = figmaVarsToDtcg(
      [INTENT_COLL],
      [
        {
          id: 'v1',
          name: 'action/primary/default',
          resolvedType: 'COLOR',
          variableCollectionId: 'cint',
          valuesByMode: {
            light: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
            dark:  { r: 0.1, g: 0.2, b: 0.5, a: 1 },
          },
        },
      ],
    )

    expect(result.intent).toEqual({
      light: { action: { primary: { default: { $type: 'color', $value: '#3366cc' } } } },
      dark:  { action: { primary: { default: { $type: 'color', $value: '#1a3380' } } } },
    })
  })

  it('routes Context per-mode into context with mode name as top-level key', () => {
    const result = figmaVarsToDtcg(
      [CONTEXT_COLL],
      [
        {
          id: 'v1',
          name: 'framed-control/md/height',
          resolvedType: 'FLOAT',
          variableCollectionId: 'ctx',
          valuesByMode: { dense: 24, compact: 32, comfortable: 40, spacious: 48 },
        },
      ],
    )

    expect(result.context).toEqual({
      dense:       { 'framed-control': { md: { height: { $type: 'number', $value: 24 } } } },
      compact:     { 'framed-control': { md: { height: { $type: 'number', $value: 32 } } } },
      comfortable: { 'framed-control': { md: { height: { $type: 'number', $value: 40 } } } },
      spacious:    { 'framed-control': { md: { height: { $type: 'number', $value: 48 } } } },
    })
  })

  it('resolves a cross-collection alias using the target variable natural name path', () => {
    const result = figmaVarsToDtcg(
      [PRIMITIVES_COLL, CONTEXT_COLL],
      [
        { id: 'pv1', name: 'space/8', resolvedType: 'FLOAT', variableCollectionId: 'cp', valuesByMode: { mp: 8 } },
        {
          id: 'cv1',
          name: 'framed-control/md/padding-inline',
          resolvedType: 'FLOAT',
          variableCollectionId: 'ctx',
          valuesByMode: { dense: { type: 'VARIABLE_ALIAS', id: 'pv1' }, compact: { type: 'VARIABLE_ALIAS', id: 'pv1' }, comfortable: { type: 'VARIABLE_ALIAS', id: 'pv1' }, spacious: { type: 'VARIABLE_ALIAS', id: 'pv1' } },
        },
      ],
    )

    expect(result.context.comfortable).toEqual({
      'framed-control': { md: { 'padding-inline': { $type: 'number', $value: '{space.8}' } } },
    })
  })

  it('resolves an Intent → Palette cross-collection alias', () => {
    const result = figmaVarsToDtcg(
      [PALETTE_COLL, INTENT_COLL],
      [
        { id: 'pal1', name: 'color/brand/500', resolvedType: 'COLOR', variableCollectionId: 'cpal', valuesByMode: { light: { r: 0.1, g: 0.5, b: 0.4, a: 1 }, dark: { r: 0.2, g: 0.6, b: 0.5, a: 1 } } },
        { id: 'int1', name: 'action/primary/default', resolvedType: 'COLOR', variableCollectionId: 'cint', valuesByMode: { light: { type: 'VARIABLE_ALIAS', id: 'pal1' }, dark: { type: 'VARIABLE_ALIAS', id: 'pal1' } } },
      ],
    )

    expect(result.intent.light).toEqual({
      action: { primary: { default: { $type: 'color', $value: '{color.brand.500}' } } },
    })
    expect(result.intent.dark).toEqual({
      action: { primary: { default: { $type: 'color', $value: '{color.brand.500}' } } },
    })
  })

  it('silently drops variables whose collection is not in the payload', () => {
    const result = figmaVarsToDtcg(
      [PRIMITIVES_COLL],
      [{ id: 'orphan', name: 'orphan/token', resolvedType: 'STRING', variableCollectionId: 'missing-coll', valuesByMode: { mp: 'unused' } }],
    )

    expect(result).toEqual({ primitives: {}, palette: {}, intent: {}, context: {}, interaction: {} })
  })

  it('throws when a variable aliases an id not present in the payload', () => {
    expect(() =>
      figmaVarsToDtcg(
        [PRIMITIVES_COLL],
        [{ id: 'pv1', name: 'font-family/default', resolvedType: 'STRING', variableCollectionId: 'cp', valuesByMode: { mp: { type: 'VARIABLE_ALIAS', id: 'missing-id' } } }],
      ),
    ).toThrow(/missing-id/)
  })

  it('silently drops unrecognised collections', () => {
    const result = figmaVarsToDtcg(
      [
        PRIMITIVES_COLL,
        { id: 'cx', name: 'Mystery', modes: [{ modeId: 'mx', name: 'Value' }], defaultModeId: 'mx' },
      ],
      [
        { id: 'v1', name: 'font-family/heading', resolvedType: 'STRING', variableCollectionId: 'cp', valuesByMode: { mp: 'Asta Sans' } },
        { id: 'v2', name: 'orphan/token',     resolvedType: 'STRING', variableCollectionId: 'cx', valuesByMode: { mx: 'ignored' } },
      ],
    )

    expect(result.primitives).toEqual({
      'font-family': { heading: { $type: 'string', $value: 'Asta Sans' } },
    })
    expect(result).toEqual(expect.objectContaining({ palette: {}, intent: {}, context: {}, interaction: {} }))
  })
})
