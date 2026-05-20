import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { App } from './App'

describe('App', () => {
  it('shows a waiting state before the sandbox announces the page', () => {
    render(<App />)

    expect(screen.getByText('Waiting for Figma…')).toBeInTheDocument()
  })

  it('announces ui-ready to the sandbox once mounted', () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage')

    render(<App />)

    expect(postMessage).toHaveBeenCalledWith(
      { pluginMessage: { type: 'ui-ready' } },
      '*',
    )
  })

  it('shows the page name announced by the sandbox', async () => {
    render(<App />)

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          pluginMessage: { type: 'plugin-ready', pageName: 'Primitiv DS' },
        },
      }),
    )

    expect(
      await screen.findByText('Connected to: Primitiv DS'),
    ).toBeInTheDocument()
  })

  it('ignores window messages that are not sandbox messages', () => {
    render(<App />)

    window.dispatchEvent(new MessageEvent('message', { data: {} }))

    expect(screen.queryByText(/Connected to:/)).not.toBeInTheDocument()
  })

  it('asks the sandbox to inspect variables when the inspect button is clicked', async () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage')
    render(<App />)

    await userEvent.click(
      screen.getByRole('button', { name: 'Inspect variables' }),
    )

    expect(postMessage).toHaveBeenLastCalledWith(
      { pluginMessage: { type: 'inspect-variables-request' } },
      '*',
    )
  })

  it('renders the inspect result returned by the sandbox', async () => {
    render(<App />)

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'inspect-variables-result',
            collections: [
              {
                id: 'c1',
                name: 'Primitives',
                modes: [],
                defaultModeId: '',
                variableIds: [],
              },
            ],
            variables: [],
          },
        },
      }),
    )

    expect(await screen.findByText(/"name": "Primitives"/)).toBeInTheDocument()
  })

  it('asks the sandbox to export tokens when the export button is clicked', async () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage')
    render(<App />)

    await userEvent.click(
      screen.getByRole('button', { name: 'Export tokens' }),
    )

    expect(postMessage).toHaveBeenLastCalledWith(
      { pluginMessage: { type: 'export-tokens-request' } },
      '*',
    )
  })

  it('renders download links for the three DTCG files after an export reply', async () => {
    render(<App />)

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'export-tokens-result',
            collections: [
              {
                id: 'cp',
                name: 'Primitives',
                modes: [{ modeId: 'mp', name: 'Value' }],
                defaultModeId: 'mp',
                variableIds: ['v1'],
              },
            ],
            variables: [
              {
                id: 'v1',
                name: 'font-family/sans',
                resolvedType: 'STRING',
                variableCollectionId: 'cp',
                valuesByMode: { mp: 'Asta Sans' },
              },
            ],
          },
        },
      }),
    )

    expect(
      await screen.findByRole('link', { name: 'primitives.json' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'semantic.json' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'components.json' }),
    ).toBeInTheDocument()
  })

  it('encodes the transformed primitives into the download link', async () => {
    render(<App />)

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'export-tokens-result',
            collections: [
              {
                id: 'cp',
                name: 'Primitives',
                modes: [{ modeId: 'mp', name: 'Value' }],
                defaultModeId: 'mp',
                variableIds: ['v1'],
              },
            ],
            variables: [
              {
                id: 'v1',
                name: 'font-family/sans',
                resolvedType: 'STRING',
                variableCollectionId: 'cp',
                valuesByMode: { mp: 'Asta Sans' },
              },
            ],
          },
        },
      }),
    )

    const link = (await screen.findByRole('link', {
      name: 'primitives.json',
    })) as HTMLAnchorElement
    expect(link.getAttribute('download')).toBe('primitives.json')
    expect(link.href).toMatch(/^data:application\/json/)
    const payload = decodeURIComponent(link.href.split(',')[1])
    expect(JSON.parse(payload)).toEqual({
      'font-family': { sans: { $type: 'string', $value: 'Asta Sans' } },
    })
  })

  it('asks the sandbox to close when the close button is clicked', async () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage')
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(postMessage).toHaveBeenLastCalledWith(
      { pluginMessage: { type: 'close' } },
      '*',
    )
  })
})
