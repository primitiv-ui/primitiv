/**
 * Pure data describing every Figma variable and text style the
 * Bootstrap context action creates per RFC 0001 §10.1 / §15.10.
 *
 * The spec is split into small tier tables (typography roles, anatomy
 * patterns) and a handful of expanders that flatten them into the
 * shape the action consumes. Adding a new context, role, or tier
 * means editing a table — never the action.
 *
 * First-cut scope per §15.11:
 *  - `framed-control` is the only anatomy pattern.
 *  - `mono` typography role is deferred.
 *  - `font-weight` variables exist (for the DTCG export) but are NOT
 *    bound on the text style; `fontName.style` stays direct because
 *    the probe found `setBoundVariable('fontWeight', ...)` is a silent
 *    no-op on the current Figma plugin API.
 */

export type { ContextName } from '../shared/messages'
import type { ContextName } from '../shared/messages'

export type VariableSpec = {
  name: string
  type: 'FLOAT' | 'STRING'
  aliasTo: string
}

export type TextStyleSpec = {
  name: string
  fontName: { family: string; style: string }
  defaultFontSize: number
  defaultLineHeight: number
  bindings: {
    fontFamily: string
    fontStyle: string
    fontSize: string
    lineHeight: string
  }
}

export type ContextSpec = {
  variables: VariableSpec[]
  textStyles: TextStyleSpec[]
}

export type TypographyTier = {
  family: 'sans' | 'serif'
  style: string
  weight: string
  size: number
  lineHeight: number
}

export type AnatomyTier = {
  height: string
  paddingInline: string
  gap: string
  iconSize: string
  radius: string
}

export type LabelControlTier = {
  paddingInline: string
  paddingBlock: string
  gap: string
  iconSize: string
  radius: string
}

export type NavItemTier = {
  height: string
  paddingInline: string
  gap: string
  iconSize: string
}

export type ContainerTier = {
  padding: string
  gap: string
  radius: string
}

function familyName(family: 'sans' | 'serif'): string {
  return family === 'sans' ? 'Khand' : 'Asta Sans'
}

function roleTitle(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function tierPath(role: string, tier: string, field: string): string {
  return tier === 'default' ? `${role}/${field}` : `${role}/${tier}/${field}`
}

export function typographyVars(
  role: string,
  tiers: Record<string, TypographyTier>,
): VariableSpec[] {
  const out: VariableSpec[] = []
  for (const [tier, t] of Object.entries(tiers)) {
    out.push(
      {
        name: tierPath(role, tier, 'font-family'),
        type: 'STRING',
        aliasTo: `font-family/${t.family}`,
      },
      {
        name: tierPath(role, tier, 'font-weight'),
        type: 'FLOAT',
        aliasTo: `font-weight/${t.weight}`,
      },
      {
        name: tierPath(role, tier, 'font-size'),
        type: 'FLOAT',
        aliasTo: `font-size/${t.size}`,
      },
      {
        name: tierPath(role, tier, 'line-height'),
        type: 'FLOAT',
        aliasTo: `line-height/${t.lineHeight}`,
      },
      {
        name: tierPath(role, tier, 'font-style'),
        type: 'STRING',
        aliasTo: `font-style/${t.weight}`,
      },
    )
  }
  return out
}

export function anatomyVars(
  pattern: string,
  tiers: Record<string, AnatomyTier>,
): VariableSpec[] {
  const out: VariableSpec[] = []
  for (const [tier, a] of Object.entries(tiers)) {
    out.push(
      {
        name: `${pattern}/${tier}/height`,
        type: 'FLOAT',
        aliasTo: `size/${a.height}`,
      },
      {
        name: `${pattern}/${tier}/padding-inline`,
        type: 'FLOAT',
        aliasTo: `space/${a.paddingInline}`,
      },
      {
        name: `${pattern}/${tier}/gap`,
        type: 'FLOAT',
        aliasTo: `space/${a.gap}`,
      },
      {
        name: `${pattern}/${tier}/icon-size`,
        type: 'FLOAT',
        aliasTo: `size/${a.iconSize}`,
      },
      {
        name: `${pattern}/${tier}/radius`,
        type: 'FLOAT',
        aliasTo: `radii/${a.radius}`,
      },
    )
  }
  return out
}

export function labelControlVars(
  pattern: string,
  tiers: Record<string, LabelControlTier>,
): VariableSpec[] {
  const out: VariableSpec[] = []
  for (const [tier, a] of Object.entries(tiers)) {
    out.push(
      { name: `${pattern}/${tier}/padding-inline`, type: 'FLOAT', aliasTo: `space/${a.paddingInline}` },
      { name: `${pattern}/${tier}/padding-block`, type: 'FLOAT', aliasTo: `space/${a.paddingBlock}` },
      { name: `${pattern}/${tier}/gap`, type: 'FLOAT', aliasTo: `space/${a.gap}` },
      { name: `${pattern}/${tier}/icon-size`, type: 'FLOAT', aliasTo: `size/${a.iconSize}` },
      { name: `${pattern}/${tier}/radius`, type: 'FLOAT', aliasTo: `radii/${a.radius}` },
    )
  }
  return out
}

export function navItemVars(
  pattern: string,
  tiers: Record<string, NavItemTier>,
): VariableSpec[] {
  const out: VariableSpec[] = []
  for (const [tier, a] of Object.entries(tiers)) {
    out.push(
      { name: `${pattern}/${tier}/height`, type: 'FLOAT', aliasTo: `size/${a.height}` },
      { name: `${pattern}/${tier}/padding-inline`, type: 'FLOAT', aliasTo: `space/${a.paddingInline}` },
      { name: `${pattern}/${tier}/gap`, type: 'FLOAT', aliasTo: `space/${a.gap}` },
      { name: `${pattern}/${tier}/icon-size`, type: 'FLOAT', aliasTo: `size/${a.iconSize}` },
    )
  }
  return out
}

export function containerVars(
  pattern: string,
  tiers: Record<string, ContainerTier>,
): VariableSpec[] {
  const out: VariableSpec[] = []
  for (const [tier, a] of Object.entries(tiers)) {
    out.push(
      { name: `${pattern}/${tier}/padding`, type: 'FLOAT', aliasTo: `space/${a.padding}` },
      { name: `${pattern}/${tier}/gap`, type: 'FLOAT', aliasTo: `space/${a.gap}` },
      { name: `${pattern}/${tier}/radius`, type: 'FLOAT', aliasTo: `radii/${a.radius}` },
    )
  }
  return out
}

export function typographyTextStyles(
  context: string,
  role: string,
  tiers: Record<string, TypographyTier>,
): TextStyleSpec[] {
  return Object.entries(tiers).map(([tier, t]) => {
    const name =
      tier === 'default'
        ? `${context} / ${roleTitle(role)}`
        : `${context} / ${roleTitle(role)} / ${tier}`
    return {
      name,
      fontName: { family: familyName(t.family), style: t.style },
      defaultFontSize: t.size,
      defaultLineHeight: t.lineHeight,
      bindings: {
        fontFamily: tierPath(role, tier, 'font-family'),
        fontStyle: tierPath(role, tier, 'font-style'),
        fontSize: tierPath(role, tier, 'font-size'),
        lineHeight: tierPath(role, tier, 'line-height'),
      },
    }
  })
}

const COMFORTABLE_TYPOGRAPHY = {
  label: {
    xs: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 12, lineHeight: 16 },
    sm: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 14, lineHeight: 20 },
    md: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 16, lineHeight: 24 },
    lg: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 18, lineHeight: 28 },
    xl: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 20, lineHeight: 32 },
  },
  body: {
    xs: { family: 'serif', style: 'Regular', weight: 'regular', size: 12, lineHeight: 16 },
    sm: { family: 'serif', style: 'Regular', weight: 'regular', size: 14, lineHeight: 20 },
    md: { family: 'serif', style: 'Regular', weight: 'regular', size: 16, lineHeight: 24 },
    lg: { family: 'serif', style: 'Regular', weight: 'regular', size: 20, lineHeight: 32 },
  },
  heading: {
    h1: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 48, lineHeight: 56 },
    h2: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 40, lineHeight: 48 },
    h3: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 32, lineHeight: 40 },
    h4: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 28, lineHeight: 36 },
    h5: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 24, lineHeight: 32 },
    h6: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 20, lineHeight: 28 },
  },
  display: {
    lg: { family: 'sans', style: 'Medium', weight: 'medium', size: 56, lineHeight: 64 },
    xl: { family: 'sans', style: 'Medium', weight: 'medium', size: 68, lineHeight: 76 },
  },
  overline: {
    default: { family: 'sans', style: 'Medium', weight: 'medium', size: 12, lineHeight: 16 },
  },
} satisfies Record<string, Record<string, TypographyTier>>

const COMFORTABLE_ANATOMY = {
  'framed-control': {
    xs: { height: '24', paddingInline: '8',  gap: '4',  iconSize: '12', radius: '4' },
    sm: { height: '32', paddingInline: '12', gap: '4',  iconSize: '14', radius: '6' },
    md: { height: '40', paddingInline: '16', gap: '8',  iconSize: '16', radius: '6' },
    lg: { height: '48', paddingInline: '20', gap: '8',  iconSize: '20', radius: '8' },
    xl: { height: '56', paddingInline: '24', gap: '12', iconSize: '24', radius: '8' },
  },
} satisfies Record<string, Record<string, AnatomyTier>>

const COMFORTABLE_LABEL_CONTROL = {
  xs: { paddingInline: '4',  paddingBlock: '2', gap: '2', iconSize: '10', radius: '2' },
  sm: { paddingInline: '6',  paddingBlock: '2', gap: '4', iconSize: '12', radius: '2' },
  md: { paddingInline: '8',  paddingBlock: '4', gap: '4', iconSize: '14', radius: '4' },
  lg: { paddingInline: '12', paddingBlock: '6', gap: '6', iconSize: '16', radius: '6' },
} satisfies Record<string, LabelControlTier>

const COMFORTABLE_NAV_ITEM = {
  xs: { height: '24', paddingInline: '8',  gap: '4', iconSize: '12' },
  sm: { height: '32', paddingInline: '12', gap: '4', iconSize: '14' },
  md: { height: '40', paddingInline: '16', gap: '8', iconSize: '16' },
  lg: { height: '48', paddingInline: '20', gap: '8', iconSize: '20' },
} satisfies Record<string, NavItemTier>

const COMFORTABLE_CONTAINER = {
  sm: { padding: '12', gap: '8',  radius: '6' },
  md: { padding: '16', gap: '12', radius: '8' },
  lg: { padding: '24', gap: '16', radius: '12' },
  xl: { padding: '32', gap: '20', radius: '16' },
} satisfies Record<string, ContainerTier>

const COMPACT_TYPOGRAPHY = {
  label: {
    xs: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 12, lineHeight: 16 },
    sm: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 14, lineHeight: 20 },
    md: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 16, lineHeight: 24 },
    lg: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 18, lineHeight: 28 },
    xl: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 20, lineHeight: 32 },
  },
  body: {
    xs: { family: 'serif', style: 'Regular', weight: 'regular', size: 12, lineHeight: 16 },
    sm: { family: 'serif', style: 'Regular', weight: 'regular', size: 14, lineHeight: 20 },
    md: { family: 'serif', style: 'Regular', weight: 'regular', size: 16, lineHeight: 24 },
    lg: { family: 'serif', style: 'Regular', weight: 'regular', size: 18, lineHeight: 28 },
  },
  heading: {
    h1: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 32, lineHeight: 40 },
    h2: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 28, lineHeight: 36 },
    h3: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 26, lineHeight: 36 },
    h4: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 22, lineHeight: 32 },
    h5: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 20, lineHeight: 28 },
    h6: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 18, lineHeight: 28 },
  },
  display: {
    lg: { family: 'sans', style: 'Medium', weight: 'medium', size: 36, lineHeight: 44 },
    xl: { family: 'sans', style: 'Medium', weight: 'medium', size: 40, lineHeight: 48 },
  },
  overline: {
    default: { family: 'sans', style: 'Medium', weight: 'medium', size: 12, lineHeight: 16 },
  },
} satisfies Record<string, Record<string, TypographyTier>>

const COMPACT_ANATOMY = {
  'framed-control': {
    xs: { height: '20', paddingInline: '6',  gap: '4', iconSize: '12', radius: '4' },
    sm: { height: '28', paddingInline: '10', gap: '4', iconSize: '14', radius: '6' },
    md: { height: '32', paddingInline: '12', gap: '4', iconSize: '16', radius: '6' },
    lg: { height: '40', paddingInline: '16', gap: '6', iconSize: '20', radius: '8' },
    xl: { height: '48', paddingInline: '20', gap: '8', iconSize: '24', radius: '8' },
  },
} satisfies Record<string, Record<string, AnatomyTier>>

const COMPACT_LABEL_CONTROL = {
  xs: { paddingInline: '3',  paddingBlock: '1', gap: '1', iconSize: '8',  radius: '2' },
  sm: { paddingInline: '4',  paddingBlock: '2', gap: '3', iconSize: '10', radius: '2' },
  md: { paddingInline: '6',  paddingBlock: '3', gap: '3', iconSize: '12', radius: '4' },
  lg: { paddingInline: '10', paddingBlock: '4', gap: '4', iconSize: '14', radius: '4' },
} satisfies Record<string, LabelControlTier>

const COMPACT_NAV_ITEM = {
  xs: { height: '20', paddingInline: '6',  gap: '4', iconSize: '12' },
  sm: { height: '28', paddingInline: '10', gap: '4', iconSize: '14' },
  md: { height: '32', paddingInline: '12', gap: '6', iconSize: '16' },
  lg: { height: '40', paddingInline: '16', gap: '6', iconSize: '20' },
} satisfies Record<string, NavItemTier>

const COMPACT_CONTAINER = {
  sm: { padding: '8',  gap: '4',  radius: '4' },
  md: { padding: '12', gap: '8',  radius: '6' },
  lg: { padding: '20', gap: '12', radius: '10' },
  xl: { padding: '28', gap: '16', radius: '12' },
} satisfies Record<string, ContainerTier>

const SPACIOUS_TYPOGRAPHY = {
  label: {
    xs: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 12, lineHeight: 20 },
    sm: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 14, lineHeight: 24 },
    md: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 16, lineHeight: 28 },
    lg: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 18, lineHeight: 32 },
    xl: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 20, lineHeight: 36 },
  },
  body: {
    xs: { family: 'serif', style: 'Regular', weight: 'regular', size: 12, lineHeight: 20 },
    sm: { family: 'serif', style: 'Regular', weight: 'regular', size: 14, lineHeight: 24 },
    md: { family: 'serif', style: 'Regular', weight: 'regular', size: 16, lineHeight: 28 },
    lg: { family: 'serif', style: 'Regular', weight: 'regular', size: 22, lineHeight: 36 },
  },
  heading: {
    h1: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 88, lineHeight: 96 },
    h2: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 68, lineHeight: 76 },
    h3: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 52, lineHeight: 60 },
    h4: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 36, lineHeight: 44 },
    h5: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 28, lineHeight: 40 },
    h6: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 20, lineHeight: 32 },
  },
  display: {
    lg: { family: 'sans', style: 'Medium', weight: 'medium', size: 120, lineHeight: 128 },
    xl: { family: 'sans', style: 'Medium', weight: 'medium', size: 160, lineHeight: 168 },
  },
  overline: {
    default: { family: 'sans', style: 'Medium', weight: 'medium', size: 12, lineHeight: 20 },
  },
} satisfies Record<string, Record<string, TypographyTier>>

const SPACIOUS_ANATOMY = {
  'framed-control': {
    xs: { height: '28', paddingInline: '10', gap: '4',  iconSize: '14', radius: '6' },
    sm: { height: '40', paddingInline: '14', gap: '6',  iconSize: '16', radius: '8' },
    md: { height: '48', paddingInline: '20', gap: '8',  iconSize: '20', radius: '8' },
    lg: { height: '56', paddingInline: '28', gap: '10', iconSize: '24', radius: '10' },
    xl: { height: '68', paddingInline: '32', gap: '12', iconSize: '28', radius: '12' },
  },
} satisfies Record<string, Record<string, AnatomyTier>>

const SPACIOUS_LABEL_CONTROL = {
  xs: { paddingInline: '6',  paddingBlock: '3',  gap: '3',  iconSize: '12', radius: '4' },
  sm: { paddingInline: '8',  paddingBlock: '4',  gap: '6',  iconSize: '14', radius: '4' },
  md: { paddingInline: '12', paddingBlock: '6',  gap: '6',  iconSize: '16', radius: '6' },
  lg: { paddingInline: '16', paddingBlock: '10', gap: '10', iconSize: '20', radius: '8' },
} satisfies Record<string, LabelControlTier>

const SPACIOUS_NAV_ITEM = {
  xs: { height: '28', paddingInline: '10', gap: '4',  iconSize: '14' },
  sm: { height: '40', paddingInline: '14', gap: '6',  iconSize: '16' },
  md: { height: '48', paddingInline: '20', gap: '10', iconSize: '20' },
  lg: { height: '56', paddingInline: '28', gap: '12', iconSize: '24' },
} satisfies Record<string, NavItemTier>

const SPACIOUS_CONTAINER = {
  sm: { padding: '16', gap: '12', radius: '8' },
  md: { padding: '24', gap: '16', radius: '12' },
  lg: { padding: '32', gap: '20', radius: '16' },
  xl: { padding: '48', gap: '32', radius: '20' },
} satisfies Record<string, ContainerTier>

const DENSE_TYPOGRAPHY = {
  label: {
    xs: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 10, lineHeight: 12 },
    sm: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 11, lineHeight: 14 },
    md: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 12, lineHeight: 16 },
    lg: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 13, lineHeight: 16 },
    xl: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 14, lineHeight: 20 },
  },
  body: {
    xs: { family: 'serif', style: 'Regular', weight: 'regular', size: 10, lineHeight: 12 },
    sm: { family: 'serif', style: 'Regular', weight: 'regular', size: 11, lineHeight: 14 },
    md: { family: 'serif', style: 'Regular', weight: 'regular', size: 12, lineHeight: 16 },
    lg: { family: 'serif', style: 'Regular', weight: 'regular', size: 13, lineHeight: 16 },
  },
  heading: {
    h1: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 18, lineHeight: 24 },
    h2: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 17, lineHeight: 20 },
    h3: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 16, lineHeight: 20 },
    h4: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 15, lineHeight: 20 },
    h5: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 14, lineHeight: 16 },
    h6: { family: 'sans', style: 'SemiBold', weight: 'semibold', size: 13, lineHeight: 16 },
  },
  display: {
    lg: { family: 'sans', style: 'Medium', weight: 'medium', size: 20, lineHeight: 24 },
    xl: { family: 'sans', style: 'Medium', weight: 'medium', size: 22, lineHeight: 28 },
  },
  overline: {
    default: { family: 'sans', style: 'Medium', weight: 'medium', size: 10, lineHeight: 12 },
  },
} satisfies Record<string, Record<string, TypographyTier>>

const DENSE_ANATOMY = {
  'framed-control': {
    xs: { height: '16', paddingInline: '4',  gap: '2', iconSize: '10', radius: '2' },
    sm: { height: '20', paddingInline: '6',  gap: '4', iconSize: '12', radius: '4' },
    md: { height: '24', paddingInline: '8',  gap: '4', iconSize: '14', radius: '4' },
    lg: { height: '32', paddingInline: '12', gap: '4', iconSize: '16', radius: '4' },
    xl: { height: '40', paddingInline: '16', gap: '6', iconSize: '20', radius: '6' },
  },
} satisfies Record<string, Record<string, AnatomyTier>>

const DENSE_LABEL_CONTROL = {
  xs: { paddingInline: '2', paddingBlock: '1', gap: '1', iconSize: '8',  radius: '2' },
  sm: { paddingInline: '3', paddingBlock: '1', gap: '2', iconSize: '10', radius: '2' },
  md: { paddingInline: '4', paddingBlock: '2', gap: '3', iconSize: '10', radius: '2' },
  lg: { paddingInline: '6', paddingBlock: '3', gap: '3', iconSize: '12', radius: '4' },
} satisfies Record<string, LabelControlTier>

const DENSE_NAV_ITEM = {
  xs: { height: '16', paddingInline: '4',  gap: '2', iconSize: '10' },
  sm: { height: '20', paddingInline: '6',  gap: '4', iconSize: '12' },
  md: { height: '24', paddingInline: '8',  gap: '4', iconSize: '14' },
  lg: { height: '32', paddingInline: '12', gap: '6', iconSize: '16' },
} satisfies Record<string, NavItemTier>

const DENSE_CONTAINER = {
  sm: { padding: '8',  gap: '4',  radius: '4' },
  md: { padding: '10', gap: '6',  radius: '4' },
  lg: { padding: '14', gap: '10', radius: '6' },
  xl: { padding: '20', gap: '14', radius: '8' },
} satisfies Record<string, ContainerTier>

function buildSpec(
  label: string,
  typography: Record<string, Record<string, TypographyTier>>,
  framedControl: Record<string, AnatomyTier>,
  labelControl: Record<string, LabelControlTier>,
  navItem: Record<string, NavItemTier>,
  container: Record<string, ContainerTier>,
): ContextSpec {
  return {
    variables: [
      ...typographyVars('label', typography.label),
      ...typographyVars('body', typography.body),
      ...typographyVars('heading', typography.heading),
      ...typographyVars('display', typography.display),
      ...typographyVars('overline', typography.overline),
      ...anatomyVars('framed-control', framedControl),
      ...labelControlVars('label-control', labelControl),
      ...navItemVars('nav-item', navItem),
      ...containerVars('container', container),
    ],
    textStyles: [
      ...typographyTextStyles(label, 'label', typography.label),
      ...typographyTextStyles(label, 'body', typography.body),
      ...typographyTextStyles(label, 'heading', typography.heading),
      ...typographyTextStyles(label, 'display', typography.display),
      ...typographyTextStyles(label, 'overline', typography.overline),
    ],
  }
}

export const CONTEXT_SPECS: Record<ContextName, ContextSpec> = {
  comfortable: buildSpec(
    'Comfortable',
    COMFORTABLE_TYPOGRAPHY,
    COMFORTABLE_ANATOMY['framed-control'],
    COMFORTABLE_LABEL_CONTROL,
    COMFORTABLE_NAV_ITEM,
    COMFORTABLE_CONTAINER,
  ),
  compact: buildSpec(
    'Compact',
    COMPACT_TYPOGRAPHY,
    COMPACT_ANATOMY['framed-control'],
    COMPACT_LABEL_CONTROL,
    COMPACT_NAV_ITEM,
    COMPACT_CONTAINER,
  ),
  spacious: buildSpec(
    'Spacious',
    SPACIOUS_TYPOGRAPHY,
    SPACIOUS_ANATOMY['framed-control'],
    SPACIOUS_LABEL_CONTROL,
    SPACIOUS_NAV_ITEM,
    SPACIOUS_CONTAINER,
  ),
  dense: buildSpec(
    'Dense',
    DENSE_TYPOGRAPHY,
    DENSE_ANATOMY['framed-control'],
    DENSE_LABEL_CONTROL,
    DENSE_NAV_ITEM,
    DENSE_CONTAINER,
  ),
}
