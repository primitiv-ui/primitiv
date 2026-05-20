import { handleUiMessage } from './handleMessage'
import { createFigmaMock } from './figma.mock'

describe('handleUiMessage', () => {
  it('closes the plugin when it receives a close message', () => {
    const figmaMock = createFigmaMock()
    vi.stubGlobal('figma', figmaMock)

    handleUiMessage({ type: 'close' })

    expect(figmaMock.closePlugin).toHaveBeenCalledOnce()
  })

  it('replies with plugin-ready when the UI announces it is ready', () => {
    const figmaMock = createFigmaMock()
    figmaMock.currentPage.name = 'Design Tokens'
    vi.stubGlobal('figma', figmaMock)

    handleUiMessage({ type: 'ui-ready' })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'plugin-ready',
      pageName: 'Design Tokens',
    })
  })
})
