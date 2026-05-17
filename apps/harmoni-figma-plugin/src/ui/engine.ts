import init from 'harmoni-wasm'
import wasmUrl from 'harmoni-wasm/harmoni_wasm_bg.wasm?url'

/**
 * The Harmoni Rust API surface, re-exported for the UI.
 *
 * Every function here is only callable once `initEngine()` has resolved.
 * It is wired in at this stage purely to prove the engine is reachable;
 * no feature consumes it yet.
 */
export * as harmoni from 'harmoni-wasm'

let initPromise: Promise<void> | null = null

/**
 * Loads and instantiates the harmoni-wasm module once, memoising the
 * result so repeat callers share a single instantiation.
 *
 * The wasm binary is passed explicitly: Figma's UI runs in a single-file
 * iframe with no resolvable URL for a sibling asset, so the build inlines
 * the binary and `wasmUrl` resolves to a data URI.
 */
export function initEngine(): Promise<void> {
  initPromise ??= init(wasmUrl).then(() => undefined)
  return initPromise
}
