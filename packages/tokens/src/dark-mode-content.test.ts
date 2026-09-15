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
// `content/muted` and `action/link/foreground/default` were added after a
// contrast audit (docs/interface-audit.md, 2026-08-15 `better-colors`) found
// both failing in dark mode while passing in light — 4.20:1 and 3.78:1 against
// `surface/default`, missing 4.5:1. Neither was covered here, which is why the
// guard above did not catch them.
//
// CORRECTION (2026-08-17): an earlier version of this comment claimed the link's
// hover and active steps were "already correctly theme-inverted (dark 500 → 300 →
// 200 lighter)". They were not — in the DARK ramp a higher step is lighter, so
// 500 → 300 → 200 descends toward black and measured 5.95:1 → 1.74:1 → 1.33:1.
// The whole dark state set was broken, not just `default`, and fixing `default`
// alone made the jump to a near-black hover more obvious rather than less.
//
// The lesson is in the `action/link/foreground` describe block at the end of this
// file: a per-token contrast check cannot see a state ramp running the wrong way,
// because it only ever measures the resting value.
describe.each([
  'content/primary',
  'content/secondary',
  'content/muted',
  'action/link/foreground/default',
] as const)('%s', (token) => {
  it('resolves to a different colour in light vs dark mode', () => {
    expect(intentColor('light', token)).not.toBe(intentColor('dark', token))
  })

})

// The neutral alpha ramp (Path A): the mode's veil colour — the neutral ramp's
// 900 end (soft-black in light, soft-white in dark) — held constant across all
// ten steps while only the alpha byte climbs. Guards both the anchor (the rgb
// part must be the veil, so the ramp inverts with the theme) and the curve
// (strictly increasing opacity).
describe('color/neutral-alpha ramp', () => {
  const steps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const

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

// The brand alpha ramp: the same construction as neutral-alpha (one anchor
// colour, ten climbing alpha bytes) but anchored on `color.brand.500`, which is
// the SAME hex in both themes. That is what makes this ramp the exception to the
// mirror rule above — a `brand-alpha-inverse` companion would be identical to
// `brand-alpha`, so it does not exist. Added for `action/primary/soft`, the
// Stepper's current-step halo: `border/focus` and `action/primary/default` both
// resolve to #236ce1, so a primary ring on the current marker would be
// pixel-identical to the focus ring; a soft tint is what separates them.
describe('color/brand-alpha ramp', () => {
  const steps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const

  it('resolves identically in light and dark mode, so it needs no inverse companion', () => {
    for (const step of steps) {
      expect(resolveRef('light', `{color.brand-alpha.${step}}`)).toBe(resolveRef('dark', `{color.brand-alpha.${step}}`))
    }
  })

  it('backs action/primary/soft in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      expect(intentColor(mode, 'action/primary/soft')).toBe(resolveRef(mode, '{color.brand-alpha.300}'))
    }
  })
})

// Surfaces and borders that are supposed to track the theme (paler in light,
// darker in dark) rather than stay fixed.
describe.each([
  'surface/subtle',
  'surface/raised',
  'surface/overlay',
  'surface/floating',
  'surface/inverse',
  'surface/sunken',
  'border/subtle',
  'border/default',
  'table/row/stripe',
  'table/row/hover',
  'table/row/selected',
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
  'tree/row/hover',
  'tree/row/selected',
] as const)('%s', (token) => {
  it('resolves to a different colour in light vs dark mode', () => {
    expect(intentColor('light', token)).not.toBe(intentColor('dark', token))
  })
})


// The swapped-index guard above only asserts light ≠ dark, which is too weak for
// an OPAQUE background: `table/row/selected` was light #cbe5ff / dark #c8edff —
// two different pale blues, so it passed that check while rendering a glaring


/*
 * The sibling property the block above does not cover: a disabled link must be
 * QUIETER than a resting one.
 *
 * Both modes shipped `disabled` aliasing the exact step `default` does
 * (`brand.500` light, `brand.600` dark), so a disabled link rendered
 * identically to an active one — indistinguishable to everyone, and to a
 * keyboard user the only cue that it is unavailable. The states block could
 * not see it: it only ever compared hover and active.
 *
 * The companion assertion — that a disabled link is measurably quieter than a
 * resting one — needs the engine's contrast maths, so it lives in
 * `crates/harmoni-core/tests/token_source_colours.rs`. It is also meaningful
 * only for `link`, whose foreground genuinely sits on the page surface;
 * `primary`/`secondary`/`danger` foregrounds sit on their own disabled
 * backgrounds. The equality below needs no such care, so it covers all four —
 * and it is the invariant that would have caught this on any of them.
 */
describe('disabled action foregrounds', () => {
  it.each(['light', 'dark'] as const)(
    '%s mode: no disabled foreground reuses its own resting colour',
    (mode) => {
      for (const family of ['primary', 'secondary', 'danger', 'link']) {
        const resting = intentColor(mode, `action/${family}/foreground/default`)
        const disabled = intentColor(mode, `action/${family}/foreground/disabled`)
        expect(disabled, `action/${family}/foreground`).not.toBe(resting)
      }
    },
  )
})
