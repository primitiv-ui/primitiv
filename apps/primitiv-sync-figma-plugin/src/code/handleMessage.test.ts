import { handleUiMessage } from './handleMessage'
import { createFigmaMock } from './figma.mock'
import { bootstrapContext } from './bootstrapContext'
import { bootstrapInteraction } from './bootstrapInteraction'
import { bootstrapIntentLight } from './bootstrapIntentLight'

vi.mock('./bootstrapContext', () => ({
  bootstrapContext: vi.fn(),
}))

vi.mock('./bootstrapInteraction', () => ({
  bootstrapInteraction: vi.fn(),
}))

vi.mock('./bootstrapIntentLight', () => ({
  bootstrapIntentLight: vi.fn(),
}))

describe('handleUiMessage', () => {
  it('closes the plugin when it receives a close message', async () => {
    const figmaMock = createFigmaMock()
    vi.stubGlobal('figma', figmaMock)

    await handleUiMessage({ type: 'close' })

    expect(figmaMock.closePlugin).toHaveBeenCalledOnce()
  })

  it('replies with plugin-ready when the UI announces it is ready', async () => {
    const figmaMock = createFigmaMock()
    figmaMock.currentPage.name = 'Design Tokens'
    vi.stubGlobal('figma', figmaMock)

    await handleUiMessage({ type: 'ui-ready' })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'plugin-ready',
      pageName: 'Design Tokens',
    })
  })

  it('summarises variable collections and variables on an export request', async () => {
    const figmaMock = createFigmaMock()
    figmaMock.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
      {
        id: 'cp',
        name: 'Primitives',
        modes: [{ modeId: 'mp', name: 'Value' }],
        defaultModeId: 'mp',
        variableIds: ['vp1'],
        key: 'k',
        remote: false,
      },
    ])
    figmaMock.variables.getLocalVariablesAsync.mockResolvedValue([
      {
        id: 'vp1',
        name: 'font-family/sans',
        resolvedType: 'STRING',
        variableCollectionId: 'cp',
        valuesByMode: { mp: 'Asta Sans' },
        description: '',
        key: 'kv',
        remote: false,
        scopes: ['ALL_SCOPES'],
      },
    ])
    vi.stubGlobal('figma', figmaMock)

    await handleUiMessage({ type: 'export-tokens-request' })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'export-tokens-result',
      collections: [
        {
          id: 'cp',
          name: 'Primitives',
          modes: [{ modeId: 'mp', name: 'Value' }],
          defaultModeId: 'mp',
          variableIds: ['vp1'],
        },
      ],
      variables: [
        {
          id: 'vp1',
          name: 'font-family/sans',
          resolvedType: 'STRING',
          variableCollectionId: 'cp',
          valuesByMode: { mp: 'Asta Sans' },
        },
      ],
    })
  })

  it('routes a bootstrap-context-request and posts bootstrap-context-result on success', async () => {
    const figmaMock = createFigmaMock()
    vi.stubGlobal('figma', figmaMock)
    const fakeResult = {
      context: 'comfortable' as const,
      collection: 'created' as const,
      variablesCreated: 100,
      variablesUpdated: 0,
      textStylesCreated: 18,
      textStylesUpdated: 0,
      warnings: [],
    }
    vi.mocked(bootstrapContext).mockResolvedValueOnce(fakeResult)

    await handleUiMessage({
      type: 'bootstrap-context-request',
      context: 'comfortable',
    })

    expect(bootstrapContext).toHaveBeenCalledWith({ context: 'comfortable' })
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'bootstrap-context-result',
      result: fakeResult,
    })
  })

  it('routes a bootstrap-interaction-request and posts bootstrap-interaction-result on success', async () => {
    const figmaMock = createFigmaMock()
    vi.stubGlobal('figma', figmaMock)
    const fakeResult = {
      collection: 'created' as const,
      variablesCreated: 5,
      variablesUpdated: 0,
      warnings: [],
    }
    vi.mocked(bootstrapInteraction).mockResolvedValueOnce(fakeResult)

    await handleUiMessage({ type: 'bootstrap-interaction-request' })

    expect(bootstrapInteraction).toHaveBeenCalledOnce()
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'bootstrap-interaction-result',
      result: fakeResult,
    })
  })

  it('posts bootstrap-interaction-error when the action throws', async () => {
    const figmaMock = createFigmaMock()
    vi.stubGlobal('figma', figmaMock)
    vi.mocked(bootstrapInteraction).mockRejectedValueOnce(
      new Error('Primitives collection not found'),
    )

    await handleUiMessage({ type: 'bootstrap-interaction-request' })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'bootstrap-interaction-error',
      message: 'Primitives collection not found',
    })
  })

  it('posts bootstrap-context-error when the action throws', async () => {
    const figmaMock = createFigmaMock()
    vi.stubGlobal('figma', figmaMock)
    vi.mocked(bootstrapContext).mockRejectedValueOnce(
      new Error('Primitives collection not found'),
    )

    await handleUiMessage({
      type: 'bootstrap-context-request',
      context: 'comfortable',
    })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'bootstrap-context-error',
      context: 'comfortable',
      message: 'Primitives collection not found',
    })
  })

  it('summarises variable collections and variables on an inspect request', async () => {
    const figmaMock = createFigmaMock()
    figmaMock.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
      {
        id: 'VariableCollectionId:1:1',
        name: 'Primitives',
        modes: [{ modeId: '1:0', name: 'Default' }],
        defaultModeId: '1:0',
        variableIds: ['VariableID:1:2'],
        key: 'k1',
        remote: false,
      },
    ])
    figmaMock.variables.getLocalVariablesAsync.mockResolvedValue([
      {
        id: 'VariableID:1:2',
        name: 'font-family/sans',
        resolvedType: 'STRING',
        variableCollectionId: 'VariableCollectionId:1:1',
        valuesByMode: { '1:0': 'Asta Sans' },
        description: '',
        key: 'k2',
        remote: false,
        scopes: ['ALL_SCOPES'],
      },
    ])
    vi.stubGlobal('figma', figmaMock)

    await handleUiMessage({ type: 'inspect-variables-request' })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'inspect-variables-result',
      collections: [
        {
          id: 'VariableCollectionId:1:1',
          name: 'Primitives',
          modes: [{ modeId: '1:0', name: 'Default' }],
          defaultModeId: '1:0',
          variableIds: ['VariableID:1:2'],
        },
      ],
      variables: [
        {
          id: 'VariableID:1:2',
          name: 'font-family/sans',
          resolvedType: 'STRING',
          variableCollectionId: 'VariableCollectionId:1:1',
          valuesByMode: { '1:0': 'Asta Sans' },
        },
      ],
    })
  })

  it('routes a bootstrap-intent-light-request and posts bootstrap-intent-light-result on success', async () => {
    const figmaMock = createFigmaMock()
    vi.stubGlobal('figma', figmaMock)
    const fakeResult = {
      collection: 'created' as const,
      variablesCreated: 40,
      variablesUpdated: 0,
      warnings: ['Palette variable "color/danger/light/500" missing — skipped intent variable "action/danger/default"'],
    }
    vi.mocked(bootstrapIntentLight).mockResolvedValueOnce(fakeResult)

    await handleUiMessage({ type: 'bootstrap-intent-light-request' })

    expect(bootstrapIntentLight).toHaveBeenCalledOnce()
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'bootstrap-intent-light-result',
      result: fakeResult,
    })
  })

  it('posts bootstrap-intent-light-error when the action throws', async () => {
    const figmaMock = createFigmaMock()
    vi.stubGlobal('figma', figmaMock)
    vi.mocked(bootstrapIntentLight).mockRejectedValueOnce(
      new Error('Primitives / Palette collection not found'),
    )

    await handleUiMessage({ type: 'bootstrap-intent-light-request' })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'bootstrap-intent-light-error',
      message: 'Primitives / Palette collection not found',
    })
  })
})
