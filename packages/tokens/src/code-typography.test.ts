import context from './context.json'
import primitives from './primitives.json'

/*
 * `code.*` is the mono typographic family — the one every colour value, hex,
 * ratio and percentage in Harmoni is set in.
 *
 * Why this needs a test: the family was authored size-first, so it shipped with
 * `font-size` and `line-height` and nothing else. That is invisible in the JSON
 * (a group with two members looks intentional) but it is not a usable family —
 * a Figma text style binds four members, so `code.*` could not be expressed as
 * a text style at all, and `font-family.mono` sat in the primitives with
 * nothing consuming it. This asserts the family is complete *and* that it is
 * the mono one, which is the whole reason it exists apart from `body`.
 */

type Mode = 'dense' | 'compact' | 'comfortable' | 'spacious'
type DtcgNode = { $type?: string; $value?: unknown; [key: string]: unknown }

const MODES: Mode[] = ['dense', 'compact', 'comfortable', 'spacious']
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

/** The members a Figma text style binds, plus the weight the CSS layer needs. */
const MEMBERS = {
  'font-family': 'string',
  'font-weight': 'number',
  'font-size': 'number',
  'line-height': 'number',
  'font-style': 'string',
} as const

function codeSize(mode: Mode, size: string): DtcgNode {
  const code = (context as Record<Mode, DtcgNode>)[mode].code as DtcgNode
  return code[size] as DtcgNode
}

/** Resolve a DTCG alias (`{font-family.mono}`) against the primitive tree. */
function resolvePrimitive(ref: string): unknown {
  const path = ref.slice(1, -1).split('.')
  let node: DtcgNode = primitives as DtcgNode
  for (const key of path) node = node[key] as DtcgNode
  return node.$value
}

describe('code typography', () => {
  for (const mode of MODES) {
    for (const size of SIZES) {
      it(`${mode} / code / ${size} is a complete typographic family`, () => {
        const entry = codeSize(mode, size)
        for (const [member, type] of Object.entries(MEMBERS)) {
          const node = entry[member] as DtcgNode | undefined
          expect(node, `${mode}.code.${size}.${member} is missing`).toBeDefined()
          expect(node?.$type).toBe(type)
        }
      })

      it(`${mode} / code / ${size} is set in the mono face`, () => {
        const family = codeSize(mode, size)['font-family'] as DtcgNode | undefined
        expect(family?.$value).toBe('{font-family.mono}')
        expect(resolvePrimitive(family?.$value as string)).toBe('JetBrains Mono')
      })
    }
  }
})
