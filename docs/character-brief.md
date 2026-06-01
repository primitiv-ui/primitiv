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

## Axis summary

| Axis | Position | Status |
| --- | --- | --- |
| Chroma / primary | Muted teal-green `#20836F` — editorial, not corporate | ✅ decided |
| Density | Four-mode Context (Dense→Spacious) — proportional control is a feature | ✅ decided |
| Focus / interaction | Brand-coloured ring on *every* intent, transparent gap band | ✅ decided |
| Type pairing | Condensed display (Khand) in tension with humanist body (Asta Sans) | ✅ decided |
| **Radius / shape** | *see below — recommendation pending sign-off* | 🟡 developing |
| **Elevation / shadow** | *see below — recommendation pending sign-off* | 🟡 developing |
| **Expressive typography** | *see below — recommendation pending sign-off* | 🟡 developing |
| Motion | duration + easing signature | ⬜ gap (deferred) |
| Iconography | stroke weight / corner / grid | ⬜ gap (deferred) |

The four decided axes are captured first for context, then the three
in-development axes get full treatment.

---

## Decided axes (captured for context)

### Chroma / primary

`#20836F` — a muted teal-green, deliberately *not* a SaaS-default
blue. Confident, slightly editorial. The brand ramp lives in
`Primitives / Palette` with Light/Dark modes; semantic decisions flow
through `Intent` (`action/*`, `surface/*`, `content/*`, `border/*`).
This is a real point of view and should be protected — resist drift
toward a safer blue.

### Density

Four Context modes — Dense, Compact, Comfortable, Spacious — where
most systems ship one or two. Four is itself a statement: *Primitiv is
about proportional control.* The height-to-padding ratio in each mode
(how chunky vs. tight a control feels) is an identity decision living
inside the `framed-control/*` numbers, not just a sizing convenience.

### Focus / interaction

The focus ring is a genuine signature: a 2px brand-coloured ring on
the +4 frame with a transparent gap band, and crucially **the same
brand colour on every variant** — including danger — because
`focus/ring` aliases `action/primary/default`. Most systems go
blue-on-everything. Ours is brand-on-everything. Treat this as a named
trait, not an implementation detail.

### Type pairing

Khand + Asta Sans. The principle worth protecting:

> A condensed, architectural display/label face in tension with a
> calm, humanist body face.

Khand is tall, narrow, geometric, a little brutalist — it works hard
in small label caps. Asta Sans is warm, open, legible — it gets out
of the way for body and input text. **The contrast between them is the
identity**, more than either face alone, and it suits the name
"Primitiv" (modernist, raw-fundamentals, Bauhaus-adjacent). Any future
face change must preserve that contrast, not just swap glyphs. Current
recommendation: keep the pairing; spend identity budget on the axes
below instead.

---

## Developing — Radius / shape language

**Why it matters most.** Shape is arguably the single most recognisable
axis in any system (Carbon reads engineered because it's near-sharp;
Material/Apple read friendly because radius is generous and
consistent). Right now Primitiv's radius is *implicit* — a by-product
of size math (`framed-control/{size}/radius` scales 2→12 across slots
and densities) rather than a stated position.

**Recommended position.** Architectural and crisp. Smaller, tighter
radii rhyme with Khand's condensed geometry and the "Primitiv" name —
a control that feels precise and engineered, not soft. Concretely:
keep the small end small, cap the large end lower than a friendly
system would, and keep the *ratio* of radius-to-height roughly
constant so a control reads equally "Primitiv" at every size.

**Proposed token work.**

- Introduce a named **shape stance** rather than leaving radius as raw
  math — e.g. a documented rule "radius ≈ N% of height, clamped to the
  `radii/*` scale" so the curve is intentional, not incidental.
- Audit the four density modes for radius *consistency of feel*: today
  Dense uses smaller radii, Spacious larger, Compact = Comfortable.
  Decide whether that spread expresses the stance or dilutes it.
- Ensure non-framed surfaces (Dropdown Panel, future Tooltip/Dialog)
  draw their radius from the same stance so panels and controls agree.

**Open questions.**

1. Crisp/architectural (recommended) or soft/approachable?
2. Should radius scale with density at all, or stay near-constant so
   the *shape* signature is identical across Dense→Spacious?
3. Is there a place for a `radius/full` (pill) treatment in the
   language, or is that off-brand for a "primitiv" system?

---

## Developing — Elevation / shadow

**Why it matters.** Flat-with-borders vs. floating-with-soft-shadows
is a whole personality. Given the **framed-control / border-first**
philosophy already baked in, Primitiv is plausibly a
*borders-over-shadows* system — and that restraint is itself a
character trait (very Polaris). The risk is bolting on heavy shadows
later and eroding it.

**Recommended position.** Restrained elevation. Borders do the
structural work; shadow is used *only* to lift genuinely floating
surfaces (menus, popovers, dialogs) off the canvas, and stays soft and
low-alpha. No decorative shadows on resting elements.

**Proposed token work.** Formalise the already-planned `elevation/*`
set (currently the Dropdown Panel uses a hardcoded
`rgba(0,0,0,0.12)` y=4 blur=16):

| Level | Use case | Y | Blur | Alpha |
| --- | --- | --- | --- | --- |
| `elevation/sm` | Cards, raised elements | 2 | 4 | 0.08 |
| `elevation/md` | Dropdowns, popovers | 4 | 16 | 0.12 |
| `elevation/lg` | Dialogs, modals | 8 | 24 | 0.16 |

- Home them in a dedicated collection or under `Primitives` (mode-
  agnostic), then rebind the Dropdown Panel effect's `boundVariables`
  (color, offsetY, radius, blur) — `elevation/md` maps to its current
  hardcoded shadow exactly.
- Decide dark-mode behaviour: shadows read weakly on dark surfaces, so
  consider a paired border/inner-glow treatment rather than just a
  darker shadow.

**Open questions.**

1. Three levels enough, or do we need an `elevation/xl` for
   command-palette / full-screen overlays?
2. Borders-first means most components have *no* elevation — is that
   the stated rule, with a short allowlist of surfaces that may float?
3. Is shadow colour always neutral-black-alpha, or ever tinted toward
   the brand for warmth?

---

## Developing — Expressive typography

**Why it matters.** A system reads as itself partly through its type
*scale ratio* and its use of case and tracking — not just its faces.
Right now Khand earns its keep mostly in labels; the `display/*` and
`overline/*` ramps are where its character can shine but are barely
exercised in workhorse UI.

**Recommended position.** Let Khand carry the personality at the
expressive end (display, overline, large headings) and keep Asta Sans
calm and unstyled in the workhorse middle (body, input, helper). The
identity gesture is the **contrast ratio** between a tall, tracked,
possibly upper-case Khand display and quiet Asta body — push that
contrast rather than flattening the scale.

**Proposed token work.**

- **Case + tracking as tokens.** Khand small-caps labels and overlines
  want intentional letter-spacing. Consider `tracking/*`
  (letter-spacing) and a documented case convention (e.g. overline =
  uppercase, tracked) so the expressive voice is reproducible, not
  per-designer.
- **Display ramp usage.** `display/lg` / `display/xl` exist; give them
  a clear home (marketing surfaces, empty states, section heroes) so
  the system has a recognisable "loud" voice distinct from `heading/*`.
- **Scale ratio.** Pin the display→body size jump deliberately — a
  larger ratio reads more editorial/confident, a smaller one more
  utilitarian. This ratio is an identity dial.

**Open questions.**

1. Are overlines / micro-labels uppercase-tracked Khand by default? If
   so, that's a strong, cheap signature — worth a token + convention.
2. How loud is the display voice allowed to be — is there a real use
   for `display/xl` in product UI, or is it marketing-only?
3. Do we ever set Khand at body sizes, or is Khand strictly an
   expressive/label face and Asta strictly the reading face? (A clean
   rule here is itself part of the identity.)

---

## Deferred axes

- **Motion.** No duration/easing tokens yet. A small set —
  `motion/duration/{instant,fast,base,slow}` and
  `motion/easing/{standard,entrance,exit}` — would give every
  interaction a consistent feel. High identity-per-effort; next in
  line after the three above.
- **Iconography.** Stroke weight, corner treatment, and grid should
  rhyme with the radius stance (sharp icons + sharp controls, or
  rounded + rounded). Decide alongside, or just after, the radius
  position.

## How to use this brief

1. Convert each 🟡 axis from "recommended position" to "decided" by
   answering its open questions.
2. For every decided axis, ensure a token encodes the opinion — if
   there isn't one (radius stance, elevation set, tracking), create it.
3. Revisit when adding a new component: which axes does it touch, and
   does it honour the stated position for each?
