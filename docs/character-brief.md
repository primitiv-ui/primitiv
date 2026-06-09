# Primitiv — character brief

A living statement of the system's identity. Not an RFC (those record
architecture decisions); this records *opinions* — one per axis of
character — so that every component reads as unmistakably Primitiv.

## What character is

Identity does not live in one token. Polaris is recognisable through
green + calm Inter + generous whitespace + hairline borders +
restrained shadow, applied consistently — not through any single
choice. Atlassian reads as itself through blue + friendly geometry +
its rounded shape language. **Character is the intersection of a few
axes, plus discipline in how they're applied.**

So this brief is organised as one stated *position* per axis, and a
pointer to the token(s) that express it. An axis without a token that
encodes its opinion is an axis we haven't really committed to yet.

## Ethos — first principles (developing)

The per-axis positions below should ladder up to this small set of
first principles — the *why* behind the choices. Still being refined,
but the spine is taking shape:

- **Harmonious, accessible colour.** The engine is named *Harmoni* for
  a reason: colour relationships should be harmonious *and* accessible
  by construction — palettes generated to hold their perceptual
  relationships and contrast, not hand-picked and spot-checked after
  the fact.
- **OKLCH-first, perceptually uniform colour.** Harmoni's Rust core
  works in OKLCH because it is perceptually uniform — equal numeric
  steps read as equal perceptual steps, and lightness / chroma stay
  truthful across hues in a way HSL and raw sRGB do not. Colour
  decisions reason in OKLCH first; sRGB hex is an *output*, not the
  model. *Constraint:* Figma cannot yet store OKLCH as variable
  values, so the tokens in the file are sRGB approximations of an
  OKLCH-native intent — a known gap we are working toward closing. A
  future, more advanced Harmoni colour picker will align with this.
- **Mathematical proportion as a through-line.** Colour is not the
  only thing derived rather than hand-placed: spacing, type scale,
  radius, and density flow from proportional relationships too.
  *Proportional control* is therefore a first-class feature — the
  four-mode density axis is the visible edge of it — adjustable
  globally and, where needed, per component.
- **Cross-environment translation.** The identity must survive the
  jump from Figma to the Web (and beyond) — the tokens, not the
  canvas, are the source of truth.
- **One coherent ethos across the stack.** `@primitiv-ui/react`,
  `@primitiv-ui/tokens`, and Harmoni are three expressions of the same
  principles, not three separate concerns.

> Once settled, every axis position should trace back to one of these
> principles; any that doesn't is suspect.

## Axis summary

Status legend: ✅ decided · 🔬 exploring (actively iterating, no commit
yet) · ⬜ gap (not started).

| Axis | Position | Status |
| --- | --- | --- |
| Type contrast | Condensed display vs humanist body — the *contrast* is the commitment, faces are swappable | ✅ decided |
| Density / proportion | Four-mode Context (Dense→Spacious); proportion as a through-line, cross-environment | ✅ decided |
| Radius / shape | Derived `r = k·height`, **k = 0.1875** (3/16); small, never sharp/pill; intrinsic-round excepted | ✅ decided |
| Elevation / shadow | Borders-first; multi-layer neutral shadows only where hierarchy demands | ✅ position (build TBD) |
| Expressive typography | Tracking + casing as tokens; Khand for display / heading / label / overline only | ✅ decided |
| Chroma / primary | In active exploration via Harmoni — synced but volatile | 🔬 exploring |
| Focus / interaction | Ring colour undecided: brand vs blue vs black; gap-band geometry kept | 🔬 exploring |
| Motion | duration + easing signature | ⬜ gap |
| Iconography | stroke weight / corner / grid, rhyming with radius | ⬜ gap |

---

## Decided axes

### Type contrast

Currently Khand + Asta Sans, but the commitment is the *principle*,
not the faces:

> A condensed, architectural display/label face in tension with a
> calm, humanist body face.

The contrast is what stays even if the typefaces change. It works in
components (tight, confident labels) and in prose (Khand headings over
quiet Asta body) alike. **Khand is strictly an expressive face** —
display, headings, labels, overlines — and never runs at body sizes,
because that contrast is the whole point. Asta Sans owns body, input,
and helper text.

### Density / proportion

Four Context modes — Dense, Compact, Comfortable, Spacious — where
most systems ship one or two. Four is a statement: *proportional
control is a feature of Primitiv.* The height-to-padding ratio in each
mode (how chunky vs. tight a control feels) is an identity decision
living inside the `framed-control/*` numbers, and it's controllable
both globally and, where needed, per component. This concept is meant
to translate to the Web, not stay a Figma-only convenience — see the
ethos note on proportion.

### Radius / shape

**Small roundness, and *derived* — never hand-assigned.** Radius is a
constant fraction of a control's height, which is what makes it
proportional (per the ethos) and makes density fall out for free:
smaller heights yield smaller radii with no separate table.

**The rule (framed controls):**

```
radius = clamp( snap_to_scale(height × k), floor≈2, —)
k = 0.1875  (3/16)
```

A floor of ~2 guarantees "never sharp"; any `k` well under 0.5
guarantees "never pill" by construction. `k` is the single roundness
knob for the whole framed-control family — *Primitiv's roundness
coefficient*. (Today's radii float between r/h 0.125 and 0.214 with no
pattern — they were snapped to `radii/*` by hand. Adopting one `k`
regularises that.)

**Three tiers — not everything is a framed control:**

1. **Framed controls** (Button, Input, Switch, Checkbox, Tabs…) →
   `radius = k × height`.
2. **Surfaces** (Dropdown / Context-Menu panel, Modal, Card) — no
   meaningful height to derive from, so `k × height` would blow up.
   The **outer** radius **pins to the md control radius** (cohesive,
   density-flexing); everything **inside** derives concentrically
   (next rule).
3. **Intrinsically round** (Avatar, status dot, spinner) →
   `radii/full`. Exempt by nature, not by exception — the named
   carve-out so these never become ad-hoc special cases.

**Two threading rules keep radius derived even in composition:**

- **Concentric focus ring** (already in the system): `gap = R+2`,
  `ring = R+4`. Geometric necessity; stays keyed to the control's R.
- **Concentric nesting**: `inner = outer − inset`. A panel's items, a
  highlight inside a button — the inner corner is the outer corner
  minus the padding, so nested shapes stay concentric. Squares off to
  0 when inset ≥ outer radius, which is correct.

**Materialization (Figma vs code).** Figma variables can't compute, so
the rule *generates* the per-slot `framed-control/{size}/radius`
values that alias `radii/*` (as today, but produced by the rule, not
by hand). In `@primitiv-ui/react` / `@primitiv-ui/tokens` the radius can be
**computed** directly from the height token. Either way the *rule* is
the source of truth; the tokens are its output.

### Expressive typography

The expressive end of the type system is where Khand earns its keep,
and these are now positions, not proposals:

- **Tracking + casing are tokens** (already in use) — so the
  uppercase, tracked voice of overlines/labels is reproducible rather
  than per-designer.
- **`display/xl` is the loud voice** — reserved for marketing pages,
  landing pages, heroes; distinct from `heading/*` in product UI.
- **Khand never drops to body sizes** — protecting the display↔body
  contrast ratio is the identity gesture.

### Elevation / shadow (position decided, build TBD)

**Borders-first.** Borders do the structural work; shadow is a tool of
*visual hierarchy*, never decoration. The rules:

1. **Only where hierarchy demands it.** A shadow lifts a genuinely
   floating surface off the canvas. Current allowlist: **Dropdown
   panel, Context Menu panel, Modal.** It is *not* used to make a
   resting element look "cool" — e.g. a ColorSwatch gets no shadow.
2. **Built from neutral colour tokens, multi-layered.** Shadows are
   composed from existing neutral tokens and **stacked in several
   layers** to get a realistic falloff — not a single flat drop
   shadow. This means an `elevation/*` token is a *set of layered
   shadows*, not one shadow, which the token model (`@primitiv-ui/tokens`
   DTCG + Figma effect styles) must support.
3. **Tooling.** Revisit the online layered-shadow generators to derive
   the layer stack rather than hand-tuning.

Starting point for levels (to be expanded into layer stacks):

| Level | Use case | rough single-layer equivalent |
| --- | --- | --- |
| `elevation/md` | Dropdown / Context Menu panels, popovers | y4 blur16 ~0.12 |
| `elevation/lg` | Modal / dialog | y8 blur24 ~0.16 |

The Dropdown Panel's current hardcoded `rgba(0,0,0,0.12)` y4 blur16 is
the first thing to migrate. Dark-mode behaviour is still open (shadows
read weakly on dark surfaces).

---

## Exploring (actively iterating, not committed)

### Chroma / primary

**Not set in stone.** The primary token set is regenerated constantly
in Harmoni and backed up via the sync plugin, so the values in the
repo are *volatile snapshots*, not a decision. Resist treating the
current teal as fixed. This gets its own dedicated session later.

The exploration is **OKLCH-native** (see Ethos): we reason about the
primary in OKLCH and the synced Figma token is its sRGB approximation,
not the canonical value — so judging the colour by the hex in the file
is judging the lossy copy.

Note the coupling with the focus ring below: if the ring stays
brand-anchored, every primary experiment moves the ring too.

### Focus / interaction

The gap-band geometry is kept — the transparent spacer band with the
+2 / +4 enlarged frames is a signature worth keeping regardless of
colour. The **ring colour is undecided**, with three candidates and a
real trade-off underneath:

| Candidate | Pro | Con |
| --- | --- | --- |
| Brand (current) | Cohesive; auto-tracks the primary | Churns with every chroma experiment; a muted brand can read weak as a focus signal |
| Pure black | Stable, high-contrast, neutral; decoupled from chroma | Less expressive; needs a dark-mode inverse |
| Conventional blue | Familiar affordance | Fights the editorial brand; reintroduces the "blue-on-everything" default we deliberately avoided |

The underlying question is **stable signature vs. auto-tracking**: a
brand-anchored ring is one less thing to maintain but inherits the
primary's instability; black/blue gives a fixed signature independent
of chroma churn at the cost of a new axis to manage.

---

## Gaps (not started)

- **Motion.** No duration/easing tokens yet. A small set —
  `motion/duration/{instant,fast,base,slow}` and
  `motion/easing/{standard,entrance,exit}` — would give every
  interaction a consistent feel. High identity-per-effort.
- **Iconography.** Stroke weight, corner treatment, and grid should
  rhyme with the small-radius stance (crisp, not rounded). Decide
  alongside or just after radius.

## How to use this brief

1. Move each 🔬 axis to ✅ by settling its open trade-off, then encode
   the decision in a token.
2. For every decided axis, ensure a token encodes the opinion — if
   there isn't one (radius-to-height rule, layered elevation, tracking
   scale, intrinsic-round carve-out), create it.
3. Develop the **Ethos** section so every axis position traces back to
   a first principle.
4. Revisit when adding a new component: which axes does it touch, and
   does it honour the stated position for each?
