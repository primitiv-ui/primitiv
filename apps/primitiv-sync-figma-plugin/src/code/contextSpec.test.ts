import {
  CONTEXT_SPECS,
  anatomyVars,
  containerVars,
  labelControlVars,
  navItemVars,
  typographyTextStyles,
  typographyVars,
} from './contextSpec'

describe('typographyVars', () => {
  it('expands a tier into five variable specs — family, weight, size, line-height, style', () => {
    const tiers = {
      md: {
        family: 'sans' as const,
        style: 'SemiBold',
        weight: 'semibold',
        size: 16,
        lineHeight: 24,
      },
    }

    const result = typographyVars('label', tiers)

    expect(result).toEqual([
      { name: 'label/md/font-family', type: 'STRING', aliasTo: 'font-family/sans' },
      { name: 'label/md/font-weight', type: 'FLOAT', aliasTo: 'font-weight/semibold' },
      { name: 'label/md/font-size', type: 'FLOAT', aliasTo: 'font-size/16' },
      { name: 'label/md/line-height', type: 'FLOAT', aliasTo: 'line-height/24' },
      { name: 'label/md/font-style', type: 'STRING', aliasTo: 'font-style/semibold' },
    ])
  })

  it('produces one set per tier in iteration order', () => {
    const tiers = {
      xs: {
        family: 'serif' as const,
        style: 'Regular',
        weight: 'regular',
        size: 12,
        lineHeight: 16,
      },
      sm: {
        family: 'serif' as const,
        style: 'Regular',
        weight: 'regular',
        size: 14,
        lineHeight: 20,
      },
    }

    const result = typographyVars('body', tiers)

    expect(result.map((v) => v.name)).toEqual([
      'body/xs/font-family',
      'body/xs/font-weight',
      'body/xs/font-size',
      'body/xs/line-height',
      'body/xs/font-style',
      'body/sm/font-family',
      'body/sm/font-weight',
      'body/sm/font-size',
      'body/sm/line-height',
      'body/sm/font-style',
    ])
  })
})

describe('anatomyVars', () => {
  it('expands an anatomy tier into five variable specs', () => {
    const tiers = {
      md: {
        height: 'size-40',
        paddingInline: 'space-16',
        gap: 'space-8',
        iconSize: 'size-16',
        radius: '6',
      },
    }

    const result = anatomyVars('framed-control', tiers)

    expect(result).toEqual([
      { name: 'framed-control/md/height', type: 'FLOAT', aliasTo: 'size/size-40' },
      { name: 'framed-control/md/padding-inline', type: 'FLOAT', aliasTo: 'space/space-16' },
      { name: 'framed-control/md/gap', type: 'FLOAT', aliasTo: 'space/space-8' },
      { name: 'framed-control/md/icon-size', type: 'FLOAT', aliasTo: 'size/size-16' },
      { name: 'framed-control/md/radius', type: 'FLOAT', aliasTo: 'radii/6' },
    ])
  })
})

describe('labelControlVars', () => {
  it('expands a tier into five variable specs — padding-inline, padding-block, gap, icon-size, radius', () => {
    const tiers = {
      md: {
        paddingInline: 'space-8',
        paddingBlock: 'space-4',
        gap: 'space-4',
        iconSize: 'size-14',
        radius: '4',
      },
    }

    const result = labelControlVars('label-control', tiers)

    expect(result).toEqual([
      { name: 'label-control/md/padding-inline', type: 'FLOAT', aliasTo: 'space/space-8' },
      { name: 'label-control/md/padding-block', type: 'FLOAT', aliasTo: 'space/space-4' },
      { name: 'label-control/md/gap', type: 'FLOAT', aliasTo: 'space/space-4' },
      { name: 'label-control/md/icon-size', type: 'FLOAT', aliasTo: 'size/size-14' },
      { name: 'label-control/md/radius', type: 'FLOAT', aliasTo: 'radii/4' },
    ])
  })
})

describe('navItemVars', () => {
  it('expands a tier into four variable specs — height, padding-inline, gap, icon-size (no radius)', () => {
    const tiers = {
      md: {
        height: 'size-40',
        paddingInline: 'space-16',
        gap: 'space-8',
        iconSize: 'size-16',
      },
    }

    const result = navItemVars('nav-item', tiers)

    expect(result).toEqual([
      { name: 'nav-item/md/height', type: 'FLOAT', aliasTo: 'size/size-40' },
      { name: 'nav-item/md/padding-inline', type: 'FLOAT', aliasTo: 'space/space-16' },
      { name: 'nav-item/md/gap', type: 'FLOAT', aliasTo: 'space/space-8' },
      { name: 'nav-item/md/icon-size', type: 'FLOAT', aliasTo: 'size/size-16' },
    ])
  })
})

describe('containerVars', () => {
  it('expands a tier into three variable specs — padding, gap, radius', () => {
    const tiers = {
      md: {
        padding: 'space-16',
        gap: 'space-12',
        radius: '8',
      },
    }

    const result = containerVars('container', tiers)

    expect(result).toEqual([
      { name: 'container/md/padding', type: 'FLOAT', aliasTo: 'space/space-16' },
      { name: 'container/md/gap', type: 'FLOAT', aliasTo: 'space/space-12' },
      { name: 'container/md/radius', type: 'FLOAT', aliasTo: 'radii/8' },
    ])
  })
})

describe('typographyTextStyles', () => {
  it('builds one text style per tier with binding paths into the context collection', () => {
    const tiers = {
      md: {
        family: 'sans' as const,
        style: 'SemiBold',
        weight: 'semibold',
        size: 16,
        lineHeight: 24,
      },
    }

    const [style] = typographyTextStyles('Comfortable', 'label', tiers)

    expect(style).toEqual({
      name: 'Comfortable / Label / md',
      fontName: { family: 'Khand', style: 'SemiBold' },
      defaultFontSize: 16,
      defaultLineHeight: 24,
      bindings: {
        fontFamily: 'label/md/font-family',
        fontStyle: 'label/md/font-style',
        fontSize: 'label/md/font-size',
        lineHeight: 'label/md/line-height',
      },
    })
  })

  it('drops the tier segment from the text-style name when the tier is "default" (single-tier roles)', () => {
    const tiers = {
      default: {
        family: 'sans' as const,
        style: 'Medium',
        weight: 'medium',
        size: 12,
        lineHeight: 16,
      },
    }

    const [style] = typographyTextStyles('Comfortable', 'overline', tiers)

    expect(style.name).toBe('Comfortable / Overline')
    expect(style.bindings).toEqual({
      fontFamily: 'overline/font-family',
      fontStyle: 'overline/font-style',
      fontSize: 'overline/font-size',
      lineHeight: 'overline/line-height',
    })
  })

  it('resolves the serif primitive family alias to Asta Sans on the direct fontName', () => {
    const tiers = {
      md: {
        family: 'serif' as const,
        style: 'Regular',
        weight: 'regular',
        size: 16,
        lineHeight: 24,
      },
    }

    const [style] = typographyTextStyles('Comfortable', 'body', tiers)

    expect(style.fontName.family).toBe('Asta Sans')
  })
})

describe('CONTEXT_SPECS.comfortable', () => {
  const spec = CONTEXT_SPECS.comfortable

  it('contains the framed-control anatomy variables for all five tiers', () => {
    const names = spec.variables.map((v) => v.name)
    for (const tier of ['xs', 'sm', 'md', 'lg', 'xl']) {
      expect(names).toContain(`framed-control/${tier}/height`)
    }
  })

  it('contains label variables for all five t-shirt tiers', () => {
    const names = spec.variables.map((v) => v.name)
    for (const tier of ['xs', 'sm', 'md', 'lg', 'xl']) {
      expect(names).toContain(`label/${tier}/font-size`)
    }
  })

  it('contains heading variables for h1..h6', () => {
    const names = spec.variables.map((v) => v.name)
    for (const h of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
      expect(names).toContain(`heading/${h}/font-size`)
    }
  })

  it('emits a single Overline text style (single-tier role)', () => {
    const overlineStyles = spec.textStyles.filter((s) =>
      s.name.includes('Overline'),
    )
    expect(overlineStyles).toHaveLength(1)
    expect(overlineStyles[0].name).toBe('Comfortable / Overline')
  })

  it('does not contain mono typography variables — mono is deferred (§13.6, §15.11)', () => {
    const names = spec.variables.map((v) => v.name)
    expect(names.every((n) => !n.startsWith('mono/'))).toBe(true)
  })

  it('contains label-control anatomy variables for xs/sm/md/lg', () => {
    const names = spec.variables.map((v) => v.name)
    for (const tier of ['xs', 'sm', 'md', 'lg']) {
      expect(names).toContain(`label-control/${tier}/radius`)
    }
  })

  it('contains nav-item anatomy variables for xs/sm/md/lg (height, no radius)', () => {
    const names = spec.variables.map((v) => v.name)
    for (const tier of ['xs', 'sm', 'md', 'lg']) {
      expect(names).toContain(`nav-item/${tier}/height`)
    }
    expect(names.every((n) => !n.startsWith('nav-item/') || !n.endsWith('/radius'))).toBe(true)
  })

  it('contains container anatomy variables for sm/md/lg/xl', () => {
    const names = spec.variables.map((v) => v.name)
    for (const tier of ['sm', 'md', 'lg', 'xl']) {
      expect(names).toContain(`container/${tier}/padding`)
    }
  })

  it('has no duplicate variable names', () => {
    const names = spec.variables.map((v) => v.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('has no duplicate text-style names', () => {
    const names = spec.textStyles.map((s) => s.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
