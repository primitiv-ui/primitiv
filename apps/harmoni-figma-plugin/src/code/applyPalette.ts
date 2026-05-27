import type { RampData } from '../shared/messages'
import { findOrCreateCollection, findOrCreateVariable } from './figmaIdempotent'

const COLLECTION_NAME = 'Primitives / Palette'

export async function applyPalette(ramps: RampData[]): Promise<void> {
  const { value: collection } = await findOrCreateCollection(COLLECTION_NAME)
  const modeId = collection.modes[0].modeId

  for (const ramp of ramps) {
    for (const swatch of ramp.swatches) {
      const varName = `color/${ramp.name}/${swatch.step}`
      const { value: variable } = await findOrCreateVariable(varName, collection, 'COLOR')
      variable.setValueForMode(modeId, swatch.rgba)
    }
  }
}
