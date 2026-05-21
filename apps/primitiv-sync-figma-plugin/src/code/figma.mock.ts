import type { Mock } from 'vitest'

/** Minimal stand-in for a Figma VariableCollection, for sandbox unit tests. */
export interface MockVariableCollection {
  id: string
  defaultModeId: string
  remove: Mock
}

/** Minimal stand-in for a Figma Variable, for sandbox unit tests. */
export interface MockVariable {
  id: string
  setValueForMode: Mock
}

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
  root: { findAll: Mock }
  variables: {
    getLocalVariableCollectionsAsync: Mock
    getLocalVariablesAsync: Mock
    createVariableCollection: Mock
    createVariable: Mock
    getVariableCollectionByIdAsync: Mock
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
  const defaultSemanticCollection: MockVariableCollection = {
    id: 'new-semantic-id',
    defaultModeId: 'new-semantic-mode-id',
    remove: vi.fn(),
  }
  const defaultVariable: MockVariable = {
    id: 'new-var-id',
    setValueForMode: vi.fn(),
  }
  return {
    closePlugin: vi.fn(),
    showUI: vi.fn(),
    currentPage: { name: 'Test Page' },
    ui: {
      postMessage: vi.fn(),
      onmessage: null,
    },
    loadAllPagesAsync: vi.fn(() => Promise.resolve()),
    root: { findAll: vi.fn(() => []) },
    variables: {
      getLocalVariableCollectionsAsync: vi.fn(() => Promise.resolve([])),
      getLocalVariablesAsync: vi.fn(() => Promise.resolve([])),
      createVariableCollection: vi.fn(() => defaultSemanticCollection),
      createVariable: vi.fn(() => defaultVariable),
      getVariableCollectionByIdAsync: vi.fn(() =>
        Promise.resolve(defaultSemanticCollection),
      ),
      getVariableByIdAsync: vi.fn(() => Promise.resolve(null)),
    },
  }
}
