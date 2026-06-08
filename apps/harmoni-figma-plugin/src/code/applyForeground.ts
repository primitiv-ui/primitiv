import type { ForegroundSource, PairedRampData } from '../shared/messages'
import { findOrCreateCollection, findOrCreateVariable } from './figmaIdempotent'

const PALETTE_COLLECTION = 'Primitives / Palette'
const FOREGROUND_COLLECTION = 'Primitives / Foreground'

function ensureModes(collection: VariableCollection): {
  lightModeId: string
  darkModeId: string
} {
  const modes = collection.modes
  const lightMode = modes.find((m) => m.name === 'Light')
  const darkMode = modes.find((m) => m.name === 'Dark')

  const lightModeId = lightMode
    ? lightMode.modeId
    : (collection.renameMode(modes[0].modeId, 'Light'), modes[0].modeId)

  const darkModeId = darkMode ? darkMode.modeId : collection.addMode('Dark')

  return { lightModeId, darkModeId }
}

/**
 * The `Primitives / Palette` variable name a chosen foreground aliases to.
 * Harmonious tiers reference the ramp's own 50/900; the soft/pure tiers
 * reference the white/black anchors (soft = engine-validated `color/white`,
 * pure = the `color/absolute-white` constant). Returns `null` for an
 * unrecognised source.
 */
function targetName(source: ForegroundSource, rampName: string): string | null {
  switch (source) {
    case 'Step900':
      return `color/${rampName}/900`
    case 'Step50':
      return `color/${rampName}/50`
    case 'SoftWhite':
      return 'color/white'
    case 'SoftBlack':
      return 'color/black'
    case 'PureWhite':
      return 'color/absolute-white'
    case 'PureBlack':
      return 'color/absolute-black'
    default:
      return null
  }
}

/**
 * Writes the `Primitives / Foreground` collection: one
 * `foreground/<ramp>/<step>` variable per ramp step, aliased (per Light/Dark
 * mode) to whichever palette variable the engine's contrast audit chose. Run
 * after `applyPalette` so the alias targets already exist. A step whose target
 * is absent (e.g. a pure-white tier with no `color/absolute-white` constant in
 * the file) is skipped rather than written as a broken alias.
 */
export async function applyForeground(ramps: PairedRampData[]): Promise<void> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync()
  const palette = collections.find((c) => c.name === PALETTE_COLLECTION)
  if (!palette) return

  const allVars = await figma.variables.getLocalVariablesAsync()
  const paletteByName = new Map<string, Variable>()
  for (const v of allVars) {
    if (v.variableCollectionId === palette.id) paletteByName.set(v.name, v)
  }

  const { value: collection } = await findOrCreateCollection(FOREGROUND_COLLECTION)
  const { lightModeId, darkModeId } = ensureModes(collection)

  for (const ramp of ramps) {
    for (let i = 0; i < ramp.light.length; i++) {
      const lightSwatch = ramp.light[i]
      const darkSwatch = ramp.dark?.[i] ?? lightSwatch
      const lightSource = lightSwatch.foregroundSource
      if (!lightSource) continue
      const darkSource = darkSwatch.foregroundSource ?? lightSource

      const lightName = targetName(lightSource, ramp.name)
      const darkName = targetName(darkSource, ramp.name)
      const lightTarget = lightName ? paletteByName.get(lightName) : undefined
      const darkTarget = darkName ? paletteByName.get(darkName) : undefined
      if (!lightTarget) continue

      const { value: variable } = await findOrCreateVariable(
        `foreground/${ramp.name}/${lightSwatch.step}`,
        collection,
        'COLOR',
      )
      variable.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: lightTarget.id })
      variable.setValueForMode(darkModeId, {
        type: 'VARIABLE_ALIAS',
        id: (darkTarget ?? lightTarget).id,
      })
    }
  }
}
