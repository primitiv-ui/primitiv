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

1. Bump the package versions (manually, or adopt Changesets later). **Bump
   every publishable package together** — see §6 on why the CLI packages can't
   be left behind.
2. Commit, then create a **GitHub Release** (which tags the commit).
3. The `release: published` trigger runs `publish.yml`, or run it manually:
   Actions → **Publish packages** → **Run workflow**.
4. The job builds wasm → installs → generates icons → tests → publishes to
   npm (with provenance) → publishes to JSR.

---

## 6. JSR slow types (no `--allow-slow-types`)

JSR scores "no slow types" as its single biggest factor. A symbol is a "slow
type" if its type must be **inferred** rather than declared, because JSR/Deno
analyses the public API without running the full TypeScript checker (for speed
and to emit `.d.ts` for Node consumers). The v0.1.0 packages were bootstrapped
with `--allow-slow-types` (scores: icons 29 / react 47 / tokens 70); the flag
is now removed. To keep it that way:

- **Every exported function/component needs an explicit return type.** For React
  components that's `ReactElement` (or `ReactElement | null` / `ReactPortal`
  where applicable) — never rely on inference.
- **Exported `const`s assigned from a call need an explicit type** —
  `forwardRef(...)`, `createContext(...)`, etc.
- **No array-destructured exports.** `export const [X, useX] = createStrictContext(...)`
  is rejected; split into two individually-typed bindings (the
  `react-component-patterns` skill shows the canonical form).
- **Barrel imports need explicit `.ts` / `.tsx` extensions** for JSR module
  resolution (`export * from "./Foo/index.ts"`, not `"./Foo"`). The
  `@primitiv-ui/icons` generator template emits these automatically.
- **Verify before publishing**, from each package dir:
  `npx jsr publish --dry-run` (or `deno publish --dry-run --no-check`). It must
  report `Success` with no slow-type errors.
- `@primitiv-ui/icons` pins `jsxImportSource` to `npm:react@^18` in its
  `jsr.json`; that resolves on JSR's servers. A local dry-run on a machine with
  only React 19 installed needs the pin temporarily aligned — production value
  stays `^18`.

### Other JSR score levers (beyond slow types)

`jsr publish --dry-run` only checks slow types; the **score** has more
factors, surfaced by `deno doc --lint <entrypoint>`:

- **Description** — JSR's config file (`jsr.json`) has **no `description`
  field** (its schema is `name` / `version` / `license` / `exports` /
  `publish` only). The description shown on jsr.io and counted by the score
  is set **per package in the jsr.io web UI** (package → Settings →
  Description). Putting `description` in `jsr.json` does nothing. The npm
  listing reads its description from `package.json` instead — keep both in
  sync there.
- **Documentation coverage** — every exported symbol (functions, components,
  **types/interfaces, and their members**) needs a JSDoc doc comment, and
  every type referenced by a public symbol must itself be exported from the
  entrypoint (`deno doc --lint` flags these as `missing-jsdoc` and
  `private-type-ref`). Run `deno doc --lint packages/<pkg>/src/index.ts` to
  get the exact list. The `@primitiv-ui/icons` generator emits a JSDoc per
  glyph so regenerated icons stay covered.
- **Runtime compatibility** — mark which runtimes each package supports in
  the jsr.io package settings; an unset list costs score.

Lockstep version bumps are **required**, not just tidy: `publish.yml` publishes
the `@primitiv-ui/cli-*` platform packages, the wrapper, and the scaffold with
plain `npm publish`, which **errors on an already-published version**. (Only the
library step uses `pnpm -r publish`, which skips versions already on the
registry.) So a release that bumps only the libraries fails at the CLI publish
step — bump all ten publishable packages (and the wrapper's
`optionalDependencies`) together.

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
- **Don't test the CLI in StackBlitz / WebContainer.** `create-primitiv-ui`
  installs `primitiv-ui`, which downloads a per-platform **native Rust binary**
  and `spawnSync`s it. WebContainers run an in-browser WASM Node that can't
  execute native binaries (and their npm shim throws `ERR_INVALID_PROTOCOL`).
  Test in a real Node environment — local, a Codespace, or a Linux/Docker
  container — with `npm create primitiv-ui@latest`. Unsupported arches fall
  back to `cargo install primitiv-cli`.
