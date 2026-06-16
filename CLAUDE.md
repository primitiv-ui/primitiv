# Claude working notes for primitiv / harmoni

Onboarding context for a future Claude session. Detailed reference
material lives in on-demand skills; this file holds only what every
session needs.

## Two names, one repo

- **Primitiv** is the product (the design system).
- **Harmoni** is the palette generation engine inside it — the code
  name for what was formerly `primitiv-core` / `primitiv-wasm`.

Engine / Rust / wasm code → `harmoni`. Product, app title, repo
name, README heading, workbench app `<h1>` → leave as `Primitiv`. The
deliberate "Primitiv" references kept after Step B:

- `README.md` branding (the Primitiv logo lockup + tagline at the top)
- Root `package.json` `"name": "primitiv"`
- `apps/workbench/index.html` `<title>Primitiv</title>`
- `apps/workbench/src/App.tsx` `<h1>Primitiv Engine</h1>`

If you're renaming any of these, stop — you're eroding the identity
split.

## Working style — non-negotiable

1. **Strict TDD.** Red → green → refactor. Coverage stays at 100% —
   **lines, regions, and functions** (Rust) / lines, branches,
   statements, functions (TS). A lines-only check is not enough: it
   lets an untested branch through. Drive every branch from a test.
2. **Pure red-green.** No characterisation tests that pass on first
   run. If a test passes immediately, delete it and find a genuinely
   new behaviour to drive.
3. **Small commits.** One per red-green(-refactor) cycle. Don't
   batch unrelated work.
4. **Push little and often.** Short-lived branches over long
   unshared history.
5. **Leave the workbench app alone** unless mechanically forced (e.g.
   import paths after a rename) or adding a **new component**, which
   ships with its own example page (see "Definition of done"). It's
   an iteration workbench, not a production surface — don't expand it
   for anything else.
6. **Never open PRs unprompted.** "Update the PR description" /
   "create a new PR" are explicit; silence is not.
7. **GitHub interactions go through MCP tools** (`mcp__github__*`),
   not `gh` or the raw API. Scope is restricted to
   `primitiv-ui/primitiv`.

## Definition of done for any component change

Every behaviour change in `packages/react` ships with:

- A new or updated **test** covering the new/changed behaviour.
- Updated **JSDoc** on affected sub-components.
- Updated component **README** if the change is consumer-facing
  (new props, changed defaults, new patterns, escape hatches,
  gotchas).
- When adding a **new component**, three more things — easy to miss,
  all required before the component counts as "done":
  - a new row in `packages/react/README.md`'s components table,
    linking to the component's own `src/<Component>/README.md`. The
    component README alone is not the index — the table is.
  - a **workbench example** page under `apps/workbench/src/pages` wired
    into the router (see the `workbench-examples` skill).
  - the component's `ROADMAP.md` checkbox ticked `[x]` (and removed
    from the "Workbench examples" backlog if it was listed there).

These (test, JSDoc, README — plus, for a new component, the table
row, workbench example, and roadmap tick) are not follow-ups — they
are part of "done".

## Working efficiency under TDD

- **Commit messages: subject + 1 sentence body, max.** Implementation
  notes belong in JSDoc and tests, not the commit body. Session-id
  footer line is still required.
- **No per-cycle TodoWrite list.** Every cycle is the same shape.
- **One test run per green check.**
  `pnpm --filter @primitiv-ui/react vitest run src/<Component>` is
  enough. Skip full-suite + `--coverage` unless you suspect a
  coverage gap or a regression elsewhere.
- **One- or two-sentence end-of-cycle summary.** The diff is the
  source of truth.
- **Read with `offset` / `limit`** when jumping into a known region
  of a large file.
- **Share fixtures across tests.** Mirror what
  `Tabs.fixtures.ts` does — pure data, no helpers.

## Skills — load on demand

Reference material lives in skills under `.claude/skills/`, covering
React component work, the Rust/wasm engine, Figma (variables,
components, scripts, token sync), and repo tooling gotchas. Each
skill's frontmatter description (with TRIGGER/SKIP conditions) is
injected into every session automatically — do not duplicate or
paraphrase skill content in this file; the frontmatter is the single
source of truth for when a skill applies.

## Slash commands

- **`/scaffold-component <Name>`** — produces the empty file shape
  for a new headless component and commits the RED state. Does not
  bypass the cycle; implementation and docs commits are still
  human-driven.

## Current state

- Steps C, D, A, B and the vocabulary rename are landed.
- `harmoni-core` is pure Rust (3 direct deps: `csscolorparser`,
  `palette`, `serde`); `harmoni-wasm` holds all Tsify/wasm-bindgen
  code.
- The `neutral` module — greyscale/neutral ramps, soft neutrals,
  hue tinting — is landed. See the `harmoni-architecture-history`
  skill.
- `Palette` is a struct (`swatches` + `lightness_curve` + padding /
  `note` metadata), not a `Vec<Swatch>` type alias.
- `packages/react` is the headless component library
  (`@primitiv-ui/react`). Component inventory lives at
  `.claude/skills/new-react-component/_generated/component-inventory.md`.
- **The build phase has started** (live checklist:
  `docs/transfer-and-next-steps.md`). New crates: `crates/primitiv-cli`
  (the `FileSystem` port + in-memory fake) and `crates/primitiv-emit`
  (the pure DTCG → CSS emitter). Rust now runs in CI via
  `.github/workflows/rust.yml`, gating the CLI crates at 100% **lines,
  regions, and functions** with `cargo llvm-cov` (regions catch the
  branch a lines-only gate would miss). The **token emitter is complete
  across the three supported formats — CSS (canonical), SCSS, Tailwind**
  (two-tier per-component split and the `primitiv.theme` overrides layer
  included). A TS/JS format was planned and partly built but **dropped
  (D50)**: it inlines values rather than emitting `var()` references, so it
  can't lean on the cascade to resolve theme/density — the three
  cascade-based formats are the set. The `tokens` and `theme` commands and
  the `primitiv.json` config (`config::resolve` / `try_resolve`) are landed.
  The **CLI command surface is now v1 feature-complete**: `init` (incl.
  interactive prompting + `--yes`), `add` (resolve → install → copy the styled
  surface + React surface + `contract.json` → `primitiv.lock` refresh /
  `--force` / interactive overwrite-keep → project wiring), `tokens`, `theme`,
  and `list` (with the lock-backed installed column). The registry has three
  adapters behind one port — embedded (baked in), `LocalRegistry`
  (`--registry <path>`) and `HttpsRegistry` (`--registry <url|version>`, a
  blocking `ureq`/rustls fetch from GitHub-raw) — chosen at run time as a
  `&dyn Registry`; the HTTPS fetch path is held at 100% by a loopback
  `TcpListener` test server (no network, no exemption, no test dep). **Only
  Distribution (Step 8) remains.** Decisions landed include category-map number
  units (rem/unitless) and `var()`-reference alias emit for every format.
- **Distribution / publishing has started.** The repo transferred to
  `primitiv-ui/primitiv`; all 10 npm packages + the 3 JSR packages
  (`@primitiv-ui/{react,icons,tokens}`) published at v0.1.0 via tokenless OIDC.
  The JSR **slow-types cleanup** is landed — `--allow-slow-types` removed; every
  exported symbol carries an explicit type (verify with `npx jsr publish
  --dry-run`). Publishing mechanics, the no-slow-types rules, and the
  lockstep-version-bump gotcha live in `RELEASING.md` (§5–6); the live checklist
  is `docs/transfer-and-next-steps.md`.

## Useful commands

```sh
cargo test --workspace                            # all Rust tests
# CLI-crate coverage gate — the exact check CI runs (lines+regions+functions):
cargo llvm-cov --workspace --exclude harmoni-core --exclude harmoni-wasm \
  --fail-under-lines 100 --fail-under-regions 100 --fail-under-functions 100
pnpm --filter @primitiv-ui/react qa:units            # React tests + coverage
pnpm --filter @primitiv-ui/react exec vitest run src/X    # scoped, during a cycle
pnpm run build:wasm                               # rebuild wasm pkg
pnpm run dev                                      # workbench dev server
```

Don't use raw `grep`/`find`/`rg` from Bash when the Grep and Glob
tools fit. Don't run `find` from `/`.
