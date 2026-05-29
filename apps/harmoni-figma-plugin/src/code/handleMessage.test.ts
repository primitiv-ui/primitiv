import { handleUiMessage } from './handleMessage'
import { createFigmaMock } from './figma.mock'

vi.mock('./applyPalette', () => ({
  applyPalette: vi.fn(() => Promise.resolve()),
}))

describe('handleUiMessage', () => {
  it('closes the plugin when it receives a close message', () => {
    const figmaMock = createFigmaMock()
    vi.stubGlobal('figma', figmaMock)

    handleUiMessage({ type: 'close' })

    expect(figmaMock.closePlugin).toHaveBeenCalledOnce()
  })

  it('delegates to applyPalette when it receives an apply-palette message', async () => {
    const { applyPalette } = await import('./applyPalette')
    vi.stubGlobal('figma', createFigmaMock())
    const ramps = [{ name: 'neutral', light: [] }]
    const singles = [{ name: 'white', rgba: { r: 1, g: 1, b: 1, a: 1 } }]

    await handleUiMessage({ type: 'apply-palette', ramps, singles })

    expect(applyPalette).toHaveBeenCalledWith(ramps, singles)
  })
})
