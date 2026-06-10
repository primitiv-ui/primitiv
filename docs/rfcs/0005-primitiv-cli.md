# RFC 0005 — The Primitiv CLI

> **Status:** Draft
> **Author:** simonrevill, with architectural review
> **Date:** 2026-06-09
> **Seeds from:** `docs/consumption-design.md` §7–§9.
> **Relates to:** RFC 0004 (distribution model & styling contract) — *what* the
> CLI installs and the contract it installs against; RFC 0006 (token & style
> pipeline) — the emitter the CLI drives; RFC 0008 (CSS architecture) — the
> layered, two-tier shape of the files `add` / `tokens` write.

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

In scope: the command surface, the prerequisites & supported-environment limits
(§1.5), `primitiv.json`, the `add`/refresh/wiring behaviour, the registry file
format, agent affordances, and CLI implementation/distribution. The token **transform** itself (DTCG → formats)
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

## 1.5 Prerequisites & supported environments

The CLI configures Primitiv **into a project the consumer already has**. This
section defines what it assumes and how far its framework knowledge extends — the
limits of v1.

### 1.5.1 An existing project, not a generator (D26)

`init` / `add` assume a Node package with a `package.json`, a React setup, and a
bundler. The CLI **detects and configures**; it never creates the framework or
the app. Run in an empty directory it errors with a pointer ("create an app
first — e.g. `npm create vite` / `create-next-app` — then `primitiv init`"),
rather than scaffolding one.

### 1.5.2 React only (D26)

Component logic ships for **React** only. Vue / Svelte / Angular / Solid are out
of scope until headless logic exists for them. The `primitiv.json` `framework`
field is **forward-looking, not load-bearing** — it records `"react"` and
reserves room, but no non-React path is built (resolves the old Open Q5).

### 1.5.3 Tiered support — degrade, don't fail

The CLI's dependence on framework knowledge is layered, so an unrecognised setup
is still useful rather than blocked:

| Tier | Capability | Framework knowledge | Availability |
|---|---|---|---|
| **0** | install `@primitiv-ui/react`, `tokens` emit, `add --styles-only` | none — writes files / adds a dep | **any** Node project |
| **1** | auto-wiring: global-CSS location, Tailwind config, import aliases, RSC `"use client"` boundaries | a maintained per-framework adapter | the supported set (§1.5.4) |
| **2** | unknown / unsupported setup | none — prints the exact wiring snippet to add by hand (the `--no-wiring` path, §4.3) | everywhere else |

Tier 2 is the floor: the CLI always copies styles and emits tokens, and where it
can't auto-wire it tells you precisely what to add. We therefore build auto-wiring
adapters only for a short, deliberate list — never "every architecture."

### 1.5.4 v1 auto-wiring set (D27)

First-class **Tier-1** adapters in v1: **Vite + React** and **Next.js** (the two
dominant React setups; Next includes the App-Router `"use client"` boundary and
its Tailwind / global-CSS conventions). **Remix / React-Router and Astro** are a
fast-follow; until then they — and any unknown setup — take the Tier-2 manual
path.

### 1.5.5 Greenfield is deferred (D28)

A from-scratch project generator is **out of scope for v1**. `create-primitiv-ui`
exists and the name is reserved, but in v1 it simply runs `init` against an
already-created app (erroring helpfully on an empty dir) — it does **not**
scaffold a framework. A blessed starter template (likely Vite + React) is
deferred post-v1; for now, bring your own app via `create-vite` /
`create-next-app`, then `init`.

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
yarn / bun) **and any import alias** (from `tsconfig.json` / `jsconfig.json`
`compilerOptions.paths`), then asks — each pre-filled with the detected value:
example styles wanted? default format? brand colour? where copied files land?
which import alias for generated code (§3.3). Each answer also has a flag
(`--styles` / `--format` / `--brand` / `--path` / `--alias-components`), and
`--yes` accepts the detected defaults. Writes `primitiv.json` (§3). The `pnpm create
primitiv-ui` entry point (the `create-primitiv-ui` package, §7.2) runs `init`
in an **existing** project; a from-scratch generator is deferred (§1.5.5), and
`init` errors helpfully when run in an empty directory.

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

### 2.6 Invocations by scenario

The CLI package is **`primitiv-ui`**, the scaffold is **`create-primitiv-ui`**,
and the command is always **`primitiv`**. Examples lead with pnpm (the repo's
manager); the equivalents below cover npm, yarn, and bun.

**Package-manager equivalence.**

| Action | pnpm | npm | yarn | bun |
|---|---|---|---|---|
| Set up in an existing app¹ | `pnpm create primitiv-ui` | `npm create primitiv-ui` | `yarn create primitiv-ui` | `bun create primitiv-ui` |
| One-off, no install | `pnpm dlx primitiv-ui <cmd>` | `npx primitiv-ui <cmd>` | `yarn dlx primitiv-ui <cmd>` | `bunx primitiv-ui <cmd>` |
| Add as dev dependency | `pnpm add -D primitiv-ui` | `npm i -D primitiv-ui` | `yarn add -D primitiv-ui` | `bun add -d primitiv-ui` |
| Run the installed bin | `pnpm exec primitiv <cmd>` | `npx primitiv <cmd>` | `yarn exec primitiv <cmd>` | `bunx primitiv <cmd>` |
| Install globally | `pnpm add -g primitiv-ui` | `npm i -g primitiv-ui` | `yarn global add primitiv-ui` | `bun add -g primitiv-ui` |

Notes: ¹ `create primitiv-ui` runs `init` in an app you've already created — v1
ships no from-scratch generator (§1.5.5). `dlx`/`global` forms assume **Yarn 2+
(Berry)**; on Yarn Classic use the npm forms (`npx`, `npm i -g`). Once `primitiv-ui` is a dependency, the everyday
path is a `package.json` script — `"scripts": { "primitiv": "primitiv" }` — run
as `pnpm primitiv add button` (and the equivalent for each manager).

> **The cold-`npx primitiv` trap.** `npx primitiv` / `pnpm dlx primitiv` — note
> the bare `primitiv`, *not* `primitiv-ui` — with no local install resolves the
> unrelated `primitiv` npm package (Primitiv AI). Once `primitiv-ui` is
> installed, the local `primitiv` bin shadows it, so `pnpm exec primitiv` /
> `npx primitiv` are safe. For cold one-offs always name the package:
> `pnpm dlx primitiv-ui …` / `npx primitiv-ui …`.

**Scenario A — Existing app, complete solution (Dev 2).** Bring an app first
(e.g. `pnpm create vite` / `create-next-app`), then:

```sh
pnpm create primitiv-ui            # runs `init` in the app: styles? format, brand → primitiv.json
primitiv add button switch         # ensure package + copy styles in the chosen format
primitiv tokens                    # emit the token layer (format from config)
```

Equivalent without the create alias: `pnpm add -D primitiv-ui && pnpm exec
primitiv init`. (A from-scratch generator is deferred, §1.5.5.)

**Scenario B — Headless only, own styling (Dev 1).** No CLI required:

```sh
pnpm add @primitiv-ui/react        # whole library; tree-shaking trims the unused
```

Or drive it through the CLI, explicitly skipping styles:

```sh
pnpm dlx primitiv-ui add button --no-styles
```

**Scenario C — Styles only, existing library e.g. Radix (Dev 3).**

```sh
pnpm add -D primitiv-ui
pnpm exec primitiv add button --styles-only --format css
pnpm exec primitiv add switch slider --styles-only        # several at once
```

**Scenario D — Tokens & theme in a chosen format.**

```sh
pnpm exec primitiv tokens --format scss --out src/styles/tokens.scss
pnpm exec primitiv theme --brand "#0a7755" --format css   # Harmoni palette → theme overrides
```

**Scenario E — Agent / CI, non-interactive.**

```sh
pnpm dlx primitiv-ui list --json                          # discover components
pnpm dlx primitiv-ui add button --yes --json              # deterministic install
pnpm dlx primitiv-ui add button --dry-run --json          # plan, write nothing
primitiv add button --yes --no-wiring --registry 0.1.0    # pin + skip config patching
primitiv tokens --format css --cwd packages/app --yes     # explicit project dir
```

**Scenario F — Global or Rust-native (no per-project install).**

```sh
pnpm add -g primitiv-ui            # or: npm i -g primitiv-ui / bun add -g primitiv-ui
primitiv add button                # bin on PATH

cargo install <crate>              # Rust-native users (crate name confirmed at publish)
primitiv add button
```

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
  "aliases": { "components": "@/components" },  // detected from tsconfig paths; used for generated imports (§3.3)
  "registry": { "version": "0.1.0" }            // pin (see §6.4)
}
```

### 3.2 Resolution

The CLI uses the nearest `primitiv.json` walking up from `--cwd` (or the process
cwd). In a monorepo each package may carry its own. Commands that don't need it
(Principle 4) run without one; if a needed value is absent and the run is
non-interactive, the command errors with a clear message and a stable exit code
rather than prompting.

### 3.3 Aliases (D32)

`aliases` maps a logical target (e.g. `components`) to the consumer's import
alias. `init` **detects** it from `tsconfig.json` / `jsconfig.json`
`compilerOptions.paths` (Vite / Next configs normally mirror these), proposes it,
and persists the confirmed value; `--alias-components <value>` sets it
non-interactively. If the project has **no** alias, the CLI falls back to
relative imports rather than inventing one.

Because the model is hybrid — logic is an npm package, styles are copy-in CSS —
the alias only matters for the **importable** outputs (the TS token object, the
Tailwind recipe) and any generated `import` line; plain CSS / SCSS needs none.
The map is therefore intentionally minimal (only the targets actually emitted),
not a broad alias registry.

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
absent, so a style file is never copied into a project that can't resolve it. The
shared token layer is a **single, idempotent** artifact (RFC 0008 §3.5): adding N
components emits it once and refreshes it under the §4.2 rules, never duplicating
it per component.

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
  primitiv-ui` / `npm create primitiv-ui` run `init` in an existing app — v1 does
  no framework generation (§1.5.5).
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
5. ~~`add` for non-React frameworks.~~ **Resolved (D26, §1.5.2):** React-only
   component logic; the `primitiv.json` `framework` field is forward-looking, not
   load-bearing.

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
| 9 | CLI configures an **existing** project (not a generator); **React-only** component logic; **tiered** support — Tier-0 anywhere / Tier-1 auto-wire / Tier-2 manual snippet | D26 |
| 10 | v1 auto-wiring adapters = **Vite + React** and **Next.js**; Remix/Astro/unknown → manual fallback | D27 |
| 11 | Greenfield generator **deferred**; v1 `create-primitiv-ui` runs `init` in an existing app | D28 |
| 12 | `aliases` **detected** from tsconfig/jsconfig `paths` at `init`, overridable by prompt or `--alias-*` flag, persisted; relative-import fallback when absent; minimal set (only emitted targets) given the hybrid model | D32 |
