# Reserved npm names (placeholders)

Minimal placeholder packages whose only job is to **reserve the unscoped npm
names** the Primitiv CLI will use (RFC 0005, decisions D20 / D22):

- **`primitiv-ui`** — the CLI package (command: `primitiv`)
- **`create-primitiv-ui`** — the `npm create primitiv-ui` scaffold

The unscoped `primitiv` name is already taken (by an unrelated product, Primitiv
AI), and unscoped names are first-come — so these two are claimed ahead of the
real release. Each placeholder just prints a "coming soon" notice.

They sit **outside the pnpm workspace** (globs: `apps/*`, `packages/*`,
`crates/harmoni-wasm/pkg`), so the monorepo never installs, builds, or tests
them.

## Naming is independent of the GitHub org

The npm names (`@primitiv-ui`, `primitiv-ui`, `create-primitiv-ui`) are
**unrelated to the GitHub org**. Transferring the repo to the `primitiv-ui`
GitHub org changes no package name and requires no re-publish. The only
transfer-coupled field is a `repository` URL — deliberately omitted from these
placeholders, so they are transfer-proof.

## Status — reserved ✅ (2026-06-09)

Both names are claimed. They were published as placeholders (**v0.0.1**) from the
`simonrevill` npm account via a one-off GitHub Actions workflow
(`reserve-names.yml`, since removed). The `NPM_TOKEN` secret and the npm token it
held have been deleted / revoked.

- https://www.npmjs.com/package/primitiv-ui
- https://www.npmjs.com/package/create-primitiv-ui

Once the real CLI ships, these placeholders are replaced by the actual
`primitiv-ui` / `create-primitiv-ui` builds at a higher version (RFC 0005 §7).
That release publishes via **Trusted Publishing** (tokenless) — no `NPM_TOKEN`
needed again.
