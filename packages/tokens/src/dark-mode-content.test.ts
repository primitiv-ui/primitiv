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

function contentColor(mode: Mode, role: string): string {
  const node = (intent as Record<Mode, { content: Record<string, DtcgNode> }>)[mode].content[role]
  return resolveRef(mode, node.$value as string)
}

function surfaceColor(mode: Mode, role: string): string {
  const node = (intent as Record<Mode, { surface: Record<string, DtcgNode> }>)[mode].surface[role]
  return resolveRef(mode, node.$value as string)
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

// Regression guard for the swapped-index bug: `content.primary` and
// `content.secondary` were aliased to the mirror-opposite neutral step in
// dark mode (`neutral.50`/`neutral.200`), but the dark neutral ramp is
// *already* the light ramp inverted (`dark.neutral.50 === light.neutral.900`),
// so the swap doubly inverted and landed both modes on the same near-black
// hex — invisible text on a dark background.
describe.each(['primary', 'secondary'] as const)('content/%s', (role) => {
  it('resolves to a different colour in light vs dark mode', () => {
    expect(contentColor('light', role)).not.toBe(contentColor('dark', role))
  })

  it('meets WCAG AA (4.5:1) against surface/default in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const ratio = contrastRatio(contentColor(mode, role), surfaceColor(mode, 'default'))
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    }
  })
})
