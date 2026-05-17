const { init } = vi.hoisted(() => ({
  init: vi.fn(() => Promise.resolve()),
}))

vi.mock('harmoni-wasm', () => ({ default: init }))

import { initEngine } from './engine'

describe('initEngine', () => {
  it('instantiates the wasm module only once across calls', async () => {
    await initEngine()
    await initEngine()

    expect(init).toHaveBeenCalledOnce()
  })
})
