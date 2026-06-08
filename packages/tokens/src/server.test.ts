import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

import { createSyncServer } from './server'

describe('createSyncServer', () => {
  let outDir: string
  let server: http.Server
  let port: number

  beforeEach(async () => {
    outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tokens-sync-'))
    server = createSyncServer({ outDir })
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', () => resolve()),
    )
    const address = server.address()
    if (typeof address === 'string' || address === null) {
      throw new Error('server did not bind to a port')
    }
    port = address.port
  })

  afterEach(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    )
    await fs.rm(outDir, { recursive: true, force: true })
  })

  function url(path = '/sync'): string {
    return `http://127.0.0.1:${port}${path}`
  }

  it('writes the six DTCG files to disk on POST /sync', async () => {
    const payload = {
      primitives: {
        'font-family': { sans: { $type: 'string', $value: 'Asta Sans' } },
      },
      palette: { light: {}, dark: {} },
      foreground: { light: {}, dark: {} },
      intent: { light: {}, dark: {} },
      context: { comfortable: {} },
      interaction: {},
    }

    const response = await fetch(url(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    expect(response.status).toBe(200)
    expect(
      JSON.parse(
        await fs.readFile(path.join(outDir, 'primitives.json'), 'utf8'),
      ),
    ).toEqual(payload.primitives)
    expect(
      JSON.parse(
        await fs.readFile(path.join(outDir, 'palette.json'), 'utf8'),
      ),
    ).toEqual(payload.palette)
    expect(
      JSON.parse(
        await fs.readFile(path.join(outDir, 'foreground.json'), 'utf8'),
      ),
    ).toEqual(payload.foreground)
    expect(
      JSON.parse(
        await fs.readFile(path.join(outDir, 'intent.json'), 'utf8'),
      ),
    ).toEqual(payload.intent)
    expect(
      JSON.parse(
        await fs.readFile(path.join(outDir, 'context.json'), 'utf8'),
      ),
    ).toEqual(payload.context)
    expect(
      JSON.parse(
        await fs.readFile(path.join(outDir, 'interaction.json'), 'utf8'),
      ),
    ).toEqual(payload.interaction)
  })

  it('includes the CORS Allow-Origin header on a successful sync', async () => {
    const response = await fetch(url(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ primitives: {}, palette: {}, intent: {}, context: {}, interaction: {} }),
    })

    expect(response.headers.get('access-control-allow-origin')).toBe('*')
  })

  it('answers OPTIONS preflight with CORS headers and 204', async () => {
    const response = await fetch(url(), { method: 'OPTIONS' })

    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(response.headers.get('access-control-allow-methods')).toContain(
      'POST',
    )
    expect(response.headers.get('access-control-allow-headers')).toContain(
      'Content-Type',
    )
  })

  it('returns 400 when the request body is not valid JSON', async () => {
    const response = await fetch(url(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })

    expect(response.status).toBe(400)
  })

  it('returns 404 for paths other than /sync', async () => {
    const response = await fetch(url('/other'), { method: 'POST' })

    expect(response.status).toBe(404)
  })

  it('returns 405 for unsupported methods on /sync', async () => {
    const response = await fetch(url(), { method: 'GET' })

    expect(response.status).toBe(405)
  })

  it('writes pretty-printed JSON with a trailing newline', async () => {
    const payload = {
      primitives: {
        color: { red: { $type: 'color', $value: '#ff0000' } },
      },
      palette: {},
      intent: {},
      context: {},
      interaction: {},
    }

    await fetch(url(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const written = await fs.readFile(
      path.join(outDir, 'primitives.json'),
      'utf8',
    )

    expect(written).toMatch(/\n$/)
    expect(written).toContain('  "color"')
  })
})
