import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { App } from './App'

vi.mock('./engine', () => ({
  initEngine: vi.fn(() => Promise.resolve()),
}))

describe('App', () => {
  it('greets once the harmoni-wasm engine is ready', async () => {
    render(<App />)

    expect(
      await screen.findByText('Hello from Harmoni Wasm!'),
    ).toBeInTheDocument()
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

  it('ignores window messages that are not sandbox messages', async () => {
    render(<App />)
    await screen.findByText('Hello from Harmoni Wasm!')

    window.dispatchEvent(new MessageEvent('message', { data: {} }))

    expect(screen.queryByText(/Connected to:/)).not.toBeInTheDocument()
  })

  it('asks the sandbox to close when the close button is clicked', async () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage')
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(postMessage).toHaveBeenCalledWith(
      { pluginMessage: { type: 'close' } },
      '*',
    )
  })
})
