# RFC 0019 — Navigation Menu (desktop dropdown + composed mobile)

> **Status:** **Accepted — §4 settled 2026-07-25, headless build in progress.**
> Drafted for review out of the docs-site landing-wireframe discussion
> (2026-07-22). All four §4 decisions are now settled (see §4); the headless
> API is fixed in §5. Every prerequisite in §7 has landed, so §6 step 2
> (scaffold + TDD the headless component) is the live step.
>
> **Author:** simonrevill, with architectural drafting.
> **Date:** 2026-07-22
> **Builds on:** the shared headless component patterns (see the
> `react-component-patterns` skill — `createStrictContext`,
> `useControllableState`, `useCollection`, `useRovingTabindex`, `deriveId`).
> Reuses **Drawer** (shell) + **Collapsible** (in-place expand, §4b) for the
> mobile presentation. The view/mode/framework choices use **SegmentedControl**
> on **desktop** (shipped) and **Rich Select** on **mobile** (the compact
> dropdowns — a **prerequisite still to build**); plus **Input** (search).
> Roadmap: `### Navigation` → **Navigation Menu** (logged, unbuilt).
> **Skills:** `new-react-component` + `react-component-patterns` +
> `react-test-conventions` (headless build); `figma-*` (the Figma sets);
> `new-registry-component` + `registry-stylesheet-conventions` (kitchen-sink).

## 1. Why this exists

The docs-site landing wireframe surfaced the product's primary navigation — the
mobile "menu open" frame (`Landing (mobile — menu open)`, Figma node
`1186:40682`, page *Wireframes — Docs Site (v1 — landing)*) shows it: **Start
Here · Concepts · Components (`mode-scoped`) · Registry & CLI · Design in Figma ·
Recipes · Changelog**, each a full-width row with a chevron, plus a docs search
(`Input`), the **VIEW & FRAMEWORK** group — three dropdowns (Audience · Mode ·
Framework), the Framework one rendering a **logo per option + a checkmark
indicator + "Soon" badges** (`Landing (mobile — framework menu open)`,
`1186:40961`) — and a **Theme** (Light/Dark) toggle. The dropdowns' custom item
rendering — logos, checkmark, "Soon" badges — is what makes them **Rich Select**,
not the native `Select`. On **desktop** these same view/mode/framework choices
are the shipped **`SegmentedControl`** strip: segmented control is the desktop
affordance, Rich Select the mobile one (shown 2026-07-23).

That nav is the roadmap's **Navigation Menu** — a genuinely headless-worthy
component (`<nav>`/menu ARIA, keyboard navigation, expand/collapse, focus
management). It has to serve **two presentations** whose interaction models
differ enough that the shape of the headless primitive is a real decision. This
RFC settles that decision *before* anyone scaffolds.

## 2. The two presentations & their state models

| | Desktop | Mobile |
|---|---|---|
| Shape | Horizontal nav bar; triggers open dropdown panels | Full-screen `Drawer`; a vertical list of expandable sections |
| Open state | **Single-open** — one panel at a time (+ hover-intent, shared viewport) | **Multi-expand tree** — several sections open, expand **in place** |
| Chevron | down (rotates on open) | right when collapsed → down on expand (Tree/Collapsible indicator) |
| Model | Radix/Ark `NavigationMenu` | `Drawer` + `Tree`/`Collapsible` |

> The wireframe's chevron-**right** on the mobile rows reads as a *collapsed
> Tree/Collapsible* indicator (rotates down on expand) — **in-place expansion**,
> matching "collapsible/tree". It is **not** a slide-to-child *drill-down stack*
> (which would need a navigation-stack + back-affordance state model — heavier,
> and out of scope unless decision (b) in §4 flips it).

## 3. Recommended architecture — composition-first

Keep `NavigationMenu` focused on the **desktop dropdown nav**, and build the
**mobile version as a composition** of primitives we already ship:

- **`NavigationMenu`** (new headless) = the desktop dropdown nav.
- **Mobile** = `Drawer` (shell — owns overlay/focus-trap/scroll-lock) + `Tree`
  *or* `Collapsible` (expandable sections) + a nav **`Link`** (active state).
- **Shared** between the two = a nav **data model** (sections → children, the
  `mode-scoped` flag) and a `Link` with `aria-current` / active detection. These
  are the *only* "affordances to revisit" — deliberately small.

Rationale: composition is king. Don't overload `NavigationMenu` with a second
interaction mode; reuse `Drawer`/`Tree`/`Collapsible`, which already exist.

**Alternative (documented, not recommended):** a single responsive
`NavigationMenu` that flips presentation by breakpoint/mode. Viable, but it
pushes *both* state models into one primitive — larger surface, bigger revisit,
and it duplicates what `Drawer` + `Tree` already do for the mobile shell.

## 4. Decisions — all settled

- **(a) The fork** — ~~desktop-only `NavigationMenu` + composed mobile
  *(recommended)*, vs one grow-both component.~~ **Settled 2026-07-25:
  desktop-only `NavigationMenu` + composed mobile.** See §4a below for the
  duplication analysis that closed it.
- **(b) Mobile interaction** — ~~in-place `Tree`/`Collapsible` expand
  *(recommended)*, vs slide drill-down stack.~~ **Settled 2026-07-23:
  in-place expand via `Collapsible`** (one independent expandable row per
  section, matching the wireframe — not `Tree`'s single-roving-tabstop model).
  This makes finishing `Collapsible` (headless `collapsedHeight` + fade-shadow)
  and building its registry + kitchen-sink surface a **prerequisite** for the
  mobile composition — see §7.
- **(c) Shared affordances** — ~~a `NavigationMenu.Link` part, a standalone
  `Link` primitive, or a shared context/hook.~~ **Settled 2026-07-25: a
  `NavigationMenu.Link` part, and nothing else.** No standalone `Link`
  primitive (that would widen this build to two components) and no nav
  **data model** in the library — per §8 the nav data is the consumer's, and
  filtering it by mode is a data concern. `NavigationMenu.Link` is the single
  shared affordance: it carries `aria-current` + `data-active`, and the mobile
  composition imports it directly so active-state logic is written once.
- **(d) Desktop specifics** — ~~how much of the Radix model to adopt.~~
  **Settled 2026-07-25: the full model** — single-open `value` state,
  hover-intent open, **and** both `Viewport` and `Indicator` parts. Adopting
  them now avoids a second revisit when the Figma desktop set needs the
  shared-panel morph and the sliding active-item indicator.

### 4a. Why the fork does not duplicate nav markup

The concern that closed (a): building mobile as a `Drawer` + `Collapsible`
composition sounds like it means maintaining the nav twice.

It does not, because the two presentations render **different DOM by
necessity** — single-open panels vs multi-expand rows — so *some* fork exists
in every option. The grow-both alternative doesn't remove the two branches, it
moves them inside the library where the consumer can't tune them. What matters
is that the three things carrying meaning stay single-sourced, and they do:

| Concern | Where it lives | Duplicated? |
|---|---|---|
| Nav data (sections → children, the `mode-scoped` flag) | one module in the consumer, `.map()`ed by both presentations | **No** |
| Active-state / `aria-current` logic | `NavigationMenu.Link`, used verbatim in both (decision (c)) | **No** |
| Panel/row wrapper elements | `List`/`Item`/`Trigger`/`Content` vs `Collapsible.Root`/`Trigger`/`Content` | Yes — ~15 lines each |

So the docs site gets one `SiteNav` component; inside it, one data array, one
`.map()` body per presentation, and the same `NavigationMenu.Link` leaf in
both. There is also an accessibility argument *for* the fork: rendering one
shared tree and hiding half of it by breakpoint puts duplicate landmarks and
duplicate `id`s in the accessibility tree.

## 5. Headless API — settled

Compound parts, following the house patterns (see the `react-component-patterns`
skill). Eight parts:

- **`NavigationMenu.Root`** — renders the `<nav>` landmark (defaulting
  `aria-label="Main"`, mirroring how `Breadcrumb.Root` defaults its own). Owns
  the open item as `value` / `defaultValue` / `onValueChange`, where **`""`
  means nothing is open**. Also owns `orientation`, `dir`, `openOnHover`,
  `delayDuration`, `closeDelay`. Provides context: the open value + setter,
  orientation/dir, the derived ids, the trigger registry, and the viewport
  registration slot.
- **`NavigationMenu.List`** — the `<ul>` of top-level entries, carrying
  `data-orientation`. (The `<nav>` landmark is on `Root`, not here — the
  earlier sketch had it on `List`; `Root`-as-`<nav>` matches both Radix and
  this repo's own `Breadcrumb`.)
- **`NavigationMenu.Item`** — an `<li>`; provides its optional `value` to
  descendants. Link-only entries omit `value`; a `Trigger` inside a
  value-less `Item` throws.
- **`NavigationMenu.Trigger`** — a `<button>` with `aria-expanded` /
  `aria-controls` / `data-state`, click-to-toggle and hover-intent open.
- **`NavigationMenu.Content`** — the panel, with `forceMount` for
  enter/exit animation. Renders in place *unless* a `Viewport` is mounted, in
  which case it portal-projects into it (the same projection mechanism
  `MillerColumns.Column` already uses for the Root strip).
- **`NavigationMenu.Link`** — an `<a>` with `active` → `aria-current="page"` +
  `data-active`; closes the open panel on click. Supports `asChild` for
  routing links. The shared affordance from decision (c).
- **`NavigationMenu.Viewport`** — the single shared panel host that every
  `Content` projects into, enabling the one-box morph between panels. Renders
  nothing when no panel is open (unless `forceMount`).
- **`NavigationMenu.Indicator`** — the arrow/underline that tracks the open
  trigger. Publishes the measured geometry as custom properties
  (`--primitiv-navigation-menu-indicator-position` / `-size`) so the styling
  layer can transition it; the library ships no styles of its own.

**Keyboard** (the ARIA APG **Disclosure Navigation Menu** model, not a
menubar — every top-level trigger and link stays in the tab order rather than
sharing one roving tab stop, which is the correct pattern for site
navigation):

| Key | Behaviour |
|---|---|
| `ArrowRight`/`ArrowLeft` (horizontal), `ArrowDown`/`ArrowUp` (vertical) | move focus between top-level entries, wrapping; RTL mirrors the horizontal pair |
| `Home` / `End` | first / last top-level entry |
| `Enter` / `Space` on a `Trigger` | toggle its panel |
| `ArrowDown` on a horizontal `Trigger` | open the panel and move focus to its first link |
| `Escape` | close the open panel and return focus to its trigger |

The axis keymap comes from `useRovingTabindex`, used for its keymap only —
`onNavigate` moves focus and the component deliberately does **not** set
`tabIndex={-1}` on the unfocused entries.

**ARIA:** `<nav>` landmark + `<ul>`/`<li>` + button/link semantics. No
`menu`/`menuitem` roles: these are links to pages, not application commands.

## 6. Build sequence

1. **API sketch + settle §4 (a)–(d)** — no code. The cheap step that shrinks the
   later revisit.
2. **Scaffold + TDD the headless component** — strict red-green, 100% coverage
   (lines/branches/statements/functions). `/scaffold-component NavigationMenu`
   produces the RED shell; see the `new-react-component` skill.
3. **Figma** — the desktop set (dropdown panels) first, then the mobile
   composition (Drawer + Tree/Collapsible). See the `figma-*` skills.
4. **Revisit the headless component** for whatever the mobile composition
   surfaced (expected: the data model + `Link` active-state), TDD.
5. **Kitchen-sink** — build **both** the desktop and mobile versions. The
   integration test *and* real dogfooding (the docs nav is the actual use case).
6. **Definition of done** (per `CLAUDE.md`): test + JSDoc + component README +
   the `packages/react/README.md` table row + a workbench example + the roadmap
   tick.

## 7. Composition inventory — status (reuse; some styling still to build)

Ready to reuse as-is:

- **Drawer** — headless ✓ / registry ✓ — the mobile shell.
- **Dropdown** ✓, **Input** ✓, **ToggleGroup** ✓ — fully shipped (`Input` = the
  docs search).
- **SegmentedControl** — headless ✓ / registry ✓ (shipped 2026-07-23) — the
  **desktop** view/mode/framework strip; on mobile those choices become the Rich
  Select dropdowns below.
- **Tree** — headless ✓ (no Figma / no registry) — **not** the chosen mobile
  model (see §4b); left here only as the roving-tree alternative.

**Prerequisites — all landed** (they gated the mobile composition + its
kitchen-sink, §6 steps 4–5):

- **Rich Select** — **landed 2026-07-25**, all four stages. `Select` gained a
  `native` boolean (default `false`); rich mode is the Popover-API listbox with
  custom item rendering, so the VIEW & FRAMEWORK group (Audience · Mode ·
  Framework, `1186:40961`) — logo per option, checkmark indicator, disabled
  "Soon" rows — is now expressible. See `docs/select-future-work.md`.
- **Collapsible** — **landed**, all four stages: headless `collapsedHeight` +
  the clamped-panel fade, plus the registry component and its three dressings
  (`plain`/`card`/`inline`) and a kitchen-sink demo per dressing.
- **Dropdown** — **landed**, all four stages (Figma → headless → registry →
  kitchen-sink), including the `Show leading` / `Show trailing` row slots.

These controls are composed *alongside* the nav inside the Drawer; they are
**not** part of `NavigationMenu`.

## 8. Non-goals / notes

- **Slide drill-down stack** — out of scope unless §4 (b) flips it.
- The **`mode-scoped`** Components section (its children depend on the
  Headless/Styled/Figma mode) is a **data** concern — the nav data is filtered by
  mode before render — not a `NavigationMenu` behaviour.
- **Menubar** and **Toolbar** (roadmap `### Navigation` siblings) are separate
  components; don't conflate them with this.
