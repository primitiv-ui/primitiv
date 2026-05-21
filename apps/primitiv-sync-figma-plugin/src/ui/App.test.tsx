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

  describe('migrate preview', () => {
    const SAMPLE_PLAN = {
      semantic: { needsCreate: true, modeName: 'Value' },
      newVariables: [
        {
          name: 'typography/compact/display/xl/font-family',
          resolvedType: 'STRING' as const,
          sourceVariableId: 'cv1',
          sourceCollectionId: 'cc',
        },
        {
          name: 'typography/compact/display/xl/font-size',
          resolvedType: 'FLOAT' as const,
          sourceVariableId: 'cv2',
          sourceCollectionId: 'cc',
        },
      ],
      deletedCollectionIds: ['cc', 'cf', 'cx'],
    }

    function dispatchPlan(plan: typeof SAMPLE_PLAN): void {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: { type: 'migrate-preview-result', plan },
          },
        }),
      )
    }

    it('posts migrate-preview-request when Plan migration is clicked', async () => {
      const postMessage = vi.spyOn(window.parent, 'postMessage')
      render(<App />)

      await userEvent.click(
        screen.getByRole('button', { name: 'Plan migration' }),
      )

      expect(postMessage).toHaveBeenLastCalledWith(
        { pluginMessage: { type: 'migrate-preview-request' } },
        '*',
      )
    })

    it('renders the create-or-reuse message and counts when a plan arrives', async () => {
      render(<App />)

      dispatchPlan(SAMPLE_PLAN)

      expect(
        await screen.findByText(/Will create a Semantic collection/i),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/2 new variables will be created/),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/3 Typography collection.*deleted/),
      ).toBeInTheDocument()
    })

    it('lists each planned variable name in the preview', async () => {
      render(<App />)

      dispatchPlan(SAMPLE_PLAN)

      expect(
        await screen.findByText(
          'typography/compact/display/xl/font-family',
        ),
      ).toBeInTheDocument()
      expect(
        screen.getByText('typography/compact/display/xl/font-size'),
      ).toBeInTheDocument()
    })

    it('uses singular "collection" when exactly one would be deleted', async () => {
      render(<App />)

      dispatchPlan({ ...SAMPLE_PLAN, deletedCollectionIds: ['cc'] })

      expect(
        await screen.findByText(/1 Typography collection will be deleted/),
      ).toBeInTheDocument()
    })

    it('says it will reuse Semantic when one already exists', async () => {
      render(<App />)

      dispatchPlan({
        ...SAMPLE_PLAN,
        semantic: {
          needsCreate: false,
          existingId: 'cs',
          modeName: 'Value',
        },
      })

      expect(
        await screen.findByText(/Will reuse the existing Semantic/i),
      ).toBeInTheDocument()
    })

    it('shows a Run migration button only after a plan has been previewed', async () => {
      render(<App />)

      expect(
        screen.queryByRole('button', { name: /Run migration/i }),
      ).not.toBeInTheDocument()

      dispatchPlan(SAMPLE_PLAN)

      expect(
        await screen.findByRole('button', { name: /Run migration/i }),
      ).toBeInTheDocument()
    })

    it('posts migrate-execute-request when Run migration is clicked', async () => {
      const postMessage = vi.spyOn(window.parent, 'postMessage')
      render(<App />)

      dispatchPlan(SAMPLE_PLAN)
      await userEvent.click(
        await screen.findByRole('button', { name: /Run migration/i }),
      )

      expect(postMessage).toHaveBeenLastCalledWith(
        { pluginMessage: { type: 'migrate-execute-request' } },
        '*',
      )
    })

    it('shows a success notice when the sandbox confirms the migration ran', async () => {
      render(<App />)
      dispatchPlan(SAMPLE_PLAN)
      await screen.findByRole('button', { name: /Run migration/i })

      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: { type: 'migrate-execute-result', success: true },
          },
        }),
      )

      expect(
        await screen.findByText(/Migration complete/i),
      ).toBeInTheDocument()
    })

    it('shows the error message when the migration fails', async () => {
      render(<App />)
      dispatchPlan(SAMPLE_PLAN)
      await screen.findByRole('button', { name: /Run migration/i })

      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'migrate-execute-result',
              success: false,
              error: 'Figma API error',
            },
          },
        }),
      )

      expect(
        await screen.findByText(/Figma API error/),
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
