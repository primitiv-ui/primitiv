/**
 * Tiny HTTP server that accepts a DTCG payload from the sync plugin and
 * writes the three layer files into `outDir` atomically.
 *
 * Designed for local dev only: it binds to 127.0.0.1, replies with a
 * permissive CORS allow-list, and has no auth. Run it via the
 * `sync:serve` script — never expose it on a public interface.
 */

import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { DtcgFiles } from './dtcg'

export interface SyncServerOptions {
  /** Directory the three DTCG files are written into. */
  outDir: string
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const

const DTCG_FILE_NAMES = ['primitives', 'palette', 'foreground', 'intent', 'context', 'interaction'] as const

/** Creates the HTTP server. Call `.listen(port)` to start accepting requests. */
export function createSyncServer(options: SyncServerOptions): http.Server {
  return http.createServer((req, res) => {
    void handleRequest(req, res, options)
  })
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  options: SyncServerOptions,
): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  if (req.url !== '/sync') {
    res.writeHead(404, CORS_HEADERS)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { ...CORS_HEADERS, Allow: 'POST, OPTIONS' })
    res.end()
    return
  }

  let body = ''
  for await (const chunk of req) body += chunk

  let payload: DtcgFiles
  try {
    payload = JSON.parse(body)
  } catch {
    res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid JSON' }))
    return
  }

  await writeDtcgFiles(payload, options.outDir)

  res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true }))
}

async function writeDtcgFiles(
  files: DtcgFiles,
  outDir: string,
): Promise<void> {
  await fs.mkdir(outDir, { recursive: true })
  for (const name of DTCG_FILE_NAMES) {
    const target = path.join(outDir, `${name}.json`)
    const tmp = `${target}.tmp`
    const json = JSON.stringify(files[name] ?? {}, null, 2) + '\n'
    await fs.writeFile(tmp, json, 'utf8')
    await fs.rename(tmp, target)
  }
}
