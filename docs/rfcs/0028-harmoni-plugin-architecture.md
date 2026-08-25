# RFC 0028 — Harmoni plugin: build architecture & test strategy

> **Status:** Draft — spikes defined, not yet run. Architecture recommended,
> repo/licence position open (§6).
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

## 4. Spike 1 — the undo probe

Build notes §22.3 flags this as the unknown that "decides whether the recovery
path exists at all". It was recorded as needing a human pressing Cmd+Z.

**It does not. The probe is fully scriptable**, and reading the API for it turned
up a design fact the notes do not have.

### 4.1 The finding: plugin writes are one undo step by default

From `@figma/plugin-typings`:

> By default, plugin actions are not committed to undo history. Call
> `figma.commitUndo()` so that triggered undos can revert a subset of plugin
> actions.

Both `figma.commitUndo()` and `figma.triggerUndo()` exist. Two consequences:

- **Harmoni chooses its own undo granularity.** A 120-variable write plus its
  stamps plus the `root` binding is, by default, a *single* undo step. The user
  cannot half-undo it — which is exactly the atomicity the ownership model wants,
  and it is a default rather than something to engineer.
- **`commitUndo()` is a design control, not plumbing.** Where the plugin places
  its commits decides what one Cmd+Z means to a user. Recommendation: one commit
  per completed write, and none *inside* a write.

### 4.2 What is still genuinely unknown

Whether `setSharedPluginData` and `root.setPluginData` **participate in the undo
stack at all.** The docs do not say, and plugin data has historically not always
been undoable. Three outcomes, with different design consequences:

| variables | plugin data | consequence |
| --- | --- | --- |
| reverted | reverted | **Best.** Clean return to the pre-write state. No recovery view needed for undo at all. |
| reverted | survives | Bound document, recipe intact, variables gone → this is `Drift · missing`, already drawn (§21.2). Recovery exists. |
| survives | reverted | **Worst.** Stamped variables with no binding. Needs a route the design does not have. |

### 4.3 The probe

One script, run through the Desktop Bridge against a scratch file. It must be a
scratch file — it writes and reverts variables.

```js
// Spike 1: does plugin data survive triggerUndo()?
const NS = 'harmoni-probe'
const col = figma.variables.createVariableCollection('Probe')
const v = figma.variables.createVariable('probe/1', col, 'COLOR')
v.setValueForMode(col.modes[0].modeId, { r: 1, g: 0, b: 0 })
v.setSharedPluginData(NS, 'origin', 'created')
col.setSharedPluginData(NS, 'project', 'probe-project')
figma.root.setPluginData('harmoni-binding', 'probe-project')

const before = {
  varId: v.id,
  colId: col.id,
  stamp: v.getSharedPluginData(NS, 'origin'),
  colStamp: col.getSharedPluginData(NS, 'project'),
  binding: figma.root.getPluginData('harmoni-binding'),
}

figma.commitUndo()
figma.triggerUndo()

const after = {
  variableStillExists: !!(await figma.variables.getVariableByIdAsync(before.varId)),
  collectionStillExists: !!(await figma.variables.getVariableCollectionByIdAsync(before.colId)),
  binding: figma.root.getPluginData('harmoni-binding'),
}
// If the variable survived, re-read its stamp; if not, the stamp went with it.
return { before, after }
```

**Then run it a second time with the `commitUndo()` call removed**, to confirm the
default-single-step claim in §4.1 against the live API rather than the docs.

**Clean up afterwards** — if the undo did not revert them, remove the probe
collection and clear `harmoni-binding` from `root`.

### 4.4 What the outcome changes

- Outcome 1 → `Drift · missing` keeps its current job (deletion by a person), and
  undo needs no design at all. §22.3's worry closes.
- Outcome 2 → as designed today. No change.
- Outcome 3 → a new route is needed: stamped variables the plugin can find but
  cannot attribute to a bound project. Likely a state of `Setup` reached by
  scanning, i.e. adopt's machinery pointed at Harmoni's own orphans.

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

**Scope it to the operations the ownership model depends on** — the ones already
probed manually and recorded as working (build notes: `createVariable`,
`setValueForMode`, `remove`, `addMode`, `renameMode`, `setSharedPluginData` on
both variables and collections), plus `remote: true` detection, which must be
caught pre-flight rather than at write time.

**Success criterion:** the same suite passes green against the fake in CI and
green in-sandbox in Figma, with at least one case that is *known* to fail against
a deliberately-wrong fake — otherwise the suite proves nothing.

---

## 6. Repo & licence position — open

Recorded so the next session does not re-derive it.

**The live problem:** the root `LICENSE` is MIT and currently covers
`apps/harmoni-figma-plugin`, so the commercial product is being MIT-licensed
today. That is fixed by a directory `LICENSE` plus a carve-out in the root, and
it is independent of everything below.

**What a private repo does and does not buy.** A Figma plugin ships its UI as a
single inlined HTML file to every user, so the shipped artefact is readable
regardless, and licence enforcement must be server-side either way. A private
repo buys privacy of *history and process*, not of the product. That is a real
benefit, and it is the one thing that gets harder by waiting — git history is
permanent, so extracting later means rewriting history or accepting a public
prefix.

**If the engine is relicensed too, the mechanics are small.** Measured, not
assumed: `primitiv-emit` calls `harmoni_core::api::generate_brand_pair` **once**
(`pipeline.rs`) and imports `ColorInput` / `ColorInputError` / `Palette`;
`primitiv-cli` imports `ColorInputError` for one error conversion. That is the
entire public-CLI → engine coupling, and it is the `primitiv theme --brand` path.
There is also **no `cargo publish` anywhere in the workflows and no `license`
field in any `Cargo.toml`** — nothing consumes `harmoni-core` as a crate, and end
users get prebuilt binaries via npm. Only contributors build from source.

Three wirings, if the split happens:

1. **Private git dependency behind a cargo feature.** `harmoni-core` optional
   behind `brand-generation`, default off; the release workflow builds with it on
   using a deploy key. Cost: outsiders cannot build or test that command, and the
   three `theme --brand` goldens only run in the credentialed build.
2. **Publish the engine to crates.io under a source-available licence** (BUSL,
   PolyForm, bespoke non-commercial). Everything builds for everyone; the licence
   is the gate, not access. Buys legal control, not secrecy.
3. **Cut the dependency — make brand generation paid.** The open CLI emits the
   committed `palette.json`, which is nearly the whole token pipeline anyway.
   Cleanest boundary; costs the open CLI its most compelling feature.

**Choosing between 1 and 3 is a pricing decision, not an engineering one** — the
engineering cost is near-identical because it is one call site.

**Recommendation:** relicense the plugin directory now; keep the engine question
open. Options 1–3 all stay available indefinitely and none gets harder by
waiting.

---

## 7. Build order

1. **Spike 1** (§4) — scriptable, one bridge session, answers a design question.
2. **Spike 2** (§5) — decides whether the ATDD strategy is honest.
3. **`plan()` and the domain** (§2.3), TDD + mutation to 100%, against no doubles.
4. **The port seam** — invert the scaffold (§2.1), `DocumentPort` with the
   fake and the real adapter behind the contract suite.
5. **Journey 1 end to end** — First run → Setup → Destination → Export → Writing
   → In sync — as the first Playwright journey, proving the harness on the
   journey that touches every layer.
6. Remaining journeys and views, view by view against the settled panels.

**Before any view is composed, read the matching wireframe panel** (CLAUDE.md
rule 8). The panels are the spec; the HTML artefacts and prose are only the
arguments that produced them.
