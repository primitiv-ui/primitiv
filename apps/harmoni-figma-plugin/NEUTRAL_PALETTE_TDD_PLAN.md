# TDD Plan: Neutral Palettes in `harmoni-figma-plugin` (Ports & Adapters)

## Architecture

```
┌─────────────────────────────────────┐  ┌──────────────────────────────┐
│         UI context (iframe)         │  │   Sandbox context (code.ts)  │
│                                     │  │                               │
│  main.tsx                           │  │  handleUiMessage              │
│    ├─ HarmoniApiProvider (context)  │  │    └─ figma.variables.*       │
│    └─ MemoryRouter (production)     │  │            ▲                  │
│         └─ App (defines routes)     │  │     postMessage bridge        │
│              └─ /neutral            │  │     (deferred with Apply)     │
│                   └─ NeutralScreen  │  │                               │
│                        ├─ ColourPicker × 2                             │
│                        └─ PaletteRamp                                  │
│                             └─ SwatchChip × 10                         │
│                                     │  │                               │
│   NeutralPaletteViewModel           │  │                               │
│   (pure functions)                  │  │                               │
└─────────────────────────────────────┘  └──────────────────────────────┘
                   ▲
         renderWithProviders
    injects HarmoniApiPort + initialEntries
      (defaults: fakeHarmoniApi, ['/'])
```

Real adapters live in `main.tsx`. Tests never touch `main.tsx`. `App.tsx` is adapter-agnostic — it defines routes only, not providers. `main.tsx` wraps it in both `HarmoniApiProvider` and `MemoryRouter`.

**Three testing layers, nothing else:**

| Layer | What | How |
|---|---|---|
| **View model** | Pure functions: label formatting, payload building | Unit tests — plain function calls, no React, no jsdom |
| **Component** | Prop-driven display: `PaletteRamp`, `ColourPicker` | Unit tests — plain `render`, no providers |
| **Integration** | User interaction → API call → UI update | `renderWithProviders` + `initialEntries` + fake port |

Hooks are an implementation detail. There are no hook unit tests.

---

## Feature scope (this plan)

- **White and Black colour pickers** in the plugin UI (the "soft white" and "soft black" neutral endpoints)
- **Neutral ramp generation** — calling `generate_neutral_ramp` on the port whenever a picker changes
- **Preview** of the 10 generated swatches in the UI
- **Routing** — introducing React Router with a `/neutral` route; `MemoryRouter` + `initialEntries` in tests

Deferred (later plan): `Apply to Figma`, `Use as neutral colour tint`, `TintMode: Achromatic` toggle, idempotent update (overwrite existing collection instead of always creating a new one).

---

## File layout

```
src/
  shared/
    messages.ts                          ← unchanged for now (Apply deferred)
  ui/
    context/
      HarmoniApiContext.ts               ← createContext + useHarmoniApi hook
      HarmoniApiProvider.tsx             ← thin provider component
    ports/
      HarmoniApiPort.ts                  ← port interface (full harmoni-wasm surface)
    adapters/
      harmoniApiAdapter.ts               ← production wasm implementation
    view-model/
      neutralPaletteViewModel.ts         ← pure functions
      neutralPaletteViewModel.test.ts    ← unit tests (no React)
    components/
      PaletteRamp/
        PaletteRamp.tsx                  ← prop-driven: accepts Palette
        PaletteRamp.test.tsx             ← component unit tests (plain render)
      SwatchChip/
        SwatchChip.tsx                   ← prop-driven: accepts Swatch
        SwatchChip.test.tsx              ← component unit tests (plain render)
      ColourPicker/
        ColourPicker.tsx                 ← controlled: label + value + onChange
        ColourPicker.test.tsx            ← component unit tests (plain render)
    screens/
      NeutralScreen/
        NeutralScreen.tsx                ← reads from context, composes components
        NeutralScreen.test.tsx           ← integration tests
    test-utils/
      renderWithProviders.tsx            ← injection point: HarmoniApiPort + initialEntries
    neutralPalette.fixtures.ts           ← FIXTURE_PALETTE, fakeHarmoniApi
    App.tsx                              ← defines routes only — no providers, no adapters
    App.test.tsx                         ← verifies route-to-screen wiring
    main.tsx                             ← wires real adapters and MemoryRouter (not tested)
  code/
    handleMessage.ts                     ← unchanged for now (Apply deferred)
    handleMessage.test.ts                ← unchanged
    figma.mock.ts                        ← unchanged for now
```

---

## How testing works in a Figma plugin

A Figma plugin runs as two separate programs that never share memory:

| Context | What it can do | How we test it |
|---|---|---|
| **Sandbox** (`src/code/`) | Calls `figma.*` API, no DOM | `vi.stubGlobal('figma', createFigmaMock())` |
| **UI** (`src/ui/`) | React + DOM + harmoni-wasm, no `figma.*` | `renderWithProviders` + Testing Library |

The `harmoni-wasm` engine cannot be initialised in jsdom. Its correctness is proven by the Rust test suite (`cargo test`). The UI tests prove only that our code calls the engine with the right arguments and renders its output correctly — done via the `HarmoniApiPort` DI seam.

The postMessage bridge (routing UI actions to the sandbox) is deferred to the Apply to Figma plan.

Since the plugin UI runs in a sandboxed iframe with no real URL, `MemoryRouter` is used both in tests and production. `App.tsx` defines routes but owns no router; `main.tsx` wraps it. Tests get a `MemoryRouter` from `renderWithProviders` — passing `initialEntries` pre-selects a route without simulating navigation clicks.

---

## Port and context

```ts
// src/ui/ports/HarmoniApiPort.ts
import type {
  ContrastResult,
  Palette,
  PaletteSet,
  SoftNeutrals,
  TintMode,
} from 'harmoni-wasm'

export interface HarmoniApiPort {
  derive_soft_neutrals(brand: string, softness: number): SoftNeutrals
  generate_neutral_ramp(white: string, black: string, tint: TintMode): Palette
  generate_palette(hex: string, lightPadding: number, darkPadding: number): Palette
  generate_palette_pair(
    hex: string,
    lightLightness: number[],
    darkLightness: number[],
    lightPadding: number,
    darkPadding: number,
  ): PaletteSet
  generate_palette_with_light_padding(hex: string, lightPadding: number): Palette
  generate_palette_with_lightness(
    hex: string,
    lightness: number[],
    lightPadding: number,
    darkPadding: number,
  ): Palette
  get_contrast_rating(bg: string, fg: string): ContrastResult
  tint_neutrals(white: string, black: string, source: string, strength: number): SoftNeutrals
}
```

The interface names match the wasm export names exactly. This is intentional: the production adapter is a direct assignment.

```ts
// src/ui/context/HarmoniApiContext.ts
import { createContext, useContext } from 'react'
import type { HarmoniApiPort } from '../ports/HarmoniApiPort'

const HarmoniApiContext = createContext<HarmoniApiPort | null>(null)

export { HarmoniApiContext }

export function useHarmoniApi(): HarmoniApiPort {
  const api = useContext(HarmoniApiContext)
  if (!api) throw new Error('HarmoniApiPort not provided')
  return api
}
```

```tsx
// src/ui/context/HarmoniApiProvider.tsx
import type { HarmoniApiPort } from '../ports/HarmoniApiPort'
import { HarmoniApiContext } from './HarmoniApiContext'

export function HarmoniApiProvider({
  api,
  children,
}: {
  api: HarmoniApiPort
  children: React.ReactNode
}) {
  return (
    <HarmoniApiContext.Provider value={api}>
      {children}
    </HarmoniApiContext.Provider>
  )
}
```

The production adapter wraps the `harmoni` singleton from `engine.ts`. Because the port names match the wasm exports exactly, the adapter is a direct assignment with no wrapping logic:

```ts
// src/ui/adapters/harmoniApiAdapter.ts
import { harmoni } from '../engine'
import type { HarmoniApiPort } from '../ports/HarmoniApiPort'

export const harmoniApiAdapter: HarmoniApiPort = harmoni
```

Wired in the entry point — not tested:

```tsx
// src/ui/main.tsx  (addition)
createRoot(document.getElementById('root')!).render(
  <HarmoniApiProvider api={harmoniApiAdapter}>
    <MemoryRouter>
      <App />
    </MemoryRouter>
  </HarmoniApiProvider>,
)
```

---

## `renderWithProviders`

The single injection point for all UI tests. Wraps the component tree in both `HarmoniApiProvider` and `MemoryRouter`. The `initialEntries` option pre-selects a route, removing the need to simulate navigation clicks in route-specific tests.

```tsx
// src/ui/test-utils/renderWithProviders.tsx
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { type PropsWithChildren, type ReactElement, type JSX } from 'react'

import { HarmoniApiProvider } from '../context/HarmoniApiProvider'
import { fakeHarmoniApi } from '../neutralPalette.fixtures'
import type { HarmoniApiPort } from '../ports/HarmoniApiPort'

export type RenderWithProvidersOptions = {
  harmoniApi?: HarmoniApiPort
  initialEntries?: string[]
} & Omit<RenderOptions, 'queries'>

export function renderWithProviders(
  ui: ReactElement,
  {
    harmoniApi = fakeHarmoniApi,
    initialEntries = ['/'],
    ...renderOptions
  }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: PropsWithChildren): JSX.Element {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <HarmoniApiProvider api={harmoniApi}>
          {children}
        </HarmoniApiProvider>
      </MemoryRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}
```

`fakeHarmoniApi` is the default — most tests never need to override it. Tests that need to assert on the calling convention pass an `apiSpy` instead.

---

## Fixture (`neutralPalette.fixtures.ts`)

Pure data, no test helpers. The `FIXTURE_PALETTE` values are grounded in the Rust test values from `ramp_tests.rs`. `fakeHarmoniApi` provides minimal stub returns for every method on the port — real functions, not `vi.fn()`.

```ts
// src/ui/neutralPalette.fixtures.ts
import type {
  ContrastResult,
  Palette,
  Swatch,
  SwatchStep,
  SoftNeutrals,
} from 'harmoni-wasm'
import type { HarmoniApiPort } from './ports/HarmoniApiPort'

const STEPS   = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const
const LVALUES = [0.975, 0.93, 0.85, 0.75, 0.64, 0.53, 0.42, 0.32, 0.22, 0.10] as const

const DARK_FG: SwatchStep = {
  l: 0.10, c: 0.00375, h: 240,
  label: { Number: 900 },
  hex: '#0d0d14', rgb: { r: 0.05, g: 0.05, b: 0.08 },
  oklch: 'oklch(0.10 0.00375 240)',
}
const LIGHT_FG: SwatchStep = {
  l: 0.975, c: 0.006, h: 240,
  label: { Number: 50 },
  hex: '#f8f8ff', rgb: { r: 0.97, g: 0.97, b: 1.0 },
  oklch: 'oklch(0.975 0.006 240)',
}

function swatch(step: number, l: number): Swatch {
  return {
    l, c: 0.006, h: 240,
    label: { Number: step },
    hex: '#aabbcc', rgb: { r: 0.67, g: 0.73, b: 0.80 },
    oklch: `oklch(${l} 0.006 240)`,
    best_foreground: l > 0.5 ? DARK_FG : LIGHT_FG,
    contrast_result: { ratio: 4.5, display_ratio: '4.50', rating: 'AA' },
  }
}

export const FIXTURE_PALETTE: Palette = {
  swatches: STEPS.map((step, i) => swatch(step, LVALUES[i])),
  lightness_curve: [...LVALUES] as unknown as [
    number,number,number,number,number,number,number,number,number,number
  ],
  max_recommended_light_padding: 0,
  max_recommended_dark_padding: 0,
  note: '',
}

export const FIXTURE_SOFT_NEUTRALS: SoftNeutrals = {
  white: { l: 0.975, c: 0.006, h: 240, hex: '#f8f8ff', rgb: { r: 0.97, g: 0.97, b: 1.0 }, oklch: 'oklch(0.975 0.006 240)' },
  black: { l: 0.10, c: 0.00375, h: 240, hex: '#0d0d14', rgb: { r: 0.05, g: 0.05, b: 0.08 }, oklch: 'oklch(0.10 0.00375 240)' },
}

export const FIXTURE_CONTRAST_RESULT: ContrastResult = {
  ratio: 4.5,
  display_ratio: '4.50',
  rating: 'AA',
}

// Default port for renderWithProviders — real functions, not vi.fn()
export const fakeHarmoniApi: HarmoniApiPort = {
  derive_soft_neutrals:              (_brand, _softness)                => FIXTURE_SOFT_NEUTRALS,
  generate_neutral_ramp:             (_white, _black, _tint)            => FIXTURE_PALETTE,
  generate_palette:                  (_hex, _lp, _dp)                   => FIXTURE_PALETTE,
  generate_palette_pair:             (_hex, _ll, _dl, _lp, _dp)        => ({ light: FIXTURE_PALETTE, dark: FIXTURE_PALETTE }),
  generate_palette_with_light_padding: (_hex, _lp)                     => FIXTURE_PALETTE,
  generate_palette_with_lightness:   (_hex, _l, _lp, _dp)              => FIXTURE_PALETTE,
  get_contrast_rating:               (_bg, _fg)                         => FIXTURE_CONTRAST_RESULT,
  tint_neutrals:                     (_white, _black, _source, _strength) => FIXTURE_SOFT_NEUTRALS,
}
```

---

## Cycle 1 — View model unit tests

No React, no jsdom, no mocks.

```ts
// src/ui/view-model/neutralPaletteViewModel.ts
import type { Palette, SwatchLabel } from 'harmoni-wasm'

export function formatSwatchLabel(label: SwatchLabel): string {
  return 'Number' in label ? String(label.Number) : label.Name
}

export function paletteToSwatchPayload(palette: Palette): Array<{ label: SwatchLabel; hex: string }> {
  return palette.swatches.map((s) => ({ label: s.label, hex: s.hex }))
}
```

```ts
// src/ui/view-model/neutralPaletteViewModel.test.ts
import { formatSwatchLabel, paletteToSwatchPayload } from './neutralPaletteViewModel'
import { FIXTURE_PALETTE } from '../neutralPalette.fixtures'

describe('formatSwatchLabel', () => {
  it('returns the number as a string for numeric labels', () => {
    expect(formatSwatchLabel({ Number: 50 })).toBe('50')
    expect(formatSwatchLabel({ Number: 900 })).toBe('900')
  })

  it('returns the name string for named labels', () => {
    expect(formatSwatchLabel({ Name: 'White' })).toBe('White')
  })
})

describe('paletteToSwatchPayload', () => {
  it('produces one entry per swatch', () => {
    expect(paletteToSwatchPayload(FIXTURE_PALETTE)).toHaveLength(10)
  })

  it('preserves step order from the source palette', () => {
    const labels = paletteToSwatchPayload(FIXTURE_PALETTE)
      .map((p) => formatSwatchLabel(p.label))
    expect(labels).toEqual(['50','100','200','300','400','500','600','700','800','900'])
  })
})
```

---

## Cycle 2 — Component unit tests

These are prop-driven display components: they accept data as props and render it. No context. Tested with plain `render` — no `renderWithProviders` needed.

### `SwatchChip`

Renders a single swatch: its colour and label.

```tsx
// src/ui/components/SwatchChip/SwatchChip.test.tsx
import { render, screen } from '@testing-library/react'
import { SwatchChip } from './SwatchChip'
import { FIXTURE_PALETTE } from '../../neutralPalette.fixtures'

describe('SwatchChip', () => {
  it('displays the step label', () => {
    render(<SwatchChip swatch={FIXTURE_PALETTE.swatches[0]} />)
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('applies the swatch hex as a background colour', () => {
    render(<SwatchChip swatch={FIXTURE_PALETTE.swatches[0]} />)
    const chip = screen.getByRole('listitem')
    expect(chip).toHaveStyle({ backgroundColor: FIXTURE_PALETTE.swatches[0].hex })
  })
})
```

### `PaletteRamp`

Renders a list of `SwatchChip` components from a `Palette` prop.

```tsx
// src/ui/components/PaletteRamp/PaletteRamp.test.tsx
import { render, screen } from '@testing-library/react'
import { PaletteRamp } from './PaletteRamp'
import { FIXTURE_PALETTE } from '../../neutralPalette.fixtures'

describe('PaletteRamp', () => {
  it('renders one chip per swatch step', () => {
    render(<PaletteRamp palette={FIXTURE_PALETTE} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(10)
  })

  it('labels each chip with its step number', () => {
    render(<PaletteRamp palette={FIXTURE_PALETTE} />)
    for (const step of ['50','100','200','300','400','500','600','700','800','900']) {
      expect(screen.getByText(step)).toBeInTheDocument()
    }
  })
})
```

### `ColourPicker`

Controlled colour input: `label`, `value`, `onChange`.

```tsx
// src/ui/components/ColourPicker/ColourPicker.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColourPicker } from './ColourPicker'

describe('ColourPicker', () => {
  it('renders a colour input with an accessible label', () => {
    render(<ColourPicker label="White" value="#ffffff" onChange={() => {}} />)
    expect(screen.getByLabelText('White')).toHaveAttribute('type', 'color')
  })

  it('reflects the current value', () => {
    render(<ColourPicker label="White" value="#aabbcc" onChange={() => {}} />)
    expect(screen.getByLabelText('White')).toHaveValue('#aabbcc')
  })

  it('calls onChange with the new hex value when the input changes', async () => {
    const onChange = vi.fn()
    render(<ColourPicker label="White" value="#ffffff" onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('White'), '#f0f0f0')
    expect(onChange).toHaveBeenCalled()
  })
})
```

---

## Cycle 3 — Integration tests (`NeutralScreen.test.tsx`)

Integration tests cover the full behavioural chain within the UI: user interaction → `HarmoniApiPort.generate_neutral_ramp` called with the right args → ramp display updates. No postMessage bridge — that is deferred with Apply to Figma.

`renderWithProviders` is used here because `NeutralScreen` reads `useHarmoniApi()` from context. Tests that need to observe the calling convention override `harmoniApi` with a spy; everything else uses the default `fakeHarmoniApi`.

```tsx
// src/ui/screens/NeutralScreen/NeutralScreen.test.tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { NeutralScreen } from './NeutralScreen'
import { FIXTURE_PALETTE, fakeHarmoniApi } from '../../neutralPalette.fixtures'
import { renderWithProviders } from '../../test-utils/renderWithProviders'

describe('NeutralScreen — initial render', () => {
  it('renders a White colour picker', () => {
    renderWithProviders(<NeutralScreen />)
    expect(screen.getByLabelText('White')).toHaveAttribute('type', 'color')
  })

  it('renders a Black colour picker', () => {
    renderWithProviders(<NeutralScreen />)
    expect(screen.getByLabelText('Black')).toHaveAttribute('type', 'color')
  })

  it('renders the ten step labels on mount', () => {
    renderWithProviders(<NeutralScreen />)
    for (const step of ['50','100','200','300','400','500','600','700','800','900']) {
      expect(screen.getByText(step)).toBeInTheDocument()
    }
  })
})

describe('NeutralScreen — ramp regeneration', () => {
  it('calls generate_neutral_ramp with the updated white when the White picker changes', async () => {
    const apiSpy = {
      ...fakeHarmoniApi,
      generate_neutral_ramp: vi.fn().mockReturnValue(FIXTURE_PALETTE),
    }
    renderWithProviders(<NeutralScreen />, { harmoniApi: apiSpy })

    await userEvent.type(screen.getByLabelText('White'), '#f0f0f0')

    expect(apiSpy.generate_neutral_ramp).toHaveBeenCalledWith(
      expect.stringContaining('#f0f0f0'),
      '#000000',
      'Inherit',
    )
  })

  it('calls generate_neutral_ramp with the updated black when the Black picker changes', async () => {
    const apiSpy = {
      ...fakeHarmoniApi,
      generate_neutral_ramp: vi.fn().mockReturnValue(FIXTURE_PALETTE),
    }
    renderWithProviders(<NeutralScreen />, { harmoniApi: apiSpy })

    await userEvent.type(screen.getByLabelText('Black'), '#111111')

    expect(apiSpy.generate_neutral_ramp).toHaveBeenCalledWith(
      '#ffffff',
      expect.stringContaining('#111111'),
      'Inherit',
    )
  })

  it('re-renders the ramp with the result of each regeneration call', async () => {
    const updatedPalette = { ...FIXTURE_PALETTE, note: 'updated' }
    const apiSpy = {
      ...fakeHarmoniApi,
      generate_neutral_ramp: vi.fn().mockReturnValue(updatedPalette),
    }
    renderWithProviders(<NeutralScreen />, { harmoniApi: apiSpy })

    await userEvent.type(screen.getByLabelText('White'), '#f0f0f0')

    expect(screen.getAllByRole('listitem')).toHaveLength(10)
  })
})
```

---

## Cycle 4 — App routing test

`App.tsx` defines routes only — no providers. `renderWithProviders` supplies both the `MemoryRouter` (via `initialEntries`) and the `HarmoniApiProvider`. One test confirms the neutral screen renders at `/neutral`.

```tsx
// src/ui/App.test.tsx (additions)
import { FIXTURE_PALETTE } from './neutralPalette.fixtures'

vi.mock('./engine', () => ({
  initEngine: vi.fn(() => Promise.resolve()),
  harmoni: {
    generate_neutral_ramp: () => FIXTURE_PALETTE,
  },
}))

it('renders the NeutralScreen at /neutral', async () => {
  renderWithProviders(<App />, { initialEntries: ['/neutral'] })
  await screen.findByText('Hello from Harmoni Wasm!')

  expect(screen.getByLabelText('White')).toBeInTheDocument()
  expect(screen.getByLabelText('Black')).toBeInTheDocument()
})
```

---

## Commit sequence

| # | Message |
|---|---|
| 1 | `test(neutral): red — view model unit tests` |
| 2 | `feat(neutral): green — neutralPaletteViewModel pure functions` |
| 3 | `test(neutral): red — SwatchChip, PaletteRamp, ColourPicker component tests` |
| 4 | `feat(neutral): green — SwatchChip, PaletteRamp, ColourPicker components` |
| 5 | `test(neutral): red — NeutralScreen integration tests` |
| 6 | `feat(neutral): green — NeutralScreen, HarmoniApiProvider, context, hook` |
| 7 | `feat(neutral): wire NeutralScreen into App routing and main` |

Commits 5 and 6 are outside-in: write all integration tests first (fully red), then implement the whole screen in one green pass, composing the components from commits 3–4.

---

## Test commands

```sh
# View model unit tests
pnpm --filter harmoni-figma-plugin exec vitest run src/ui/view-model/neutralPaletteViewModel

# Component unit tests
pnpm --filter harmoni-figma-plugin exec vitest run src/ui/components

# Integration tests
pnpm --filter harmoni-figma-plugin exec vitest run src/ui/screens/NeutralScreen
pnpm --filter harmoni-figma-plugin exec vitest run src/ui/App

# Full suite before committing
pnpm --filter harmoni-figma-plugin qa:units
```

---

## What this plan deliberately defers

- **Apply to Figma** — sending the palette to the sandbox, creating Figma Colour variables. Separate plan; requires extending `messages.ts`, the postMessage bridge, `figma.mock.ts`, and `handleMessage.ts`.
- **Idempotency** — second Apply overwrites rather than duplicates. Needs `figma.variables.getLocalVariableCollectionsAsync`.
- **`TintMode: Achromatic` toggle** — port interface signature is already correct for it; just not exposed in the UI yet.
- **"Use as neutral colour tint"** — links a brand palette colour to the neutral generator via `tint_neutrals`.
