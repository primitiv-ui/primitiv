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

  describe('live sync', () => {
    const PRIMITIVES_PAYLOAD = {
      type: 'export-tokens-result' as const,
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
          resolvedType: 'STRING' as const,
          variableCollectionId: 'cp',
          valuesByMode: { mp: 'Asta Sans' },
        },
      ],
    }

    function dispatchExportResult(): void {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { pluginMessage: PRIMITIVES_PAYLOAD },
        }),
      )
    }

    it('renders a Live sync toggle that is off by default', () => {
      render(<App />)

      const toggle = screen.getByRole('checkbox', { name: /Live sync/i })
      expect(toggle).not.toBeChecked()
    })

    it('POSTs the DTCG payload to localhost:4477 when live sync is enabled', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: true, status: 200 } as Response)
      vi.stubGlobal('fetch', fetchMock)

      render(<App />)
      await userEvent.click(
        screen.getByRole('checkbox', { name: /Live sync/i }),
      )
      dispatchExportResult()

      await screen.findByText(/Synced/)

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4477/sync',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      const body = JSON.parse(
        (fetchMock.mock.calls[0][1] as { body: string }).body,
      )
      expect(body.primitives['font-family'].sans).toEqual({
        $type: 'string',
        $value: 'Asta Sans',
      })
    })

    it('shows an error status when the sync server responds non-OK', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response),
      )

      render(<App />)
      await userEvent.click(
        screen.getByRole('checkbox', { name: /Live sync/i }),
      )
      dispatchExportResult()

      expect(await screen.findByText(/500/)).toBeInTheDocument()
    })

    it('shows an error status when the sync fetch rejects', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('connection refused')),
      )

      render(<App />)
      await userEvent.click(
        screen.getByRole('checkbox', { name: /Live sync/i }),
      )
      dispatchExportResult()

      expect(
        await screen.findByText(/connection refused/),
      ).toBeInTheDocument()
    })

    it('shows a Syncing status while the request is in flight', async () => {
      let resolveFetch: (value: Response) => void = () => {}
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve
      })
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(fetchPromise))

      render(<App />)
      await userEvent.click(
        screen.getByRole('checkbox', { name: /Live sync/i }),
      )
      dispatchExportResult()

      expect(await screen.findByText(/Syncing/)).toBeInTheDocument()

      resolveFetch({ ok: true, status: 200 } as Response)
      await screen.findByText(/Synced/)
    })

    it('hides the download links while live sync is enabled', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response),
      )

      render(<App />)
      await userEvent.click(
        screen.getByRole('checkbox', { name: /Live sync/i }),
      )
      dispatchExportResult()
      await screen.findByText(/Synced/)

      expect(
        screen.queryByRole('link', { name: 'primitives.json' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('bootstrap context', () => {
    it('renders a Bootstrap context button', () => {
      render(<App />)

      expect(
        screen.getByRole('button', { name: /Bootstrap context/i }),
      ).toBeInTheDocument()
    })

    it('sends bootstrap-context-request with the selected context when clicked', async () => {
      const postMessage = vi.spyOn(window.parent, 'postMessage')
      render(<App />)

      await userEvent.click(
        screen.getByRole('button', { name: /Bootstrap context/i }),
      )

      expect(postMessage).toHaveBeenLastCalledWith(
        {
          pluginMessage: {
            type: 'bootstrap-context-request',
            context: 'comfortable',
          },
        },
        '*',
      )
    })

    it('shows a summary of the bootstrap result when it arrives', async () => {
      render(<App />)

      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'bootstrap-context-result',
              result: {
                context: 'comfortable',
                collection: 'created',
                variablesCreated: 97,
                variablesUpdated: 0,
                textStylesCreated: 18,
                textStylesUpdated: 0,
                warnings: [],
              },
            },
          },
        }),
      )

      expect(await screen.findByText(/97/)).toBeInTheDocument()
      expect(screen.getByText(/18/)).toBeInTheDocument()
    })

    it('lists warnings returned with the bootstrap result', async () => {
      render(<App />)

      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'bootstrap-context-result',
              result: {
                context: 'comfortable',
                collection: 'updated',
                variablesCreated: 0,
                variablesUpdated: 97,
                textStylesCreated: 0,
                textStylesUpdated: 18,
                warnings: ['Primitive "font-size/12" missing — skipped'],
              },
            },
          },
        }),
      )

      expect(
        await screen.findByText(/font-size\/12/),
      ).toBeInTheDocument()
    })

    it('shows the error message when a bootstrap-context-error arrives', async () => {
      render(<App />)

      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'bootstrap-context-error',
              context: 'comfortable',
              message: 'Primitives collection not found',
            },
          },
        }),
      )

      expect(
        await screen.findByText(/Primitives collection not found/),
      ).toBeInTheDocument()
    })
  })

  describe('bootstrap interaction', () => {
    it('renders a Bootstrap interaction button', () => {
      render(<App />)

      expect(
        screen.getByRole('button', { name: /Bootstrap interaction/i }),
      ).toBeInTheDocument()
    })

    it('sends bootstrap-interaction-request when clicked', async () => {
      const postMessage = vi.spyOn(window.parent, 'postMessage')
      render(<App />)

      await userEvent.click(
        screen.getByRole('button', { name: /Bootstrap interaction/i }),
      )

      expect(postMessage).toHaveBeenLastCalledWith(
        {
          pluginMessage: { type: 'bootstrap-interaction-request' },
        },
        '*',
      )
    })

    it('shows a summary of the bootstrap interaction result when it arrives', async () => {
      render(<App />)

      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'bootstrap-interaction-result',
              result: {
                collection: 'created',
                variablesCreated: 5,
                variablesUpdated: 0,
                warnings: [],
              },
            },
          },
        }),
      )

      expect(
        await screen.findByText(/Bootstrapped Interaction/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/5 created/)).toBeInTheDocument()
    })

    it('lists warnings returned with the bootstrap interaction result', async () => {
      render(<App />)

      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'bootstrap-interaction-result',
              result: {
                collection: 'updated',
                variablesCreated: 0,
                variablesUpdated: 4,
                warnings: ['Primitive "opacity/90" missing — skipped'],
              },
            },
          },
        }),
      )

      expect(
        await screen.findByText(/opacity\/90/),
      ).toBeInTheDocument()
    })

    it('shows the error message when a bootstrap-interaction-error arrives', async () => {
      render(<App />)

      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'bootstrap-interaction-error',
              message: 'Primitives collection not found',
            },
          },
        }),
      )

      expect(
        await screen.findByText(/Primitives collection not found/),
      ).toBeInTheDocument()
    })
  })

  describe('bootstrap intent', () => {
    it('renders a Bootstrap Intent button', () => {
      render(<App />)

      expect(
        screen.getByRole('button', { name: /Bootstrap Intent/i }),
      ).toBeInTheDocument()
    })

    it('sends bootstrap-intent-request when clicked', async () => {
      const postMessage = vi.spyOn(window.parent, 'postMessage')
      render(<App />)

      await userEvent.click(
        screen.getByRole('button', { name: /Bootstrap Intent/i }),
      )

      expect(postMessage).toHaveBeenLastCalledWith(
        {
          pluginMessage: { type: 'bootstrap-intent-request' },
        },
        '*',
      )
    })

    it('shows a summary of the bootstrap intent result when it arrives', async () => {
      render(<App />)

      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'bootstrap-intent-result',
              result: {
                collection: 'updated',
                variablesCreated: 0,
                variablesUpdated: 46,
                warnings: [],
              },
            },
          },
        }),
      )

      expect(
        await screen.findByText(/Bootstrapped Intent/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/46 updated/)).toBeInTheDocument()
    })

    it('shows the error message when a bootstrap-intent-error arrives', async () => {
      render(<App />)

      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'bootstrap-intent-error',
              message: 'Primitives / Palette collection not found',
            },
          },
        }),
      )

      expect(
        await screen.findByText(/Primitives \/ Palette collection not found/),
      ).toBeInTheDocument()
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
