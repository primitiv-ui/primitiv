import type {
  CollectionSummary,
  SandboxMessage,
  UiMessage,
  VariableSummary,
} from '../shared/messages'

/** Routes a message received from the plugin UI to its sandbox action. */
export async function handleUiMessage(message: UiMessage): Promise<void> {
  switch (message.type) {
    case 'ui-ready':
      reply({ type: 'plugin-ready', pageName: figma.currentPage.name })
      return
    case 'inspect-variables-request': {
      const data = await extractVariables()
      reply({ type: 'inspect-variables-result', ...data })
      return
    }
    case 'export-tokens-request': {
      const data = await extractVariables()
      reply({ type: 'export-tokens-result', ...data })
      return
    }
    case 'close':
      figma.closePlugin()
      return
  }
}

function reply(message: SandboxMessage): void {
  figma.ui.postMessage(message)
}

async function extractVariables(): Promise<{
  collections: CollectionSummary[]
  variables: VariableSummary[]
}> {
  const [collections, variables] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
  ])
  return {
    collections: collections.map(summariseCollection),
    variables: variables.map(summariseVariable),
  }
}

function summariseCollection(c: VariableCollection): CollectionSummary {
  return {
    id: c.id,
    name: c.name,
    modes: c.modes.map(({ modeId, name }) => ({ modeId, name })),
    defaultModeId: c.defaultModeId,
    variableIds: c.variableIds,
  }
}

function summariseVariable(v: Variable): VariableSummary {
  return {
    id: v.id,
    name: v.name,
    resolvedType: v.resolvedType,
    variableCollectionId: v.variableCollectionId,
    valuesByMode: v.valuesByMode,
  }
}
