import type { PairedRampData, SingleColorData } from '../shared/messages'
import { findOrCreateCollection, findOrCreateVariable } from './figmaIdempotent'

const COLLECTION_NAME = 'Primitives / Palette'

async function ensureModes(
  collection: VariableCollection,
): Promise<{ lightModeId: string; darkModeId: string }> {
  const modes = collection.modes

  const lightMode = modes.find((m) => m.name === 'Light')
  const darkMode = modes.find((m) => m.name === 'Dark')

  const lightModeId = lightMode
    ? lightMode.modeId
    : (collection.renameMode(modes[0].modeId, 'Light'), modes[0].modeId)

  const darkModeId = darkMode ? darkMode.modeId : collection.addMode('Dark')

  return { lightModeId, darkModeId }
}

export async function applyPalette(
  ramps: PairedRampData[],
  singles: SingleColorData[],
): Promise<void> {
  const { value: collection } = await findOrCreateCollection(COLLECTION_NAME)
  const { lightModeId, darkModeId } = await ensureModes(collection)

  for (const { name, rgba } of singles) {
    const { value: variable } = await findOrCreateVariable(`color/${name}`, collection, 'COLOR')
    variable.setValueForMode(lightModeId, rgba)
    variable.setValueForMode(darkModeId, rgba)
  }

  for (const ramp of ramps) {
    for (let i = 0; i < ramp.light.length; i++) {
      const lightSwatch = ramp.light[i]
      const darkSwatch = ramp.dark?.[i] ?? lightSwatch
      const { value: variable } = await findOrCreateVariable(
        `color/${ramp.name}/${lightSwatch.step}`,
        collection,
        'COLOR',
      )
      variable.setValueForMode(lightModeId, lightSwatch.rgba)
      variable.setValueForMode(darkModeId, darkSwatch.rgba)
    }
  }
}
