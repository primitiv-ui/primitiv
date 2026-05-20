import { handleUiMessage } from './handleMessage'
import { createFigmaMock } from './figma.mock'

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

  it('loads all pages and replies with a migration plan on a preview request', async () => {
    const figmaMock = createFigmaMock()
    figmaMock.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
      {
        id: 'cp',
        name: 'Primitives',
        modes: [{ modeId: 'mp', name: 'Value' }],
        defaultModeId: 'mp',
        variableIds: ['pv1'],
        key: 'k',
        remote: false,
      },
      {
        id: 'cc',
        name: 'Typography / Compact',
        modes: [{ modeId: 'mc', name: 'Value' }],
        defaultModeId: 'mc',
        variableIds: ['cv1'],
        key: 'k',
        remote: false,
      },
    ])
    figmaMock.variables.getLocalVariablesAsync.mockResolvedValue([
      {
        id: 'pv1',
        name: 'font-family/sans',
        resolvedType: 'STRING',
        variableCollectionId: 'cp',
        valuesByMode: { mp: 'Asta Sans' },
        description: '',
        key: 'k',
        remote: false,
        scopes: ['ALL_SCOPES'],
      },
      {
        id: 'cv1',
        name: 'display/xl/font-family',
        resolvedType: 'STRING',
        variableCollectionId: 'cc',
        valuesByMode: { mc: { type: 'VARIABLE_ALIAS', id: 'pv1' } },
        description: '',
        key: 'k',
        remote: false,
        scopes: ['ALL_SCOPES'],
      },
    ])
    vi.stubGlobal('figma', figmaMock)

    await handleUiMessage({ type: 'migrate-preview-request' })

    expect(figmaMock.loadAllPagesAsync).toHaveBeenCalledOnce()
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'migrate-preview-result',
      plan: {
        semantic: {
          needsCreate: true,
          existingId: undefined,
          modeName: 'Value',
        },
        newVariables: [
          {
            name: 'typography/compact/display/xl/font-family',
            resolvedType: 'STRING',
            sourceVariableId: 'cv1',
            sourceCollectionId: 'cc',
          },
        ],
        deletedCollectionIds: ['cc'],
      },
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
})
