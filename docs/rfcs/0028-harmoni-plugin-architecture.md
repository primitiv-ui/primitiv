# RFC 0028 — Harmoni plugin: build architecture & test strategy

> **Status:** Draft — spike 1 run and clean (§4), spike 2 pending. Architecture
> recommended;
> the domain model is settled in §7, and both findings it surfaced are now
> decided (§7.8). The plugin is built in a **private repo** from its first
> commit; §6 carries the migration plan.
> **Author:** simonrevill, with architectural review
> **Date:** 2026-08-25
> **Relates to:** the settled design record — Figma page "Wireframes — Harmoni
> Plugin (v3 — settled)" (the spec) and `docs/harmoni-plugin-v3-build-notes.md`
> (what building the views against it taught us). RFC 0013 (configurable palette
> export) for the canvas swatch output; RFC 0027 for the engine surface the
> plugin consumes.
> **Supersedes nothing.** This RFC covers *how the plugin gets built*; the build
> notes remain the record of *what* gets built.

---

## 0. Summary

The v3 design phase is complete: 25 views with light twins, 14 journeys, and a
coverage grid enumerated from ownership verbs × entities × entry states rather
than walked. The engine surface the plugin needs has already crossed the wasm
boundary. **The design is ready to build against**, with one scope cut (§1.2)
and two spikes that must run first (§4, §5).

This RFC settles three things the build notes deliberately left to their own
session: the ports-and-adapters shape, the test strategy across four layers, and
the two spikes whose outcomes can still invalidate design decisions.

**The one-line architecture:** the domain core lives in the UI iframe, and
`code.ts` is demoted from a peer to a driven adapter that executes plans the core
computes.

**The one-line domain (§7):** desired state comes from the project, actual state
comes from the document, and everything the plugin does — write, adopt, remove,
rebind — is `reconcile(desired, actual)` producing a plan. Drift is not a state,
it is a non-empty plan; the entry states are three facts plus a plan; and every
count in the UI is the length of a list in it.

---

## 1. Readiness

### 1.1 What the design gives the build

Unusually complete, and in the ways that matter for TDD:

- **The flow board is most of the test plan.** Journey → `describe`, card → page
  object, edge label → step. 14 journeys, already drawn as live instances.
- **The engine surface exists.** `curve_samples`, `generate_palette_pair_with_curve`,
  `readable_step`, `grade(ratio, use)`, `supported_step_range`,
  `chroma_headroom` — all across the wasm boundary already (build notes §2, §3;
  RFC 0027 §6–7). This is normally the part that isn't ready.
- **The hard cases are already argued.** §22–§25 caught contradictions *between*
  views (adopt vs remove, rename-orphans-variables, rebinding leaves variables
  behind) that a spec written top-down would have shipped as bugs.

### 1.2 Scope cut for v1: the picker's 3D tab

Build notes §15.3 and §6: no design behind it, and `api::gamut` paints planes and
strips — **there is no function returning a gamut solid.** Ship four tabs
(`lightness · chroma · hue · curve`). The fifth arrives when someone designs it
and the engine grows a volumetric call.

### 1.3 Carried, not blocking

- `soft_white` / `soft_black` have no home in any v3 panel (build notes §6).
  Settle during the build; DEFAULTS in Settings is the candidate.
- **Drag-to-canvas** ships after click-to-place. Build notes §6 O6 already settles
  that the Generate button *is* the drag handle and that there is no in-panel
  drag state to draw — so this is additive, not a redesign. It is also the one
  journey Playwright can never cover (§3.4).
- Multi-seed stays deferred with its one cheap-keeping rule (a role's rule names
  the ramp it searches).

---

## 2. Architecture: the sandbox is an adapter, not a peer

A Figma plugin hands you a hexagonal boundary for free — two programs, no shared
scope, a message bus. The mistake available here is treating them as peers.

**The forcing constraint:** the harmoni-wasm engine can only run in the UI iframe
(the sandbox has no DOM and cannot instantiate wasm), and the `figma` global only
exists in the sandbox. The domain needs both. Therefore **the core lives in the
UI bundle**, and `code.ts` is reached through a port.

```
            UI iframe (real browser)                    sandbox
  ┌──────────────────────────────────────────┐     ┌─────────────────┐
  │  React views  ──▶  application services  │     │   code.ts       │
  │                          │               │     │   (dumb plan    │
  │                          ▼               │     │    executor)    │
  │                    ┌──────────┐          │     │                 │
  │                    │  domain  │          │ RPC │   figma.*       │
  │                    │  (pure)  │          │◀───▶│                 │
  │                    └──────────┘          │     └─────────────────┘
  │                     │        │           │
  │        PaletteEngine│        │DocumentPort│
  │              (wasm) ▼        ▼            │
  └──────────────────────────────────────────┘
```

### 2.1 What has to change in the current scaffold

The scaffold has it inverted. `src/code/applyPalette.ts` (53 lines) and
`applyForeground.ts` (98 lines) are domain logic living in the sandbox, and
`src/shared/messages.ts` carries business events (`apply-palette` with ramps).
That puts domain knowledge on the far side of a boundary the tests can't cross
cheaply.

### 2.2 Port verbs are plan-shaped, not per-node CRUD

The tempting port is `createVariable` / `setValueForMode` / `getVariableById`.
**Don't.** A chatty port means 120+ postMessage round trips for one write, and
`documentAccess: "dynamic-page"` makes every document read async on top of that.

The port is two verbs at the natural transaction boundary:

```ts
interface DocumentPort {
  readInventory(namespace: string): Promise<Inventory>
  applyPlan(plan: VariablePlan): Promise<PlanResult>   // reports progress
}
```

The core decides *what*; the adapter performs *how*. This is the same split
`primitiv-emit` already has against `primitiv-cli`: a pure function produces the
artefact, the adapter writes it. It also gives the `Writing` view its progress
count (`Creating… 47 / 120`) for free, since the adapter reports against a plan
whose length is known before the write starts.

### 2.3 The pure core is smaller than "hexagonal" tempts you to make it

**Half the domain is already in Rust.** Ramp generation, `readable_step`, contrast
grades and curve sampling live in `harmoni-core` and are gated by
`ramp_regression.rs`. The risk of applying hexagonal by the book is inventing a
fat TypeScript colour domain beside it.

The TypeScript domain is: projects (recipes), ramps, roles, stamps, and one pure
function:

```
plan(project, inventory) -> { creates, renames, updates, releases, deletes }
```

**That function is the whole ownership model.** Drift, adopt, the three-category
Remove (§23.1), the rename/step-count reconcile (§23.2), and rebinding's release
(§25.2) are all *inside it*. It is deterministic, takes no I/O, and every hard
bug the design phase found lives there. It is where mutation testing pays for
itself, and it should be built first.

### 2.4 The engine port, and its honest trade-off

`PaletteEngine` is a thin interface over harmoni-wasm. Two reasons it exists:
wasm instantiation is async and environment-dependent (this container cannot run
`wasm-pack`, which is why the session-start hook stubs the package), and
application-service unit tests want speed where colour values are irrelevant.

**But journey tests use the real engine, not a fake.** A fake engine makes a
journey's colour assertions meaningless — you would be testing your fake. Colour
*truth* stays gated in Rust where it already is; the TypeScript layers assert
structure and flow.

---

## 3. Test strategy

Four layers, each with a different tool and a different question.

| layer | tool | question | mutation gate |
| --- | --- | --- | --- |
| domain (`plan()`, stamps, roles) | vitest, no doubles | is the reasoning right? | **yes, 100%** |
| application services | vitest + fakes | are the ports orchestrated right? | **yes, 100%** |
| adapters (figma, wasm, clientStorage) | contract suite (§3.3) | does the real thing behave like the fake? | no |
| views | RTL | does the view render and wire? | no |
| journeys | Playwright (§3.2) | does the whole thing work? | no |

### 3.1 Why mutation stops at the application layer

Adapter tests are contract tests; most mutants in a thin adapter are equivalent,
and the ones that aren't are caught by the contract suite running against the
real implementation. Views are worse value: this repo already knows the cost
(~7 min per component via `mutate:component`), and at 25 views that is a day of
wall-clock for findings RTL integration tests largely already make. `plan()`
alone justifies the practice.

Stryker availability is environment-dependent in this repo — check
`ls packages/react/node_modules/.bin/stryker` before choosing, and fall back to
`scripts/mutate-local.mjs` knowing it is an approximation, never the gate. See
the `mutation-testing` skill.

### 3.2 The Playwright harness

You cannot drive Figma desktop with Playwright. You can drive the UI, because it
is an ordinary Vite app.

**Swap the adapter at the composition root.** In test mode, mount an in-page
`FakeFigmaDocument` backed by an in-memory document model instead of the
postMessage adapter. Journeys then run through real React, the real core, the
real engine, and a fake Figma. Fourteen journeys map near-mechanically off the
flow board.

### 3.3 The contract suite is not optional

A fake you cannot verify is a fake you are testing instead of the system. The
contract suite is one set of assertions run against **both** implementations:

- against `FakeFigmaDocument`, in CI, on every commit;
- against the real sandbox adapter, inside Figma, via a **dev-only plugin
  command** that runs the suite in-sandbox and reports pass/fail into the panel.

The second half cannot run in CI — it needs Figma desktop and a human to launch
it. That is the honest gap, and the reason §5 spikes it *before* 14 journeys get
built on a fake nobody has checked.

### 3.4 What the harness will never cover — write it down

- **Drag-to-canvas.** The drag image is over the Figma canvas, outside the
  iframe (build notes §6 O6). Manual test, forever.
- **Multiplayer and undo behaviour in real Figma.** §4 probes undo once; genuine
  concurrency is deferred (§22.3) and should be *stated* as out of scope for v1
  rather than left absent.

---

## 4. Spike 1 — the undo probe: RUN, and the answer is clean

**Run 2026-08-25** against a blank scratch file through the Desktop Bridge.
Build notes §22.3 called this the unknown that "decides whether the recovery path
exists at all", and recorded it as needing a human pressing Cmd+Z. It needed
both: the scriptable half gave the wrong answer, and the human half corrected it.

### 4.1 Result: a real undo reverts everything, atomically

One `Cmd+Z` after a write of a collection + variable + marks + binding, committed
as a single undo step with `figma.commitUndo()`:

| | before | after one real Cmd+Z |
| --- | --- | --- |
| variable `probe/500` | exists | **gone** |
| collection `Probe` | exists | **gone** |
| variable mark (`setSharedPluginData`) | `created` | gone with the variable |
| collection mark (the project stamp) | `probe-project` | gone with the collection |
| `root.setPluginData('harmoni-binding')` | `probe-project` | **`""`, key removed** |

**This is outcome 1 of §4.4's three, the cleanest one. §22.3's worry closes.**
An undo returns the document to before the write, so undo needs no design at all:
no half-written state, no orphaned marks, no binding pointing at nothing.
`Drift · missing` keeps the job it was drawn for — variables a *person* deleted —
and does not have to also mean "someone undid the write".

Verified visibly rather than by trusting the read: the `Probe` collection was
watched disappearing from Figma's own Variables panel, because the binding is
invisible in the UI and the collection vanishing is the only human-checkable
proof the keystroke reached the document.

### 4.2 The trap, and it is the most valuable thing the spike found

**`figma.triggerUndo()` does not behave like a user's undo, and a test built on
it will assert a state real users cannot reach.**

Called from inside a running plugin, across two checkpoints:

- undo 1 reverted exactly the second write — variable `B` and its root key gone,
  variable `A` and `harmoni-binding` intact. **Granularity control confirmed:
  `commitUndo()` really does decide what one undo means.**
- undo 2 removed variable `A` **and the collection** but left
  `harmoni-binding` behind — and it then survived **four further** `triggerUndo()`
  calls. Permanently stuck: variables gone, document still bound.

That is outcome 3, the one the design has no route for — and it is **an artefact
of calling `triggerUndo()` while the plugin's own execution is still open**, not
something a user can produce. The same write undone by hand reverted completely.

Two consequences, both binding on the build:

- **Never use `triggerUndo()` to test undo behaviour** — not in the contract suite
  (§5), not in a journey. It answers a different question than the one being
  asked. Undo is verified by hand or not at all.
- **The domain must not treat the binding as evidence that variables exist.**
  It already doesn't — `reconcile(desired, actual)` always reads the document —
  and this is the concrete reason that has to stay true rather than being
  optimised into a fast path that trusts the binding.

### 4.3 One design fact, carried over

Plugin actions are **not** committed to undo history by default, so a whole write
is a single undo step unless the plugin says otherwise, and `commitUndo()` is
therefore a design control — it decides what one Cmd+Z means to a user — rather
than plumbing. §4.2 confirms it works. **Recommendation: one commit per completed
write, and none inside a write**, so a user's undo takes back the whole thing and
never half of it.

### 4.4 Incidental API facts earned here

- **`setSharedPluginData`'s namespace must be `[A-Za-z0-9_.]`** — a hyphen throws
  *"The namespace can only consist of alphanumeric characters, _ or ."*.
  `"harmoni"` is fine; `"harmoni-probe"` is not. It threw **after** the collection
  and variable had been created (the partial-apply hazard, gotcha 5, again), so
  the retry needed a cleanup pass first.
- **`setPluginData(key, '')` removes the key**, it does not leave an empty one —
  `getPluginDataKeys()` comes back without it. That is how Remove drops a binding.
- **A collection's own `setSharedPluginData` dies with the collection.** Worth
  weighing against §7.1, which makes the collection stamp the authoritative home
  of the recipe: it is durable exactly as long as the collection is.

---

## 5. Spike 2 — the in-sandbox contract runner

**The question:** can a contract suite execute inside the real plugin sandbox and
report structured results back to the panel?

If it can, `FakeFigmaDocument` is trustworthy and §3.2's whole strategy holds. If
it cannot, the fake is unverifiable and the journey suite is worth much less than
it looks — better to know now than after 14 journeys.

**Shape:** a `contract/` module exporting a suite of `(port: DocumentPort) =>
Promise<Result[]>` cases, importable by both a vitest run (against the fake) and
a dev-only sandbox entry point. The sandbox build is already a separate Vite
config in library mode, so a second entry is cheap.

**Do not put undo in this suite** — §4.2 established that `triggerUndo()` is not
a faithful stand-in for a user's undo, and there is no scriptable one that is.

**Scope it to the operations the ownership model depends on** — the ones already
probed manually and recorded as working (build notes: `createVariable`,
`setValueForMode`, `remove`, `addMode`, `renameMode`, `setSharedPluginData` on
both variables and collections), plus `remote: true` detection, which must be
caught pre-flight rather than at write time.

**Success criterion:** the same suite passes green against the fake in CI and
green in-sandbox in Figma, with at least one case that is *known* to fail against
a deliberately-wrong fake — otherwise the suite proves nothing.

---

## 6. Repo & licence — settled 2026-08-25

**The plugin is built in a private repo, from its first commit. The engine stays
public and MIT where it is.**

### 6.1 Why now rather than later

The asymmetry decides it: **code written from the moment of the move is fully
private; code written in a public repo stays in its history permanently.**
Deleting a folder does not remove it — the objects remain, clones and forks keep
them, and `git filter-repo` plus a force push breaks every clone without
guaranteeing removal from forks. So "extract at first paid release" really means
"everything built until then is public, forever".

Against that, **the plugin's code does not exist yet.** The scaffold under
`apps/harmoni-figma-plugin/src/` is being discarded rather than ported (§7.8), so
there is nothing to carry. This is the cheapest the split will ever be, and every
day of building raises the price by exactly what was built.

**What a private repo does and does not protect.** A published Figma plugin ships
its built files to every user, so the bundle is obtainable — but it is minified,
with names mangled and no comments, tests, or history. That is reverse
engineering, not reading. The repo is the real exposure: readable source, the
**test suite** (an exhaustive specification of behaviour, and the single most
useful thing a competitor could be handed), the design record, and the commit
history showing every dead end.

**Accepted cost:** the v3 build notes and this RFC have been public throughout and
stay in this repo's history. Only what comes after the move is private.

### 6.2 The engine stays public

Measured, not assumed: `primitiv-emit` calls `harmoni_core::api::generate_brand_pair`
**once** (`pipeline.rs`) and imports `ColorInput` / `ColorInputError` / `Palette`;
`primitiv-cli` imports `ColorInputError` for one error conversion. There is **no
`cargo publish` anywhere in the workflows and no `license` field in any
`Cargo.toml`** — nothing consumes `harmoni-core` as a crate, and end users get
prebuilt binaries via npm.

Relicensing it therefore has no deadline and three cheap routes whenever it is
wanted: an optional dependency behind a cargo feature with a private git source;
publishing to crates.io under a source-available licence; or dropping
`theme --brand` from the open CLI so the coupling disappears. Choosing between
them is a pricing decision, not an engineering one.

### 6.3 The absolute rule

**Anything that gates payment goes in the private repo from its first line** —
licence verification, server endpoints, keys. The ports-and-adapters shape makes
this clean: a `LicencePort` *interface* can live anywhere; its implementation and
the server must never touch a public repo.

### 6.4 What moves, and the trap in the way

> **DONE 2026-08-25.** `apps/harmoni-figma-plugin/scripts/` was mis-homed: 34 of
> its 37 files were **Primitiv's own design tooling** — every `arrange-*.js`, plus
> the Modal and ToggleGroup fixers — so moving the app folder wholesale would have
> taken Primitiv's tooling private by accident. Those 34 now live in
> `scripts/figma/` (alongside the 4 docs-site wireframe scripts already there),
> and CLAUDE.md plus the three Figma skills that cite the path were updated. The
> plugin folder keeps only the three that are Harmoni's:
> `create-v1-wireframes.js`, `create-v1-output-detail-wireframes.js` and
> `refresh-view-flow-board.js`.

| moves to the private repo | stays public |
| --- | --- |
| `docs/harmoni-plugin-v3-build-notes.md` | engine RFCs — 0002, 0003, 0010, 0011, 0027 |
| this RFC (0028) | `crates/harmoni-*` (§6.2) |
| RFC 0013 (palette export — plugin-facing) | the 34 Primitiv `scripts/` files, rehomed first |
| `docs/plugin-ui-design-guide.md` (superseded — move or delete) | `packages/*`, the registry, the CLI |
| plugin build plumbing: `manifest.json`, both `vite.config*.ts`, `tsconfig.*`, `eslint.config.js`, `package.json`, `index.html`, `vitest.setup.ts` | |
| the 3 Harmoni scripts above, and `PLUGIN_UX_PLAN.md` | |
| **not** `src/` — discarded, per §7.8 | |

### 6.5 Sequence

1. ~~**Rehome the 34 Primitiv scripts**~~ — **done 2026-08-25**, they are in
   `scripts/figma/`.
2. **Publish the engine as `@primitiv-ui/harmoni-wasm`.** Not optional and not
   substitutable: `crates/harmoni-wasm/pkg/` is **gitignored with nothing tracked**
   (it is generated by `wasm-pack`), so a git dependency is impossible and the
   alternative is committing a build artefact. Scoped rather than bare
   `harmoni-wasm`, because the org name is guaranteed available. Public and MIT is
   consistent with §6.2 and means the private repo's CI needs no Rust toolchain.
   `@primitiv-ui/react` and `@primitiv-ui/icons` are already published.
   **This does not block starting.** Build steps 3 and 4 of §8 — the domain and the
   port seam — are pure TypeScript and touch no engine; only journey 1 (step 5)
   needs it. So the repo can be created and worked in before this is done.
3. **Create the private repo** with fresh history — do not `git subtree split`, which
   would carry the public history across.
4. **Copy** the build plumbing, the 3 scripts and the docs from §6.4.
5. **Delete** them from this repo, and drop `apps/harmoni-figma-plugin/` from
   `pnpm-workspace.yaml`.
6. **Write the private repo its own `CLAUDE.md`** — the plugin's working rules, with
   a pointer to this repo for the design system, the engine and the skills. Sessions
   that need both can attach the public repo alongside.
7. CI in the private repo: vitest + coverage, Playwright, eslint, `tsc`. No wasm
   build step needed once step 2 is done.

**Not doable from a Claude session:** creating the private repo (no tool for it) and
publishing to npm both need a human. Everything else is mechanical.

---

## 7. The domain model

Built first (§8), gated at 100% lines/branches/functions and 100% mutation. This
section fixes its shape so the first red-green cycle starts against a settled
model rather than inventing one. Every claim below traces to a settled position
in the build notes; where the modelling exposed something the design has not
settled, it is in §7.8 rather than quietly resolved here.

### 7.1 Where each entity lives

Three storage locations, and which one holds what is load-bearing — it is what
makes entry state 7 (the inherited project) work at all.

| entity | lives in | scope |
| --- | --- | --- |
| project list (index) | `clientStorage` | per **user, per device** — a convenience index, never the source of truth |
| project (the recipe) | a stamp on the destination **collection** | per document — this is what makes a project recoverable from the file alone |
| binding (project ↔ file) | `root.setPluginData` | per document, shared by everyone who opens it |
| ramp, role, destination | inside the project | — |
| provenance | a stamp on each **variable** | per variable |

**The recipe is authoritative in the document, not in `clientStorage`.** §18.1
settles that the second person to open any Harmoni file is *always* in state 7,
and that nothing has to be decided because "the recipe is recoverable from the
variables Harmoni manages". The cheapest way for that to be true is a
project-level stamp on the collection. Seeds could alternatively be re-derived
from pivot steps the way adopt does (§16.1), but **roles cannot** — a role schema
is not recoverable from colour values — so something in the document has to carry
it regardless.

### 7.2 The stamp has two levels

```ts
/** On the destination collection. Makes the recipe recoverable from the file. */
interface ProjectStamp {
  schemaVersion: number
  project: Project
}

/** On every variable Harmoni manages. */
interface VariableStamp {
  project: ProjectId
  target: StampTarget             // WHICH family, and what within it — see below
  origin: 'created' | 'adopted'   // §23.1: the fix for the adopt/remove contradiction
  wrote: ModeValues               // what Harmoni last wrote; drift is current ≠ this
}

/** Harmoni writes two families of variable, and they are not the same shape. */
type StampTarget =
  | { family: 'palette';  ramp: RampId; step: string }   // a ramp step
  | { family: 'semantic'; role: RoleId }                 // a role, aliasing a step
```

`origin` is the whole of §22.1's fix. Before it, "stamped" and "created" were the
same set, and every rule written before adopt existed assumed they were — which
is how `Remove` came to delete variables that predate Harmoni. With it, Remove
deletes `created` and releases `adopted`, and "un-adopt" needs no separate action.

`wrote` is what makes a hand-edit detectable: a stamped variable whose current
value differs from the value Harmoni last wrote was edited by a person.

### 7.3 The types

```ts
type ProjectId = string
type RampId    = string   // stable ACROSS RENAME — see below
type RoleId    = string

interface Project {
  id: ProjectId
  name: string
  ramps: Ramp[]
  roles: Role[]
  destinations: Destinations
  defaults: GenerateDefaults      // GenerateOptions, surfaced in Settings (§2c)
}

interface Ramp {
  id: RampId
  name: string                    // the variable-name segment: `brand`
  colour: RampColour
  steps: StepScheme
}

type RampColour =
  | { kind: 'seed';    seed: Oklch }              // brand, danger, warning, success, info
  | { kind: 'neutral'; tint: NeutralTint | null } // derived from brand; HAS NO SEED (§3)

type StepScheme =
  | { kind: 'harmoni'; count: number }            // labels = step_labels(count), 3..32
  | { kind: 'found';   labels: string[] }         // adopted: keeps the found names (§25.3)

interface Role {
  id: RoleId
  family: 'surface' | 'content' | 'border' | 'action'
  name: string                    // renaming must not re-run the engine (§2b)
  rule: RoleRule
}

type RoleRule =
  | { kind: 'search'; ramp: RampId; on: SurfaceRef; mustReach: ContrastFloor }
  | { kind: 'pin';    ramp: RampId; step: string }

interface Destinations {
  palette: Destination
  semantic?: Destination          // populated only once the offer is accepted (§7.8)
}

interface Destination {
  collection: CollectionRef       // an existing collection, or a name to create
  groupPrefix: string             // `color` — a NAME PREFIX, not a container (§5)
  modes: { light: ModeId; dark: ModeId }
}
```

Four things in there are decisions, not notation:

- **`RampId` is stable across rename, and `name` is just a field.** §23.2 requires
  rename-in-place rather than create-plus-orphan, and the stamp is what "makes the
  old set findable". A stamp keyed on the *name* cannot do that — the name is
  precisely what changed. Keying on an id makes reconciliation trivial and makes
  the orphaning bug structurally impossible rather than carefully avoided.
- **`RampColour` is a union because `neutral` genuinely has no seed** (§3: five
  seeds, six ramps). Modelling every ramp as seed-bearing would force a fake seed
  for neutral and lose the tint relationship the picker exposes (§11).
- **`StepScheme` is a union because adopt keeps found *names*, not just found
  length** (§25.3). `step_labels` is not a subset at other lengths — 7 steps
  yields `[50, 100, 230, 370, 500, 700, 900]`, and no hand-made palette is named
  `230`. Normalising onto Harmoni's ladder is then a deliberate act in `Ramp`,
  carrying that view's rename warning.
- **`destinations` is a record, not a field.** Harmoni writes two families — ramp
  steps, and (once the offer is accepted) the roles that alias them — and the user
  chooses where each one lands. Modelling a single `destination` bakes in an answer
  the design has not given; see §7.8. `semantic` being optional is also what
  encodes "the panel starts at two views" — an un-accepted offer is an absent
  destination, not an empty one.
- **Every rule names its ramp**, including pins. §19.2 settled it for searching
  rules (`brand · AA text`, never `AA text`) so a second brand seed means adding a
  row rather than migrating every stored role. §7.8 records that the pin's ramp is
  explicitly *not* settled — it is modelled here, not decided.

### 7.4 One reconcile, four intents

The design already says this in §16.1, in passing and about one case: *"Adopt and
Drift turn out to be the same machinery pointed at a different starting
condition."* That generalises to everything the plugin does to a document.

```ts
function reconcile(desired: DesiredState, actual: Inventory): Plan
```

`desired` is derived from the project; `actual` is what the document holds; the
plan is the diff. The four intents differ only in how `desired` is built:

| intent | desired state |
| --- | --- |
| **write** | run the engine over the project's ramps and roles |
| **adopt** | exactly what was found, with claims added and nothing else changed |
| **remove** | nothing at this destination |
| **rebind** | nothing at the old destination; a write plan at the new one |

That adopt "changes nothing" is not a special case in the writer — it falls out of
its desired state being the found values. §16.1's trap (adopt claims names, the
next write regenerates from seeds and overwrites everything it just adopted) is
avoided because adopting also derives each ramp's seed from its pivot step, so the
next write's desired state equals what is already there and the plan is empty.

```ts
type Operation =
  | { op: 'create';  slot: Slot;         value: ModeValues }
  | { op: 'update';  variable: VarRef;   from: ModeValues; to: ModeValues }
  | { op: 'rename';  variable: VarRef;   from: string;     to: string }
  | { op: 'restore'; slot: Slot;         value: ModeValues }   // stamped but missing (§21.2)
  | { op: 'claim';   variable: VarRef;   as: VariableStamp }   // adopt
  | { op: 'release'; variable: VarRef }                        // drop the claim, keep the variable
  | { op: 'delete';  variable: VarRef }                        // ONLY origin === 'created'

interface Plan {
  operations: Operation[]
  protected: ProtectedVariable[]   // current ≠ stamp.wrote: a person edited these
  untouched: number                // unstamped at the destination — never in scope
}
```

**`release` and `delete` are different operations and must never collapse.**
Release is what Remove does to adopted rows (§23.1) and what rebinding does to the
old destination (§25.2). It is already the panel's vocabulary, and it is the whole
reason the ownership promise survives adopt.

### 7.5 Drift is a reading of the plan, not a separate state

`In sync` is "the plan is empty". `Drift` is "the plan is not empty", and the
`SINCE THE LAST WRITE` cause strip is derived from *which* operations it holds:

| the plan contains | cause chip |
| --- | --- |
| `update` where current still equals `stamp.wrote` | **Seed** — the recipe moved, the document did not |
| a non-empty `protected` list | **Hand-edit** |
| `create` traceable to a role added since the last write | **New role** |
| `restore` | **Deleted** (§21.2) |
| destination reports `remote: true` | **Library** — caught pre-flight (§6) |

This is worth building deliberately, because it means **one function backs five
surfaces**: the entry-state decision, the Drift view and its cause strip, Export's
`Will create` count, the footer's `Creating… 47 / 120` denominator, and Remove's
inventory. A count that appears in copy is then the length of a list in the plan,
which is what stops §21.2's mock-arithmetic class of bug from having a runtime
equivalent.

### 7.6 The entry states fall out of it

§15.1's seven states are not seven code paths — they are three facts and a plan.

| bound | recipe on device | plan | view |
| --- | --- | --- | --- |
| no | none exist | — | `First run` |
| no | some exist | — | `Setup` |
| yes | yes | empty | `In sync` |
| yes | yes | non-empty | `Drift`, cause per 7.5 |
| yes | **no** | any | `In sync · inherited` — rebuild from the collection stamp (7.1), then as above |
| yes | yes | destination `remote` | pre-flight refusal (§6) |
| yes | yes | destination **deleted** | `Write refused · destination gone` (§26) |

### 7.7 Invariants worth driving from tests

These are the properties the model exists to guarantee. Each is one failing test
before it is one line of code, and each corresponds to a bug the design phase
found by reading views against each other:

1. **No `delete` operation ever targets a variable whose `origin` is `adopted`.**
   (§22.1 — the promise the whole model exists to keep.)
2. **No plan both creates a name and leaves an old one stamped to the same
   `RampId`.** Renaming a ramp or changing its step count produces `rename`, never
   `create` + orphan. (§22.2 / §23.2.)
3. **An adopt plan contains no `update`.** Adopting changes no value. (§16.1.)
4. **A ramp is removable exactly when no role's rule names it.** Not a hardcoded
   list — this is what protects `brand` and `neutral` without a special case.
   (§21.1, surviving §23.3.)
5. **A hand-edited variable is never written without an explicit overwrite.**
   Default is protect. (Drift's danger tone is earned by this.)
6. **Every count shown to a user is the length of a list in the plan**, never
   computed separately.
7. **Unstamped variables appear in no operation, ever.**
8. **No collection or group name appears anywhere in the domain, for either
   family.** Every target comes from a `Destination` the user chose (§5). The
   legacy scaffold hardcodes `Primitives / Palette` *and* `Primitives /
   Foreground`; a grep for a quoted collection name in `domain/` should return
   nothing, forever. A derived second destination (§7.8) is still derived from
   the user's first choice, never from a constant.

### 7.8 What the modelling surfaced

**Two findings. The first is the one that changes the model.**

#### The semantic layer is a second family, and nothing says where it lands

The design speaks of **the** collection throughout: `Destination` picks one
COLLECTION → GROUP (§5), and `Project`'s `WRITES INTO` rebinds that one (§20).
But Harmoni writes two families of variable, not one:

- **ramp steps** — `<group>/<ramp>/<step>`, real colour values;
- **roles** — the semantic layer, which §16.1 describes in its own words as what
  *"the semantic layer aliases"*: one variable per role, aliased to the ramp step
  its rule picks.

The second family only exists once the user accepts the offer at Export — which
is the design working as intended (§2: the offer sits next to the variable count,
retires itself, and taking it adds Roles and Audit). What is missing is that
accepting it needs a **destination of its own**, and the panel has nowhere to ask.

**Primitiv's own file is the argument that "same collection" is not obviously
right.** It separates `Primitives / Palette` from `Intent` deliberately — that is
RFC 0001's layered stack, primitives underneath, semantics aliasing them — and a
user adopting Harmoni may well want the same split, their own split, or none.
**That is exactly why it has to be asked rather than derived.** The principle the
rest of the model already obeys applies here too: the plugin proposes, the user
decides, and nothing in the domain names a collection.

**Settled 2026-08-25: the second destination is asked when the offer is
accepted.** Not at first run beside the first — that adds height to a screen
already carrying a three-column browser, and asks about a layer the user has not
been offered yet. And not derived from the palette destination, which would be
cheapest but forecloses the primitives/semantics split Primitiv's own file uses
(`Primitives / Palette` apart from `Intent`) for everyone who wants it.

**The cost is named rather than hidden: the offer stops being a one-tap yes.**
Accepting it becomes a short route into a destination picker, which is a real
change to a view that was designed as a compact pitch beside the variable count.
Two things make it affordable — the route already exists as an idiom (`Adopt`,
`Canvas swatches` and `Remove` are all pushed views reached from a control), and
nobody who leaves the semantic layer off ever sees it.

**Still to draw:** the picker itself. It is `Destination`'s `Where` card with one
collection and one group, minus the mode mapping (roles inherit the modes of what
they alias), reached from Export's offer and returning to it. Add it to the flow
board as a state of journey 5.

`Destinations` in §7.3 already carries the shape: `semantic` is absent until the
offer is accepted, and populated from this picker.

This also reaches three built views, which is how to tell it is real rather than
tidy: **`Remove`** counts and deletes per family (roles are `created`, so they
go); **`Drift`** gains a cause when a role's alias target moves; and **`Project`**'s
`WRITES INTO` rebinds one destination today while a project may have two — and
§25.2's release-on-rebind has to apply to each.

#### A mode is not a variable

**A mode is not a variable, so 6 ramps × 10 steps is 60 variables, not 120.**
Figma's model is one variable per name holding one value *per mode*
(`createVariable(...)` then `setValueForMode(mode1, ...)`,
`setValueForMode(mode2, ...)`). So the write produces **60 variables carrying 120
values**, and §3's derivation — "6 ramps × 10 steps × 2 modes = 120 variables,
which is exactly what Export and CRUD 03 report" — counts values while saying
variables. §23.1 repeats it ("10 steps x 2 modes = 20 variables").

That matters because "variables" is the word in the copy everywhere:
`Create 120 variables`, `Remove 80 variables`, `Adopt 60 variables`,
`Restore 2 variables`, `missing 2 / unchanged 118`. A user who accepts
`Create 120 variables` and then opens Figma's Variables panel sees **60 rows**.
This is §21.2's rule in a third costume — the counts have to survive being added
up *and* being counted in the document.

**And the multiplier is not stable anyway, which is the deeper reason the count
must be per-variable.** The destination is user-chosen, and a collection may have
any number of modes. `Destination` maps Harmoni's Light and Dark onto two of the
target collection's modes; the rest are untouched. So "× 2 modes" is not a
property of the write, it is a property of one particular target. `Slot` is
`(ramp, step)` → one variable, and `Plan.operations.length` is the number the UI
should report — which is invariant 6 in §7.7 doing its job.

**Settled 2026-08-25: count variables, and name the modes beside them** —
`Create 60 variables · Light and Dark`. It matches what Figma shows, and it
echoes the Destination screen, which has already taught the user that modes are a
mapping rather than a multiplier. Bare corrected numbers (60/40/20) would be
accurate but silently drop the fact that both themes are written; counting values
(`120 values across 60 variables`) is the most precise and puts a Figma internal
in front of someone who may not care.

**This is a sweep, not a single edit.** Every count in the built views is
affected — Export's `Create 120 variables`, `Remove`'s 80/40 split, `Adopt`'s 60,
`Drift`'s `missing 2 / unchanged 118`, `In sync`'s lead, and CRUD 03. Each has to
be re-derived from ramps × steps rather than halved by eye, because the ratios
differ per view. Invariant 6 in §7.7 is what stops it recurring: once every count
is the length of a list in the plan, no copy can disagree with what happens.

**Withdrawn, and worth keeping visible because the correction is instructive.**
An earlier draft named the second family as a `Primitives / Foreground` collection
of aliases (RFC 0003), read straight out of the **legacy scaffold** where both
that name and `Primitives / Palette` are hardcoded constants in
`src/code/applyPalette.ts` and `applyForeground.ts`. Wrong family, and wrong
because hardcoded collection names are precisely what v3 replaces. Two things say
so:

- `Destination` exists to pick *any* collection and *any* group prefix (§5), so
  **nothing in the domain may name a collection**. `Destination.collection` is a
  `CollectionRef` — an existing collection, or a name to create — and
  `groupPrefix` is a name prefix, because there is no createGroup API.
- **v3 writes no foreground variables at all.** §4 settles that a swatch's paired
  foreground is *data, not a token*, with **no variable binding**, because it
  differs per step. Palette's `✓ every step has a readable foreground` is a
  quality claim, not a variable family. RFC 0003's alias layer belongs to the old
  600 px app.

The half that was right — that a single `Destination` under-specifies the target —
survives, pointed at the family that genuinely exists in v3 rather than the one
inherited from the old app. **Reading the shipped code for the design's structure
is the mistake to avoid**: the scaffold predates every v3 decision.

**Worth writing down as a build trap:** the legacy `applyPalette.ts` /
`applyForeground.ts` look like a head start on the writer and are not one. They
hardcode the destination, put domain logic in the sandbox (§2.1), and write a
variable family v3 does not have. Port the *idempotent find-or-create* idea if
anything; port none of the rest.

**Four smaller things, deliberately modelled but not decided:**

- **A pinned role's ramp.** §19.2 names this open and says it belongs to the pin's
  data model. `RoleRule` carries `ramp` on both arms so the decision has somewhere
  to land, but nothing in the design says what a pin's ramp *means* yet.
- **How `neutral`'s tint is expressed.** §11 gives tinting a control and an off
  state; the model needs the shape of `NeutralTint` (a hue plus an amount? the
  duotone two-anchor form RFC 0011 proposes?) before the picker's neutral tab can
  be built.
- **Whether the collection stamp stores the whole recipe or only what cannot be
  re-derived.** Storing everything is simpler and makes state 7 trivially correct;
  storing only roles is smaller and forces seeds to round-trip through the pivot
  rule, which is a useful thing to be forced to keep true.
- **Release then re-adopt.** Rebinding releases the old destination's variables
  (§25.2), which leaves them unstamped and therefore adoptable again. That is
  coherent and probably desirable, but nothing says it out loud.

---

## 8. Build order

1. ~~**Spike 1** (§4)~~ — **done 2026-08-25. Clean: a real undo reverts the whole
   write, so undo needs no design.**
2. **Spike 2** (§5) — decides whether the ATDD strategy is honest.
3. **The domain** (§7) — `reconcile` and the types, TDD + mutation to 100%,
   against no doubles. §7.7's seven invariants are the first seven failing tests.
4. **The port seam** — invert the scaffold (§2.1), `DocumentPort` with the
   fake and the real adapter behind the contract suite.
5. **Journey 1 end to end** — First run → Setup → Destination → Export → Writing
   → In sync — as the first Playwright journey, proving the harness on the
   journey that touches every layer.
6. Remaining journeys and views, view by view against the settled panels.

**Before any view is composed, read the matching wireframe panel** (CLAUDE.md
rule 8). The panels are the spec; the HTML artefacts and prose are only the
arguments that produced them.
