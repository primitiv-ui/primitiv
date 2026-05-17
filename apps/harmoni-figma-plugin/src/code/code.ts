import { handleUiMessage } from './handleMessage'
import type { SandboxMessage } from '../shared/messages'

// Sandbox entry point. Figma runs this in the plugin sandbox and exposes
// the built UI bundle as the `__html__` global.
figma.showUI(__html__, { width: 320, height: 260, themeColors: true })

const ready: SandboxMessage = {
  type: 'plugin-ready',
  pageName: figma.currentPage.name,
}
figma.ui.postMessage(ready)

figma.ui.onmessage = handleUiMessage
