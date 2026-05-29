import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColorEngine } from './ColorEngine'

vi.mock('./useColors', () => ({
  useColors: () => ({
    wasmReady: true,
    neutralWhite: '#ffffff',
    neutralBlack: '#000000',
    effectiveWhite: '#ffffff',
    effectiveBlack: '#000000',
    tintSource: null,
    tintStrength: 0,
    neutralPalette: undefined,
    neutralDarkPalette: undefined,
    brand: {
      hex: '#c0392b',
      lightPalette: {
          swatches: [{
            oklch: 'oklch(50% 0.2 30)',
            label: { Number: 500 },
            best_foreground: { oklch: 'oklch(100% 0 0)', label: { Name: 'white' } },
            contrast_result: { display_ratio: '4.5:1', rating: 'AA' },
          }],
        },
      darkPalette: undefined,
      lightRampPaddingLeft: 0,
      lightRampPaddingRight: 0,
      darkRampPaddingLeft: 0,
      darkRampPaddingRight: 0,
    },
    handleNeutralWhiteChange: vi.fn(),
    handleNeutralBlackChange: vi.fn(),
    handleBrandChange: vi.fn(),
    handleUseAsTint: vi.fn(),
    handleTintStrengthChange: vi.fn(),
    handleRemoveTint: vi.fn(),
    handleLightRampPaddingLeft: vi.fn(),
    handleLightRampPaddingRight: vi.fn(),
    handleDarkRampPaddingLeft: vi.fn(),
    handleDarkRampPaddingRight: vi.fn(),
  }),
}))

describe('ColorEngine ramp name', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
      getImageData: vi.fn().mockReturnValue({ data: [255, 0, 0, 255] }),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext

    vi.spyOn(window, 'postMessage')
  })

  it('renders a ramp name field defaulting to "brand"', () => {
    render(<ColorEngine />)
    expect(screen.getByRole('textbox', { name: /ramp name/i })).toHaveValue('brand')
  })

  it('uses the ramp name field value when applying to Figma', async () => {
    const user = userEvent.setup()
    render(<ColorEngine />)

    const nameInput = screen.getByRole('textbox', { name: /ramp name/i })
    await user.clear(nameInput)
    await user.type(nameInput, 'danger')
    await user.click(screen.getByRole('button', { name: /apply to figma/i }))

    expect(window.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginMessage: expect.objectContaining({
          ramps: expect.arrayContaining([
            expect.objectContaining({ name: 'danger', light: expect.any(Array) }),
          ]),
        }),
      }),
      '*',
    )
  })
})
