# Figma integration — connect, sync variables to DTCG, migrate Typography → Semantic

## Context

Primitiv has no link between its codebase and the Figma design
system file. Tokens / variables live only in Figma; the repo emits
colours from the harmoni engine but does not consume or produce
DTCG-shaped tokens.

The user wants three things, in order:

1. A working MCP connection so I can read the Figma file (variables,
   components, styles).
2. A one-way **Figma → repo** sync that lands variables as
   **DTCG-conformant** JSON in a new `packages/tokens` workspace,
   so tokens can be transformed and consumed elsewhere.
3. A **one-shot** Figma-side restructure: a new **Semantic**
   collection composed of Primitives, into which the **Typography**
   collection's variables move — **without breaking** existing
   references from the typographic scale (styles + components) that
   currently point at Typography variables. After this runs once,
   Typography lives in Semantic permanently; there is no recurring
   migration.

## Hard constraints discovered during exploration

- **The existing `apps/harmoni-figma-plugin` is the future
  consumer-facing Harmoni plugin** and must remain free of any
  sync / migration code. All Figma-side work for this task lives in
  a **new, separate, internal-only plugin** named
  **`primitiv-sync-figma-plugin`** under `apps/`. It is never
  submitted to Figma Community; it's loaded locally via
  *Plugins → Development → Import plugin from manifest…*. This
  cleanly satisfies the "secret feature" requirement without
  build-flag gymnastics inside the consumer plugin.
- **Figma plan = Starter/Free** → the Variables REST API is **not
  available** (read or write). Therefore **all variable read/write
  must go through the Plugin Variables API** (`figma.variables.*`).
  The new `primitiv-sync-figma-plugin` is the execution surface.
- **Figma does not let you move a variable between collections** —
  not via UI, plugin, or REST. The Typography → Semantic move is a
  *create-new + rebind-references + delete-old* migration, scripted
  inside the new plugin and run **once**.
- **Figma Dev Mode MCP requires Dev Mode** (paid). On Starter it is
  likely unavailable; we'll attempt to enable it, but the primary
  read-path for me (Claude) is a **third-party PAT-based MCP**
  (e.g. GLips/figma-context-mcp). On Starter, even via PAT, the
  Variables endpoints return 403; the PAT MCP can still read file
  structure, components, styles, frames.
- A plugin with `documentAccess: dynamic-page` must call
  `figma.loadAllPagesAsync()` before iterating styles / nodes when
  hunting for references — the migration relies on this.

## What I need from you to connect (checklist)

You've already given me:

- **File URL**:
  `https://www.figma.com/file/1Nh5ffky0lYEw0MzXoqQVy?node-id=129:1207&locale=en&type=design`
  → **`FIGMA_FILE_KEY = 1Nh5ffky0lYEw0MzXoqQVy`**, focus node
  `129:1207`.

Still needed (you said you'll provide in the next step):

1. **Personal Access Token (PAT)** generated at
   *Settings → Security → Personal access tokens*, with scopes:
   - `File content` → Read
   - `File metadata` → Read
   - `Library content` → Read
   - `Dev resources` → Read (if available on Starter; harmless if
     greyed out)
   - `Variables` → Read (will return 403 on Starter; harmless to
     include for future upgrade)
2. **Confirmation of current collection names** exactly as they
   appear in Figma — i.e. `Primitives`, `Typography`, `Components`,
   case included — and the **exact name** for the new Semantic
   collection (`Semantic`? `Semantics`? `Tokens / Semantic`?).
3. **Modes** inside each collection (e.g. `Default`, `Light`, `Dark`).
   DTCG needs an explicit modes story.
4. **(Optional)** A small list of typography style names currently
   referencing Typography variables, so we have a known-good
   migration check.

The PAT should be pasted into `.claude/settings.local.json` (gitignored,
user-scoped), **not** `.claude/settings.json`. Proposed shape:

```json
{
  "env": {
    "FIGMA_PAT": "figd_...",
    "FIGMA_FILE_KEY": "1Nh5ffky0lYEw0MzXoqQVy"
  },
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": { "FIGMA_API_KEY": "${FIGMA_PAT}" }
    }
  }
}
```

(Exact server name confirmed during Phase A.)

## Architecture decisions

- **New plugin** `apps/primitiv-sync-figma-plugin/` owns variable
  read, DTCG export, and the Typography → Semantic migration.
  Scaffolded from the existing `apps/harmoni-figma-plugin`
  structure (Vite UI build + Vite code build + Vitest + jsdom +
  Testing Library, `documentAccess: dynamic-page`, message-passing
  contract under `src/shared/messages.ts`, mockable
  `src/code/figma.mock.ts`).
- **UI is built on `@primitiv/react` + `@primitiv/icons`** — both
  are already workspace packages and a workspace dep of the
  existing plugin. The sync plugin's UI composes headless
  components (Tabs to switch between Export and Migrate, Accordion
  for advanced, list/checkbox primitives for the per-variable
  mapping table) plus icons from `@primitiv/icons`. Styling can be
  minimal/utilitarian.
- **PAT-based MCP for read-only file browse** so I can answer
  "what components exist", "what styles use which variable", etc.
  during planning and component work. Variables themselves come
  out of the plugin (Starter limitation).
- **Sync transport is dual-mode**, behind a setting in the plugin
  UI: (a) **live POST** to `http://127.0.0.1:4477/sync` when a local
  dev server is running; (b) **manual export** (download JSON /
  copy-to-clipboard) for use without a running server.
- **DTCG layout**: one file per collection. `primitives.json`,
  `semantic.json`, `components.json` under
  `packages/tokens/src/`. Easy to diff per layer; mirrors Figma.
- **DTCG shape**: each token has `$type`, `$value`, optional
  `$description`. Aliases use `{group.sub.name}` string refs (DTCG
  spec). Modes encoded as DTCG **token sets**, one per Figma mode,
  with a shared base.
- **Migration is one-shot.** After it runs successfully, it stays
  in the plugin codebase as a maintenance tool (in case of future
  similar moves) but is not expected to be invoked again. The
  plugin's primary recurring role is the DTCG export.

## Phasing

### Phase A — Scaffold plugin + connect & verify (no writes, no sync)

1. **Scaffold `apps/primitiv-sync-figma-plugin/`** by copying the
   structure from `apps/harmoni-figma-plugin/`:
   - `package.json` (name `primitiv-sync-figma-plugin`, scripts
     identical to harmoni plugin's: `dev`, `build`, `qa`, etc.),
     with `@primitiv/react`, `@primitiv/icons` deps but **no**
     `harmoni-wasm` dep (the sync plugin doesn't need the engine).
   - `manifest.json` — different `name` (`"Primitiv Sync"`), unique
     `id`, `documentAccess: "dynamic-page"`,
     `networkAccess.allowedDomains: ["http://127.0.0.1:4477"]`
     with a `reasoning` string.
   - `vite.config.ts`, `vite.config.code.ts`, `vitest.config.ts`,
     tsconfigs — adapted copies.
   - `src/code/code.ts`, `src/code/handleMessage.ts`,
     `src/code/figma.mock.ts`, `src/code/handleMessage.test.ts`.
   - `src/shared/messages.ts` — own discriminated union (separate
     from harmoni plugin's).
   - `src/ui/{main.tsx,App.tsx,App.test.tsx,index.scss}`.
   - `index.html`, `eslint.config.js`, `vitest.setup.ts`,
     `.gitignore`, `README.md`.
2. `pnpm install` to wire the workspace package; verify
   `pnpm --filter primitiv-sync-figma-plugin qa:units` passes on
   the scaffolded smoke test.
3. **Configure MCP**: add `.claude/settings.local.json` per the
   snippet above, and append `mcp__figma__*` patterns to
   `.claude/settings.json` `permissions.allow`.
4. **Smoke-test**:
   - I list pages, components, and styles in the file via the PAT
     MCP, focused on node `129:1207`.
   - You load the new plugin in Figma (Development → Import from
     manifest…). A temporary "Inspect variables" command reads
     `figma.variables.getLocalVariableCollectionsAsync()` and
     `getLocalVariablesAsync()` and renders a JSON dump in the UI.
     Confirms the Plugin API works against your file.
5. (Optional) Enable Dev Mode MCP if your Figma desktop offers it
   on Starter; if it does, add a second `mcpServers.figma-devmode`
   entry pointing at `http://127.0.0.1:3845`.

**Done when**: I can read components/styles via PAT MCP, and the
plugin logs the live variable structure back to its UI.

### Phase B — DTCG sync (Figma → repo)

Scaffold `packages/tokens` as a new pnpm workspace package:

- `packages/tokens/package.json` — name `@primitiv/tokens`, scripts
  `sync:serve`, `lint:tokens`, `build` (transform if needed).
- `packages/tokens/src/{primitives,semantic,components}.json` —
  DTCG output, regenerated on every sync.
- `packages/tokens/src/server.ts` — small local HTTP server
  (Node `node:http`) on port `4477`, POST `/sync` accepts the
  plugin payload and writes the per-collection files atomically.
- `packages/tokens/src/dtcg.ts` — pure function
  `figmaVarsToDtcg(payload) → { primitives, semantic, components }`,
  unit-tested under TDD (red→green→refactor, 100% coverage).
- `packages/tokens/src/spec/` — vitest tests with fixture payloads,
  mirroring the `Tabs.fixtures.ts` pure-data pattern.

Plugin side (`apps/primitiv-sync-figma-plugin`):

- Message types in `src/shared/messages.ts`:
  `EXPORT_TOKENS_REQUEST` / `EXPORT_TOKENS_RESULT`.
- Handler in `src/code/handleMessage.ts` reads variable collections,
  walks alias chains, emits the DTCG-shaped payload.
- UI in `src/ui/App.tsx` gains an "Export tokens" panel
  (`@primitiv/react` Tabs + `@primitiv/icons` for affordances) with
  a toggle: **Live sync (localhost)** vs **Download JSON**.

**Done when**: clicking *Export tokens* in the plugin produces
DTCG-conformant `primitives.json`, `semantic.json`, `components.json`
under `packages/tokens/src/`, either by HTTP POST or by manual save.
A DTCG validator (e.g. `@terrazzo/cli check` or a hand-rolled
JSON-schema check) passes.

### Phase C — Typography → Semantic migration (one-shot)

A plugin command **Migrate Typography → Semantic** that runs **once**
inside the file. Steps, all wrapped in a single undoable change:

1. **Discover.** `loadAllPagesAsync()`, then enumerate variables in
   the `Typography` collection (incl. modes).
2. **Mapping UI.** Plugin UI lists, for each Typography variable,
   its current path/name; user accepts the suggested 1:1 name in
   Semantic or edits it (you chose "I'll decide per-variable
   during migration").
3. **Dry-run preview.** Before any mutation, show: number of
   styles, nodes, and other variables that will be rebound.
4. **Create.** Ensure `Semantic` collection exists with matching
   modes; create the new variables. Where the original was an
   **alias** into Primitives, copy the alias; where it was a
   **raw value**, copy the value.
5. **Rebind references** — the critical step that protects your
   typographic scale. For every place a Typography variable is
   bound:
   - **Local styles** — `figma.getLocalTextStylesAsync()`,
     `getLocalPaintStylesAsync()`, `getLocalEffectStylesAsync()`,
     `getLocalGridStylesAsync()`; inspect each style's
     `boundVariables`; rebind via
     `style.setBoundVariable(field, newVariable)`.
   - **Nodes** — walk all pages (component sets, components,
     instances, frames, text); rebind via `node.setBoundVariable()`.
   - **Other variables** — any variable whose value is a
     `VARIABLE_ALIAS` to a Typography variable gets its alias
     rewritten to the new Semantic variable.
6. **Verify.** Re-scan; the migration **refuses to delete** the
   old collection if any reference still resolves to a Typography
   variable. Residual list is reported to the UI.
7. **Delete.** With zero residual references, remove the
   Typography collection.
8. **Re-sync.** Auto-trigger Phase B's export so
   `packages/tokens/src/*.json` reflects the new shape.

This logic is **unit-tested** against an extended `figma.mock.ts`
that simulates variables / styles before being run on the real
file. Tests cover: alias-of-alias chains, multi-mode variables,
nodes nested in components, and the "residual references → refuse
delete" path.

**Done when**: the Typography collection is gone, every prior
reference resolves to a Semantic variable, the typographic scale
visually unchanged in Figma, and `packages/tokens/src/semantic.json`
contains the moved tokens.

## Critical files

- `.claude/settings.json` — add `mcp__figma__*` to
  `permissions.allow`; add plugin's qa/test pnpm scripts to the
  Bash allow-list.
- `.claude/settings.local.json` — `FIGMA_PAT`, `FIGMA_FILE_KEY`,
  `mcpServers.figma`.
- `apps/primitiv-sync-figma-plugin/` — **new app**:
  - `package.json`, `manifest.json`, `index.html`,
    `vite.config.ts`, `vite.config.code.ts`, `vitest.config.ts`,
    `tsconfig.*`, `eslint.config.js`, `.gitignore`, `README.md`,
    `vitest.setup.ts`.
  - `src/code/{code,handleMessage,figma.mock,handleMessage.test}.ts` +
    `src/code/migrate.ts`, `src/code/tokensExport.ts` and tests.
  - `src/shared/messages.ts`.
  - `src/ui/{main.tsx,App.tsx,App.test.tsx,index.scss}` +
    `src/ui/ExportPanel.tsx`, `src/ui/MigratePanel.tsx`.
- `packages/tokens/` — **new workspace**: `package.json`,
  `src/dtcg.ts`, `src/server.ts`,
  `src/{primitives,semantic,components}.json`,
  `src/spec/*.test.ts`, `README.md`.
- `pnpm-workspace.yaml` — already globs `apps/*` and `packages/*`,
  no change needed.
- `package.json` (root) — add `dev:sync-plugin` and `tokens:sync`
  convenience scripts.
- `CLAUDE.md` — short "Tokens / Figma sync" subsection pointing at
  a new on-demand skill `figma-token-sync` (scaffolded as part of
  this work to capture conventions).
- `apps/harmoni-figma-plugin/**` — **untouched**.

## Reuses existing patterns

- **Plugin testing**: copy `figma.mock.ts` dependency-injection
  pattern from `apps/harmoni-figma-plugin/src/code/`, extend with
  variables / styles surface.
- **Message contract**: same discriminated-union style as
  `apps/harmoni-figma-plugin/src/shared/messages.ts`.
- **Colour serialisation**: where token values include colour,
  reuse `harmoni-core::color::output`
  (`crates/harmoni-core/src/color/output.rs`) if its outputs are
  needed — most likely not, since Figma is the source.
- **UI primitives**: compose `@primitiv/react` headless components
  + `@primitiv/icons`. Inventory at
  `.claude/skills/new-react-component/_generated/component-inventory.md`.
- **Test conventions**: vitest scoped invocation per repo
  conventions
  (`pnpm --filter primitiv-sync-figma-plugin vitest run src/code/migrate`),
  fixture layout mirrors `Tabs.fixtures.ts`.
- **TDD cadence**: red → green → refactor, one commit per cycle,
  per `CLAUDE.md` non-negotiables.

## Verification

- **Phase A**: I run an MCP read against the file and report the
  page / component / style counts; the plugin renders a JSON dump
  of its first variable collection in its UI.
- **Phase B**: `pnpm --filter @primitiv/tokens vitest run` passes;
  `packages/tokens/src/*.json` validates against the DTCG spec; a
  re-export produces zero diff (idempotent).
- **Phase C**: dry-run reports mapping + reference count without
  mutating. After a real run: (a) Typography collection no longer
  exists, (b) zero residual references, (c) typographic scale
  renders identically before/after (visual spot-check), (d)
  re-exporting tokens produces a `semantic.json` populated with
  the migrated tokens.

## Out of scope (deliberately)

- Two-way sync / repo → Figma writes (you chose one-way for now).
- Consuming tokens inside `packages/react` (engine ships unstyled
  per `CLAUDE.md`).
- Reorganising Primitives or Components collections.
- CI gating of the sync (manual for now; revisit once stable).
- Any change to `apps/harmoni-figma-plugin`.
