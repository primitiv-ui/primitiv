import breakpoint from './breakpoint.json'
import context from './context.json'
import elevation from './elevation.json'
import intent from './intent.json'
import interaction from './interaction.json'
import motion from './motion.json'
import palette from './palette.json'
import primitives from './primitives.json'

/*
 * A token's path becomes its custom-property name segment by segment, so a key
 * that repeats its group's name doubles in every stylesheet: `space.space-4`
 * emitted as `--primitiv-space-space-4`. The scale keys belong bare under their
 * group (`space.4`), the way `radii.4` and `opacity.40` already are.
 */

const SOURCES: Record<string, unknown> = {
  breakpoint,
  context,
  elevation,
  intent,
  interaction,
  motion,
  palette,
  primitives,
}

function stutters(node: unknown, path: string[], out: string[]): string[] {
  if (node === null || typeof node !== 'object') return out
  const group = path[path.length - 1]
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue
    if (group !== undefined && key.startsWith(`${group}-`)) out.push([...path, key].join('.'))
    stutters(child, [...path, key], out)
  }
  return out
}

describe('token naming', () => {
  it("no source file has a key that repeats its group's name", () => {
    const found = Object.entries(SOURCES).flatMap(([file, document]) => stutters(document, [file], []))
    expect(found).toEqual([])
  })
})
