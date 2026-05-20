import type { UiMessage } from '../shared/messages'

/** Routes a message received from the plugin UI to its sandbox action. */
export function handleUiMessage(message: UiMessage): void {
  switch (message.type) {
    case 'close':
      figma.closePlugin()
      return
  }
}
