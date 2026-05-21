# TDD Plan: Neutral Palettes in `harmoni-figma-plugin` (Ports & Adapters)

## Architecture

```
┌─────────────────────────────────────┐  ┌──────────────────────────────┐
│         UI context (iframe)         │  │   Sandbox context (code.ts)  │
│                                     │  │                               │
│  main.tsx                           │  │  handleUiMessage              │
│    └─ NeutralRampProvider (context) │  │    └─ figma.variables.*       │
│         └─ App                      │  │            ▲                  │
│              └─ NeutralPanel        │  │     postMessage bridge        │
│                   └─ context        │  │                               │
│                        │            │  │                               │
│   NeutralPaletteViewModel           │  │                               │
│   (pure functions)                  │  │                               │
└─────────────────────────────────────┘  └──────────────────────────────┘
                   ▲
         renderWithProviders
       injects NeutralRampPort
         (default: fakeRampPort)
```

Real adapters live in `main.tsx`. Tests never touch `main.tsx`. `App.tsx` is adapter-agnostic — it just renders components.

**Two testing strategies, nothing else:**

| Layer | What | How |
|---|---|---|
| **View model** | Pure functions: label formatting, payload building | Unit tests — plain function calls, no React, no jsdom |
| **Integration** | Full behaviour from user interaction to Figma API | `renderWithProviders` + fake port + figma stub + postMessage bridge |

Hooks are an implementation detail. There are no hook unit tests.

---

## Feature scope (this plan)

- **White and Black colour pickers** in the plugin UI (the "soft white" and "soft black" neutral endpoints)
- **Neutral ramp generation** — calling `generateRamp` on the port whenever a picker changes
- **Preview** of the 10 generated swatches in the UI
- **"Apply to Figma"** — sending the palette to the sandbox, which creates Figma Colour variables in a `Neutral` collection

Deferred (later plan): `Use as neutral colour tint`, `TintMode: Achromatic` toggle, idempotent update (overwrite existing collection instead of always creating a new one).

---

## File layout

```
src/
  shared/
    messages.ts                          ← extend with apply-neutral-palette
  ui/
    context/
      NeutralRampContext.ts              ← createContext + useNeutralRampPort hook
      NeutralRampProvider.tsx            ← thin provider component
    ports/
      NeutralRampPort.ts                 ← port interface (the DI seam)
    adapters/
      harmoniRampAdapter.ts              ← production wasm implementation
    view-model/
      neutralPaletteViewModel.ts         ← pure functions
      neutralPaletteViewModel.test.ts    ← unit tests (no React)
    test-utils/
      renderWithProviders.tsx            ← single injection point for all UI tests
    neutralPalette.fixtures.ts           ← shared data: FIXTURE_PALETTE, fakeRampPort
    useNeutralPalette.ts                 ← thin React hook (untested in isolation)
    NeutralPanel.tsx                     ← thin component (reads port from context)
    NeutralPanel.test.tsx                ← integration tests
    App.tsx                              ← no adapter wiring, just renders components
    App.test.tsx                         ← one new integration test for the panel wiring
    main.tsx                             ← wires real adapters (not tested)
  code/
    handleMessage.ts                     ← extend with apply-neutral-palette case
    handleMessage.test.ts                ← existing tests unchanged
    figma.mock.ts                        ← extend with variables API
```

---

## How testing works in a Figma plugin

A Figma plugin runs as two separate programs that never share memory:

| Context | What it can do | How we test it |
|---|---|---|
| **Sandbox** (`src/code/`) | Calls `figma.*` API, no DOM | `vi.stubGlobal('figma', createFigmaMock())` |
| **UI** (`src/ui/`) | React + DOM + harmoni-wasm, no `figma.*` | `renderWithProviders` + Testing Library |

The `harmoni-wasm` engine cannot be initialised in jsdom. Its correctness is proven by the Rust test suite (`cargo test`). The UI tests prove only that our code calls the engine with the right arguments and renders its output correctly — done via the `NeutralRampPort` DI seam.

In integration tests, both contexts share the same jsdom environment. A `postMessage` spy bridges them: when the UI posts to the sandbox, the spy intercepts and routes to `handleUiMessage` synchronously.

---

## Port and context

```ts
// src/ui/ports/NeutralRampPort.ts
import type { Palette } from 'harmoni-wasm'

export interface NeutralRampPort {
  generateRamp(white: string, black: string): Palette
}
```

`TintMode` is always `'Inherit'` at this stage — it is not exposed through the port yet (deferred). The adapter fixes it internally.

```ts
// src/ui/context/NeutralRampContext.ts
import { createContext, useContext } from 'react'
import type { NeutralRampPort } from '../ports/NeutralRampPort'

const NeutralRampContext = createContext<NeutralRampPort | null>(null)

export { NeutralRampContext }

export function useNeutralRampPort(): NeutralRampPort {
  const port = useContext(NeutralRampContext)
  if (!port) throw new Error('NeutralRampPort not provided')
  return port
}
```

```tsx
// src/ui/context/NeutralRampProvider.tsx
import type { NeutralRampPort } from '../ports/NeutralRampPort'
import { NeutralRampContext } from './NeutralRampContext'

export function NeutralRampProvider({
  port,
  children,
}: {
  port: NeutralRampPort
  children: React.ReactNode
}) {
  return (
    <NeutralRampContext.Provider value={port}>
      {children}
    </NeutralRampContext.Provider>
  )
}
```

The production adapter:

```ts
// src/ui/adapters/harmoniRampAdapter.ts
import { harmoni } from '../engine'
import type { NeutralRampPort } from '../ports/NeutralRampPort'

export const harmoniRampAdapter: NeutralRampPort = {
  generateRamp: (white, black) =>
    harmoni.generate_neutral_ramp(white, black, 'Inherit'),
}
```

Wired in the entry point — not tested:

```tsx
// src/ui/main.tsx  (addition)
createRoot(document.getElementById('root')!).render(
  <NeutralRampProvider port={harmoniRampAdapter}>
    <App />
  </NeutralRampProvider>,
)
```

---

## `renderWithProviders`

The single injection point for all UI tests. The `Wrapper` function provides every context the component tree needs, with real defaults replaced by test doubles where necessary.

```tsx
// src/ui/test-utils/renderWithProviders.tsx
import { render, type RenderOptions } from '@testing-library/react'
import { type PropsWithChildren, type ReactElement, type JSX } from 'react'

import { NeutralRampProvider } from '../context/NeutralRampProvider'
import { fakeRampPort } from '../neutralPalette.fixtures'
import type { NeutralRampPort } from '../ports/NeutralRampPort'

export type RenderWithProvidersOptions = {
  neutralRampPort?: NeutralRampPort
} & Omit<RenderOptions, 'queries'>

export function renderWithProviders(
  ui: ReactElement,
  {
    neutralRampPort = fakeRampPort,
    ...renderOptions
  }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: PropsWithChildren): JSX.Element {
    return (
      <NeutralRampProvider port={neutralRampPort}>
        {children}
      </NeutralRampProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}
```

`fakeRampPort` is the default — most tests never need to override it. Tests that want to observe the calling convention pass a `portSpy` instead.

---

## Fixture (`neutralPalette.fixtures.ts`)

Pure data, no test helpers. Grounded in the Rust test values from `ramp_tests.rs` (`oklch(0.975, 0.006, 240)` white, `oklch(0.10, 0.00375, 240)` black). The `SwatchLabel` shape reflects the Tsify/serde externally-tagged encoding: `{ Number: 50 }` for numeric steps.

```ts
// src/ui/neutralPalette.fixtures.ts
import type { Palette, Swatch, SwatchStep } from 'harmoni-wasm'
import type { NeutralSwatchPayload } from '../shared/messages'
import type { NeutralRampPort } from './ports/NeutralRampPort'

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

export const FIXTURE_SWATCHES: NeutralSwatchPayload[] = FIXTURE_PALETTE.swatches.map(
  (s) => ({ label: s.label as NeutralSwatchPayload['label'], rgb: s.rgb }),
)

// Default port for renderWithProviders — real function, not vi.fn()
export const fakeRampPort: NeutralRampPort = {
  generateRamp: (_white, _black) => FIXTURE_PALETTE,
}
```

`fakeRampPort` is a real function, not a spy. Tests that need to assert on calling convention override it locally with a `vi.fn()`.

---

## Cycle 1 — View model unit tests

No React, no jsdom, no mocks.

```ts
// src/ui/view-model/neutralPaletteViewModel.ts
import type { Palette, SwatchLabel } from 'harmoni-wasm'
import type { NeutralSwatchPayload } from '../../shared/messages'

export function formatSwatchLabel(label: SwatchLabel): string {
  return 'Number' in label ? String(label.Number) : label.Name
}

export function paletteToSwatchPayload(palette: Palette): NeutralSwatchPayload[] {
  return palette.swatches.map((s) => ({
    label: s.label as NeutralSwatchPayload['label'],
    rgb: s.rgb,
  }))
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

  it('carries label and rgb only', () => {
    const [first] = paletteToSwatchPayload(FIXTURE_PALETTE)
    expect(Object.keys(first)).toEqual(['label', 'rgb'])
    expect(first.label).toEqual({ Number: 50 })
    expect(first.rgb).toEqual(FIXTURE_PALETTE.swatches[0].rgb)
  })

  it('preserves step order from the source palette', () => {
    const labels = paletteToSwatchPayload(FIXTURE_PALETTE)
      .map((p) => formatSwatchLabel(p.label))
    expect(labels).toEqual(['50','100','200','300','400','500','600','700','800','900'])
  })
})
```

---

## Cycle 2 — `messages.ts` and `figma.mock.ts`

```ts
// src/shared/messages.ts (additions)
export type NeutralSwatchPayload = {
  label: { Number: number } | { Name: string }
  rgb: { r: number; g: number; b: number }
}

export type UiMessage =
  | { type: 'close' }
  | { type: 'apply-neutral-palette'; swatches: NeutralSwatchPayload[] }
```

```ts
// src/code/figma.mock.ts (additions)
export interface FigmaMock {
  // ... existing fields ...
  variables: {
    createVariableCollection: Mock  // (name: string) => { id, modes }
    createVariable: Mock            // (name, collection, 'COLOR') => { setValueForMode }
  }
}

// In createFigmaMock():
variables: {
  createVariableCollection: vi.fn().mockReturnValue({
    id: 'mock-collection-id',
    modes: [{ modeId: 'mock-mode-id', name: 'Default' }],
  }),
  createVariable: vi.fn().mockReturnValue({
    setValueForMode: vi.fn(),
  }),
},
```

---

## Cycle 3 — Integration tests (`NeutralPanel.test.tsx`)

### Sandbox bridge

The `beforeEach` block owns the seam between the two plugin contexts. When the component calls `window.parent.postMessage(...)`, the spy intercepts and routes to `handleUiMessage`. Both contexts share the same jsdom environment in tests, so one interception point covers the full round-trip.

```ts
// src/ui/NeutralPanel.test.tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { NeutralPanel } from './NeutralPanel'
import { handleUiMessage } from '../code/handleMessage'
import { createFigmaMock, type FigmaMock } from '../code/figma.mock'
import { FIXTURE_PALETTE } from './neutralPalette.fixtures'
import { renderWithProviders } from './test-utils/renderWithProviders'

let figmaMock: FigmaMock

beforeEach(() => {
  figmaMock = createFigmaMock()
  vi.stubGlobal('figma', figmaMock)

  vi.spyOn(window.parent, 'postMessage').mockImplementation(async (data) => {
    if (data?.pluginMessage) await handleUiMessage(data.pluginMessage)
  })
})
```

### Tests

```ts
describe('NeutralPanel — pickers', () => {
  it('renders a colour picker labelled "White"', () => {
    renderWithProviders(<NeutralPanel />)
    expect(screen.getByLabelText('White')).toHaveAttribute('type', 'color')
  })

  it('renders a colour picker labelled "Black"', () => {
    renderWithProviders(<NeutralPanel />)
    expect(screen.getByLabelText('Black')).toHaveAttribute('type', 'color')
  })
})

describe('NeutralPanel — ramp preview', () => {
  it('renders the ten step labels on mount', () => {
    renderWithProviders(<NeutralPanel />)
    for (const step of ['50','100','200','300','400','500','600','700','800','900']) {
      expect(screen.getByText(step)).toBeInTheDocument()
    }
  })
})

describe('NeutralPanel — ramp regeneration', () => {
  it('calls generateRamp with the updated white when the White picker changes', async () => {
    const portSpy = { generateRamp: vi.fn().mockReturnValue(FIXTURE_PALETTE) }
    renderWithProviders(<NeutralPanel />, { neutralRampPort: portSpy })

    await userEvent.type(screen.getByLabelText('White'), '#f0f0f0')

    expect(portSpy.generateRamp).toHaveBeenCalledWith(
      expect.stringContaining('#f0f0f0'),
      '#000000',
    )
  })

  it('calls generateRamp with the updated black when the Black picker changes', async () => {
    const portSpy = { generateRamp: vi.fn().mockReturnValue(FIXTURE_PALETTE) }
    renderWithProviders(<NeutralPanel />, { neutralRampPort: portSpy })

    await userEvent.type(screen.getByLabelText('Black'), '#111111')

    expect(portSpy.generateRamp).toHaveBeenCalledWith(
      '#ffffff',
      expect.stringContaining('#111111'),
    )
  })
})

describe('NeutralPanel — Apply to Figma', () => {
  it('renders an "Apply to Figma" button', () => {
    renderWithProviders(<NeutralPanel />)
    expect(screen.getByRole('button', { name: 'Apply to Figma' })).toBeInTheDocument()
  })

  it('creates a Neutral variable collection when Apply is clicked', async () => {
    renderWithProviders(<NeutralPanel />)

    await userEvent.click(screen.getByRole('button', { name: 'Apply to Figma' }))

    expect(figmaMock.variables.createVariableCollection).toHaveBeenCalledWith('Neutral')
  })

  it('creates one COLOR variable per swatch step', async () => {
    renderWithProviders(<NeutralPanel />)

    await userEvent.click(screen.getByRole('button', { name: 'Apply to Figma' }))

    expect(figmaMock.variables.createVariable).toHaveBeenCalledTimes(10)
  })

  it('names each variable after its step label', async () => {
    renderWithProviders(<NeutralPanel />)

    await userEvent.click(screen.getByRole('button', { name: 'Apply to Figma' }))

    expect(figmaMock.variables.createVariable).toHaveBeenCalledWith(
      '50',
      expect.objectContaining({ id: 'mock-collection-id' }),
      'COLOR',
    )
    expect(figmaMock.variables.createVariable).toHaveBeenCalledWith(
      '900',
      expect.objectContaining({ id: 'mock-collection-id' }),
      'COLOR',
    )
  })

  it('sets each variable value to the swatch RGB colour for the default mode', async () => {
    const variableMock = { setValueForMode: vi.fn() }
    figmaMock.variables.createVariable.mockReturnValue(variableMock)
    renderWithProviders(<NeutralPanel />)

    await userEvent.click(screen.getByRole('button', { name: 'Apply to Figma' }))

    const first = FIXTURE_PALETTE.swatches[0]
    expect(variableMock.setValueForMode).toHaveBeenCalledWith(
      'mock-mode-id',
      { r: first.rgb.r, g: first.rgb.g, b: first.rgb.b },
    )
  })
})
```

The regeneration tests are the only ones that pass a `portSpy` — they need to observe the calling convention. Everything else uses the default `fakeRampPort` from `renderWithProviders` and asserts on the Figma API end of the chain.

---

## Cycle 4 — App wiring test

`App.test.tsx` already mocks `./engine`. The existing mock is extended to expose `harmoni.generate_neutral_ramp`, and one new test confirms the panel renders within the app:

```ts
// src/ui/App.test.tsx (additions)

vi.mock('./engine', () => ({
  initEngine: vi.fn(() => Promise.resolve()),
  harmoni: {
    generate_neutral_ramp: () => FIXTURE_PALETTE,
  },
}))

it('renders the neutral palette colour pickers', async () => {
  renderWithProviders(<App />)
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
| 3 | `test(neutral): red — NeutralPanel integration tests` |
| 4 | `feat(neutral): green — NeutralPanel, context, hook, sandbox handler` |
| 5 | `feat(neutral): wire NeutralPanel into App and main` |

Commits 3 and 4 are outside-in: write all integration tests first (fully red), then implement the whole stack in one green pass using the view model functions from commit 2.

---

## Test commands

```sh
# View model unit tests
pnpm --filter harmoni-figma-plugin exec vitest run src/ui/view-model/neutralPaletteViewModel

# Integration tests
pnpm --filter harmoni-figma-plugin exec vitest run src/ui/NeutralPanel
pnpm --filter harmoni-figma-plugin exec vitest run src/ui/App

# Full suite before committing
pnpm --filter harmoni-figma-plugin qa:units
```

---

## What this plan deliberately defers

- **Idempotency** — second Apply overwrites rather than duplicates. Needs `figma.variables.getLocalVariableCollectionsAsync`. Clear next cycle once the base flow is green.
- **`TintMode: Achromatic` toggle** — port interface and message type are ready for it.
- **"Use as neutral colour tint"** — links a brand palette colour to the neutral generator.
