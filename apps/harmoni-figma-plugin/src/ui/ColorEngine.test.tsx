import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColorEngine } from './ColorEngine'

const { colorsState } = vi.hoisted(() => ({
  colorsState: {
    overrides: {} as Record<string, unknown>,
  },
}))

vi.mock('./useColors', () => ({
  useColors: () => ({
    wasmReady: true,
    neutralWhite: '#ffffff',
    neutralBlack: '#000000',
    effectiveWhite: '#ffffff',
    effectiveBlack: '#000000',
    tintSource: null,
    tintStrength: 0,
    tintSpread: 0,
    bow: 0,
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
    handleTintSpreadChange: vi.fn(),
    handleBowChange: vi.fn(),
    handleRemoveTint: vi.fn(),
    handleLightRampPaddingLeft: vi.fn(),
    handleLightRampPaddingRight: vi.fn(),
    handleDarkRampPaddingLeft: vi.fn(),
    handleDarkRampPaddingRight: vi.fn(),
    ...colorsState.overrides,
  }),
}))

describe('ColorEngine duotone spread', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
      getImageData: vi.fn().mockReturnValue({ data: [255, 0, 0, 255] }),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext
  })

  afterEach(() => {
    colorsState.overrides = {}
  })

  it('hides the duotone spread slider until a tint source is set', () => {
    colorsState.overrides = { tintSource: null }
    render(<ColorEngine />)

    expect(screen.queryByRole('slider', { name: /spread/i })).toBeNull()
  })

  it('exposes a keyboard-reachable bipolar spread slider once tinted', async () => {
    colorsState.overrides = { tintSource: 'oklch(50% 0.2 30)', tintSpread: 15 }
    const user = userEvent.setup()
    render(<ColorEngine />)

    // Tab through white, black, brand, the use-as-tint button and the tint
    // strength slider to land on the spread slider — sixth in the tab order.
    for (let i = 0; i < 6; i++) await user.tab()

    const spread = screen.getByRole('slider', { name: /spread/i })
    expect(spread).toHaveFocus()
    expect(spread).toHaveAttribute('min', '-30')
    expect(spread).toHaveAttribute('max', '30')
    expect(spread).toHaveValue('15')
  })
})

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
