# Figma's dark Intent variables have drifted from the code

> **Found:** 2026-09-03, from "the muted token isn't working that well in
> some places" on the docs home page. It was a real bug, not a matter of
> taste. **Partly fixed** — see §4 for what remains.
> **The code is correct throughout. Figma is the side that is wrong.**

---

## 1. The mechanism

Figma's **dark** Intent variables alias the **light** Palette ramp,
because the file resolves the Palette collection through Light mode on
dark frames. The root `CLAUDE.md` already records this for the alpha
ramps, which is why `color.neutral-alpha-inverse.*` exists.

So under Figma's scheme a **low step number means light ink**:

| role | aliases | renders |
| --- | --- | --- |
| `content/primary` | `neutral/50` | `#e5ecf6` |
| `content/secondary` | `neutral/200` | `#bcc2cb` |

The sequence must therefore *descend*: 50 → 200 → ~400 → ~500.

## 2. What was broken

`content/muted` aliased **`neutral/600`**, which jumps past the midpoint
into the dark half of the ramp. On the dark page:

| role | was | contrast | needs |
| --- | --- | --- | --- |
| `content/muted` | `#565a60` | **2.66:1** | 4.5:1 |
| `action/link/…/default` | `#104fb2` | **2.44:1** | 4.5:1 |
| `action/link/…/hover` | `#032e71` | **1.43:1** | 4.5:1 |
| `action/link/…/active` | `#011841` | **1.06:1** | 4.5:1 |

**The tell:** muted (2.66:1) was *darker* than disabled (3.91:1), so
disabled text was more legible than muted text. And the link family got
**darker** on hover and active — backwards on a dark background.

Only dark mode is affected, which is why the component pages looked
fine: they are in Light mode, and every light value is correct.

## 3. What was fixed

| role | was | now | contrast |
| --- | --- | --- | --- |
| `content/muted` | `neutral/600` | **`neutral/400`** | 2.66 → **6.04:1** |
| `action/link/…/default` | `brand/600` | **`brand/400`** | 2.44 → **6.16:1** |
| `action/link/…/hover` | `brand/700` | **`brand/300`** | 1.43 → **8.65:1** |
| `action/link/…/active` | `brand/800` | **`brand/200`** | 1.06 → **10.94:1** |
| `action/link/…/visited` | `brand/700` | **`brand/300`** | → 8.65:1 |
| `action/link/…/disabled` | `brand/600` | **`brand/500`** | → 3.78:1 |

`content/muted` → `neutral/400` (`#8f949c`) is an **exact** match for
what the code's dark `content/muted` resolves to. The four link changes
are the **closest available step** (within ~2%, visually
indistinguishable) — see §4 for why an exact match is impossible.

**One code-side bug found on the way:** `intent.json` sets dark
`action/link/foreground/disabled` to `brand.600`, identical to
`…/default`. A disabled link that renders exactly like an active one is
almost certainly unintended. Figma now uses `brand/500` instead, so the
two files deliberately disagree on that one role until the code is
fixed.

## 4. What remains, and why it cannot be re-aliased

A full reconciliation was attempted and is **not possible through
aliases alone**. Of 103 dark roles, **56 have no exact equivalent
anywhere in the light ramp** — the dark ramps are genuinely different
colours, not mirror images. Of the 80 roles checkable against the code,
**48 diverge**. They fall into three classes:

**A · Near-misses — cosmetic, not worth churning.** ~20 roles sit 1–3%
off, imperceptible: `content/disabled` `#6f747b` vs `#747980`,
`border/default` the same, `content/secondary` `#bcc2cb` vs `#b4b9c2`,
`surface/subtle` `#202328` vs `#1e2126`, `border/subtle`,
`surface/inverse`, and most of `action/secondary/*`.

**B · Wrong direction, but nothing currently reads as broken.**
`action/primary/hover` and `/active` *lighten* in Figma (`#86b3fb`)
where the code *darkens* (`#053a8a`); `action/danger/*` does the same;
the `feedback/*/soft/*` families all sit a step or two off. Worth a
deliberate decision rather than a silent fix — on a dark surface,
lightening on hover is arguably the better behaviour, in which case the
**code** is what should change.

**C · Fixed above** — the four that genuinely failed contrast.

### The durable fix

Mirror families, following the precedent `color.neutral-alpha-inverse.*`
already sets: a `*-inverse` family per ramp whose Light mode carries the
dark theme's values, so dark Intent variables can alias an exact value
instead of hunting for a near-miss in the light ramp.

That is a real piece of work — six ramps × ten steps — and it is the
only route to true parity. Until it exists, Figma's dark mode is an
approximation of the shipped dark theme, close everywhere and exact in
about half the roles.

**Do not** "fix" this by setting the Palette collection to Dark mode on
dark frames. The root `CLAUDE.md` is explicit: the whole theme
double-inverts.

## 5. Verifying

```js
// contrast of any role against the dark page, from the plugin console
const v = /* Intent variable */;
v.resolveForConsumer(nodeInsideTheDarkFrame).value
```

`resolveForConsumer` is the only reliable read — a bound paint keeps a
stale literal `color` snapshot, and walking `valuesByMode` by hand
resolves cross-collection aliases through the wrong mode.
