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
 *    the probe found `setBoundVariable('fontWeight', …)` is a silent
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
    xs: { height: 'size-24', paddingInline: 'space-8',  gap: 'space-4',  iconSize: 'size-12', radius: '4' },
    sm: { height: 'size-32', paddingInline: 'space-12', gap: 'space-4',  iconSize: 'size-14', radius: '6' },
    md: { height: 'size-40', paddingInline: 'space-16', gap: 'space-8',  iconSize: 'size-16', radius: '6' },
    lg: { height: 'size-48', paddingInline: 'space-20', gap: 'space-8',  iconSize: 'size-20', radius: '8' },
    xl: { height: 'size-56', paddingInline: 'space-24', gap: 'space-12', iconSize: 'size-24', radius: '8' },
  },
} satisfies Record<string, Record<string, AnatomyTier>>

const COMFORTABLE_LABEL_CONTROL = {
  xs: { paddingInline: 'space-4',  paddingBlock: 'space-2', gap: 'space-2', iconSize: 'size-10', radius: '2' },
  sm: { paddingInline: 'space-6',  paddingBlock: 'space-2', gap: 'space-4', iconSize: 'size-12', radius: '2' },
  md: { paddingInline: 'space-8',  paddingBlock: 'space-4', gap: 'space-4', iconSize: 'size-14', radius: '4' },
  lg: { paddingInline: 'space-12', paddingBlock: 'space-6', gap: 'space-6', iconSize: 'size-16', radius: '6' },
} satisfies Record<string, LabelControlTier>

const COMFORTABLE_NAV_ITEM = {
  xs: { height: 'size-24', paddingInline: 'space-8',  gap: 'space-4', iconSize: 'size-12' },
  sm: { height: 'size-32', paddingInline: 'space-12', gap: 'space-4', iconSize: 'size-14' },
  md: { height: 'size-40', paddingInline: 'space-16', gap: 'space-8', iconSize: 'size-16' },
  lg: { height: 'size-48', paddingInline: 'space-20', gap: 'space-8', iconSize: 'size-20' },
} satisfies Record<string, NavItemTier>

const COMFORTABLE_CONTAINER = {
  sm: { padding: 'space-12', gap: 'space-8',  radius: '6' },
  md: { padding: 'space-16', gap: 'space-12', radius: '8' },
  lg: { padding: 'space-24', gap: 'space-16', radius: '12' },
  xl: { padding: 'space-32', gap: 'space-20', radius: '16' },
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
    xs: { height: 'size-20', paddingInline: 'space-6',  gap: 'space-4', iconSize: 'size-12', radius: '4' },
    sm: { height: 'size-28', paddingInline: 'space-10', gap: 'space-4', iconSize: 'size-14', radius: '6' },
    md: { height: 'size-32', paddingInline: 'space-12', gap: 'space-4', iconSize: 'size-16', radius: '6' },
    lg: { height: 'size-40', paddingInline: 'space-16', gap: 'space-6', iconSize: 'size-20', radius: '8' },
    xl: { height: 'size-48', paddingInline: 'space-20', gap: 'space-8', iconSize: 'size-24', radius: '8' },
  },
} satisfies Record<string, Record<string, AnatomyTier>>

const COMPACT_LABEL_CONTROL = {
  xs: { paddingInline: 'space-3',  paddingBlock: 'space-1', gap: 'space-1', iconSize: 'size-8',  radius: '2' },
  sm: { paddingInline: 'space-4',  paddingBlock: 'space-2', gap: 'space-3', iconSize: 'size-10', radius: '2' },
  md: { paddingInline: 'space-6',  paddingBlock: 'space-3', gap: 'space-3', iconSize: 'size-12', radius: '4' },
  lg: { paddingInline: 'space-10', paddingBlock: 'space-4', gap: 'space-4', iconSize: 'size-14', radius: '4' },
} satisfies Record<string, LabelControlTier>

const COMPACT_NAV_ITEM = {
  xs: { height: 'size-20', paddingInline: 'space-6',  gap: 'space-4', iconSize: 'size-12' },
  sm: { height: 'size-28', paddingInline: 'space-10', gap: 'space-4', iconSize: 'size-14' },
  md: { height: 'size-32', paddingInline: 'space-12', gap: 'space-6', iconSize: 'size-16' },
  lg: { height: 'size-40', paddingInline: 'space-16', gap: 'space-6', iconSize: 'size-20' },
} satisfies Record<string, NavItemTier>

const COMPACT_CONTAINER = {
  sm: { padding: 'space-8',  gap: 'space-4',  radius: '4' },
  md: { padding: 'space-12', gap: 'space-8',  radius: '6' },
  lg: { padding: 'space-20', gap: 'space-12', radius: '10' },
  xl: { padding: 'space-28', gap: 'space-16', radius: '12' },
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
    xs: { height: 'size-28', paddingInline: 'space-10', gap: 'space-4',  iconSize: 'size-14', radius: '6' },
    sm: { height: 'size-40', paddingInline: 'space-14', gap: 'space-6',  iconSize: 'size-16', radius: '8' },
    md: { height: 'size-48', paddingInline: 'space-20', gap: 'space-8',  iconSize: 'size-20', radius: '8' },
    lg: { height: 'size-56', paddingInline: 'space-28', gap: 'space-10', iconSize: 'size-24', radius: '10' },
    xl: { height: 'size-68', paddingInline: 'space-32', gap: 'space-12', iconSize: 'size-28', radius: '12' },
  },
} satisfies Record<string, Record<string, AnatomyTier>>

const SPACIOUS_LABEL_CONTROL = {
  xs: { paddingInline: 'space-6',  paddingBlock: 'space-3',  gap: 'space-3',  iconSize: 'size-12', radius: '4' },
  sm: { paddingInline: 'space-8',  paddingBlock: 'space-4',  gap: 'space-6',  iconSize: 'size-14', radius: '4' },
  md: { paddingInline: 'space-12', paddingBlock: 'space-6',  gap: 'space-6',  iconSize: 'size-16', radius: '6' },
  lg: { paddingInline: 'space-16', paddingBlock: 'space-10', gap: 'space-10', iconSize: 'size-20', radius: '8' },
} satisfies Record<string, LabelControlTier>

const SPACIOUS_NAV_ITEM = {
  xs: { height: 'size-28', paddingInline: 'space-10', gap: 'space-4',  iconSize: 'size-14' },
  sm: { height: 'size-40', paddingInline: 'space-14', gap: 'space-6',  iconSize: 'size-16' },
  md: { height: 'size-48', paddingInline: 'space-20', gap: 'space-10', iconSize: 'size-20' },
  lg: { height: 'size-56', paddingInline: 'space-28', gap: 'space-12', iconSize: 'size-24' },
} satisfies Record<string, NavItemTier>

const SPACIOUS_CONTAINER = {
  sm: { padding: 'space-16', gap: 'space-12', radius: '8' },
  md: { padding: 'space-24', gap: 'space-16', radius: '12' },
  lg: { padding: 'space-32', gap: 'space-20', radius: '16' },
  xl: { padding: 'space-48', gap: 'space-32', radius: '20' },
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
    xs: { height: 'size-16', paddingInline: 'space-4',  gap: 'space-2', iconSize: 'size-10', radius: '2' },
    sm: { height: 'size-20', paddingInline: 'space-6',  gap: 'space-4', iconSize: 'size-12', radius: '4' },
    md: { height: 'size-24', paddingInline: 'space-8',  gap: 'space-4', iconSize: 'size-14', radius: '4' },
    lg: { height: 'size-32', paddingInline: 'space-12', gap: 'space-4', iconSize: 'size-16', radius: '4' },
    xl: { height: 'size-40', paddingInline: 'space-16', gap: 'space-6', iconSize: 'size-20', radius: '6' },
  },
} satisfies Record<string, Record<string, AnatomyTier>>

const DENSE_LABEL_CONTROL = {
  xs: { paddingInline: 'space-2', paddingBlock: 'space-1', gap: 'space-1', iconSize: 'size-8',  radius: '2' },
  sm: { paddingInline: 'space-3', paddingBlock: 'space-1', gap: 'space-2', iconSize: 'size-10', radius: '2' },
  md: { paddingInline: 'space-4', paddingBlock: 'space-2', gap: 'space-3', iconSize: 'size-10', radius: '2' },
  lg: { paddingInline: 'space-6', paddingBlock: 'space-3', gap: 'space-3', iconSize: 'size-12', radius: '4' },
} satisfies Record<string, LabelControlTier>

const DENSE_NAV_ITEM = {
  xs: { height: 'size-16', paddingInline: 'space-4',  gap: 'space-2', iconSize: 'size-10' },
  sm: { height: 'size-20', paddingInline: 'space-6',  gap: 'space-4', iconSize: 'size-12' },
  md: { height: 'size-24', paddingInline: 'space-8',  gap: 'space-4', iconSize: 'size-14' },
  lg: { height: 'size-32', paddingInline: 'space-12', gap: 'space-6', iconSize: 'size-16' },
} satisfies Record<string, NavItemTier>

const DENSE_CONTAINER = {
  sm: { padding: 'space-8',  gap: 'space-4',  radius: '4' },
  md: { padding: 'space-10', gap: 'space-6',  radius: '4' },
  lg: { padding: 'space-14', gap: 'space-10', radius: '6' },
  xl: { padding: 'space-20', gap: 'space-14', radius: '8' },
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
