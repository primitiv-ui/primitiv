import { render, screen } from '@testing-library/react'
import { App } from './App'

vi.mock('./ColorEngine', () => ({
  ColorEngine: () => <div data-testid="color-engine" />,
}))

describe('App', () => {
  it('renders the colour engine', () => {
    render(<App />)
    expect(screen.getByTestId('color-engine')).toBeInTheDocument()
  })
})
