# RFC 0033 — Web components (`@primitiv-ui/web`) and a shared behaviour core (`@primitiv-ui/core`)

**Status:** Draft — proposed (2026-11-07). Package name and tag prefix settled
(D16, D17); framework neutrality settled (D19–D23); part model, styling
decoupling and CLI surface settled (D24–D27); event naming settled (D29); the
first increment is Tabs end to end, with `@primitiv-ui/react` Tabs rebuilt on
the web implementation (D30); the controller/host split (D28), the §6.3 golden
exception and the separate `onKeyDown` fix accepted 2026-11-07. Open: snippet
flavour (§9). Phase 1 in progress.
**Decision sought:** Ship Primitiv's headless behaviour as standard custom
elements that work **anywhere a browser runs HTML**: a plain HTML/CSS/JS page,
any server-rendered stack, React, Vue, Angular, Svelte or anything else. The
framework-independent logic comes out of `@primitiv-ui/react` into a shared
package **first**, so every surface runs the same keyboard and state rules. The
direction (§3.3) is that the web implementation becomes the library's base and
framework packages become thin adapters over it — delivered **one component at
a time, starting with Tabs**: in the release that ships it, `@primitiv-ui/react`
Tabs runs on the web implementation with no change a consumer can observe.

---

## 1. Why

Today, using Primitiv means using React. The design system itself (tokens,
registry stylesheets, the `contract.json` styling contract, Figma) has no React
dependency at all. Only the behaviour layer does: keyboard models, ARIA wiring,
roving focus, controlled state. A team on Vue, Angular, Svelte, a
server-rendered stack or a hand-written page can already use the token layer
and the registry CSS. What it cannot get is a tablist that behaves correctly.

Custom elements are the one component model every one of those environments
already understands, because it is the browser's own:

- **They are a platform standard, not a library.** No framework has to know
  about them, and every major framework can render them, bind their
  properties, and listen to their events (§5.6).
- **They upgrade themselves.** The browser runs `connectedCallback` whenever an
  element enters the document, however it got there: parsed HTML, a framework
  render, an HTMX swap, `innerHTML`, a history restore. There is no hydration
  step to wire up.
- **They live in the light DOM**, so the existing styling contract (root class,
  modifier classes, `data-*` state, `--primitiv-*` custom properties, RFC 0004
  §3) and the `@layer primitiv.*` cascade (RFC 0008) apply unchanged.
- **They cost almost nothing to ship.** No runtime, no virtual DOM. A component
  is a few kilobytes of event handling over markup someone else rendered.

The opening proposal for this work (an external draft written without access
to this repo) converted Tabs to an index-based `<pv-tabs>` with its own keyboard
code, aimed at one server-side stack. That would have produced a *second,
smaller* Tabs: no `value` pairing, no `aria-controls`, no disabled tabs, no
manual activation, no RTL. It would also have reimplemented logic the React
package already holds as pure functions. This RFC keeps that draft's good calls
— native custom elements, no Lit, light DOM, a `data-*` styling contract — and
replaces the rest. The stack it named (Spring Boot, Thymeleaf, HTMX) is one
consumer among many here, not a target the design bends towards.

## 2. Goals and non-goals

**Goals**

1. **Usable anywhere, with no technology assumed.** The same elements work in:
   - a plain HTML/CSS/JS page with no build step (one `<script type="module">`);
   - any server-rendered or hypermedia stack (HTMX, Hotwire, Rails, Django,
     Laravel, Spring …);
   - a React project that prefers elements over `@primitiv-ui/react`;
   - Vue, Angular, Svelte, Solid or any other framework.
2. **One behavioural contract per component**, whichever surface delivers it.
3. **Pure, framework-free logic lives once**, in `@primitiv-ui/core`.
4. **Framework rendering is safe.** An element never fights the framework that
   rendered it (§5.6), and it never assumes that framework exists.
5. **The existing registry stylesheets style the elements**, gaining only the
   one wrapper rule in §5.6.1.
6. **No dead ends for §3.3.** Every choice in this RFC keeps open the path to
   elements as the base with framework adapters on top.

**Non-goals (v1)**

- **Shadow DOM.** It would cut the components off from the cascade layers, the
  `data-theme` / `data-density` inheritance (RFC 0009), and consumer CSS. Light
  DOM is the whole point.
- **Lit, Stencil, or any element framework.** The core is already pure. The
  per-element glue is small enough that a framework would cost more than it
  saves, and a runtime dependency would contradict goal 1.
- **Wrapping React in custom elements.** That would make every consumer ship
  React.
- **Rebuilding React components other than Tabs in this increment.** Each one
  follows the same path afterwards, one at a time (§10).
- **Vue, Angular or Svelte adapter packages in this increment.** Typings for
  each framework ship in `@primitiv-ui/web` (§5.6.4). The React adapter lives
  inside `@primitiv-ui/react` itself, so no new React package is needed.
- **New visual design.** Custom elements add no visual surface. They render the
  same anatomy, so nothing goes to Figma. (The "Figma first" rule in CLAUDE.md
  is about composite *designs*; it does not apply here.)
- **Any one consumer's stack in this repo** (a Spring Boot app, an Angular
  workspace's full toolchain …). See §7.5.

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
React state. `<primitiv-tabs>` calls the same function and applies the outcome to
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

### 3.3 The direction: the web implementation as the base, delivered incrementally

The diagram above is the starting point: core feeds two sibling surfaces. The
direction this RFC sets is:

```text
@primitiv-ui/core   pure logic
        │
@primitiv-ui/web    the implementation: DOM behaviour, lifecycle, ARIA
        │
adapters            @primitiv-ui/react, and later vue / angular / …
                    typed props, framework events, framework state,
                    SSR pre-rendering — no behaviour of their own
```

**It is delivered per component, not as a big-bang rewrite (D30).** Tabs goes
first and goes all the way: core, the web implementation, the elements, *and*
`@primitiv-ui/react` Tabs rebuilt as an adapter over it. In the release that
ships it, a React consumer sees no difference in API, behaviour, rendered DOM
or server-rendered markup. That release is the test that proves the plan: if
Tabs can move under an unchanged React API, every other component can follow
the same path, one at a time, and each move is independently shippable.

The design choices that make this possible, each enforced elsewhere in the RFC:

1. **All behaviour and policy live in core** (§3.1). An adapter can compute, at
   render time, exactly the state the web implementation would set, which is
   what keeps server-rendered markup unchanged.
2. **The web implementation never restructures the DOM** (§5.6.1), so React can
   own every node.
3. **It can attach to DOM it did not render** (§3.4), so React keeps rendering
   the same elements it renders today.
4. **The conformance suite** (§6.2) runs against the elements and against React,
   so the same contract is proved on both.

How the questions that move raises are answered for Tabs:

| Question | Answer for Tabs |
|---|---|
| **React 18** | The adapter renders native elements, attaches with a ref and listens with `addEventListener`, so it needs nothing React 19 added. React 18 support stays. |
| **`asChild`** | Stays a React feature: `Slot` renders the consumer's element, and the adapter registers whatever `Slot` rendered as the trigger. |
| **`DirectionProvider`** | The adapter resolves `dir` exactly as today and hands it to the implementation. |
| **`lazyMount`** | Stays an adapter feature: React simply doesn't render a panel's children until it has been active. The elements surface drops it (D9). |
| **Imperative API** | `setActiveTab` sets adapter state, as today. |
| **Events** | The adapter maps `primitiv-tabs-change` onto the existing `onValueChange(value)` and `onChange({ index, name })` (D29). |
| **Tests** | The 14 existing Tabs test files are the acceptance test and must pass **unmodified** (§6.3). |
| **Cost** | Bundle size of React Tabs before and after, recorded in the release notes (§7.3). |

### 3.4 Controllers and hosts (D28)

**The problem.** "React Tabs uses the web component", read literally, means
React renders `<primitiv-tabs>`, `<primitiv-tabs-list>` and so on. That
cannot satisfy "no difference a consumer can observe":

- **Tag names change.** Consumer CSS or tests targeting `div[role="tablist"]`
  or `[role="tablist"] > button` stop matching.
- **Default layout changes.** A custom element is `display: inline` and a `<div>`
  is `block`. A headless React consumer who ships their own CSS would see the
  root, list and panels collapse to inline boxes, and an extra box around every
  trigger. The only fix is a default stylesheet from the implementation, which
  D25 forbids.
- **Ref element types widen** from `HTMLDivElement` to the element class.

**The proposal.** Split `@primitiv-ui/web` in two layers:

- A **controller** per component (`TabsController`) holds the entire DOM
  behaviour: listeners, keyboard (through core), focus, the DOM-ordered
  collection of parts, ARIA reconciliation, and the lifecycle rules in §5.4. It
  attaches to **any** elements it is handed. Parts *register* with it, the same
  shape as `useCollection` today, so it never has to guess which nodes are
  parts.
- A **host** decides where the elements come from and who owns the state:
  - **The custom elements** (`<primitiv-tabs>` …) are a host. A few lines each:
    create the controller on connect, register parts, keep state in reflected
    attributes, dispose on disconnect. This is the elements surface.
  - **The React adapter** is a host. It renders exactly today's DOM (`<div>`,
    `<button role="tab">`, `<div role="tabpanel">`), creates a
    `TabsController` on the root in a layout effect, registers each part by
    ref, and keeps state in React.

Both surfaces then run **the same behavioural code**, not merely the same
pure functions. That is what "the React package uses the web implementation"
means in this RFC. Nothing about the elements surface changes: the custom
elements are still the public face of `@primitiv-ui/web`, and they still
follow every rule above.

**State ownership.** The controller never owns state. It computes an outcome
(through core) and asks its host to apply it:

- the elements host writes reflected attributes and dispatches
  `primitiv-tabs-change`;
- the React host calls `setState` (or `onValueChange` when controlled), and
  React renders the new attributes.

Because React also renders every state attribute (it has to, for server
rendering), the controller writes only what its host does not render, and
compares before it writes, so the two can never fight.

**The alternative**, if literal custom elements in React's output are a
requirement: render the elements and relax D25 so the implementation ships a
lowest-priority default stylesheet (`display: block` for structural parts,
`display: contents` for wrappers). That still changes tag names and the DOM
shape, so it would be a breaking change for any consumer whose CSS or tests
select by element, and it could not ship as "no difference".

## 4. The extraction (React side)## 4. The extraction (React side)

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
| `Tabs.Root` | `<primitiv-tabs>` | state owner |
| `Tabs.List` | `<primitiv-tabs-list>` | `tablist` |
| `Tabs.Trigger` | `<primitiv-tabs-trigger>` + your `<button>` / `<a>` | `tab` (on the child) |
| `Tabs.Content` | `<primitiv-tabs-content>` | `tabpanel` |

```html
<primitiv-tabs value="overview" class="primitiv-tabs primitiv-tabs--md">
  <primitiv-tabs-list label="Account sections" class="primitiv-tabs__list">
    <primitiv-tabs-trigger value="overview">
      <button type="button" class="primitiv-tabs__trigger">
        <span class="primitiv-tabs__trigger-label">Overview</span>
      </button>
    </primitiv-tabs-trigger>
    <primitiv-tabs-trigger value="billing" disabled>
      <button type="button" class="primitiv-tabs__trigger">
        <span class="primitiv-tabs__trigger-label">Billing</span>
      </button>
    </primitiv-tabs-trigger>
  </primitiv-tabs-list>
  <primitiv-tabs-content value="overview" class="primitiv-tabs__panel">…</primitiv-tabs-content>
  <primitiv-tabs-content value="billing" class="primitiv-tabs__panel" hidden>…</primitiv-tabs-content>
</primitiv-tabs>
```

**Two kinds of part (D24).** This is how `asChild` translates:

- **Structural parts** (root, list, content, panel) *are* their element.
  `role`, ARIA and `data-*` are written on the custom element itself.
- **Interactive parts** (triggers, items, links, close buttons) *decorate
  exactly one interactive child* that the consumer writes: a `<button>`, an
  `<a href>`, or whatever a framework router renders (`<Link>`, `<RouterLink>`,
  `<a routerLink>`). The part's contract attributes go on that child, so the
  rendered DOM is the same as React's `<button role="tab">`. The wrapper
  itself carries only its own inputs (`value`, `disabled`).

There is no default element and no `as-child` switch, because the child is
*always* the consumer's choice. That is `asChild` with nothing left to opt
into. React's Slot rules carry over unchanged:

| Slot rule (React) | Element equivalent |
|---|---|
| Child handlers run first, then the part's | The browser's bubbling order already does this: the child's listener fires, then the wrapper's |
| `className` is concatenated | Classes are the consumer's, written on the child; the part never writes `class` (D20) |
| Part props are the fallback, child props win | Part-owned attributes (`role`, `aria-*`, roving `tabindex`, `data-state`) are written on the child; a consumer `id` is kept |
| Refs compose | Not applicable: the consumer already holds the child |

Two rules complete it:

- **Native semantics come free.** Because the child is a real `<button>` or
  `<a>`, Enter/Space activation, focus, `cursor` and the UA resets the registry
  stylesheets were written against all behave exactly as on the React surface.
  This removes the stylesheet audit an element-as-button model would need.
- **Misuse is reported, not thrown.** An interactive part with no element child,
  or more than one, logs one `console.error` naming the part and does nothing
  else. React throws for the equivalent misuse, but a server-rendered page has
  no error boundary to catch a throw.

**Disabled tabs** keep React's contract: the child gets `aria-disabled` and
`data-disabled`, not the native `disabled` attribute, because arrow keys must
still land on a disabled tab.

**Prefix `primitiv-` (D17).** The tag names share the namespace of the
`primitiv-` *class* contract, which stays the styling contract: a tag is a type
selector, a class is a class selector, and they never collide in CSS. Markup
reads `<primitiv-tabs class="primitiv-tabs">`, which is redundant-looking but
deliberate: the element supplies behaviour and the class opts into the
registry look, exactly as the React primitive and the styled wrapper stay
separate. The headless element applies **no classes and no styles**. `define`
keeps a prefix override (§7.1) for teams running two versions side by side.

### 5.2 Attribute and property contract

| Attribute (reflected) | Property | Maps to React |
|---|---|---|
| `value` on `<primitiv-tabs>` | `.value` | `value` / `defaultValue` |
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
  `primitiv-tabs-change` (`bubbles: true`, `cancelable: true`,
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
  `<primitiv-tabs-content value="reports" hx-get="/reports" hx-trigger="primitiv-tabs-show once">`.
  The element fires a non-cancelable `primitiv-tabs-show` on the panel that becomes
  active, so that recipe has an event to hang off.
- **The imperative API** is the `.value` setter, the equivalent of
  `setActiveTab`.

### 5.3 ARIA the element owns

| Element | What it sets |
|---|---|
| list | `role="tablist"`; `aria-orientation`; `aria-label` from `label` |
| trigger's child | `role="tab"`; `id`; `aria-selected`; `aria-controls`; `aria-disabled`; `data-disabled`; `data-state`; `data-orientation`; roving `tabindex` from `tabsTabStop` |
| content | `role="tabpanel"`; `aria-labelledby`; `tabindex="0"`; `hidden` when inactive |
| structural parts | `data-state` and `data-orientation` |

- **Ids** are `deriveId(rootId, "trigger"|"panel", value)`. `rootId` is the
  root's own `id` if present, or a generated one otherwise. Ids the server
  rendered are never overwritten.
- **ARIA is set as attributes, not through `ElementInternals`.** Attributes are
  inspectable, work with Testing Library and jsdom, and let the server
  pre-render the same output (§5.5). `ElementInternals` comes in only where it
  is the sole mechanism, which is form association (`formAssociated`) for
  Select, Checkbox and Switch later.
- **The trigger's child is the tab** (D24, §5.1). Links as tabs need nothing
  special: an `<a href>` child is decorated the same way as a `<button>`.
  Keyboard handling is attached to the wrapper and reaches the child by
  bubbling, so swapping the child (a framework re-render, an HTMX swap) never
  leaves a listener behind on the old one.

### 5.4 Lifecycle: the part the draft got wrong

Six rules, each one driven by a test:

1. **Listeners attach through an `AbortController` per connection.**
   `disconnectedCallback` aborts it. Moving the element (`hx-preserve`, DOM
   reparenting) can therefore never stack handlers.
2. **Children register with their owner, and the owner never queries once and
   caches.** Each part registers on connect with
   `this.closest('primitiv-tabs')` and unregisters on disconnect. The root keeps the
   collection in DOM order (`compareDocumentPosition`, as `useCollection` does
   via its sort). Fragments swapped into the middle of a tab set therefore
   join it.
3. **The upgrade order doesn't matter.** A part that connects before its root
   is defined registers when the root upgrades: the root adopts parts whose
   nearest `primitiv-tabs` is itself. A root that connects before its children are
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

### 5.6 Working inside frameworks

These rules make the element safe to render from any framework, and they are
the same rules a plain HTML page needs.

#### 5.6.1 DOM ownership

**An element never creates, moves or removes nodes it did not create.** It
only writes attributes on itself and on the parts it owns, and it only writes
the attributes in its contract (§5.3). Frameworks reconcile the nodes and the
attributes *they* rendered; an element that also moves children or rewrites
consumer attributes corrupts that reconciliation (React and Vue both lose
track of a moved node). Three consequences:

- No rendering, no templating, no wrapping of text nodes (the React wrapper's
  `primitiv-tabs__trigger-label` span is written by the consumer, §8).
- No `class` writes. Classes belong to the consumer and, through them, to the
  registry styling.
- A consumer-supplied `id` is never replaced (§5.3).

**No styles from the implementation, at all (D25).** Element code writes no
inline `style`, injects no stylesheet, and adopts no constructed stylesheet.
Behaviour never depends on layout. The one structural rule the wrapper model
wants, that an interactive part's wrapper takes no box of its own, is a
stylesheet concern and ships as one:

```css
@layer primitiv.reset {
  :where(primitiv-tabs-trigger, primitiv-modal-trigger /* … every interactive part */) {
    display: contents;
  }
}
```

- **Styled consumers** get it from each component's registry `styles.css`, so it
  arrives with the component that needs it.
- **Headless consumers** who load no registry CSS can opt into
  `@primitiv-ui/web/elements.css`, a separate file that holds only these
  rules. The JS never imports it.
- **Without it, everything still works.** The wrapper is an inline box around
  its child, which may change how a flex or grid parent lays the child out, and
  which the consumer is free to style as they like.
- `:where()` keeps the rule at zero specificity, and the `reset` sublayer keeps
  it beneath every consumer rule (RFC 0008). Being CSS rather than script, it
  also applies **before** the module loads, so the page lays out correctly
  before upgrade.
- `display: contents` historically stripped semantics from the element it is
  set on. The wrapper has no role, and the child it would affect keeps its own,
  so that bug does not apply.

#### 5.6.2 Import and SSR safety

Server renderers (Next.js, Nuxt, Angular SSR, SvelteKit, Astro) import modules
in a runtime with no DOM. `class X extends HTMLElement` throws there at import
time. So:

- Element modules evaluate safely without a DOM (the base class falls back
  when `HTMLElement` is absent), and `define` is a no-op when
  `customElements` is undefined.
- Server output is just the light-DOM markup, which §5.5 already makes correct
  before upgrade.

#### 5.6.3 Binding properties, attributes and events

Every piece of state is reachable as **both** a reflected attribute and a
property, and every notification is a DOM event with a lowercase kebab-case
name. That is the one combination every framework binds without help:

| Framework | Set the value | Listen for a change |
|---|---|---|
| Plain HTML / JS | `value="billing"` or `el.value = "billing"` | `el.addEventListener("primitiv-tabs-change", …)` |
| React 19 (raw elements) | `<primitiv-tabs value={v}>` | `onprimitiv-tabs-change={…}` (see below) |
| Vue 3 | `:value="v"` | `@primitiv-tabs-change="…"` |
| Angular | `[value]="v"` | `(primitiv-tabs-change)="…"` |
| Svelte 5 | `value={v}` | `onprimitiv-tabs-change={…}` |

The interop lab (§7.4) verifies the plain, React, Vue and Angular rows.

**Why the React row reads `onprimitiv-tabs-change` (D29).** For a custom
element, React 19 strips `on` from a function prop and passes the rest to
`addEventListener` **exactly as written** (verified in `react-dom` 19.2.5's
`setPropOnCustomElement`): no camelCase-to-kebab conversion and no
lowercasing. So `onTabsChange` would listen for an event literally named
`TabsChange`. Naming the DOM event `TabsChange` instead would break every
listener attached through an HTML attribute, because the HTML parser lowercases
attribute names (`hx-on:TabsChange` becomes `hx-on:tabschange`, as do Vue and
Alpine `@…` in in-DOM templates). No single event name reads idiomatically in
React and also works in HTML, so:

- DOM events stay lowercase kebab-case, prefixed with the component's tag name
  (`primitiv-tabs-change`, not a shorter `primitiv-change`), so a listener
  names the component it is for.
- Idiomatic framework names come from **adapters**, which reuse the existing
  React prop names (`onValueChange`, `onChange`) rather than inventing new
  ones like `onTabsChange`. Moving between `@primitiv-ui/react` and the
  elements therefore never renames a handler.
- Raw elements inside React remain possible, with the raw event name, as an
  escape hatch.

Controlled usage in every framework is the same pattern: bind `value`, and in
the change handler either let the change through or call `preventDefault()`
and set your own value (D7). Rich data never travels through attributes; it is
set through properties, so no framework has to serialise it.

#### 5.6.4 Types and tooling

`@primitiv-ui/web` ships, with no runtime cost:

- `HTMLElementTagNameMap` declarations, so `document.querySelector
  ("primitiv-tabs")` is typed in any TypeScript project.
- A **Custom Elements Manifest** (`custom-elements.json`), the community
  standard most tooling reads: VS Code HTML completion, Storybook, JetBrains,
  framework type generators. It is generated from the element classes' JSDoc
  at build time, which also makes it the natural input for the docs-site props
  extractor (D18) and for RFC 0020's agent manifest.
- Opt-in typing entry points for React 19 JSX, Vue `GlobalComponents` and
  Svelte, so `<primitiv-tabs>` type-checks in templates. Angular needs only
  `CUSTOM_ELEMENTS_SCHEMA`, which the README documents.

### 5.7 The React adapter for Tabs

What `@primitiv-ui/react` Tabs becomes, with its public API untouched:

- **Rendering is unchanged.** The same elements, attributes, ids and `data-*`
  values, on the server and on the client. The adapter computes them through
  core, exactly as the hooks do today.
- **Behaviour moves out of the hooks.** `useTabsTrigger`'s keydown and
  activation handling and `useTabsRoot`'s trigger registry are replaced by a
  `TabsController` attached to the root. `useRovingTabindex` is no longer used
  by Tabs; the ten other components that use it are untouched.
- **Handler ordering is preserved, and the reason is worth knowing.** Today
  the library's activation runs *before* a consumer's `onClick`, with no
  `preventDefault` veto (the comment in `useTabsTrigger.ts`). The controller
  listens natively on the Tabs root, and React's synthetic events are
  delegated from the React root container *above* it, so a native listener on
  the Tabs root fires first. The order falls out of the DOM.
- **A divergence the move surfaces.** Today a consumer `onKeyDown` on
  `Tabs.Trigger` *replaces* the library's keyboard handler, because `...rest`
  is spread after `onKeyDown` in `Tabs.tsx`, so passing one disables arrow-key
  navigation. A native controller listener cannot be replaced that way. This is
  almost certainly a latent bug rather than a contract, but "no observable
  difference" means it is decided explicitly, in its own cycle, before the move:
  either keep it (the adapter suppresses the controller when a consumer
  `onKeyDown` is present) or fix it in a release of its own first. Decided 2026-11-07:
  fix it first, in its own release, so the move itself changes nothing.
- **Event mapping.** `primitiv-tabs-change` maps to `onValueChange(value)` and
  `onChange({ index, name })`, the names Tabs already uses (D29).
- **Dependencies.** `@primitiv-ui/react` gains `@primitiv-ui/web` and
  `@primitiv-ui/core` as dependencies, both lockstep-versioned, and its
  `jsr.json` gains the matching imports.

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

### 6.3 The acceptance test for the React move

The move is proved when, on the same commit:

1. **All 14 existing Tabs test files pass without a single edit.** Any edit
   to a React Tabs test during the move is, by definition, an observable
   change, and is either reverted or split out as its own decided change
   (as with the `onKeyDown` divergence, §5.7).
2. **Tabs keeps 100% mutation score** on the allowlist (it is on it today).
3. **The conformance suite passes on both surfaces.**
4. **Server-rendered markup is byte-identical** before and after.

Point 4 needs a decision. The strict red-green rule forbids a test that passes
on first run, and a "markup is unchanged" golden captured before the move does
exactly that. It is still the only direct check of server-rendered output,
because no existing Tabs test renders to a string. Accepted 2026-11-07: it is allowed as a
named exception (a refactor guard, written before the refactor, deleted after
one release), rather than relying on the existing suites to notice.

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
- **No-build consumers** (a static folder, or a CDN via jsDelivr from npm)
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

### 7.4 The interop lab (in repo)

`apps/interop-lab/` holds one small app per environment, each rendering the
same Tabs scenarios and each driven by the **same** Playwright spec:

| App | What it proves |
|---|---|
| `html` | No build step; the CDN bundle on a blank page |
| `htmx` | Elements under server-driven fragment swaps (cases below) |
| `react` | React 19 rendering, property binding, events, StrictMode double-mount |
| `vue` | Vue 3 templates, `:value` / `@event`, `v-if` mount and unmount |
| `angular` | `CUSTOM_ELEMENTS_SCHEMA`, `[value]` / `(event)`, change detection |

Each app sits outside the pnpm workspace with its own lockfile, as
`apps/docs-site` does, so one framework's toolchain never enters another's
resolution. The lab runs in its own CI workflow, triggered by changes to
`packages/core` or `packages/web`. Svelte and Solid follow on demand.

The shared scenarios are the Tabs keyboard and ARIA contract (the conformance
cases, now in a real browser), plus `:dir()` and focus-visible, which jsdom
cannot prove.

The `htmx` app adds the swap cases, one Playwright test each. They are the
most demanding test of the §5.4 lifecycle rules, because nothing re-renders the
elements on HTMX's behalf:

1. A full fragment swap (`hx-swap="outerHTML"`) brings in a new
   `<primitiv-tabs>`. It upgrades with correct ARIA and no script call.
2. `innerHTML` swap into one `<primitiv-tabs-content>` that contains a nested
   `<primitiv-tabs>`. The two instances stay independent.
3. An out-of-band swap appends a new trigger and panel. They join the existing
   set in DOM order and are reachable by keyboard.
4. An out-of-band swap changes only the root's `value` attribute. The
   selection follows.
5. `hx-preserve` moves the element. Each key press still fires exactly one
   handler.
6. History restore (`hx-push-url`, back button). The selection restored from
   the snapshot is the one the user left.
7. The lazy panel recipe (`hx-trigger="primitiv-tabs-show once"`) loads once.
8. `hx-trigger="primitiv-tabs-change"` on the root posts the new value, and
   `preventDefault` from an `hx-on` handler vetoes the change.
9. A swap during a key press, with focus inside the removed fragment, doesn't
   throw and doesn't leave a stuck listener.
10. RTL: arrow keys flip under `<html dir="rtl">`.

### 7.5 Real-world stacks live outside this repo

A full consumer stack (Spring Boot + Thymeleaf, a Rails app, an Nx Angular
workspace) is a large standing CI cost for one consumer, and it would tempt the
design towards that stack. They live in separate example repos, consume the
published packages exactly as a user would, and record DX notes against this
RFC. The interop lab is what gates releases.

## 8. The styled layer and the CLI

The registry's `contract.json` is already framework-neutral. It names the root
element, every part's class, the modifiers and the `data-*` hooks. The `.tsx`
wrapper and the cva recipe are the only React-specific files in a registry
component, so an elements install is the same component minus those, plus a
markup snippet.

### 8.1 What an elements install copies

- **`styles.css`** (or `.scss` / Tailwind, per `--format`), unchanged apart from
  the §5.6.1 `display: contents` rule each component gains.
- **`contract.json`**, as today.
- **A `tabs.html` snippet.** The §5.1 markup with every contract class applied
  and the pre-rendered ARIA from §5.5. It is plain HTML, so it pastes into any
  template language, and Vue, Angular and Svelte templates take it nearly
  verbatim. It is **copied into the project as an editable file**, the
  elements-side equivalent of the tsx wrapper the consumer owns, and is tracked
  in `primitiv.lock` like every other copied file.
- **Generated, not hand-written.** Snippets are generated from `contract.json`
  when the registry is built, committed, and embedded in the CLI, the same way
  `tabs.tsx` is generated from the contract today. The CLI stays a copier, and
  every snippet change shows up as a reviewable diff.

### 8.2 CLI changes (D26)

The vocabulary is a **surface**, not a framework (D27): a Vue, Angular or plain
HTML project installing elements is choosing the elements surface, and calling
that `framework: "html"` would be wrong for every one of them.

| Area | Change |
|---|---|
| **Config** | `primitiv.json` gains `surface: "react" \| "elements"`. `framework` is still **read** as an alias (`framework: "react"` means `surface: "react"`), so every existing config keeps working unchanged; `init` writes `surface` from now on. |
| **`init`** | `--surface <react\|elements>` plus a prompt. The default is `react` when `package.json` lists a `react` dependency, and `elements` otherwise (Vue, Angular, Svelte, a server-rendered project, or no `package.json` at all). |
| **`add`** | `--surface` as a per-run override, the way `--format` overrides the config today. A component with no elements surface yet fails clearly: *"modal has no elements surface yet"*. |
| **Registry schema** | The React-specific keys move under a per-surface block: `surfaces.react: { packages: [@primitiv-ui/react, class-variance-authority], files: [tabs.tsx, tabs.recipe.ts] }` and `surfaces.elements: { packages: [@primitiv-ui/web], files: [tabs.html] }`. `styles.formats` and `contract` stay shared. Components with no behaviour carry an `elements` block with no package (§8.3). `registry.json`'s schema version bumps. |
| **Package install** | With a `package.json`, `@primitiv-ui/web` installs through the detected package manager. Without one, nothing is installed and the CLI prints a version-pinned `<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/primitiv-web.js">`. Copying the bundle into the project (`--vendor <dir>`) is a later addition, because embedding it would tie the Rust build to the JS build. |
| **Wiring** | The tsx barrel and the stylesheet self-import line are React-only. For elements the CLI keeps `components/index.css`, an `@import` per installed component, so a page needs one `<link>`. It prints the `<link>` and `<script>` lines rather than editing a layout it cannot reliably find. |
| **Default path** | `src/components` for React, as today; `primitiv/` for elements, overridable with `--path` and recorded in the config. |
| **`list`** | Gains a column showing which surfaces each component supports. |

All of it is built behind the existing ports and adapters, under the Rust gate
(RFC 0007: 100% lines, regions and functions), with golden files for the
snippets.

### 8.3 Components with no behaviour

Button, Badge, Tag, Kbd, Card, Avatar and the prose family need no custom
element on the elements surface. The class contract on native markup *is* the
whole component (`<a class="primitiv-button primitiv-button--primary">`), which
is also React's `asChild` case for them. They get an elements install (styles,
contract, snippet) with no package dependency. That makes them a cheap early
milestone: they exercise the whole CLI and snippet pipeline before any element
code is needed (Phase 2b, §10).

The kitchen-sink and docs site stay React for now. A **"Web" mode in the
docs-site consumption switch** (`docs/docs-site-planning.md`) is a follow-up,
fed by the Custom Elements Manifest (§5.6.4, D18).

## 9. Open questions

**Settled 2026-11-07:**

- the core package is `@primitiv-ui/core` (D16);
- the tag prefix is `primitiv-` (D17);
- `@primitiv-ui/web` joins the docs-site props extractor after the experiment
  (D18);
- framework neutrality and the elements-as-base direction (D19–D23);
- the part model that replaces `asChild` (D24);
- no styles from the implementation (D25);
- the CLI's `surface` vocabulary and changes (D26, D27);
- snippets are copied into the project as editable files (§8.1).

Still open:

1. **Snippet flavour.** Generic HTML only, or per-environment flavours (JSX for
   a React project using elements, template-language loops)? This RFC proposes
   generic HTML only, with flavours a demand-driven follow-up.

## 10. Rollout

| Phase | Work | Done when |
|---|---|---|
| 0 | This RFC accepted, including D28 and §6.3's exception | Done 2026-11-07 |
| 1 | `@primitiv-ui/core` scaffolded; §4 steps 1–4 landed | React suites unchanged and green; core 100% coverage + 100% mutation |
| 2 | `@primitiv-ui/web` Tabs: `TabsController` and the element host | Conformance suite green on both surfaces; web suite 100%; Stryker 100% |
| 3 | The `onKeyDown` divergence decided and, if fixed, released on its own (§5.7) | — |
| 4 | **`@primitiv-ui/react` Tabs rebuilt as an adapter over `TabsController`** | §6.3's four checks green on one commit |
| 5 | Distribution: entry points, bundle, CEM + framework typings, size gate, lockstep release with `@primitiv-ui/react` depending on core and web | **The proof release:** published, React Tabs consumers see no change, elements work from jsDelivr on a blank page |
| 6 | `apps/interop-lab` (html, htmx, react, vue, angular) + Playwright | Shared spec and the ten HTMX cases green in CI |
| 7 | CLI: `surfaces` registry schema, snippet generation, `--surface`; components with no behaviour first (§8.3), then Tabs | `primitiv add tabs --surface elements` works in every interop-lab app; Rust gate green |
| 8 | Next components, one at a time, each through phases 2–5 | — |

Phase 8 order, so each step reuses the core the previous one built:

1. RadioGroup, ToggleGroup, SegmentedControl (roving + keymap).
2. Accordion, Collapsible (`hidden` and the grid-row track pattern, no new
   core).
3. Modal and ConfirmDialog (native `<dialog>`; brings in `FOCUSABLE_SELECTOR`).
4. Popover, Tooltip, Dropdown (Popover API + anchor positioning).
5. Listbox, Select, Combobox (typeahead core, `ElementInternals` form
   association).

Each one moves its React component onto the web implementation in the same
increment, under the same §6.3 checks, and follows the Definition of done in
CLAUDE.md: tests, JSDoc, README, the components-table row in
`packages/web/README.md`, and the conformance suite.

## 11. Decision record

| # | Decision | Why |
|---|---|---|
| D1 | Native custom elements, no element framework | The behaviour is already pure (core); the glue is small |
| D2 | Light DOM only | The cascade layers, mode inheritance and consumer CSS must reach the parts |
| D3 | Pure logic extracted to a published `@primitiv-ui/core` before any element is written | One copy of each keyboard/policy rule, and `tsc` + JSR need a real package boundary |
| D4 | Element names mirror React part names (`primitiv-tabs-trigger`, not `primitiv-tab`) | One contract, one vocabulary across docs, manifests and prop tables |
| D5 | Value pairing, never index pairing | Stable under conditional server rendering and partial swaps |
| D6 | `value` attribute reflected; no `default-value` | HTMX snapshots, `hx-include` and server re-renders see the live state |
| D7 | Controlled mode becomes a cancelable `primitiv-tabs-change` | One mode instead of two; reads naturally to HTMX and plain listeners |
| D8 | Direction from `:dir()`, no `dir` attribute | The HTML `dir` attribute is already the inheritable provider |
| D9 | `lazyMount` dropped; a `primitiv-tabs-show` event plus an HTMX recipe instead | On a server-driven page, lazy content is a fetch, not a deferred render |
| D10 | ARIA as attributes; `ElementInternals` only for form association | Inspectable, testable, server-pre-renderable |
| D11 | Lifecycle rules §5.4 (AbortController, registration, `closest()` scoping, microtask batch, observed attributes) | Each one fixes a real failure mode under HTMX swaps |
| D12 | Shared conformance suite run by both surfaces | The only mechanical guard against the two surfaces drifting apart |
| D13 | Interop lab in repo (html, htmx, react, vue, angular); full consumer stacks out of repo | Prove portability in CI without adopting any one consumer's toolchain |
| D14 | Lockstep versioning, npm + JSR, provenance | Same release path as every other package |
| D15 | Styled layer = `primitiv add` for elements over the unchanged `contract.json` + `styles.css` | The styling contract was framework-neutral all along |
| D16 | Shared package named `@primitiv-ui/core` | Settled 2026-11-07 |
| D17 | Tag prefix `primitiv-` | Settled 2026-11-07; one namespace across tags, classes and custom properties |
| D18 | Docs-site props extractor gains `@primitiv-ui/web` after the experiment | It must read every surface package eventually; not needed to prove the behaviour |
| D19 | Framework neutrality is a goal: plain HTML, server stacks, React, Vue, Angular and others are all first-class | Settled 2026-11-07; the elements must assume no technology |
| D20 | Elements never create, move or remove nodes they did not create, and never write `class` | Frameworks own the nodes they render (§5.6.1) |
| D21 | Element modules are safe to import without a DOM; `define` is a no-op there | SSR frameworks import modules on the server (§5.6.2) |
| D22 | State is attribute + property; notifications are lowercase kebab-case DOM events; typings and a Custom Elements Manifest ship with the package | The one combination every framework binds without help (§5.6.3–4) |
| D23 | Direction: the web implementation becomes the base and framework packages become adapters (§3.3) | Settled 2026-11-07; delivered per component under D30 |
| D24 | Structural parts are their element; interactive parts decorate exactly one consumer-written child, replacing `asChild` | Same DOM as React, native button/link semantics, and framework routers work unchanged |
| D25 | Element code writes no styles of any kind; the `display: contents` wrapper rule ships as CSS in each registry stylesheet and in an opt-in `elements.css` | Styling stays completely decoupled from the implementation (settled 2026-11-07) |
| D26 | CLI: `surface` config + `--surface` on `init` and `add`; per-surface registry blocks; CDN tag printed when there is no `package.json`; `components/index.css` aggregator | Elements installs without assuming a package manager or a framework |
| D27 | The vocabulary is `surface: "react" \| "elements"`; `framework` stays readable as an alias | A Vue or plain-HTML project installing elements is not choosing a framework called "html" |
| D28 | `@primitiv-ui/web` splits into per-component controllers (all DOM behaviour, attachable to any registered elements, never owning state) and hosts (the custom elements; the React adapter) | The only way React can run the web implementation while rendering today's DOM unchanged (§3.4) |
| D29 | DOM events are lowercase kebab-case prefixed with the tag name (`primitiv-tabs-change`); adapters map them onto the existing React prop names | HTML attribute names are case-insensitive; React 19 passes custom-element event names through verbatim (§5.6.3) |
| D30 | Delivered per component; Tabs first, end to end, including `@primitiv-ui/react` Tabs as an adapter, released with no observable change | The release itself is the proof that the plan works (§3.3, §6.3) |
