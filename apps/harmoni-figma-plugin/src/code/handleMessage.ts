import type { UiMessage } from '../shared/messages'
import { applyPalette } from './applyPalette'

/** Routes a message received from the plugin UI to its sandbox action. */
export async function handleUiMessage(message: UiMessage): Promise<void> {
  switch (message.type) {
    case 'close':
      figma.closePlugin()
      return
    case 'apply-palette':
      await applyPalette(message.ramps)
      return
  }
}
