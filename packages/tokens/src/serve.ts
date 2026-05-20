/**
 * Boot script for the local DTCG sync server.
 *
 * Run via `pnpm --filter @primitiv/tokens sync:serve` (or the root
 * `pnpm tokens:sync` alias). Listens on http://localhost:4477 and
 * writes any POST /sync payload into this directory as the three
 * `<layer>.json` files. Not meant for production; binds to loopback
 * only.
 */

import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { createSyncServer } from './server'

const here = path.dirname(fileURLToPath(import.meta.url))
const port = 4477

const server = createSyncServer({ outDir: here })
server.listen(port, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(
    `[@primitiv/tokens] sync server listening on http://localhost:${port}`,
  )
  // eslint-disable-next-line no-console
  console.log(`[@primitiv/tokens] writing JSON files to ${here}`)
})
