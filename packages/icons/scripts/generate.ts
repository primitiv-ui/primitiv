import { optimize } from 'svgo'
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs'
import { join, basename } from 'path'

const SVG_DIR = join(import.meta.dirname, '../icons/svg')
const OUT_DIR = join(import.meta.dirname, '../src/icons')

mkdirSync(OUT_DIR, { recursive: true })

function toPascalCase(name: string): string {
  return name
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

// Exported-name overrides, keyed by SVG filename stem.
//
// A component name normally comes straight from the filename, which is what
// keeps the SVG asset, the Figma glyph and the React export in lockstep — so
// only add an entry here for a genuine collision, never for taste.
//
// `grid` is the one entry: `Grid` is also a registry layout component (RFC
// 0022), and a consumer importing both in the same module gets a
// duplicate-identifier error that fails the build outright (which is exactly
// how this was found — the kitchen-sink imports both). Renaming the asset to
// `grid-icon.svg` would fix it too, but it pushes a redundant "-icon" suffix
// onto the SVG and the Figma glyph, where it reads as a mistake. Overriding
// only the exported symbol leaves both of those named `grid`.
const NAME_OVERRIDES: Record<string, string> = {
  grid: 'GridIcon',
}

function extractInnerSvg(svgString: string): string {
  const match = svgString.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)
  if (!match) throw new Error('No <svg> element found')
  return match[1].trim()
}

// Strip hardcoded fill values so inner elements inherit currentColor from the IconBase root.
// fill="none" is also removed — these are solid fill icons with no transparent cutouts.
function stripFills(inner: string): string {
  return inner.replace(/\s+fill="[^"]*"/g, '')
}

// Convert SVG attribute names to JSX-compatible camelCase equivalents
function svgAttrsToJsx(inner: string): string {
  return inner
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/stroke-dasharray=/g, 'strokeDasharray=')
    .replace(/class=/g, 'className=')
}

const svgFiles = readdirSync(SVG_DIR)
  .filter((f) => f.endsWith('.svg'))
  .sort()

const componentNames: string[] = []

for (const file of svgFiles) {
  const svgContent = readFileSync(join(SVG_DIR, file), 'utf-8')
  const stem = basename(file, '.svg')
  const componentName = NAME_OVERRIDES[stem] ?? toPascalCase(stem)
  // Prose names the glyph, not the symbol, so an overridden entry documents
  // itself as "The Grid icon." rather than "The GridIcon icon."
  const glyphName = toPascalCase(stem)

  const { data: optimized } = optimize(svgContent, {
    plugins: [
      {
        name: 'preset-default',
        params: { overrides: { removeViewBox: false } },
      },
    ],
  })

  const innerSvg = svgAttrsToJsx(stripFills(extractInnerSvg(optimized)))

  const component = `import type { ReactElement } from 'react'
import type { IconProps } from '../types.ts'
import { IconBase } from '../IconBase.tsx'

/**
 * The ${glyphName} icon.
 *
 * A fill-based SVG that inherits \`currentColor\` and scales via the
 * \`size\` prop. Accepts all native \`<svg>\` attributes (see {@link IconProps}).
 *
 * @example
 * \`\`\`tsx
 * <${componentName} size={20} aria-label="${glyphName}" />
 * \`\`\`
 */
export const ${componentName} = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    ${innerSvg}
  </IconBase>
)
`

  writeFileSync(join(OUT_DIR, `${componentName}.tsx`), component)
  componentNames.push(componentName)
  console.log(`✓ ${componentName}`)
}

const barrel = componentNames
  .map((name) => `export { ${name} } from './${name}.tsx'`)
  .join('\n')

writeFileSync(join(OUT_DIR, 'index.ts'), barrel + '\n')
console.log(`\n→ wrote ${componentNames.length} icons to src/icons/`)
