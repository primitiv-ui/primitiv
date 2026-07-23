# RFC 0019 — Navigation Menu (desktop dropdown + composed mobile)

> **Status:** **Draft — proposed, not started.** Drafted for review out of the
> docs-site landing-wireframe discussion (2026-07-22); a follow-on session/agent
> executes the build. The decisions in §4 are the thing to settle before anyone
> scaffolds.
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

## 4. Decisions to settle in the API-sketch step (before scaffolding)

- **(a) The fork** — desktop-only `NavigationMenu` + composed mobile
  *(recommended)*, vs one grow-both component.
- **(b) Mobile interaction** — ~~in-place `Tree`/`Collapsible` expand
  *(recommended)*, vs slide drill-down stack.~~ **Settled 2026-07-23:
  in-place expand via `Collapsible`** (one independent expandable row per
  section, matching the wireframe — not `Tree`'s single-roving-tabstop model).
  This makes finishing `Collapsible` (headless `collapsedHeight` + fade-shadow)
  and building its registry + kitchen-sink surface a **prerequisite** for the
  mobile composition — see §7.
- **(c) Shared affordances** — where the nav **data model** and the
  active-state **`Link`** live: a `NavigationMenu.Link` part, a standalone `Link`
  primitive, or a shared context/hook both presentations consume.
- **(d) Desktop specifics** — how much of the Radix model to adopt: hover-intent
  open, single-open `value` state, `Viewport`/`Indicator` parts.

## 5. Headless API sketch (desktop starting point)

Compound parts, following the house patterns (see the `react-component-patterns`
skill):

- `NavigationMenu.Root` — `value` / `defaultValue` / `onValueChange` (the open
  item), `orientation`. Context provides the active value + setter, orientation,
  ids, trigger registration for roving focus.
- `NavigationMenu.List` — the `role`-appropriate container (`<nav aria-label>`).
- `NavigationMenu.Item` — `value`.
- `NavigationMenu.Trigger` — chevron, `aria-expanded`, open on hover/click.
- `NavigationMenu.Content` — the panel (force-mount for enter/exit animation).
- `NavigationMenu.Link` — `aria-current`; the shared active-state affordance.
- *(optional, per (d))* `NavigationMenu.Viewport`, `NavigationMenu.Indicator`.
- **Keyboard:** arrows (axis-aware), Home/End, Escape to close, Enter/Space to
  activate. **ARIA:** `<nav>` + menu/link semantics.

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

**Prerequisites still to build** (gate the mobile composition + its kitchen-sink,
§6 steps 4–5 — not the desktop headless, which can scaffold in parallel):

- **Rich Select** — **not built** (native `Select` only ships today). The VIEW &
  FRAMEWORK group (Audience · Mode · Framework, `1186:40961`) needs custom item
  rendering — a logo per option, a checkmark indicator, disabled "Soon" rows —
  which native `<select>` cannot do. Its design decisions are already **settled**
  (`docs/select-future-work.md`: Popover-API top layer + `data-side`/`data-align`
  hooks, single-select, hidden native `<select>` for forms); scaffold-ready
  pending a Popover-API browser re-check. Full build: scaffold → headless TDD →
  Figma → registry → kitchen-sink.
- **Collapsible** — Figma ✓ / headless ✓ **but incomplete**: the headless still
  needs **`collapsedHeight` + the clamped-panel fade-shadow**, and it has **no
  registry / kitchen-sink surface**. Because §4(b) settled on `Collapsible` for
  the in-place mobile expand, finishing it end-to-end (headless → registry →
  kitchen-sink) is a prerequisite for the mobile presentation.

These controls are composed *alongside* the nav inside the Drawer; they are
**not** part of `NavigationMenu`.

## 8. Non-goals / notes

- **Slide drill-down stack** — out of scope unless §4 (b) flips it.
- The **`mode-scoped`** Components section (its children depend on the
  Headless/Styled/Figma mode) is a **data** concern — the nav data is filtered by
  mode before render — not a `NavigationMenu` behaviour.
- **Menubar** and **Toolbar** (roadmap `### Navigation` siblings) are separate
  components; don't conflate them with this.
