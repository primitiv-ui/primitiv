import palette from './palette.json'
import intent from './intent.json'

type Mode = 'light' | 'dark'
type DtcgNode = { $type?: string; $value?: unknown; [key: string]: unknown }

/**
 * Resolve a DTCG alias (`{color.neutral.900}`) or literal value against a
 * mode's palette tree, following chained aliases.
 */
function resolveRef(mode: Mode, ref: string): string {
  if (!ref.startsWith('{')) return ref
  const path = ref.slice(1, -1).split('.')
  let node: DtcgNode = (palette as Record<Mode, DtcgNode>)[mode]
  for (const key of path) node = node[key] as DtcgNode
  return resolveRef(mode, node.$value as string)
}

/** Resolve a slash-separated Intent token (`"surface/raised"`) to its hex colour in `mode`. */
function intentColor(mode: Mode, token: string): string {
  let node: DtcgNode = (intent as Record<Mode, DtcgNode>)[mode]
  for (const key of token.split('/')) node = node[key] as DtcgNode
  const value = node.$value as string
  return value.startsWith('{') ? resolveRef(mode, value) : value
}

/** WCAG relative luminance (sRGB, 0-1). */
function luminance(hex: string): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio between two colours (1-21). */
function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

// Regression guard for the swapped-index bug (verified against the Figma
// Intent collection, which always resolves color/neutral/* through the
// Light-mode ramp — Dark-mode Intent variables pick a *different* neutral
// step, not a different ramp). Our codebase instead carries a separately
// generated Dark ramp that is already the Light ramp's near-mirror
// (`dark.neutral.50 ≈ light.neutral.900`), so reproducing the same visual
// role in Dark mode means picking the same or a hex-nearest step in *our*
// Dark ramp — not re-swapping the index a second time. Several tokens were
// swapped a second time, cancelling the intended flip and landing both
// modes on the same (or a same-toned) colour.
describe.each(['content/primary', 'content/secondary'] as const)('%s', (token) => {
  it('resolves to a different colour in light vs dark mode', () => {
    expect(intentColor('light', token)).not.toBe(intentColor('dark', token))
  })

  it('meets WCAG AA (4.5:1) against surface/default in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const ratio = contrastRatio(intentColor(mode, token), intentColor(mode, 'surface/default'))
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    }
  })
})

// The neutral alpha ramp (Path A): the mode's veil colour — the neutral ramp's
// 900 end (soft-black in light, soft-white in dark) — held constant across all
// ten steps while only the alpha byte climbs. Guards both the anchor (the rgb
// part must be the veil, so the ramp inverts with the theme) and the curve
// (strictly increasing opacity).
describe('color/neutral-alpha ramp', () => {
  const steps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const

  it.each(['light', 'dark'] as const)("%s mode anchors every step on the mode's veil colour", (mode) => {
    const veil = resolveRef(mode, '{color.neutral.900}')
    for (const step of steps) {
      expect(resolveRef(mode, `{color.neutral-alpha.${step}}`).slice(0, 7)).toBe(veil)
    }
  })

  it.each(['light', 'dark'] as const)('%s mode climbs a strictly increasing alpha curve', (mode) => {
    const alphas = steps.map((step) => parseInt(resolveRef(mode, `{color.neutral-alpha.${step}}`).slice(7, 9), 16))
    for (let i = 1; i < alphas.length; i++) {
      expect(alphas[i]).toBeGreaterThan(alphas[i - 1])
    }
  })

  // The inverse companion: every step is the OTHER theme's neutral-alpha step,
  // so each mode carries the opposite veil (soft-white in light, soft-black in
  // dark). It exists for Figma's dark step-swap idiom — the file resolves the
  // Palette collection through Light mode even on dark frames, so dark Intent
  // variables alias neutral-alpha-inverse to reach the white veil — and the
  // exact mirror keeps a variables backup a no-op.
  it.each([
    ['light', 'dark'],
    ['dark', 'light'],
  ] as const)("neutral-alpha-inverse in %s mode mirrors the %s mode's neutral-alpha ramp exactly", (mode, other) => {
    for (const step of steps) {
      expect(resolveRef(mode, `{color.neutral-alpha-inverse.${step}}`)).toBe(
        resolveRef(other, `{color.neutral-alpha.${step}}`),
      )
    }
  })
})

// Surfaces and borders that are supposed to track the theme (paler in light,
// darker in dark) rather than stay fixed.
describe.each([
  'surface/subtle',
  'surface/raised',
  'surface/overlay',
  'surface/inverse',
  'surface/sunken',
  'border/subtle',
  'border/default',
  'table/row/stripe',
  'table/row/hover',
  'action/secondary/default',
  'action/secondary/hover',
  'action/secondary/active',
  'action/secondary/disabled',
  'action/secondary/foreground/default',
  'action/secondary/border/default',
  'action/secondary/border/hover',
  'action/secondary/border/disabled',
  'action/ghost/hover',
  'action/ghost/active',
] as const)('%s', (token) => {
  it('resolves to a different colour in light vs dark mode', () => {
    expect(intentColor('light', token)).not.toBe(intentColor('dark', token))
  })
})

// `surface/selected` (the ToggleGroup thumb) and `content/on-selected` (its
// label) are the deliberate exception: RFC 0017 requires them to read as
// light-surface-with-dark-label in *both* themes, so the thumb keeps lifting
// off a track that itself goes dark in dark mode. A near-1 contrast ratio
// between the two modes confirms neither one flipped.
describe('surface/selected and content/on-selected', () => {
  it('stay visually consistent (not flipped) between light and dark mode', () => {
    for (const token of ['surface/selected', 'content/on-selected'] as const) {
      const ratio = contrastRatio(intentColor('light', token), intentColor('dark', token))
      expect(ratio).toBeLessThan(1.25)
    }
  })

  it('content/on-selected meets WCAG AA (4.5:1) against surface/selected in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const ratio = contrastRatio(intentColor(mode, 'content/on-selected'), intentColor(mode, 'surface/selected'))
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    }
  })
})
