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

const COMFORTABLE_SPEC: ContextSpec = {
  variables: [
    ...typographyVars('label', COMFORTABLE_TYPOGRAPHY.label),
    ...typographyVars('body', COMFORTABLE_TYPOGRAPHY.body),
    ...typographyVars('heading', COMFORTABLE_TYPOGRAPHY.heading),
    ...typographyVars('display', COMFORTABLE_TYPOGRAPHY.display),
    ...typographyVars('overline', COMFORTABLE_TYPOGRAPHY.overline),
    ...anatomyVars('framed-control', COMFORTABLE_ANATOMY['framed-control']),
  ],
  textStyles: [
    ...typographyTextStyles('Comfortable', 'label', COMFORTABLE_TYPOGRAPHY.label),
    ...typographyTextStyles('Comfortable', 'body', COMFORTABLE_TYPOGRAPHY.body),
    ...typographyTextStyles('Comfortable', 'heading', COMFORTABLE_TYPOGRAPHY.heading),
    ...typographyTextStyles('Comfortable', 'display', COMFORTABLE_TYPOGRAPHY.display),
    ...typographyTextStyles('Comfortable', 'overline', COMFORTABLE_TYPOGRAPHY.overline),
  ],
}

export const CONTEXT_SPECS: Record<ContextName, ContextSpec> = {
  comfortable: COMFORTABLE_SPEC,
}
