# RFC 0024 — App-shell & marketing patterns

> **Status:** Draft — exploratory, not yet scoped for Figma
> **Author:** Claude, with architectural drafting
> **Date:** 2026-07-27
> **Depends on:** RFC 0022 (layout primitives) — `Container`/`Stack` must
> land first; nothing here can be arranged sensibly without them. Reuses
> composites from RFC 0021 (**Card**, **Confirm Dialog**) once those land,
> and existing primitives `NavigationMenu`, `Breadcrumb`, `Button`,
> `EmptyState`, `Avatar`, `Divider`. Sibling proposals from the same
> session: RFC 0021, RFC 0022, RFC 0023.

## 1. Why this one reads differently from RFC 0021/0023

The other two proposals from this session extend things Primitiv already
has committed design work behind: RFC 0021 composes primitives that are
*all* already built and Figma-designed; RFC 0023 crosses over prose
elements whose Figma design is *already done* (RFC 0012/0015). **This
category has no existing Figma design at all.** A Hero, a Page Header, an
app shell — none of these have been designed in Figma the way Button or
List have. Building them means starting a genuine design conversation
first, the same way RFC 0012/0014/0015 each began with a planning session
before any component landed.

That's a materially bigger commitment than the other two RFCs, which is
why this one stays deliberately lighter: a scoped candidate list and a
sequencing note, not a settled build plan. Treat it as the placeholder for
a future design session, not something to start building from this
document alone.

## 2. Candidate patterns

| Pattern | What it composes | Componentised value |
|---|---|---|
| **Page Header** | `Breadcrumb` + `Stack` (RFC 0022) + `Button` (page actions) + a title slot | High — clear, reusable, almost entirely built from things that already exist once RFC 0022 lands. |
| **Error / Empty page shell** | `EmptyState` (already shipped) + `Container` (RFC 0022) | High — `EmptyState` already does the hard part; this is just a page-level width/centring wrapper around it. |
| **Auth / form page shell** | `Card` (RFC 0021) + `Field` stack + `Container` (RFC 0022) | Medium — genuinely useful, but closer to a documented layout recipe than a distinct component once Card and Container both exist. |
| **App shell / sidebar layout** | `NavigationMenu`'s vertical presentation + `Container` (RFC 0022) | Medium — real value for anyone building a dashboard-style app, but a bigger surface (persistent nav rail + scrollable content region + responsive collapse) with more genuine layout decisions to make. |
| **Hero** | headline + subhead + CTA row + optional media slot | Lower — closer to a marketing content block than an interactive component; mostly typography + `Stack` + `Button`. |
| **Footer** | link columns + legal row | Lower — same shape as Hero: content-heavy, component-light. |

## 3. Caution: don't chase the count

The premise for this whole planning session was a comparison to design
systems claiming 150–200+ components. That number is not, on its own, a
reason to ship marketing filler — RFC 0021 §3's selection bar (composable
from real primitives today, common enough to earn its keep, no copy-pasted
markup from another component) should still apply here, loosely adapted.
**Hero** and **Footer** read as the weakest candidates on that bar: they're
more "a documented composition recipe" than "a shippable registry unit" —
worth having as a kitchen-sink or docs-site example page, not necessarily
as a `primitiv add`-able component in v1.

**Page Header** and **Error/Empty page shell** are the strongest — both
compose entirely from primitives that already exist or are already
proposed (RFC 0022), and both have an unambiguous, singular job. If this
category gets picked up before the others are fully settled, start there.

## 4. Sequencing

1. Do not start before **RFC 0022** lands (`Container`/`Stack` are load-
   bearing for every entry above).
2. Prefer starting after at least **Card** and **Confirm Dialog** (RFC
   0021 Tier 1) land, so the composite-registry flow (dependsOn wiring,
   kitchen-sink hand-sync) has been proven a couple more times on lower-
   stakes surfaces first.
3. The actual next step for this category, when picked up, is a **Figma
   design session** — not a TDD cycle. This RFC does not attempt to
   pre-settle variant axes or token bindings the way RFC 0021/0023 could,
   because none of that design work exists yet.

## 5. Suggested minimal v1, if picked up

**Page Header** and **Error/Empty page shell** only. Both need no new
Figma work beyond arranging already-designed components on a page, which
keeps this proposal honest about not jumping ahead of the design process.
Hero, Footer, and the full app-shell/sidebar layout stay documented here as
candidates for a later, dedicated design pass rather than committed scope.
