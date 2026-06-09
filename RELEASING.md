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
  (section 3), or update them if you set them up earlier.

---

## 2. Make the packages publish-ready (not done yet)

The three publishable packages — `packages/react`, `packages/icons`,
`packages/tokens` — are currently **not** shippable. Each needs:

- [ ] `"private": true` removed (or set `false`).
- [ ] A real `"version"` (they're all `0.0.0`).
- [ ] A valid `"exports"` **map** — today it's `["."]`, which is invalid for
      npm. Should be e.g.
      `{ ".": { "types": "...", "import": "..." } }`.
- [ ] A decision on **source vs build**: today `main`/`types` point at
      `./src/index.ts` (raw TS). That works for JSR (source-first) and for
      bundler consumers, but a typical public npm package ships compiled
      `dist` + `.d.ts`. If you add a build, wire a `build` script and a
      `"files"` allowlist, and add the build step to the workflow.
- [ ] `"files"` set on each package (only `react` has one) so the published
      tarball contains the right paths.
- [ ] `"publishConfig": { "access": "public" }` (scoped packages are private
      by default on npm).

The workflow already runs `qa:units` on all three before publishing, so
tests gate the release.

---

## 3. One-time tokenless (OIDC) publishing setup

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
`exports` map / `jsr.json`; see section 2.)

---

## 4. Cutting a release

Once 2 and 3 are done:

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
