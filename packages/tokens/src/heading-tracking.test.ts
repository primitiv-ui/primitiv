import context from './context.json'
import primitives from './primitives.json'

/*
 * Heading letter-spacing (docs/interface-audit.md, 2026-08-15 `better-typography`:
 * large headings want slightly negative tracking, and the `letter-spacing.tight` /
 * `.tighter` primitives existed with nothing consuming them).
 *
 * Why this needs a test at all: tracking here is **absolute** (the primitive ramp
 * emits `rem`, matching its `font-size` / `line-height` siblings in the same
 * family), so the correct step differs per density mode — `heading.h1` is 18px in
 * Dense and 88px in Spacious. That makes the source a 24-cell alias table, and a
 * mis-keyed cell is invisible by inspection: `{letter-spacing.tighter}` looks just
 * as plausible at h6 as at h1. The band assertion below is what ties each cell
 * back to the reason it was chosen.
 */

type Mode = 'dense' | 'compact' | 'comfortable' | 'spacious'
type DtcgNode = { $type?: string; $value?: unknown; [key: string]: unknown }

const MODES: Mode[] = ['dense', 'compact', 'comfortable', 'spacious']
const LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

/**
 * The conventional band for display tracking, relative to the level's own font
 * size. `LOOSEST` is the point below which a negative value stops being visible
 * as tracking at all (so a level either sits in the band or is exactly normal);
 * `TIGHTEST` is where letterforms start to collide. These are the two numbers the
 * alias table was chosen against, named here so a failure reads as "this cell
 * left the band" rather than "this cell is not -0.03".
 */
const BAND = { loosest: -0.01, tightest: -0.035 } as const

/** Resolve a DTCG alias (`{letter-spacing.snug}`) against the primitive tree. */
function resolvePrimitive(ref: string): number {
  const path = ref.slice(1, -1).split('.')
  let node: DtcgNode = primitives as DtcgNode
  for (const key of path) node = node[key] as DtcgNode
  return node.$value as number
}

/** A heading member's value in `mode`, resolved through its alias to a raw number. */
function headingValue(mode: Mode, level: string, member: string): number {
  const heading = (context as Record<Mode, DtcgNode>)[mode].heading as DtcgNode
  const node = (heading[level] as DtcgNode)[member] as DtcgNode | undefined
  if (node === undefined) throw new Error(`context.${mode}.heading.${level}.${member} is missing`)
  const value = node.$value
  return typeof value === 'string' ? resolvePrimitive(value) : (value as number)
}

describe('heading letter-spacing', () => {
  it.each(MODES)('%s mode: every level declares a letter-spacing', (mode) => {
    for (const level of LEVELS) {
      expect(() => headingValue(mode, level, 'letter-spacing')).not.toThrow()
    }
  })

  // The band is the whole point of the token: negative tracking at display sizes,
  // nothing at reading sizes. Expressed relative to the level's own font size,
  // because that is the quantity the eye judges — an absolute -1.2px is a
  // comfortable -0.025em at 48px and an unreadable -0.067em at 18px.
  it.each(MODES)('%s mode: tracking is either normal or inside the band', (mode) => {
    for (const level of LEVELS) {
      const em = headingValue(mode, level, 'letter-spacing') / headingValue(mode, level, 'font-size')
      expect(em).toBeLessThanOrEqual(0)
      if (em !== 0) {
        expect(em).toBeLessThanOrEqual(BAND.loosest)
        expect(em).toBeGreaterThanOrEqual(BAND.tightest)
      }
    }
  })

  it.each(MODES)('%s mode: tracking loosens as the heading level descends', (mode) => {
    const track = LEVELS.map((level) => headingValue(mode, level, 'letter-spacing'))
    for (let i = 1; i < track.length; i++) {
      expect(track[i]).toBeGreaterThanOrEqual(track[i - 1])
    }
  })

  it.each(LEVELS)('%s: tracking tightens as the density mode grows', (level) => {
    // MODES is ordered smallest type to largest, so tracking must never loosen
    // along it — the guard against a cell copied from the wrong mode's column.
    const track = MODES.map((mode) => headingValue(mode, level, 'letter-spacing'))
    for (let i = 1; i < track.length; i++) {
      expect(track[i]).toBeLessThanOrEqual(track[i - 1])
    }
  })
})
