---
name: new-web-component
description: End-to-end playbook for giving a component its Elements surface (RFC 0033) — a standard custom element in @primitiv-ui/web over shared logic in @primitiv-ui/core, the React primitive moved onto the same controller, the conformance suite, the registry elements block and example markup, the CLI's elements install, the per-component CDN file, the interop lab, the docs-site Elements pages, and the release order that makes the CDN URL resolve. Also covers behaviourless components, which get markup-only Elements support with no package. TRIGGER when asked to make a web component / custom element / Elements version of a component, to add a component to @primitiv-ui/web or @primitiv-ui/core, to give a registry component an `elements` block, or to make a component appear in the docs site's Elements mode. SKIP for the headless React primitive alone (see new-react-component), the copied React styled surface (see new-registry-component), and docs-site page work that doesn't touch Elements (see docs-site-component-page).
---

# New web component (Elements surface)

Tabs was the first and Accordion the second; together they are the reference
for everything below: read `packages/web/src/{tabs,accordion}/`,
`packages/web/src/internal/`, `packages/core/src/{tabs,accordion}/`, and
`docs/rfcs/0033-web-components.md` before starting. The RFC records **why**
each rule exists (§3 architecture, §5 the element contract, §6 testing, §7
distribution, §8 CLI, §11 decision record). This skill is the order of work and
the traps.

## The model, in five lines

- **`@primitiv-ui/core`** — pure functions, no DOM: key maps, roving rules, id
  derivation, the component's state policy (`tabsKeydown`, `tabsClick`,
  `tabsTabStop`). Framework-free by construction (§3.1).
- **`@primitiv-ui/web`** — a **controller** that owns DOM behaviour but never
  state (`TabsController` + a `TabsControllerHost`, D28), and the **custom
  elements** that host it, keeping state in reflected attributes.
- **`@primitiv-ui/react`** — the React primitive hosts the *same* controller
  (D30), so the two surfaces cannot drift in behaviour.
- **The registry** — an `elements` block on the component: the package it needs
  (or none) and an example markup file the CLI prints and the docs show.
- **Elements are headless by default; styling is the opt-in.**
  `primitiv add <x> --surface elements` installs the package and prints bare
  markup; `--styled` copies the stylesheet and prints the classed markup.

## First: does the component have behaviour?

- **No behaviour** (Button, Badge, Tag, Kbd, InlineCode): it gets
  **markup-only** Elements support — no element, no package. Skip to
  "Behaviourless components" below.
- **Behaviour** (keyboard, state, ARIA wiring): the full path below.

## 1. Core: extract the logic (TDD, 100% + mutation)

Move the component's framework-independent rules out of `packages/react` into
`packages/core/src/<component>/policy.ts` (and shared helpers into
`keyboard/` / `ids/`). Pure inputs → outputs: a keydown becomes an outcome
(`{ focus, activate }`), never a DOM call. Export from `src/index.ts`.

- Tests in `src/<component>/__tests__/`. Core and web are held at a **hard 100%
  mutation score for the whole package** from the first commit
  (`stryker.config.mjs` in each; RFC §6.1), not ratcheted per component.
- Re-export moved helpers from React's old barrel so React components importing
  them are untouched (the `utils/index.ts` re-export of `deriveId` is the
  pattern).

## 2. Web: controller + elements (TDD)

**Start from the shared bases in `packages/web/src/internal/`**, extracted once
a second component existed — don't copy a sibling's plumbing:

- `TriggerController` — the ordered trigger collection (`registerTrigger`,
  `setTriggers`, `unregisterTrigger`), `connect`/`disconnect` with an
  `AbortController`, and finding the trigger an event happened in. A subclass
  takes its host in the constructor and implements only
  `onTriggerClick(trigger, event)` and `onTriggerKeydown(trigger, event)`,
  using `this.ordered()` and `this.disabled()`. Document what "disabled" means
  for the component (Tabs lands on it, Accordion skips it) on the subclass.
- `PrimitivRootElement` — the root element's lifecycle: one `MutationObserver`
  on `reconcileOn` attributes, the controller connected and disconnected with
  the element, `rootId()` (the element's `id` or a generated
  `<tag>-<n>`), `parts(selector)` scoped so a nested instance keeps its own,
  `direction()` from `:dir()`, and `announce(type, detail)` for the cancelable
  change event. A subclass declares `controller`, `reconcileOn` and
  `reconcile()`.
- `element.ts` — `ElementBase` (the parts' SSR-safe base), `write`,
  `reportOnce`, `owned(scope, selector, owner)` for parts below the root (an
  Accordion item's own trigger), and `defineElements`.

What stays per component: the core policy, the show-event bookkeeping (Tabs
tracks one value, Accordion a set), and the reconcile itself.

Layout, mirroring Tabs:

```
packages/web/src/<component>/
  <Component>Controller.ts   behaviour; asks its host for state, tells it to apply changes
  elements.ts                the custom elements + define<Component>(registry?)
  index.ts                   classes only, no side effects
  __tests__/                 controller, rendering, interaction, lifecycle,
                             edges, server (pre-rendered markup), conformance
packages/web/src/define/<component>.ts   side-effect entry: calls define<Component>()
```

Rules from the RFC that the Tabs tests enforce (copy the test files' shape):

- **Two kinds of part (D24).** Structural parts (root, list, panel) *are* their
  element; the root writes their role/ARIA. Interactive parts (trigger, item,
  close) **decorate exactly one child the consumer writes** — a `<button>`,
  `<a href>`, or a router link — which receives the role. No default element and
  no `as-child`. Misuse (no `value`, not exactly one element child) logs **one**
  `console.error` and leaves the part undecorated; never throw (a
  server-rendered page has no error boundary).
- **State lives in reflected attributes** (`value`), so a server re-render or a
  history snapshot sees the live selection. Attributes are kebab-case
  (`activation-mode`).
- **Write only on change** (`write()` compares first) and **adopt pre-rendered
  markup without writing anything** (D20) — the `server` test re-inserts fully
  rendered HTML and asserts zero attribute writes.
- **Lifecycle (§5.4):** listeners through an `AbortController` per connection,
  aborted in `disconnectedCallback`; one `MutationObserver` on the root picks up
  parts arriving and leaving and the attributes it reads; parts are never
  cached; keyboard handling sits on the wrapper and reaches the child by
  bubbling, so a swapped child leaves no stale listener.
- **SSR-safe import:** extend `ElementBase` (falls back to an empty class when
  `HTMLElement` is missing, D21).
- **Events:** `primitiv-<component>-<what>`, bubbling, and **cancelable before**
  a user-driven change applies (D29). Add the event type to
  `src/frameworks/events.ts`.
- **JSDoc on each element class** with `@customElement`, `@summary`,
  `@attr {type} name - description`, `@fires {type} name - description`. This is
  the API source for both the Custom Elements Manifest (`cem analyze` over
  `src/**/elements.ts`) **and** the docs site's attributes/events data
  (`scripts/docs-data/extract-docs-data.mjs` → `elementsApi()`), which reads the
  same tags.

Then wire the package (each is easy to miss):

1. `src/index.ts` — `export * from "./<component>/index.ts"`.
2. `src/define/index.ts` — `import "./<component>.ts"`.
3. `src/tags.ts` — every new tag in `HTMLElementTagNameMap`.
4. `src/frameworks/{react,vue,svelte}.ts` — the JSX / template typings for the
   new tags and events (React 19 passes `on<event-name>` through verbatim, so
   the prop is `onprimitiv-<component>-change`).
5. `package.json` — `./<component>` and `./define/<component>` in **both**
   `exports` (src, for the workspace) **and** `publishConfig.exports` (dist).
   `sideEffects` already covers `define/**`.
6. `jsr.json` — the same two entries in `exports`. **Leave the
   `imports` floors (`jsr:@primitiv-ui/core@^0.1.x`) alone**, even when web
   now uses a core API newer than the floor: the PR's JSR dry run resolves
   them against what is **already published**, so a floor naming the
   upcoming release fails it ("Could not find version … that matches").
   The caret floor still resolves JSR consumers to the newest release.
   Raise it only when the minor changes (`RELEASING.md` §5). JSR does not
   support `workspace:*`.

**The CDN file needs no wiring.** `scripts/build-cdn.mjs` builds
`dist/cdn/<component>.js` from every `src/define/<component>.ts` in one esbuild
run with code splitting; shared code lands once in `dist/cdn/chunks/`. Run
`pnpm --filter @primitiv-ui/web build` and `size`: `check-size.mjs` holds each
CDN file (with the chunks it imports) and `primitiv-web.js` to the 3 KB gzipped
budget. Once two components exist, check the shared chunk really appears.

## 3. Conformance: one suite, both surfaces

`packages/conformance` (private, never published) holds a surface-agnostic suite
per component (`src/<component>.ts`, exported from `src/index.ts`): Testing
Library role queries and `user-event` only, driven by a pure-data fixture. Each
surface runs it with its own mount:

- `packages/react/src/<Component>/__tests__/<Component>.conformance.test.tsx`
- `packages/web/src/<component>/__tests__/<component>.conformance.test.ts`

**`user-event` for every interaction — never `fireEvent`.** It is not just
style: `fireEvent` from `@testing-library/dom` dispatches the one event you
name, while React listens for the bubbling twin (`onFocus` is `focusin`,
`onPointerEnter` rides `pointerover`), so a `fireEvent.focus` never reaches
React and the case fails for a reason that has nothing to do with the
component — or, worse, passes because nothing ran. Use `user.tab()` for focus
and blur, `user.hover` / `user.unhover` for the pointer, `user.pointer({ keys:
"[MouseLeft>]", target, coords })` for a bare press (with coordinates for a
backdrop hit test), `user.keyboard("{Escape}")` for keys. Where jsdom lacks the
browser step a real key would trigger, teach the test polyfill that step rather
than dispatching the result by hand: the `<dialog>` polyfills raise `cancel` on
Escape for the topmost modal, so the Modal suite presses a real Escape.

Write it against the element **before** the element exists, so it starts red
there; on React it passes first run — allowed, because React is the reference
it describes (RFC §6.2). Any case React fails is a real React bug, fixed in its
own cycle.

## 4. React: host the shared controller (D30)

Rebuild the React primitive on the web controller with
`useHostedController(snapshot, (root, latest) => new XController(root, host),
{ itemsRef, keys })` from `src/hooks`: it returns the root ref, builds the
controller once per mount, reads state through `latest()`, and hands over the
`useCollection` triggers on every change (`useTabsRoot.ts` and
`useAccordionRoot.ts` are the pattern). Add the component to the
`src/hooks/useHostedController.ts` entry in `stryker.config.mjs`'s `SHARED`
map so the hook stays under the mutation gate. If the root spreads `...rest`
onto its element, compose a consumer `ref` with the returned one
(`composeRefs`) — Accordion's root forwards a DOM ref and would otherwise
lose the controller's. The acceptance bar (§6.3), all on one
commit: the existing React suite passes unedited, conformance passes, 100%
coverage, 100% mutation. Expect to add a **StrictMode** test (without
`disconnect()` on effect cleanup, two controllers handle every event twice) and
to keep forwarding consumer handlers (`onKeyDown`) the controller now owns.

## 5. Registry: the elements block

In `registry/registry.json`, on the component:

```json
"elements": {
  "packages": [{ "name": "@primitiv-ui/web", "version": "^0.1.<next>" }],
  "example": "<component>.html"
}
```

- **The version is the floor the CLI and the docs pin the CDN URL to** (a URL
  takes one version: the minimum of the range). Set it to the release that
  will **first contain** this component's `dist/cdn/<component>.js` — usually
  the next one. An older floor prints a URL that 404s.
- `registry/components/<component>/<component>.html` — the **styled** example
  (registry classes on every part, `hidden` on inactive panels, a real
  `<button type="button">` inside each trigger wrapper). It is hand-written for
  a compound; the headless form is **derived** by removing the classes and
  unwrapping class-only spans (`without_classes` in the CLI, `withoutClasses`
  in the docs site), so never write a second, bare file.
- Add the example to the embedded file list in
  `crates/primitiv-cli/src/ports/registry.rs` (`registry_file!(...)`).
- The drift guard `committed_registry_examples_match_their_contracts`
  (`crates/primitiv-emit/src/snippet_tests.rs`) checks a hand-written example
  uses only the contract's classes and every part's class.

The CLI needs no change for a new component: `add --surface elements`,
`--styled`, the per-component CDN script (`dist/cdn/<name>.js`) and the
no-behaviour note are generic. Run `cargo test -p primitiv-cli -p primitiv-emit`.

## 6. Interop lab

`apps/interop-lab` loads the real element in plain HTML, React, Vue, Svelte,
Angular, htmx and a styled site (`e2e/*.spec.ts`, Playwright; run by
`interop-lab.yml`). Add the component to `src/fixture.ts` and a spec covering
at least: arrival in a fragment, a server re-render, a nested instance,
`hx-preserve`, history restore, a veto on the change event, and RTL — the htmx
cases in `e2e/htmx.spec.ts` are the checklist. The styled site installs through
the real CLI (`scripts/install-elements-site.mjs` runs `init --styles` then
`add`), so it exercises the printed markup too.

## 7. Docs site

Load the `docs-site-component-page` skill as well. For Elements:

1. `node scripts/docs-data/sync-docs-data.mjs` — picks up the `elements` block
   automatically: `docs.elements` (package, version floor, root element,
   example, and `api`, the attributes/events from the JSDoc) and the roster's
   `elements: "behaviour" | "markup" | null`, which decides where the component
   is listed (Elements + Headless lists only `behaviour`). Commit the JSON
   before running `pnpm qa:docs-data`: it diffs against git.
2. The page's spec (`apps/docs-site/src/site/examples/<id>.tsx`): every
   `code(density, mode)` and the playground `snippet` gain a
   `mode === "elements"` branch returning the **styled** markup — the
   headless tab is derived from it. Use `markup()` / `indent()` from
   `src/lib/playground.ts` for single elements; write a tree helper for a
   compound (`elementsTree` in `tabs.tsx`). `asChild` has no Elements
   equivalent: put the classes on the element itself.
3. **Write the page in the Elements reader's language, not React's.** The
   hand-written prose names props, parts and hooks (`Tabs.List`,
   `onValueChange`, `asChild`) that plain markup doesn't have. Each has an
   Elements counterpart that replaces it only in Elements mode:
   - `spec.elements` — `description` (replaces the JSDoc lede in the header),
     `anatomyMeta`, `keyboardMeta`, `keyboard`, `accessibility`. Write them in
     attribute and event terms (`activation-mode`, `primitiv-tabs-change`, "the
     `<button>` inside a trigger").
   - `elementsCaption` on each `InteractiveExample`, and `elementsTitle` on an
     example whose title names something React-only ("As a link (asChild)" →
     "As a link").
   - Generated sections switch themselves: Props becomes **Attributes & events**
     (`ElementsApiReference`, from the `@attr`/`@fires` JSDoc, so write those
     tags well) for a component with behaviour, or **Classes**
     (`ElementsClassReference`, from the contract) for a behaviourless one; the
     Data attributes table labels its groups by element.
   - Then **scan the built page for React terms**: open it in Elements mode,
     read the text and grep for the part names, `on[A-Z]`, `asChild`, `props`,
     `children`, `React`. Only the demo's own sample data should remain.
4. **The previews are the real elements.** In Elements mode the playground and
   every `InteractiveExample` mount the Elements markup with `ElementsPreview`
   (loads `@primitiv-ui/web/define` on demand) — a developer reading the page
   opens devtools and expects real elements. The preview is the **styled**
   markup in both modes, as React mode's preview always has been: stripping the
   classes under Headless previews unstyled HTML (tried, and reverted). Only the
   code tabs differ. So the Elements code must be complete markup. Where it isn't
   on purpose, give the example an override:
   - `elementsPreview={(density, code) => …}` — return the full markup, e.g.
     when the code elides repeated parts (Tabs "Controlled") or shows an icon
     as `<!-- plus glyph -->` (Button's `withGlyphs` swaps the real
     `@primitiv-ui/icons` paths in).
   - `wire={(root) => cleanup}` — behaviour the code tab shows as a
     `<script>`, e.g. a `primitiv-tabs-change` listener updating a readout.
   Add the component to `apps/docs-site/e2e/elements-preview.spec.ts`: the
   element is defined, its roles are wired, the preview keeps its classes under
   Headless, and
   React mode renders no `primitiv-*` element. Add the spec file to the
   `e2e-carousel.yml` paths.
5. The Installation and Load panels, the fallback notices and the
   framework/styling switch need nothing: they read `docs.elements`.
6. Gates: `node scripts/check-tokens.mjs`, `pnpm build`, `pnpm test:seo`,
   `pnpm test:e2e`, and a real-browser look at the page in Elements + Headless
   and Elements + Styled (Playwright from `apps/docs-site`; serve `out/` with
   `node e2e/serve.mjs`).

## 8. Release order

1. Push to `main`; CI runs core/web/react units, web build + size + manifest
   check, the JSR dry run, the interop lab, and Rust.
2. **Release** (Actions → Release, the next version) → **Publish packages**.
   Confirm the tarball has the file:
   `npm pack @primitiv-ui/web@<v>` and `tar -tzf … | grep cdn/<component>.js`.
3. **Only then deploy the docs** (Actions → Deploy docs site): the Load panel
   shows `…/@primitiv-ui/web@<floor>/dist/cdn/<component>.js`, which 404s until
   the release exists.

The registry is baked into the CLI binary, so the `elements` block reaches
`primitiv add` users only through that release too.

## Behaviourless components

No element and no package: the registry block is just
`"elements": { "example": "<component>.html" }`. The example is **generated**
from the contract (`emit_snippet`) — regenerate with
`cargo run -p primitiv-emit --example regen-snippets`; the drift guard fails on
a hand edit. The CLI's headless run skips it with a note (its headless form is
plain HTML) and `--styled` copies the stylesheet and prints the markup. In the
docs it is listed under Elements + Styled only; its spec's elements branches
print classed markup with `markup()`.

## Traps from the Tabs and Accordion builds

- **A stylesheet can override `hidden`.** The registry Accordion's panel is
  `display: grid` so it can animate, which beats the UA's `[hidden]` rule, so
  a closed panel stayed in the accessibility tree as an empty region until the
  element also wrote `aria-hidden`. Only a real browser showed it
  (`getByRole("region")` in the interop lab's styled page).
- **The headless markup is derived by stripping classes and unwrapping bare
  `<span>`s**, so any styling-only wrapper in the styled example must be a
  `<span>` (give it `display: block` in the stylesheet if it needs a box) —
  a `<div>` would survive into the headless form. The drift guard accepts
  classes the component's own `styles.css` defines, for exactly these.
- **Playwright treats `aria-disabled` as disabled**: clicking a disabled
  trigger in an e2e needs `{ force: true }`.
- **Docs previews load the definition on demand**, so an e2e that clicks right
  away can beat the upgrade under load; wait for an attribute the element
  writes first.

- **The docs-site build resolves react's imports from `packages/react`, not the
  docs site's `node_modules`.** React imports `@primitiv-ui/web` and `/core`, so
  any workflow that builds the docs site runs
  `pnpm install --frozen-lockfile --filter "@primitiv-ui/react..."` at the root
  first (deploy and e2e workflows do). Linking the packages into the docs site
  and Turbopack aliases were both tried and don't fix *react's* imports. The
  docs site does link `@primitiv-ui/web` itself, for `ElementsPreview` — an
  import from the docs site's own `src` resolves through its own
  `node_modules`, so that link works.
- **The docs-site code tab and preview must agree.** A placeholder in the
  Elements code is fine only if the example's `elementsPreview` fills it in;
  otherwise the preview renders the placeholder.
- **Don't trust the workspace install to prove a clean build.** It worked
  locally for a week while the deploy was broken. Reproduce CI in a fresh
  `git worktree` when a build depends on workspace packages.
- **Elements are headless first.** The docs, the CLI default and the roster
  filters all assume it; don't make a classed example the default anywhere.
- **The headless markup is derived, never authored** — one styled example per
  component, everywhere.
- **A CDN URL takes one version.** Raise the registry floor with the component,
  release, then deploy the docs.
