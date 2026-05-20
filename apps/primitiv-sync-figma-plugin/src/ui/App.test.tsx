import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { App } from './App'

describe('App', () => {
  it('shows a waiting state before the sandbox announces the page', () => {
    render(<App />)

    expect(screen.getByText('Waiting for Figma…')).toBeInTheDocument()
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
