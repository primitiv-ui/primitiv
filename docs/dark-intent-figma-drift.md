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

## 4. The real fix, applied

§4 originally said a full reconciliation was impossible through aliases,
because 56 of 103 dark roles had no equivalent in the light ramp. That was
true **only while dark frames left the Palette collection on Light**. The
constraint was self-imposed.

**What changed.** Dark frames now pin **both** `Intent=Dark` *and*
`Palette=Dark`, and the dark Intent aliases use the **same palette step the
code uses** — no more inverted step numbers picked by eye. `neutral/600`
then resolves against the dark ramp and gives `#8f949c`, exactly as the code
intends. Figma matches by construction rather than by approximation.

| | |
| --- | --- |
| Aliases rewritten | **60** (42 were already right) |
| Nodes given a `Palette=Dark` pin | **129** |
| Nodes scanned / skipped | 42,575 / **0** |
| Roles diverging afterwards | **0** (was 48) |

Both phases ran in one pass. This had to be a **flag day**: between them a
dark frame resolves the code's step numbers against the *light* ramp and
looks worse than before, so `scripts/figma/reconcile-dark-intent.js`
collects every node *before* writing anything and does both or neither.

### Two consequences

1. **`color.neutral-alpha-inverse.*` is now redundant.** Seven aliases moved
   off it onto plain `neutral-alpha/*`. It exists solely to work around the
   problem this fixed. Retire it once nothing else references it — note
   `docs/carousel-development-log.md` still cites it for the Carousel dots.
2. **Every new dark frame must pin `Palette=Dark` as well as `Intent=Dark`.**
   This is the one rule that replaces the old "never override Palette"
   warning. A dark frame with only the Intent pin renders against the light
   ramp and will look subtly wrong rather than obviously broken, which is the
   worst failure mode.

### Still worth a decision

The reconciliation adopted the code wholesale, including two things worth a
second look now that Figma agrees with them:

- **`action/link/foreground/disabled` equals `…/default`** in the code, so a
  disabled link renders identically to an active one. Almost certainly
  unintended; fix it in `intent.json` and re-run the script.
- **`action/primary/hover` darkens on dark** (`#053a8a`). Figma previously
  lightened it, which is arguably the better behaviour on a dark surface.
  The reconciliation made Figma follow the code; if the code is wrong here,
  change it there and re-run.

## 5. Verifying

```js
// contrast of any role against the dark page, from the plugin console
const v = /* Intent variable */;
v.resolveForConsumer(nodeInsideTheDarkFrame).value
```

`resolveForConsumer` is the only reliable read — a bound paint keeps a
stale literal `color` snapshot, and walking `valuesByMode` by hand
resolves cross-collection aliases through the wrong mode.
