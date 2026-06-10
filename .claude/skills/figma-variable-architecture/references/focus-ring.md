# Focus ring anatomy, recipe, and gotchas

Every framed control's focus state uses a three-layer anatomy:

```
[ focus-ring layer     ]  ← 2px brand-colour stroke (focus/ring token), enlarged frame
[ focus-ring-gap layer ]  ← 2px transparent stroke (color/neutral/transparent), enlarged frame
[ control frame        ]  ← the button/control itself
```

The two ring layers are **separate frames, larger than the control**, sitting
behind the content (children index 0 and 1), each centred over the control and
extending outward — *not* an OUTSIDE stroke on the control itself. The gap layer
is +2 px per side, the ring layer +4 px per side. Strokes are **INSIDE** on these
enlarged frames, so the visible stroke sits in the band outside the control edge.
(Verified against the live Button set, 2026-05-28.)

## Corner radii

| Layer              | Token                                    | Formula          |
| ------------------ | ---------------------------------------- | ---------------- |
| Control frame      | `framed-control/{size}/radius`           | R                |
| Focus-ring-gap     | `framed-control/{size}/focus-ring-gap-radius` | R + 2       |
| Focus-ring         | `framed-control/{size}/focus-ring-radius`     | R + 4       |

**Why R + 2 for the gap:** the gap layer extends 2 px beyond the control edge on
all sides, so its corner arc must shift out by 2 px to remain concentric.

**Why R + 4 for the ring:** the ring frame extends +4 px per side, so its corner
arc must shift out by 4 px from the control radius to stay concentric.

## Focus ring stroke spec (live Button set)

- Width: **2 px**, bound to `focus/ring/width` (in the `Interaction` collection).
- Colour: bound to the **`focus/ring`** token, which aliases
  `action/primary/default` → `color/brand/light/500` (**#20836F**, brand/teal).
  It is **intent-neutral** — the ring is the brand colour on *every* variant
  (primary, secondary, link, danger), because it points at the primary action
  token regardless of the variant's own colour. It is **not** a fixed `#99C8FF`.
- The ring is a **2 px INSIDE stroke on an enlarged frame** (R + 4, +4 px/side),
  not an OUTSIDE stroke on the control.
- The gap layer is a **2 px INSIDE stroke** bound to `color/neutral/transparent`
  (white at alpha 0) on a +2 px/side frame (R + 2) — a transparent spacer band,
  not a white fill.
- Toggled via a **"Focus ring"** boolean component property on each variant frame.

## Canonical recipe — focus ring on ANY component

This ring is the **shared standard for every framed control** (Button, Switch,
Checkbox, Tabs/Trigger, …). Build it identically each time so all components match.
For a focus variant of size `S` in context collection `C`, add two frames as the
**first two children** (behind the content), each centred on the control with
`layoutPositioning = "ABSOLUTE"`:

1. **`focus-ring-gap`** (index 0 or 1, drawn under the ring):
   - size = control **+2 px per side** (w+4, h+4); position x=y=**−2** rel. control.
   - **constraints = `{ horizontal: "STRETCH", vertical: "STRETCH" }`** — anchors all four edges to the parent so the ring follows when label text (and thus control width) changes.
   - 4 corner radii → `C` `framed-control/${S}/focus-ring-gap-radius`.
   - stroke INSIDE, 4 weights → `focus/ring/width`; stroke colour → `color/neutral/transparent`.
   - no fill.
2. **`focus-ring`** (outermost):
   - size = control **+4 px per side** (w+8, h+8); position x=y=**−4** rel. control.
   - **constraints = `{ horizontal: "STRETCH", vertical: "STRETCH" }`** — same requirement as the gap frame.
   - 4 corner radii → `C` `framed-control/${S}/focus-ring-radius`.
   - stroke INSIDE, 4 weights → `focus/ring/width`; stroke colour → `focus/ring`.
   - no fill.
3. Expose a boolean **"Focus ring"** component property bound to both frames'
   visibility (so non-focus variants hide it / it can be toggled).

The +2/+4 px offsets are **fixed for all sizes**; only the radii vary (via the
size token). Pin the radii to `S` — do not inherit them from a duplicated source
size (see the slip gotcha below). For a non-rectangular control (e.g. a circular
Switch thumb/track) the same two-frame, +2/+4, INSIDE-stroke model applies; use
the control's own radius token in place of `framed-control/*` if it differs.

> Older component *descriptions* in the file (Switch, Checkbox, Tabs…) still cite
> "3 px #99C8FF OUTSIDE" — that text is stale. Trust the live `focus/ring` /
> `focus/ring/width` tokens and the actual focus-variant nodes over those notes.

## Gotchas

**Ring-frame radius slips.** The two ring frames must bind their corner
radii to *their own component's* size slot (`framed-control/{size}/focus-ring-radius`
on the ring, `…/focus-ring-gap-radius` on the gap). When variants are built by
duplicating across sizes, these bindings are easy to leave pointing at the source
size (or, seen once, the gap frame bound to the *ring*-radius token) — the control
frame still looks right but the ring is non-concentric (most visible at xl). On the
Button set, 16 of 160 ring frames had slipped this way. Fix deterministically:
sweep every `State=focus` component and `setBoundVariable` all four radius corners
of each ring frame to the correct context+size token. Frame *offsets* are a fixed
+4 px/side (ring) and +2 px/side (gap) regardless of size, so only the radii slip.

**Ring-frame constraints must be STRETCH, not MIN.** Both ring frames
require `constraints: { horizontal: "STRETCH", vertical: "STRETCH" }` (the "Left &
Right / Top & Bottom" setting in Figma's UI). With `MIN` (the default when a frame
is created), the ring anchors only to the top-left corner and stays at a fixed pixel
size — so when a designer changes label text and the control widens/narrows, the ring
doesn't follow and becomes asymmetric. With `STRETCH`, Figma maintains the exact
−2/−4 px margin on *all four sides* dynamically. Found on Tabs/Trigger and
Accordion/Item (2026-06-03) after both were built correctly except for this one
property. After any ring-frame build or clone sweep, verify:
`ringFr.constraints.horizontal === "STRETCH" && ringFr.constraints.vertical === "STRETCH"`.
