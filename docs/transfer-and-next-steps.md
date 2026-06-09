# Checklist — org transfer & next steps

Snapshot after the 2026-06-09 consumption-layer design session. The npm name
reservation is **done**; the rest is for the 16th onward. Transfer detail lives
in [`../RELEASING.md`](../RELEASING.md); the full decision log (D1–D25) lives in
[`consumption-design.md`](consumption-design.md).

## ✅ Done (2026-06-09)

- Consumption layer designed: `consumption-design.md` + RFCs **0004–0006**
  (`rfcs/`), indexed in `rfcs/README.md`.
- npm names **reserved** (placeholder packages, v0.0.1, owner: `simonrevill`):
  - `primitiv-ui` — the CLI package (command: `primitiv`)
  - `create-primitiv-ui` — the `npm create primitiv-ui` scaffold
- Placeholders live under `reserved/` (outside the pnpm workspace).

## 🔐 Security cleanup (now / today)

- [ ] Delete the `NPM_TOKEN` repo secret (Settings → Secrets and variables → Actions).
- [ ] Revoke the granular npm token (npmjs.com → Access Tokens).
- [ ] Optional: delete `.github/workflows/reserve-names.yml` — its one job is done.

## 📦 Org transfer to `primitiv-ui` (the 16th) — detail in RELEASING.md §1

- [ ] Transfer `simonrevill/primitiv` → `primitiv-ui/primitiv` (Settings → Transfer ownership).
- [ ] Update local remotes: `git remote set-url origin https://github.com/primitiv-ui/primitiv.git`.
- [ ] Re-apply branch protection / rulesets (they don't always travel).
- [ ] Re-check GitHub Pages base (`deploy-docs.yml` `WORKBENCH_BASE` — still correct if the repo name stays `primitiv`).
- [ ] Re-add Actions secrets (they do **not** transfer). For real releases prefer **Trusted Publishing** (tokenless) over re-adding `NPM_TOKEN`.
- [ ] Configure the npm **Trusted Publisher** per package → `primitiv-ui/primitiv` + `publish.yml`.
- [ ] Link each **JSR** package to the new repo.
- [ ] When the real packages ship, set their `repository` URLs to `primitiv-ui/primitiv` (the placeholders deliberately omit them).
- [ ] Optional: add the `@primitiv-ui` npm org as an owner of the unscoped `primitiv-ui` / `create-primitiv-ui` names (currently owned by the personal account).

## 🏗️ Build phase — the work that comes next (per the RFCs)

Foundation-first order:

- [ ] **Token emitter** (RFC 0006 §4) — DTCG → CSS (canonical) / SCSS / TS / Tailwind, custom Rust emitter. TDD from the existing `packages/tokens` fixtures. Both `tokens` and the example styles depend on it, so it goes first.
- [ ] **`primitiv theme`** (RFC 0006 §5) — link `harmoni-core`; brand → palette → token overrides; emit light + dark token sets.
- [ ] **Styling contract + `contract.json`** per component (RFC 0004 §3) — hybrid generation (data-* auto-verified, modifiers/custom-props authored).
- [ ] **Default theme authoring** in the workbench (RFC 0006 §7) — ported from Figma, one design emitted per format.
- [ ] **The CLI** (RFC 0005) — `init` / `add` / `tokens` / `theme` / `list`, `primitiv.json`, the static registry, refresh + wiring behaviour.
- [ ] **Distribution** (RFC 0005 §7) — Rust binary via `optionalDependencies` (`@primitiv-ui/cli-*`), `cargo-dist`/napi-rs matrix; replace the `reserved/` placeholders with the real `primitiv-ui` / `create-primitiv-ui` at a higher version.

## ❓ Small open questions to settle during the build

- Dark-mode switch selector — `[data-theme="dark"]` vs `.dark` (RFC 0006 §10).
- TS token object shape; Tailwind v4-only vs also v3 (RFC 0006 §10).
- `primitiv theme` output — separate overrides file vs merge (RFC 0006 §10).
- Written-file manifest location; registry hosting URL; package-manager coverage (RFC 0005 §9).
- (Already settled: BEM compound-part naming, hybrid `contract.json` generation, all-four token formats, light-theme + dark-tokens.)
