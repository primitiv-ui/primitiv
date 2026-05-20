import type { SandboxMessage, UiMessage } from '../shared/messages'

/** Routes a message received from the plugin UI to its sandbox action. */
export function handleUiMessage(message: UiMessage): void {
  switch (message.type) {
    case 'ui-ready': {
      const ready: SandboxMessage = {
        type: 'plugin-ready',
        pageName: figma.currentPage.name,
      }
      figma.ui.postMessage(ready)
      return
    }
    case 'close':
      figma.closePlugin()
      return
  }
}
