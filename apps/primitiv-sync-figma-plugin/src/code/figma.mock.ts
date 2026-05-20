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
  variables: {
    getLocalVariableCollectionsAsync: Mock
    getLocalVariablesAsync: Mock
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
    variables: {
      getLocalVariableCollectionsAsync: vi.fn(() => Promise.resolve([])),
      getLocalVariablesAsync: vi.fn(() => Promise.resolve([])),
    },
  }
}
