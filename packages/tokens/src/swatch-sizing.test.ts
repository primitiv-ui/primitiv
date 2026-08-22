import context from './context.json'
import primitives from './primitives.json'

/*
 * `swatch.*` — the geometry of a Harmoni colour swatch.
 *
 * Why it needs its own family rather than borrowing one: a swatch is not a
 * control (`framed-control.*` is a thing you click) and not a surface
 * (`surface.*` is a thing you put content on). It is a specimen — a colour
 * box that prints facts about itself — and its box wants to grow far past any
 * control height at `xl` while its padding stays tight. Borrowing either
 * family would have coupled it to a scale chosen for a different job.
 *
 * The two ladders below are what make the `Size` and density axes mean
 * anything. They are asserted rather than eyeballed because a single
 * mis-keyed alias — `{space.space-8}` where `{space.space-4}` belongs — is
 * invisible in a 120-cell table and shows up only as one size looking wrong.
 */

type Mode = 'dense' | 'compact' | 'comfortable' | 'spacious'
type DtcgNode = { $type?: string; $value?: unknown; [key: string]: unknown }

/** Ascending by design: each mode is roomier than the one before it. */
const MODES: Mode[] = ['dense', 'compact', 'comfortable', 'spacious']
/** Ascending by design: each size is larger than the one before it. */
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const
const MEMBERS = ['box', 'min-height', 'radius', 'padding-inline', 'padding-block', 'gap'] as const

function member(mode: Mode, size: string, name: string): DtcgNode | undefined {
  const swatch = (context as Record<Mode, DtcgNode>)[mode].swatch as DtcgNode | undefined
  return (swatch?.[size] as DtcgNode | undefined)?.[name] as DtcgNode | undefined
}

/** Resolve a DTCG alias (`{space.space-8}`) against the primitive tree. */
function resolvePrimitive(ref: string): number {
  const path = ref.slice(1, -1).split('.')
  let node: DtcgNode = primitives as DtcgNode
  for (const key of path) node = node[key] as DtcgNode
  return node.$value as number
}

function value(mode: Mode, size: string, name: string): number {
  return resolvePrimitive(member(mode, size, name)?.$value as string)
}

describe('swatch sizing', () => {
  for (const mode of MODES) {
    for (const size of SIZES) {
      it(`${mode} / swatch / ${size} carries every member, aliased to a primitive`, () => {
        for (const name of MEMBERS) {
          const node = member(mode, size, name)
          expect(node, `${mode}.swatch.${size}.${name} is missing`).toBeDefined()
          expect(node?.$type).toBe('number')
          expect(String(node?.$value)).toMatch(/^\{[a-z-]+\.[a-z0-9-]+\}$/)
          expect(typeof resolvePrimitive(node?.$value as string)).toBe('number')
        }
      })
    }
  }

  for (const name of MEMBERS) {
    it(`${name} never shrinks as the size grows`, () => {
      for (const mode of MODES) {
        const ladder = SIZES.map((size) => value(mode, size, name))
        expect(ladder, `${mode}.swatch.*.${name}`).toEqual([...ladder].sort((a, b) => a - b))
      }
    })

    it(`${name} never shrinks as the density loosens`, () => {
      for (const size of SIZES) {
        const ladder = MODES.map((mode) => value(mode, size, name))
        expect(ladder, `*.swatch.${size}.${name}`).toEqual([...ladder].sort((a, b) => a - b))
      }
    })
  }
})
