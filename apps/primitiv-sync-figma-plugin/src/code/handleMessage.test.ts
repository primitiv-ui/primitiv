import { handleUiMessage } from './handleMessage'
import { createFigmaMock } from './figma.mock'

describe('handleUiMessage', () => {
  it('closes the plugin when it receives a close message', () => {
    const figmaMock = createFigmaMock()
    vi.stubGlobal('figma', figmaMock)

    handleUiMessage({ type: 'close' })

    expect(figmaMock.closePlugin).toHaveBeenCalledOnce()
  })
})
