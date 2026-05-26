import type { Mock } from 'vitest'

/** The slice of Figma's `figma` global the sandbox tests rely on. */
export interface FigmaMock {
  closePlugin: Mock
  showUI: Mock
  currentPage: { name: string }
  ui: {
    postMessage: Mock
    onmessage: ((event: { pluginMessage: unknown }) => void) | null
  }
  loadAllPagesAsync: Mock
  loadFontAsync: Mock
  createTextStyle: Mock
  getLocalTextStylesAsync: Mock
  variables: {
    getLocalVariableCollectionsAsync: Mock
    getLocalVariablesAsync: Mock
    createVariableCollection: Mock
    createVariable: Mock
    getVariableByIdAsync: Mock
  }
}

/**
 * Minimal stand-in for Figma's `figma` global, for sandbox unit tests.
 *
 * Only the surface the sandbox actually touches is mocked; assign the
 * result with `vi.stubGlobal('figma', createFigmaMock())`.
 */
export function createFigmaMock(): FigmaMock {
  return {
    closePlugin: vi.fn(),
    showUI: vi.fn(),
    currentPage: { name: 'Test Page' },
    ui: {
      postMessage: vi.fn(),
      onmessage: null,
    },
    loadAllPagesAsync: vi.fn(() => Promise.resolve()),
    loadFontAsync: vi.fn(() => Promise.resolve()),
    createTextStyle: vi.fn(() => ({
      id: 'style-stub',
      name: '',
      fontName: { family: 'Inter', style: 'Regular' },
      fontSize: 16,
      lineHeight: { value: 24, unit: 'PIXELS' },
      letterSpacing: { value: 0, unit: 'PIXELS' },
      setBoundVariable: vi.fn(),
      remove: vi.fn(),
    })),
    getLocalTextStylesAsync: vi.fn(() => Promise.resolve([])),
    variables: {
      getLocalVariableCollectionsAsync: vi.fn(() => Promise.resolve([])),
      getLocalVariablesAsync: vi.fn(() => Promise.resolve([])),
      createVariableCollection: vi.fn((name: string) => ({
        id: `col-${name}`,
        name,
        modes: [{ modeId: 'mode-0', name: 'Mode 1' }],
        defaultModeId: 'mode-0',
        variableIds: [],
        key: 'k',
        remote: false,
        remove: vi.fn(),
      })),
      createVariable: vi.fn(
        (name: string, collection: { id: string }, type: string) => ({
          id: `var-${name}`,
          name,
          resolvedType: type,
          variableCollectionId: collection.id,
          valuesByMode: {},
          description: '',
          scopes: ['ALL_SCOPES'],
          key: 'kv',
          remote: false,
          setValueForMode: vi.fn(),
          remove: vi.fn(),
        }),
      ),
      getVariableByIdAsync: vi.fn(() => Promise.resolve(null)),
    },
  }
}
