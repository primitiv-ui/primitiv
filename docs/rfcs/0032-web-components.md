# RFC 0032 — Web components (`@primitiv-ui/web`) and a shared behaviour core (`@primitiv-ui/core`)

**Status:** Draft — proposed (2026-11-07)
**Decision sought:** Ship Primitiv's headless behaviour as framework-free custom
elements for server-rendered stacks (plain HTML, HTMX, Thymeleaf, Rails, Django,
Laravel …), with the framework-independent logic pulled out of
`@primitiv-ui/react` into a shared package **first**, so the two surfaces run the
same keyboard and state rules instead of two copies that drift apart.

---

## 1. Why

Today, using Primitiv means using React. The design system itself (tokens,
registry stylesheets, the `contract.json` styling contract, Figma) has no React
dependency at all. Only the behaviour layer does: keyboard models, ARIA wiring,
roving focus, controlled state. A team rendering HTML on the server and
swapping fragments with HTMX can already use the token layer and the registry
CSS. What it cannot get is a tablist that behaves correctly.

Custom elements fill that gap without asking the consumer to adopt a client
framework:

- **They upgrade themselves.** The browser runs `connectedCallback` whenever a
  `<pv-tabs>` enters the document, however it got there: parsed HTML, an HTMX
  swap, `innerHTML`, a history restore. There is no hydration step.
- **They live in the light DOM**, so the existing styling contract (root class,
  modifier classes, `data-*` state, `--primitiv-*` custom properties, RFC 0004
  §3) and the `@layer primitiv.*` cascade (RFC 0008) apply unchanged.
- **They cost almost nothing to ship.** No runtime, no virtual DOM. A component
  is a few kilobytes of event handling over markup the server already sent.

The opening proposal for this work (an external draft written without access
to this repo) converted Tabs to an index-based `<pv-tabs>` with its own keyboard
code. That would have produced a *second, smaller* Tabs: no `value` pairing, no
`aria-controls`, no disabled tabs, no manual activation, no RTL. It would also
have reimplemented in parallel logic that the React package already holds as
pure functions. This RFC keeps that draft's good calls — native custom elements,
no Lit, light DOM, a `data-*` styling contract, HTMX as the proving ground — and
replaces the rest.

## 2. Goals and non-goals

**Goals**

1. One behavioural contract per component, delivered by two surfaces: React
   (`@primitiv-ui/react`) and custom elements (`@primitiv-ui/web`).
2. Pure, framework-free logic lives once, in `@primitiv-ui/core`, and both
   surfaces import it.
3. The elements work in any server-rendered stack with no build step: one
   `<script type="module">` and they run.
4. Correct behaviour under HTMX's whole swap repertoire (§7.4), proved in a real
   browser.
5. The existing registry stylesheets style the elements unchanged.

**Non-goals (v1)**

- **Shadow DOM.** It would cut the components off from the cascade layers, the
  `data-theme` / `data-density` inheritance (RFC 0009), and consumer CSS. Light
  DOM is the whole point.
- **Lit, Stencil, or any element framework.** The core is already pure. The
  per-element glue is small enough that a framework would cost more than it
  saves.
- **Wrapping React in custom elements.** That would make every consumer ship
  React, which defeats the purpose.
- **Using the elements from React.** React consumers keep `@primitiv-ui/react`.
- **New visual design.** Custom elements add no visual surface. They render the
  same anatomy, so nothing goes to Figma. (The "Figma first" rule in CLAUDE.md
  is about composite *designs*; it does not apply here.)
- **A Spring Boot app in this repo.** See §7.5.

## 3. Architecture

```text
            ┌────────────────────────────────────────────┐
            │ @primitiv-ui/core   (pure TS, zero deps)    │
            │  keymaps · roving targets · id derivation   │
            │  per-component policy (tabs, accordion …)   │
            └───────────────┬─────────────────┬──────────┘
                            │                 │
          ┌─────────────────▼───┐      ┌──────▼──────────────────┐
          │ @primitiv-ui/react   │      │ @primitiv-ui/web         │
          │ hooks + compounds    │      │ custom elements          │
          │ (state in React)     │      │ (state in attributes)    │
          └──────────┬───────────┘      └──────┬──────────────────┘
                     │   same DOM contract     │
                     └──────────┬──────────────┘
                     ┌──────────▼───────────┐
                     │ registry styles.css   │  (unchanged, contract.json)
                     │ + @primitiv-ui/tokens │
                     └──────────────────────┘
```

The seam is **the DOM each surface renders**: the same roles, ARIA
relationships, `data-*` hooks and keyboard behaviour. A shared conformance suite
(§6.2) asserts it against both surfaces.

### 3.1 What goes in core, and what doesn't

The test is **"does it need React (or the DOM's mutable state) to run?"** If it
doesn't, it moves to core.

| Moves to `@primitiv-ui/core` | Stays per-surface |
|---|---|
| `getKeyToActionMap` (already pure; `utils/getKeyToActionMap.ts`) | `useRovingTabindex` as a hook (becomes a thin adapter) |
| The index arithmetic inside `useRovingTabindex` → `resolveRovingTarget` | `useControllableState`, `useCollection` (React state models) |
| `deriveId` | `createStrictContext`, `Slot` / `asChild` |
| `FOCUSABLE_SELECTOR` | Element lifecycle, registration, attribute reflection (web) |
| Typeahead matching (`useTypeahead`'s query/cycle/wrap rules) → `createTypeahead` | Timers bound to a component lifetime |
| Per-component **policy**: decisions such as "does this navigation activate the tab" and "which trigger is the tab stop" | Rendering |
| Shared union types (`Orientation`, `ReadingDirection`, `ActivationMode`, `RovingKeyAction`) | React prop types, `ComponentProps` narrowing, JSDoc for docgen |

Policy is the important row. Today `useTabsTrigger.ts` decides, inline:

- **activation:** `!isDisabled && (activationMode === "automatic" || action === "activate")`;
- **tab stop:** `isActive || (activeValue === undefined && isFirst) ? 0 : -1`;
- **landing on disabled tabs:** arrow keys land on a disabled tab but don't
  activate it (the Tabs-specific contract, distinct from RadioGroup and
  Accordion, which skip disabled items).

Those three rules *are* Tabs' keyboard contract. If they stay inside a React
hook, the web surface has to re-derive them, and the two copies will disagree
the first time either one is fixed. Core exposes them as plain functions over
plain data:

```ts
// @primitiv-ui/core — tabs/policy.ts (sketch; signatures are settled in TDD)
export function tabsKeydown(state: TabsState, key: string): TabsKeyOutcome | null;
//   → { focus: string; activate: string | null } — or null when the key is not ours
export function tabsTabStop(state: TabsState): string | undefined;
export type TabsState = {
  values: readonly string[];          // DOM order
  disabled: ReadonlySet<string>;
  active: string | undefined;
  focused: string;
  orientation: Orientation;
  dir: ReadingDirection;
  activationMode: ActivationMode;
};
```

`useTabsTrigger` then calls `tabsKeydown` and applies the outcome through
React state. `<pv-tabs>` calls the same function and applies the outcome to
attributes.

### 3.2 Package shape

| Package | Contents | Published |
|---|---|---|
| `packages/core` → `@primitiv-ui/core` | Pure TS, no DOM types in signatures where avoidable, no deps | npm + JSR |
| `packages/web` → `@primitiv-ui/web` | Custom element classes, `define` entry points, a prebuilt bundle | npm + JSR |
| `packages/react` | Unchanged public API; now depends on `@primitiv-ui/core` | as today |

Core has to be a **real published package**, not a folder that both packages
reach into. `packages/react` builds with plain `tsc -p tsconfig.build.json`, and
its JSR entry is `./src/index.ts`. A relative import outside its own `src/`
breaks both the `rootDir` build and JSR's module graph. `workspace:*` resolves
locally, and pnpm rewrites it to the lockstep version at publish time.

Users never install core directly: it reaches them as a dependency of
whichever surface they chose. Its API is still semver-public, though, because
both surfaces pin it.

## 4. The extraction (React side)

The extraction happens **before** any element is written, and it must leave
React behaviour unchanged. The proof is that the existing React suites (Tabs
alone has 14 test files, plus the ten other components that consume
`useRovingTabindex` or `getKeyToActionMap`) pass **without modification**, and the Stryker scores on
the mutation allowlist do not drop.

Order of work, one red-green cycle per commit (CLAUDE.md working style):

1. **Scaffold `packages/core`** (vitest in node, 100% coverage gate, Stryker
   config, `jsr.json`). Wire it into `scripts/bump-version.mjs`
   (`PACKAGE_JSON_PATHS` and `JSR_JSON_PATHS`), `publish.yml`, and
   `release.yml`'s explicit `git add`.
2. **Move `getKeyToActionMap` and `deriveId`** with their existing tests
   (`utils/__tests__/getKeyToActionMap.test.ts`, `deriveId.test.ts`) and
   re-point the React imports. This is a pure move, so it isn't a red-green
   cycle. The moved tests are the existing net, not new characterisation tests.
3. **Extract `resolveRovingTarget`** out of `useRovingTabindex`'s `switch`,
   driven red-first in core. The hook keeps its signature and becomes
   `getKeyToActionMap` → `resolveRovingTarget` → `onNavigate`, so none of
   its callers change.
4. **Extract Tabs policy** (`tabsKeydown`, `tabsTabStop`), driven red-first in
   core. Then refactor `useTabsTrigger` onto it under green.
5. **`FOCUSABLE_SELECTOR`, shared types, and the typeahead core** follow when a
   web component first needs them (Modal/Popover and Listbox respectively), not
   speculatively.

The `// Stryker disable` justifications travel with the code they annotate.
Core joins the mutation allowlist at **100%** from its first commit, since pure
functions have no excuse for surviving mutants.

## 5. `@primitiv-ui/web` — the Tabs element set

### 5.1 Markup and naming

Element names mirror the React part names, so documentation, prop tables and
agent manifests (RFC 0020) can map one-to-one:

| React | Element | Role |
|---|---|---|
| `Tabs.Root` | `<pv-tabs>` | state owner |
| `Tabs.List` | `<pv-tabs-list>` | `tablist` |
| `Tabs.Trigger` | `<pv-tabs-trigger>` | `tab` |
| `Tabs.Content` | `<pv-tabs-content>` | `tabpanel` |

```html
<pv-tabs value="overview" class="primitiv-tabs primitiv-tabs--md">
  <pv-tabs-list label="Account sections" class="primitiv-tabs__list">
    <pv-tabs-trigger value="overview" class="primitiv-tabs__trigger">
      <span class="primitiv-tabs__trigger-label">Overview</span>
    </pv-tabs-trigger>
    <pv-tabs-trigger value="billing" disabled class="primitiv-tabs__trigger">
      <span class="primitiv-tabs__trigger-label">Billing</span>
    </pv-tabs-trigger>
  </pv-tabs-list>
  <pv-tabs-content value="overview" class="primitiv-tabs__panel">…</pv-tabs-content>
  <pv-tabs-content value="billing" class="primitiv-tabs__panel" hidden>…</pv-tabs-content>
</pv-tabs>
```

**Prefix `pv-`.** It's short enough to type in templates, and it doesn't read
as the `primitiv-` *class* namespace, which stays the styling contract. The
headless element applies **no classes and no styles**, exactly like the React
primitive.

### 5.2 Attribute and property contract

| Attribute (reflected) | Property | Maps to React |
|---|---|---|
| `value` on `<pv-tabs>` | `.value` | `value` / `defaultValue` |
| `orientation` | `.orientation` | `orientation` |
| `activation-mode` | `.activationMode` | `activationMode` |
| `label` / `aria-labelledby` on the list (one required) | — | `label` / `ariaLabelledBy` |
| `value`, `disabled` on trigger and content | `.value`, `.disabled` | `value`, `disabled` |

- **`value` is both the server's input and the live state.** The element keeps
  the attribute in sync as the user switches tabs. That makes HTMX history
  snapshots, `hx-include`, and a server re-render all see the real selection.
  There's no separate `default-value`: a server-rendered page has no "first
  render" distinct from "now".
- **Controlled mode becomes a cancelable event.** The element dispatches
  `pv-tabs-change` (`bubbles: true`, `cancelable: true`,
  `detail: { value, index }`) *before* applying the change.
  `event.preventDefault()` vetoes it, and the caller can apply its own choice
  by setting `.value`. This replaces `value` + `onValueChange` without a second
  mode.
- **Event names are kebab-case and prefixed**, not `change`, because native
  `change` events bubbling up from form fields inside a panel would collide.
  Kebab-case also works in every `hx-on:` / `hx-trigger` form.
- **Reading direction comes from the platform.** The element reads
  `this.matches(':dir(rtl)')` at keydown time. The inherited HTML `dir`
  attribute *is* the `DirectionProvider` equivalent, so there's no `dir`
  attribute of its own to drift from it.
- **`lazyMount` is dropped on purpose.** On a server-driven page, lazy panels
  are an HTMX recipe, not a component feature:
  `<pv-tabs-content value="reports" hx-get="/reports" hx-trigger="pv-tabs-show once">`.
  The element fires a non-cancelable `pv-tabs-show` on the panel that becomes
  active, so that recipe has an event to hang off.
- **The imperative API** is the `.value` setter, the equivalent of
  `setActiveTab`.

### 5.3 ARIA the element owns

| Element | What it sets |
|---|---|
| list | `role="tablist"`; `aria-orientation`; `aria-label` from `label` |
| trigger | `role="tab"`; `aria-selected`; `aria-controls`; `aria-disabled`; `data-disabled`; roving `tabindex` from `tabsTabStop` |
| content | `role="tabpanel"`; `aria-labelledby`; `tabindex="0"`; `hidden` when inactive |
| every element | `data-state` and `data-orientation` |

- **Ids** are `deriveId(rootId, "trigger"|"panel", value)`. `rootId` is the
  root's own `id` if present, or a generated one otherwise. Ids the server
  rendered are never overwritten.
- **ARIA is set as attributes, not through `ElementInternals`.** Attributes are
  inspectable, work with Testing Library and jsdom, and let the server
  pre-render the same output (§5.5). `ElementInternals` comes in only where it
  is the sole mechanism, which is form association (`formAssociated`) for
  Select, Checkbox and Switch later.
- **The trigger element is the tab.** `role="tab"` overrides the button role
  anyway, so there's no inner `<button>`. Enter/Space activation comes from the
  shared keymap (`activate`), the same path manual mode uses in React. The open
  question in §9.3 covers links-as-tabs (React's `asChild` + `<Link>`).

### 5.4 Lifecycle: the part the draft got wrong

Six rules, each one driven by a test:

1. **Listeners attach through an `AbortController` per connection.**
   `disconnectedCallback` aborts it. Moving the element (`hx-preserve`, DOM
   reparenting) can therefore never stack handlers.
2. **Children register with their owner, and the owner never queries once and
   caches.** Each part registers on connect with
   `this.closest('pv-tabs')` and unregisters on disconnect. The root keeps the
   collection in DOM order (`compareDocumentPosition`, as `useCollection` does
   via its sort). Fragments swapped into the middle of a tab set therefore
   join it.
3. **The upgrade order doesn't matter.** A part that connects before its root
   is defined registers when the root upgrades: the root adopts parts whose
   nearest `pv-tabs` is itself. A root that connects before its children are
   parsed picks them up as they arrive.
4. **Ownership is scoped by `closest()`, never by `querySelectorAll`.** Tabs
   nested inside a panel belong to the inner root only.
5. **Reconciliation is batched into a microtask.** Ten registrations from one
   swap cost one pass of ARIA and state writes, not ten.
6. **Attribute changes from outside apply.** `observedAttributes` covers
   `value`, `orientation` and `activation-mode` on the root, and `value` and
   `disabled` on the parts. A server out-of-band swap that changes only
   attributes must work. Invalid values are ignored, using the same
   "unknown value → no selection" rule React's uncontrolled mode follows.
   Selection never moves to the first tab by guesswork.

### 5.5 Progressive enhancement

The server can render the whole post-upgrade state: roles, ARIA, `data-state`,
and `hidden` on inactive panels. The element then *reconciles* that markup
rather than building it. The page is correct before the module loads and stays
correct if it never loads (all panels except the active one stay hidden). The
registry's HTML snippet (§8) emits the pre-rendered form.

For hand-written markup that omits it, there is no CSS-only fallback worth
shipping. A selector cannot compare a panel's `value` with its root's, so
before the upgrade every panel shows. The README therefore makes rendering
`hidden` on inactive panels from the template the rule, not a tip.

## 6. Testing

The rules are the same as everywhere else: strict TDD, 100% lines, branches,
statements and functions, and Stryker on the allowlist.

### 6.1 Per package

- **Core:** vitest in the node environment. These are pure functions, so there
  are no fixtures beyond data.
- **Web:** vitest + jsdom (jsdom implements `customElements`, `:dir()`
  matching aside; see below) + `@testing-library/dom` + `user-event`. These are
  the same tools as React, minus React. A fixture is an HTML string mounted
  into `document.body`.
- **jsdom gaps** are covered in Playwright (§7.4), not mocked: `:dir()`
  support, real focus-visible, real upgrade timing against parsing.

### 6.2 The conformance suite: what keeps the two surfaces equal

Each component gets one **surface-agnostic** suite in
`packages/core/conformance/tabs.conformance.ts`. It exports test cases written
against Testing Library DOM queries only (`getByRole('tab', { name, selected })`,
keyboard via `user-event`). Each surface runs it with its own `mount(fixture)`:

```ts
// packages/react/src/Tabs/__tests__/Tabs.conformance.test.tsx
runTabsConformance({ mount: (f) => render(<TabsFromFixture {...f} />) });
// packages/web/src/tabs/__tests__/tabs.conformance.test.ts
runTabsConformance({ mount: (f) => mountHtml(tabsHtml(f)) });
```

The fixture is pure data: values, labels, disabled set, orientation,
activation mode, direction. That follows the `Tabs.fixtures.ts` convention.
Any behaviour one surface has and the other lacks fails here, which is the
drift guard. Surface-specific behaviour (React's `asChild`, the web element's
attribute reflection and HTMX events) stays in each package's own suite.

Strict red-green note: the conformance suite is written against the web
element *before* the element exists, so it starts red there. On React it is
expected to pass on first run. That doesn't break the "no characterisation
tests" rule, because React is the reference implementation the suite is
describing. Any case that fails on React is a real React bug and is fixed in
its own cycle.

## 7. Distribution and integration

### 7.1 Entry points

```text
@primitiv-ui/web            → classes only, no side effects (tree-shakeable)
@primitiv-ui/web/tabs       → one component's classes
@primitiv-ui/web/define     → defines every element (side-effect import)
@primitiv-ui/web/define/tabs→ defines one component's elements
dist/primitiv-web.js        → prebuilt single ESM bundle, core inlined, for no-build stacks
```

- `package.json` lists `"sideEffects": ["./dist/define/**"]`, and every
  `exports` condition puts `"types"` first.
- `define` is idempotent (`customElements.get(name) ?? define`). It also
  accepts a prefix override for teams that need to rename the elements to run
  two versions side by side.
- **No-build consumers** (Spring Boot's `static/`, a CDN via jsDelivr from npm)
  use `<script type="module" src=".../primitiv-web.js">`. The bundle is built
  with the Vite/esbuild that is already in the toolchain. Per-module output
  uses `tsc`, like `packages/react`.

### 7.2 Versioning and release

- Both packages version **in lockstep** with the rest, through
  `scripts/bump-version.mjs`, never with a separate `0.0.1-alpha` line. The
  bump count in CLAUDE.md's command list grows accordingly.
- JSR's no-slow-types rule applies from the first commit (RELEASING.md §6).
- Both packages publish with `--access public --provenance` from `publish.yml`.

### 7.3 Size budget

The CI gate is `size-limit` (or an equivalent script) on the min+gzip size of
`define/tabs` *including the core it pulls in*. The opening target is **≤ 3 KB**,
to be confirmed once the first build exists and then held. The RFC also
records, without gating on it, the React path for comparison:
`@primitiv-ui/react` Tabs plus `react` and `react-dom`.

### 7.4 HTMX lab (in repo)

`apps/htmx-lab` is a static HTML + htmx page served by Vite. A tiny Vite
middleware stands in for the server's fragment endpoints, and Playwright drives
it in CI. Each case below is one Playwright test:

1. A full fragment swap (`hx-swap="outerHTML"`) brings in a new `<pv-tabs>`. It
   upgrades with correct ARIA and no script call.
2. `innerHTML` swap into one `<pv-tabs-content>` that contains a nested
   `<pv-tabs>`. The two instances stay independent.
3. An out-of-band swap appends a new trigger and panel. They join the existing
   set in DOM order and are reachable by keyboard.
4. An out-of-band swap changes only the root's `value` attribute. The
   selection follows.
5. `hx-preserve` moves the element. Each key press still fires exactly one
   handler.
6. History restore (`hx-push-url`, back button). The selection restored from
   the snapshot is the one the user left.
7. The lazy panel recipe (`hx-trigger="pv-tabs-show once"`) loads once.
8. `hx-trigger="pv-tabs-change"` on the root posts the new value, and
   `preventDefault` from an `hx-on` handler vetoes the change.
9. A swap during a key press, with focus inside the removed fragment, doesn't
   throw and doesn't leave a stuck listener.
10. RTL: arrow keys flip under `<html dir="rtl">`.

### 7.5 Spring Boot / Thymeleaf

This lives in a **separate repo** (`primitiv-ui/examples-spring`, or a personal
sandbox), not here. A JVM toolchain in this repo's CI would be a large standing
cost for one consumer. The package's job is to be stack-agnostic, and
`apps/htmx-lab` proves the HTMX behaviour without one. The Spring repo consumes
the published package exactly as a real user would, and records DX notes
against this RFC: Thymeleaf fragment ergonomics, attribute escaping, and
`th:attr` with kebab-case attributes.

## 8. The styled layer: registry `--target html`

The registry's `contract.json` is already framework-neutral. It names the root
element, every part's class, the modifiers and the `data-*` hooks. The `.tsx`
wrapper is the only React-specific file in a registry component. So the styled
story for web is:

- **`primitiv add tabs --target html`** copies `styles.css` (unchanged),
  `contract.json`, and a generated **`tabs.html` snippet**. The snippet is the
  §5.1 markup with every contract class applied and the pre-rendered ARIA from
  §5.5. It's plain HTML, so it pastes into Thymeleaf, ERB, Jinja or Blade.
  `primitiv.json` records the target, so later `add`s follow it.
- **Audit first.** Each registry stylesheet must be checked for assumptions
  about the element type before its component gets a web target. A custom
  element is `display: inline` with no UA styles, where `<button>` has a
  focusable box, `cursor`, and `font: inherit` resets. The Tabs audit is part
  of Phase 3 and decides whether those rules go in the stylesheet (which then
  works for both surfaces) or in a tiny `pv-*` base sheet.
- **Auto-wrapping.** The React wrapper wraps text nodes in
  `primitiv-tabs__trigger-label`. The HTML snippet writes that span out
  literally. The element does **not** rewrite consumer children.

Generating the snippet is CLI work in `crates/primitiv-cli`, under the Rust
rules (RFC 0007, 100% lines, regions and functions). The kitchen-sink and docs
site stay React. A **"Web" mode in the docs-site consumption switch**
(`docs/docs-site-planning.md`) is a follow-up, once the first few components
exist.

## 9. Open questions

1. **Core package name.** `@primitiv-ui/core` is the working name. It's
   unambiguous on npm, but "core" also appears in `harmoni-core`.
   `@primitiv-ui/behaviors` is the alternative.
2. **Tag prefix.** `pv-` (proposed) vs `primitiv-`. The second is unambiguous
   but long in templates, and easy to confuse with the class namespace.
3. **Links as tabs.** React supports `asChild` + `<Link>`. The candidate web
   equivalent: if a trigger's single child is an `<a href>`, the element moves
   the tab role and tabindex onto it. That needs its own decision, since
   it's the one place the element would touch consumer children.
4. **Snippet flavour.** Generic HTML only, or Thymeleaf/ERB/Jinja dialects with
   `th:each`-style loops? This RFC proposes generic only, and making dialects
   a demand-driven follow-up.
5. **Is `@primitiv-ui/web` added to the docs-site props extractor?** That
   would mean JSDoc on element classes to the docgen bar, mirroring
   `react-component-patterns` §9.

## 10. Rollout

| Phase | Work | Done when |
|---|---|---|
| 0 | This RFC accepted; open questions §9.1–2 answered | — |
| 1 | `@primitiv-ui/core` scaffolded; §4 steps 1–4 landed | React suites unchanged and green; core 100% coverage + 100% mutation |
| 2 | `@primitiv-ui/web` Tabs | Conformance suite green on both surfaces; web suite 100%; Stryker 100% |
| 3 | `apps/htmx-lab` + Playwright §7.4 cases; Tabs stylesheet audit | All ten cases green in CI; registry CSS renders the elements correctly |
| 4 | Distribution: entry points, bundle, size gate, lockstep release | Published; `<script type="module">` from jsDelivr works on a blank page |
| 5 | `primitiv add --target html` + snippet generation | Rust gate green; Tabs installs into a plain-HTML project |
| 6 | Next components, chosen for core reuse | — |

Phase 6 order, so each step reuses the core the previous one built:

1. RadioGroup, ToggleGroup, SegmentedControl (roving + keymap).
2. Accordion, Collapsible (`hidden` and the grid-row track pattern, no new
   core).
3. Modal and ConfirmDialog (native `<dialog>`; brings in `FOCUSABLE_SELECTOR`).
4. Popover, Tooltip, Dropdown (Popover API + anchor positioning).
5. Listbox, Select, Combobox (typeahead core, `ElementInternals` form
   association).

Each one follows the Definition of done in CLAUDE.md: tests, JSDoc, README,
the components-table row in `packages/web/README.md`, and the conformance
suite.

## 11. Decision record

| # | Decision | Why |
|---|---|---|
| D1 | Native custom elements, no element framework | The behaviour is already pure (core); the glue is small |
| D2 | Light DOM only | The cascade layers, mode inheritance and consumer CSS must reach the parts |
| D3 | Pure logic extracted to a published `@primitiv-ui/core` before any element is written | One copy of each keyboard/policy rule, and `tsc` + JSR need a real package boundary |
| D4 | Element names mirror React part names (`pv-tabs-trigger`, not `pv-tab`) | One contract, one vocabulary across docs, manifests and prop tables |
| D5 | Value pairing, never index pairing | Stable under conditional server rendering and partial swaps |
| D6 | `value` attribute reflected; no `default-value` | HTMX snapshots, `hx-include` and server re-renders see the live state |
| D7 | Controlled mode becomes a cancelable `pv-tabs-change` | One mode instead of two; reads naturally to HTMX and plain listeners |
| D8 | Direction from `:dir()`, no `dir` attribute | The HTML `dir` attribute is already the inheritable provider |
| D9 | `lazyMount` dropped; a `pv-tabs-show` event plus an HTMX recipe instead | On a server-driven page, lazy content is a fetch, not a deferred render |
| D10 | ARIA as attributes; `ElementInternals` only for form association | Inspectable, testable, server-pre-renderable |
| D11 | Lifecycle rules §5.4 (AbortController, registration, `closest()` scoping, microtask batch, observed attributes) | Each one fixes a real failure mode under HTMX swaps |
| D12 | Shared conformance suite run by both surfaces | The only mechanical guard against the two surfaces drifting apart |
| D13 | HTMX lab in repo; Spring Boot integration out of repo | Prove the behaviour cheaply in CI; keep the JVM out of this repo's toolchain |
| D14 | Lockstep versioning, npm + JSR, provenance | Same release path as every other package |
| D15 | Styled layer = `primitiv add --target html` over the unchanged `contract.json` + `styles.css` | The styling contract was framework-neutral all along |
