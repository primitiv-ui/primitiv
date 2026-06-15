# Releasing & repo ownership

How the `@primitiv-ui/*` packages get published, and how to move the repo
into the `primitiv-ui` GitHub org. See `NAMING.md` for *why* the scope is
`@primitiv-ui`; this file is the *how* of shipping.

The publish workflow lives at `.github/workflows/publish.yml`. It is a
**scaffold** — the prerequisites below must be done before it can succeed.

---

## 1. Transferring the repo into the `primitiv-ui` org

Currently `simonrevill/primitiv`. Moving it to `primitiv-ui/primitiv`
aligns the repo with the npm/JSR/GitHub names and is what trusted
publishing keys off.

**Before transferring**

- It's a deliberate, low-traffic moment — do it when no PRs are mid-flight.
- You must be an owner of the `primitiv-ui` org (you created it, so you are).

**Steps**

1. Repo → **Settings** → **General** → bottom → **Transfer ownership**.
2. New owner: `primitiv-ui`. Confirm by typing the repo name.

**After transferring**

- **Remotes** — anyone with a clone updates their remote:
  `git remote set-url origin https://github.com/primitiv-ui/primitiv.git`
  (GitHub keeps a redirect, so old URLs still work, but update it anyway).
- **GitHub Pages** — re-check Settings → Pages; the docs site URL base may
  change. The `deploy-docs.yml` workflow assumes base `/primitiv/`
  (`WORKBENCH_BASE: /primitiv/workbench/`) — still correct if the repo name
  stays `primitiv`.
- **Branch protection / rulesets** — these don't always travel; re-apply on
  `main`.
- **Secrets & variables** — Actions secrets do NOT transfer. Re-add any you
  rely on (none are needed if you stay fully OIDC/tokenless).
- **Trusted Publisher config** (npm + JSR) — must reference the **new**
  `primitiv-ui/primitiv` owner/repo. Set these up *after* the transfer
  (section 4), or update them if you set them up earlier.

---

## 2. CLI binary distribution

The `primitiv` Rust binary is distributed via the proven `optionalDependencies`
per-platform-package pattern (same as esbuild, Biome, oxc). The pieces:

| Directory | npm name | Role |
|---|---|---|
| `npm/cli-darwin-arm64/` | `@primitiv-ui/cli-darwin-arm64` | Binary for macOS Apple Silicon |
| `npm/cli-darwin-x64/` | `@primitiv-ui/cli-darwin-x64` | Binary for macOS Intel |
| `npm/cli-linux-x64-gnu/` | `@primitiv-ui/cli-linux-x64-gnu` | Binary for Linux x64 (glibc) |
| `npm/cli-linux-arm64-gnu/` | `@primitiv-ui/cli-linux-arm64-gnu` | Binary for Linux arm64 (glibc) |
| `npm/cli-win32-x64/` | `@primitiv-ui/cli-win32-x64` | Binary for Windows x64 |
| `npm/cli-wrapper/` | `primitiv-ui` | JS launcher; lists platform packages as `optionalDependencies` |
| `npm/create-primitiv-ui/` | `create-primitiv-ui` | `npm create primitiv-ui` entry point |

**How it works at install time:** the package manager installs only the
matching platform package (skipping others via `os`/`cpu` guards). The
`bin/primitiv.mjs` launcher resolves the binary from whichever platform
package was installed and `spawnSync`s it.

**Binaries are not committed.** The `npm/cli-*/primitiv[.exe]` files are in
`.gitignore`. `publish.yml` builds them via a matrix job, stages them in
`/tmp/cli-artifacts/`, copies them into the package directories, then
publishes immediately.

**Platform matrix (v1):** `darwin-arm64`, `darwin-x64`, `linux-x64-gnu`,
`linux-arm64-gnu`, `win32-x64`. musl is a documented fast-follow.
`cargo install primitiv-cli` covers any target not yet packaged.

**Versioning:** platform packages, wrapper, and scaffold are versioned
together. When cutting a new release, bump all seven package.json `version`
fields and the `optionalDependencies` in `npm/cli-wrapper/package.json` to
match. The `@primitiv-ui/cli-*` packages supersede their published v0.0.1
placeholders at v0.1.0+.

**One-time Trusted Publishing setup (npm)** — do this for each package name:

1. Go to `npmjs.com/package/<name>` → Settings → Trusted Publisher.
2. Add a GitHub Actions publisher:
   - Repository: `primitiv-ui/primitiv`
   - Workflow: `publish.yml`

For `@primitiv-ui/cli-*` packages that don't exist yet: configure TP before
the first publish (npmjs.com supports this for new packages). If TP rejects
a new package, do a one-time bootstrap with `NPM_TOKEN` (uncomment the env
blocks in `publish.yml`, add the secret, publish once, then switch to TP and
remove the secret).

**musl fast-follow** — when needed, add two more entries to the matrix and
two more platform packages (`cli-linux-x64-musl`, `cli-linux-arm64-musl`),
then add them to the wrapper's `optionalDependencies`.

---

## 3. Library packages (publish-ready as of 2026-06-15)

`packages/react`, `packages/icons`, `packages/tokens` — all three are now
shippable at v0.1.0. Changes made:

- [x] `"private": true` removed; `"publishConfig": { "access": "public" }` added.
- [x] Version set to `0.1.0`.
- [x] `"exports"` maps valid (`{ "types": ..., "default": ... }` shape).
- [x] **Source-first** (decided for v1): `main`/`types` point at `./src/index.ts`.
  All modern bundlers (Vite, Next.js, Rollup, webpack 5+) consume TypeScript
  directly; JSR is source-first by design. No `dist` step added — add one
  only if a non-bundler consumer (plain Node, Deno without bundler) needs it.
- [x] `"files": ["src"]` set on all three.
- [x] `"repository"` field set to `primitiv-ui/primitiv` (as instructed in
  the org-transfer checklist).

The workflow already runs `qa:units` on all three before publishing, so
tests gate the release. `pnpm -r publish` skips `private: true` packages
(`apps/workbench`, `crates/harmoni-wasm/pkg`) automatically.

---

## 4. One-time tokenless (OIDC) publishing setup

No long-lived tokens live in the repo. Both registries authenticate from
GitHub Actions via OIDC (`id-token: write`, already set in the workflow).

**npm — Trusted Publishing**

For **each** package (`@primitiv-ui/react`, `/icons`, `/tokens`):

1. The package must exist on npm first. For a brand-new package, either do
   one initial manual publish with a granular token, or create the package
   and configure trusted publishing per npm's current flow.
2. npmjs.com → the package → **Settings** → **Trusted Publisher** → add a
   GitHub Actions publisher:
   - Repository: `primitiv-ui/primitiv`
   - Workflow: `publish.yml`
3. After that, CI publishes with **no token** and attaches provenance.

> If tokenless publishing isn't working for your npm/pnpm versions yet,
> uncomment the `NODE_AUTH_TOKEN` env block in `publish.yml` and add an
> `NPM_TOKEN` repo secret (granular, automation, publish scope) as a
> fallback. Remove it once trusted publishing is confirmed.

**JSR — link the package to the repo**

For each package on jsr.io → package **Settings** → link to the GitHub
repository `primitiv-ui/primitiv`. JSR then trusts OIDC publishes from
Actions automatically — no token. (Each package also needs a valid
`exports` map / `jsr.json`; see section 3.)

---

## 5. Cutting a release

Once sections 2, 3, and 4 are done:

1. Bump the package versions (manually, or adopt Changesets later).
2. Commit, then create a **GitHub Release** (which tags the commit).
3. The `release: published` trigger runs `publish.yml`, or run it manually:
   Actions → **Publish packages** → **Run workflow**.
4. The job builds wasm → installs → generates icons → tests → publishes to
   npm (with provenance) → publishes to JSR.

---

## Notes

- The wasm build step is mandatory: `harmoni-wasm` is a workspace member the
  install graph resolves against, so `pnpm install` fails without it (the
  same gotcha documented in the `sandbox-gotchas` skill).
- `pnpm -r publish` skips `private` packages automatically, so only the
  publish-ready ones go out — no need to maintain a separate list.
- This is process documentation, not a guarantee: confirm the current npm
  Trusted Publishing and pnpm OIDC support at release time, as both have
  evolved recently.
