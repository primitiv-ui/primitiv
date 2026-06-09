# RFC 0005 — The Primitiv CLI

> **Status:** Draft
> **Author:** simonrevill, with architectural review
> **Date:** 2026-06-09
> **Seeds from:** `docs/consumption-design.md` §7–§9.
> **Relates to:** RFC 0004 (distribution model & styling contract) — *what* the
> CLI installs and the contract it installs against; RFC 0006 (token & style
> pipeline) — the emitter the CLI drives.

---

## 0. Summary

This RFC specifies the **Primitiv CLI**: the Rust binary that consumers (human
or agent) use to install and configure the system — ensure packages, copy in
example styles, emit tokens, and generate themes. It is the orchestrator across
the versioned packages (RFC 0004 §2) and the static registry, and it is the
surface that makes the four consumer profiles concrete.

The moves:

1. **A small, verb-first command surface** — `init`, `add`, `tokens`, `theme`,
   `list` — each with a fully flag-driven, `--json` non-interactive mode so the
   Agent profile is first-class (§2, §5).
2. **A durable `primitiv.json`** records the consumer's choices (format, paths,
   brand, registry pin) so every re-run is deterministic and config-less
   commands stay possible (§3).
3. **A safe `add` flow** — detect-and-prompt on file conflicts (never silently
   clobber edits), detect-and-offer for project wiring (never silently edit the
   consumer's config) (§4).
4. **A static registry** — `registry.json` + per-component files including the
   `contract.json` from RFC 0004 — fetched over HTTPS, no backend, doubling as
   the agent manifest (§6).
5. **A Rust binary** distributed via the proven `optionalDependencies`
   per-platform-package pattern: command `primitiv`, front-door packages
   unscoped `primitiv-ui` / `create-primitiv-ui`, platform binaries scoped
   `@primitiv-ui/cli-*`, also installable via `cargo install` (§7).

## 0.1 Scope

In scope: the command surface, `primitiv.json`, the `add`/refresh/wiring
behaviour, the registry file format, agent affordances, and CLI
implementation/distribution. The token **transform** itself (DTCG → formats)
and the per-component style authoring are specified in RFC 0006; this RFC only
defines the commands that *drive* them. The styling contract is RFC 0004.

---

## 1. Principles

### Principle 1 — Deterministic by default

Given the same `primitiv.json` and registry pin, a command produces the same
result. Choices are persisted, not re-asked; randomness and hidden state are
avoided.

### Principle 2 — Never clobber, never surprise

The CLI writes into a repo the consumer owns. It never overwrites an edited
file or modifies a config the consumer maintains without showing the change and
getting consent (interactively) or an explicit flag (non-interactively).

### Principle 3 — Every prompt has a flag

Anything the interactive CLI asks, the non-interactive CLI accepts as a flag.
`--json` makes output machine-readable; exit codes are stable. An agent never
has to drive a TTY.

### Principle 4 — Config-less where it can be

Commands that don't strictly need project config (`tokens --format css`,
`theme --brand …`, `list`) run without `init`. `primitiv.json` is an
optimisation for repeat use, not a gate.

### Principle 5 — The binary is self-contained

Token emission and theme generation run inside the binary (the Rust emitter and
native `harmoni-core`, RFC 0006). The CLI needs network access only to fetch
registry files, and that is cacheable.

---

## 2. Command surface

```sh
primitiv init                      # scaffold primitiv.json (interactive)
primitiv add <component...>        # ensure package + (opt-in) copy styles
primitiv tokens [--format <fmt>]   # emit the token layer in a format
primitiv theme --brand <hex>       # Harmoni palette → theme token overrides
primitiv list [--json]             # registry components + install state
```

Global flags: `--json`, `--yes` (accept config defaults / confirmations),
`--dry-run` (report actions, write nothing), `--cwd <dir>`, `--registry <ref>`
(override the pinned registry version/URL).

### 2.1 `init`

Detects the framework and package manager (from the lockfile — pnpm / npm /
yarn / bun), then asks: example styles wanted? default format? brand colour?
where copied files land. Writes `primitiv.json` (§3). The `pnpm create
primitiv-ui` entry point (the `create-primitiv-ui` package, §7.2) runs `init`
in a new or existing project.

### 2.2 `add`

The core flow (§4). Ensures the headless package, optionally copies styles per
config, resolves transitive deps, and offers any project wiring. Flags:
`--styles-only` (Dev 3 — copy styles, don't touch the package),
`--no-styles` (headless only), `--format <fmt>` (override the config default for
this run), `--path <dir>`, `--force` (overwrite without prompting).

### 2.3 `tokens`

Drives the RFC 0006 emitter; writes the token layer (CSS custom properties /
SCSS / TS / Tailwind preset) to the configured path. Format and path default
from `primitiv.json`; both are overridable by flag.

### 2.4 `theme`

Links `harmoni-core` natively to derive a contrast-checked palette from a brand
colour and emit it as **theme token overrides** (the `--primitiv-<token-path>`
layer, RFC 0004 §3.3) in the chosen format. `--brand <hex>` required;
`--out <path>` optional. (Dark-palette generation is an open question, §9.)

### 2.5 `list`

Prints the registry's components, their versions, and whether each is installed
in this project. `--json` emits the index as data for agents.

---

## 3. `primitiv.json`

### 3.1 Schema

```jsonc
{
  "$schema": "https://primitiv-ui.dev/schema/primitiv.json",
  "version": 1,
  "framework": "react",
  "styles": {
    "enabled": true,
    "format": "css",                 // css | scss | tailwind | …
    "path": "src/styles/primitiv"    // where copied component styles land
  },
  "tokens": {
    "format": "css",
    "path": "src/styles/primitiv/tokens.css"
  },
  "theme": { "brand": "#0a7755" },
  "aliases": { "components": "@/components" },  // optional import-alias mapping
  "registry": { "version": "0.1.0" }            // pin (see §6.4)
}
```

### 3.2 Resolution

The CLI uses the nearest `primitiv.json` walking up from `--cwd` (or the process
cwd). In a monorepo each package may carry its own. Commands that don't need it
(Principle 4) run without one; if a needed value is absent and the run is
non-interactive, the command errors with a clear message and a stable exit code
rather than prompting.

---

## 4. The `add` flow

### 4.1 Steps

1. Resolve the registry entry for each component (and its transitive deps,
   §4.4).
2. Ensure the headless package is present — install it with the detected
   package manager, or skip under `--styles-only`.
3. Determine styles: if `--no-styles`, stop after the package. Otherwise, if
   `primitiv.json` doesn't already say, **ask whether** styles are wanted, then
   **ask the format** if none is recorded; persist both.
4. Copy the style files for the chosen format into the configured path, applying
   the refresh semantics in §4.2.
5. Offer any project wiring the format needs (§4.3).
6. Report what changed (`--json` for agents).

### 4.2 Refresh semantics — detect & prompt (D18)

On re-add, each copied file is hashed against what the CLI originally wrote
(a manifest of written-file hashes lives alongside `primitiv.json`):

- **Unchanged** files refresh silently to the registry version.
- **Consumer-edited** files are never silently overwritten: the CLI shows a diff
  and prompts *keep / overwrite / skip*.
- `--force` overwrites all; `--yes` accepts updates to unchanged files and keeps
  edited ones (no destructive default); `--dry-run` reports the would-be set.

This honours Principle 2 — edits are safe, updates are still reachable
deliberately.

### 4.3 Project wiring — detect & offer to patch (D19)

When a format needs project-level wiring (e.g. registering the generated
Tailwind preset in `tailwind.config`), the CLI **inspects the project, shows the
exact change, and applies it on confirmation**:

- Interactive: prints the diff to the config and asks `[Y/n]`.
- Non-interactive: `--yes` applies it, `--no-wiring` skips and prints the
  snippet to add manually. It never edits a consumer-owned config silently.

### 4.4 Transitive deps

A registry entry declares what it needs (§6.2): the headless package(s), the
token layer (component styles resolve `--primitiv-*` custom properties, so the
token output must exist), the Tailwind preset for the Tailwind format, and any
sibling components. `add` resolves these, installing/emitting the token layer if
absent, so a style file is never copied into a project that can't resolve it.

---

## 5. Interactive vs non-interactive (agent mode)

Every command runs both ways (Principle 3):

- **Interactive** (human): prompts as described.
- **Non-interactive** (agent / CI): `--yes` for confirmations, `--no-*` to
  decline specific steps, `--json` for structured output, `--dry-run` to plan
  without writing. Exit codes are stable and documented (0 success; distinct
  non-zero codes for "config missing", "network/registry", "conflict needs
  resolution", etc.).

See §6.5 for the registry-side agent affordances (`registry.json`,
`primitiv list --json`, `AGENTS.md`).

---

## 6. The registry

**Decision (RFC 0004 / design doc D8):** a static `registry.json` manifest plus
per-component files, served from the repo / GitHub raw / a CDN. No backend.

### 6.1 Layout

```
registry.json                     # index: components, versions, deps
r/
  button/
    contract.json                 # RFC 0004 §3.4 — root class, parts, data-*, css-vars
    styles.css                    # canonical
    styles.scss
    tailwind/button.recipe.ts     # preset fragment + recipe
  switch/…
```

### 6.2 `registry.json`

```jsonc
{
  "version": "0.1.0",
  "components": {
    "button": {
      "version": "0.1.0",
      "dependsOn": {
        "packages": ["@primitiv-ui/react"],
        "tokens": true,
        "components": []
      },
      "formats": {
        "css":     ["styles.css"],
        "scss":    ["styles.scss"],
        "tailwind":["tailwind/button.recipe.ts"]
      },
      "contract": "contract.json"
    }
  }
}
```

### 6.3 `contract.json`

Defined in RFC 0004 §3.4 (hybrid generation, D15): the component's root class
and parts, modifier classes, emitted `data-*` attributes, and `--primitiv-*`
custom-property API. The CLI reads it to know what it's installing; an agent
reads it to know what to apply.

### 6.4 Versioning & pinning

`primitiv.json`'s `registry.version` pins the registry. The CLI fetches from a
stable, content-addressable location — GitHub raw at the matching tag, or a CDN
mirror — so a given pin always yields the same bytes. A repo-local registry
(monorepo dogfooding, offline) is supported via `--registry <path>`.

### 6.5 Agent affordances

- **`registry.json` at a stable URL** — an agent fetches it to evaluate fit and
  read each component's `contract.json` and `dependsOn` *before* installing.
- **`primitiv list --json`** — the index as data.
- **`AGENTS.md` / `llms.txt`** — the system, the contract, and install recipes,
  so an agent acts without scraping prose.
- **(future)** an MCP server wrapping the CLI for tool-preferring agents.

---

## 7. Implementation & distribution

### 7.1 Rust binary

The CLI is a single Rust binary (design doc D13). It links `harmoni-core`
natively for `theme`, houses the token emitter (RFC 0006), and reads/writes
files and the registry. No Node runtime is involved in its execution.

### 7.2 Package & command naming — unscoped `primitiv-ui` front door (D20, D22)

The unscoped **`primitiv`** package is **already owned by an unrelated product**
— Primitiv AI (`primitiv-ai/primitiv`, a spec-driven-development engine for
AI-assisted dev), `primitiv@1.0.7` published 2026-04-06 — so the bare
`primitiv` package, `npm i primitiv`, and `npx primitiv` resolve to *them*. The
front door is therefore the unscoped names that mirror our scope:

- **CLI / wrapper package:** unscoped **`primitiv-ui`**, exposing the `primitiv`
  bin. A bin name is a local symlink, unaffected by who owns the `primitiv`
  *package*, so the command stays on-brand. Install `pnpm add -D primitiv-ui`;
  run `primitiv add button` or `pnpm dlx primitiv-ui add button`.
- **Scaffold entry:** unscoped **`create-primitiv-ui`**, so `pnpm create
  primitiv-ui` / `npm create primitiv-ui` run `init`.
- **Command (D22):** **`primitiv`**. No short global bin is shipped — two-letter
  names are clash-prone (e.g. `pv` is the ubiquitous *pipe viewer*); power users
  alias on their own machines, keeping that collision opt-in and theirs.
- **Platform binaries:** scoped **`@primitiv-ui/cli-<target>`** (e.g.
  `@primitiv-ui/cli-darwin-arm64`), listed in the `primitiv-ui` wrapper's
  `optionalDependencies`; the manager installs only the matching one and the
  launcher resolves and execs it.
- **Libraries are unaffected:** they stay `@primitiv-ui/{react,icons,tokens}`.
- Also installable via `cargo install` for Rust-native users (crate/binary name
  to confirm at publish).

> **Reserve now.** `primitiv-ui` and `create-primitiv-ui` are unscoped and
> first-come — the `primitiv` situation is the cautionary tale. Publish minimal
> placeholder packages to claim them ahead of launch. Scoped names
> (`@primitiv-ui/*`) need no race — the scope is owned — so they can wait.
> **JSR is not involved:** it has no unscoped names and does not host a native
> binary; the CLI is an npm + Cargo story.

> **Brand note (non-blocking):** Primitiv AI operates in adjacent
> AI-assisted-dev tooling. The `@primitiv-ui` / `primitiv-ui` identity stays
> distinct, but the spoken-brand overlap is worth tracking.

### 7.3 Platform matrix — common desktop set, gnu (D21)

v1 targets: `darwin-arm64`, `darwin-x64`, `linux-x64-gnu`, `linux-arm64-gnu`,
`win32-x64`. **musl** (`linux-{x64,arm64}-musl`, for Alpine/Docker/CI) is a
documented **fast-follow**, added when a consumer needs it. `cargo install`
covers any target not yet packaged.

### 7.4 Publish consequences

`publish.yml` grows a cross-platform **build matrix** and a target-aware order:
build all targets → publish the `@primitiv-ui/cli-*` platform packages → publish
the `primitiv-ui` / `create-primitiv-ui` wrappers (which depend on them).
`cargo-dist` (or napi-rs) scaffolds the matrix and the platform packages. JSR is
source-only and does **not** carry the CLI binary — it's an npm + Cargo story;
the libraries still publish to both. (Detail tracked in `RELEASING.md`.)

---

## 8. What this RFC does not cover

- The token **transform** and the multi-format "one look" emit — RFC 0006.
- **Style authoring** (per-component default theme, the workbench's role) —
  RFC 0006.
- The styling **contract** itself — RFC 0004.
- Publish-readiness of the packages and the publish workflow internals —
  `RELEASING.md`.

---

## 9. Open questions

1. **Dark theme generation (§2.4).** Whether `primitiv theme` emits a dark
   palette in v1, and how it surfaces (a `--dark` flag, a paired light/dark
   emit). Ties to the deferred dark-mode work (`dark-mode-palettes` skill).
2. **Written-file manifest location (§4.2).** Where the hash manifest lives — a
   field in `primitiv.json`, a sibling `.primitiv/` dir, or a lockfile-style
   `primitiv.lock`.
3. **Registry hosting concretely (§6.4).** GitHub raw at a tag vs a CDN mirror
   as the canonical fetch URL for v1.
4. **Package-manager coverage (§2.1).** pnpm / npm / yarn / bun are detected
   from the lockfile; confirm Deno (and bun's workspace quirks) are out of scope
   for v1.
5. **`add` for non-React frameworks.** `framework` is in `primitiv.json` but v1
   ships React only; confirm the field is forward-looking, not load-bearing yet.

---

## 10. Decision record

| # | Decision | Maps to |
|---|---|---|
| 1 | Command surface: `init`, `add`, `tokens`, `theme`, `list`; global `--json` / `--yes` / `--dry-run` | §2 |
| 2 | `primitiv.json` persists choices; commands stay config-less where possible | D7, §3 |
| 3 | `add` refresh = **detect & prompt** on conflict; `--force`/`--yes` flags; never silently clobber edits | D18 |
| 4 | Project wiring = **detect & offer to patch**; never silently edit a consumer config | D19 |
| 5 | CLI front door = unscoped **`primitiv-ui`** + **`create-primitiv-ui`** (bare `primitiv` is owned by Primitiv AI); platform binaries scoped `@primitiv-ui/cli-*`; libraries stay `@primitiv-ui/*`; reserve the unscoped names now (first-come), scoped can wait, JSR not involved for the CLI | D20 |
| 8 | Command users type = **`primitiv`** (a local bin, unaffected by the package collision); no short global bin shipped (clash-prone, e.g. `pv` = pipe viewer); power users alias themselves | D22 |
| 6 | Platform matrix = common desktop set (gnu); musl as fast-follow; `cargo install` fallback | D21 |
| 7 | Registry = static `registry.json` + per-component files (incl. `contract.json`), pinned by version, agent-readable | D8, §6 |
