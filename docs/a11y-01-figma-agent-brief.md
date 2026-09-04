# A11Y-01 — brief for Figma's agent

A self-contained brief for handing the **A11Y-01 keyboard animation** to Figma's
own agent (`use_figma` + the `figma-use-motion` skill). Everything it needs is
here; it should not have to guess at a token name, a variant string or a node id.

The canonical creative brief is `docs/docs-site-home-copy.md` § Section 9. This
document is the *executable* companion: what exists in the file, what may not be
invented, and what will bite.

---

## 0. Feasibility — verified, not assumed

Motion in Figma is gated behind the **`metronome`** account feature flag. It is
**enabled** on this account (`midlandmusic`, Pro). Probed live on 2026-09-04:

| Probe | Result |
|---|---|
| `figma.motion` namespace | present |
| `figma.motion.figmaAnimationStyles()` | 6 styles — position, scale, rotation, size, opacity, path |
| `node.manualKeyframeTracks` | reads (`{}` on a fresh node) |
| `node.timelines` | reads (`[{ id, duration }]`, seconds) |
| `node.applyManualKeyframeTrack(...)` | present |

So keyframe authoring and MP4 export are both available. If any motion call ever
returns `"<name>" is not a supported API`, the flag has gone — **stop
immediately, do not retry**, and report it.

**Load `figma-use` AND `figma-use-motion` before the first `use_figma` call**, and
pass both in `skillNames`.

---

## 1. Target

- **File key:** `1Nh5ffky0lYEw0MzXoqQVy` (`Primitiv Design System`)
- **Desktop frame:** node `2180:92025` — **560 × 420** (4:3), on page
  `Home — desktop (v3)`, section `09 — Accessibility`
- **Mobile frame:** node `2183:92374` — **342 × 257**, on page
  `Home — mobile (v3)`

Both are currently dashed placeholders named `⟦ ILLUSTRATION GAP · A11Y-01 ⟧`.
Clear the children, rename to `A11Y-01 · keyboard only`, drop the dashed stroke.

**`export_video` needs a top-level frame.** These frames are nested inside the
page layout, so the animation must be built in a **top-level frame on its own
page** first, exported, and only then moved (or instanced) into place. Do not
try to export the nested frame.

---

## 2. Non-negotiables

1. **No pointer, ever.** No cursor, no hover state, at any point including the
   first frame. The absence of a mouse for nine seconds *is* the argument.
2. **Do not invent colour, spacing or type.** Every value comes from a variable
   (§4). If something seems to need a value that does not exist, stop and say so
   rather than hardcoding a hex.
3. **Do not redraw the focus ring.** It is a real part of the components, at a
   real geometry (§5). Thickening or recolouring it to "read better" would
   misrepresent the one thing this image exists to prove.
4. **Use the real component instances** (§3), not look-alikes drawn from
   rectangles. Switch **variants** to change state.
5. **Do not speed it up.** ~9 seconds. It should feel like someone using it.
6. **Do not skip the Select.** It is the only element whose keyboard model is
   non-obvious, and therefore the only one that proves anything.

---

## 3. Components available (all local to this file)

Use `createInstance()` off the named variant. Property keys include their id
suffix and must be passed verbatim to `setProperties`.

| Set | Node id | Page | Use for |
|---|---|---|---|
| `Field` | `394:7449` | Field | the labelled wrapper around Input / Select |
| `Input` | `393:6159` | Input | "Full name" |
| `Select / Trigger` | `403:1883` | Select | the closed/open "Country" control |
| `Listbox / Option` | `1569:2859` | Listbox | the options in the open list |
| `Dropdown / Panel` | `668:42210` | Dropdown | the popup surface the options sit in |
| `Checkbox` | `369:30652` | Checkbox | "Email me about releases" |
| `Button` | `347:14161` | Button | "Create account" |
| `Kbd` | `612:35198` | Kbd | the key-cap indicator |
| `Card` | `1444:37322` | Card | the frame around the form |

### Variant axes — read these carefully, they are not consistent

| Set | Axes | Focus state is spelled |
|---|---|---|
| `Button` | `Variant` (primary/secondary/link/danger/ghost) · `Size` · `State` | `State=focus` |
| `Input` | `Size` · `State` · `Filled` (filled/empty) | `State=focus` |
| `Checkbox` | `Size` · `State` (unchecked/checked/indeterminate) · `Interaction` | **`Interaction=focus`** |
| `Select / Trigger` | `Size` · `State` · `Filled` (true/false) | **`State=focused`** |
| `Listbox / Option` | `State` (default/hover/**cursor**/disabled) · `Selected` · `Size` |  — |
| `Field` | `State` (default/invalid/disabled) · `Size` | — |

> **Two traps.** `Select / Trigger` spells it **`focused`**, not `focus`, and
> `Checkbox` carries focus on a **separate `Interaction` axis** while `State`
> holds checked/unchecked. A blanket `State=focus` will throw on both.

> **`Listbox / Option` has a `cursor` state.** That is the one to use as the
> keyboard cursor moves through the open list — not `hover`. Using `hover` would
> contradict the whole image.

### Property keys

```
Field    Label#394:1386 · Required#394:1402 · Helper#394:1418 · Show helper#394:1434
Input    Value#394:1335 · Leading Icon#393:1080 · Trailing Icon#393:1131
Select/T Value#403:0 · Show leading#1292:412 · Leading#1292:463
Listbox  Label#1569:533 · Mark#1569:574 · Show leading#1569:615 · Show trailing#1569:697
Checkbox Label#881:61 · Show label#881:122
Button   Label#347:3401 · Leading Icon#347:3389 · Trailing Icon#347:3395
Kbd      Key#612:468
Dropdown Slot#668:804
```

Everything is at **`Size=md`**.

---

## 4. Variables — the only source of colour and spacing

| Collection | Id | Modes |
|---|---|---|
| Intent | `VariableCollectionId:346:4407` | `Light=346:7` · `Dark=372:1` |
| Context | `VariableCollectionId:369:31958` | `Comfortable=369:10` · `Compact=369:9` · `Spacious=369:11` · `Dense=369:8` |
| Primitives / Palette | `VariableCollectionId:345:4376` | `Light=345:6` · `Dark=371:0` |

Pin **`Context = Comfortable`** on the animation frame.

**Theme:** the home page is dark-pinned. Set `Intent = Dark` on the frame. There
is a live constraint recorded in `CLAUDE.md`: **pin `Intent=Dark` and leave
`Primitives / Palette` on Light.** Pinning Palette to Dark as well renders
`content/primary` at `#121418` on a `#141414` surface — invisible text. This has
been measured on these exact frames. Do not "fix" it by pinning both.

The brief asks for the sequence in **both** themes (it is the proof for the
fourth commitment). Build dark first; a light twin is a second frame with the
Intent mode switched, not a redraw.

Tokens named in the creative brief:

```
card         surface/raised · elevation/raised (effect style) · border/subtle
focus ring   focus/ring · border/focus · focus/ring/width · focus/ring/offset
form gap     space/space-20
kbd cap      the Kbd component's own tokens — do not override
```

---

## 5. The focus ring — measured anatomy

On `Button [Variant=primary, Size=md, State=focus]`, the ring is **two
absolutely-positioned frames that bleed outside the component box**:

| Node | Size | Offset | Stroke | Radius |
|---|---|---|---|---|
| `focus-ring` | 114 × 48 | (−4, −4) | 2 | 12 |
| `focus-ring-gap` | 110 × 44 | (−2, −2) | 2 | 10 |

The component box itself is **106 × 40** in both `default` and `focus` — the ring
does not change layout, it overhangs by 4px on every side.

**Consequences the agent must honour:**

- **Nothing that contains a focusable control may clip.** Set
  `clipsContent = false` on the Card, the form column and the animation frame,
  or the outer ring is cut off at exactly the moment it matters.
- Leave **at least 8px** of padding around the outermost control so the ring has
  somewhere to go.
- Radii come from `framed-control/md/focus-ring-radius` and
  `framed-control/md/focus-ring-gap-radius`; Checkbox has its own
  `checkbox/md/focus-ring-*` pair. They are already bound inside the components —
  switching the variant is enough.

---

## 6. The sequence

Nine keypresses, ~9 seconds, looping with a 2s pause between passes.
~700ms apart, **except a 1.2s beat after the listbox opens.**

| # | Key | What changes |
|---|---|---|
| 1 | `Tab` | focus ring appears on the "Full name" Input |
| 2 | `Tab` | ring moves to the "Country" Select trigger |
| 3 | `ArrowDown` | listbox **opens**. → **1.2s beat here** |
| 4 | `ArrowDown` | cursor moves to option 2 (`Listbox / Option [State=cursor]`) |
| 5 | `ArrowDown` | cursor moves to option 3 |
| 6 | `Enter` | option chosen, listbox closes, trigger flips to `Filled=true` and shows the value |
| 7 | `Tab` | ring moves to the Checkbox |
| 8 | `Space` | checkbox toggles to `State=checked`; the mark appears |
| 9 | `Tab` | ring lands on the "Create account" Button and **stops** |

The `Kbd` cap in the **lower-left** updates on every press:
`Tab · Tab · ArrowDown · ArrowDown · ArrowDown · Enter · Tab · Space · Tab`.

The whole form is visible throughout — no scrolling, nothing enters or leaves.

**The 1.2s beat is the craft note, not a detail.** It is the difference between a
sequence a reader can follow and one they merely watch.

### Reduced-motion still

A single frame: Select open, cursor on the second option, focus ring clearly
visible, Kbd cap reading `Enter`. That frame carries the whole claim, so it must
be exportable on its own.

---

## 7. House gotchas that will bite

These are from `CLAUDE.md` and cost real debugging time in this file:

1. **`resize()` silently flips sizing modes to `FIXED`.** Re-assert
   `primaryAxisSizingMode = 'AUTO'` / `layoutSizing*` after every resize.
2. **A `FILL` child inside a hugging parent is not counted** — the parent hugs to
   its other children and the FILL child overhangs. Fixed parent ⇒ FILL child;
   hugging parent ⇒ HUG children.
3. **`clone()` drops `componentPropertyReferences`.** Four separate occurrences in
   this file. If you clone variants, repair and re-read the refs in the same call.
4. **Append a slotted instance into its parent FIRST, then configure its slot.**
   Writing to a detached instance's slot invalidates the handle.
5. **An icon instance colours its `VECTOR` children, not the instance frame.**
6. **A density mode change does not reflow within the same call.** Set the pin,
   return, and measure in the next call — otherwise you read the previous mode's
   geometry and conclude nothing happened.
7. **Text nodes created by script default to `textAutoResize: 'NONE'`.** Set
   `'HEIGHT'` before measuring anything.

---

## 8. Verification

- `get_screenshot` shows **only the resting state** — it will never show motion.
- To check the animation, `export_video` on the **top-level** frame, then sample
  frames with `ffmpeg`. Render small and cheap: `constraint: { type: 'WIDTH',
  value: 768 }` (the focus ring and Kbd cap need enough pixels to read),
  `quality: "low"`, `fps: 5`. Pick the moments first — one frame per phase, about
  6–9 here, one per keypress.
- Extraction is free once rendered: mine one export for every frame that tells
  you something rather than re-exporting.
- **Check specifically:** that no frame shows a pointer; that the ring is never
  clipped; that the `cursor` state (not `hover`) is used in the listbox; that the
  trigger actually shows the chosen value after `Enter`.

---

## 9. Definition of done

- [ ] Desktop 560 × 420 and mobile 342 × 257, both populated
- [ ] Dark theme built; light twin via the Intent mode, not a redraw
- [ ] Every colour and space bound to a variable — no literals
- [ ] Focus ring at its real geometry, never clipped
- [ ] No pointer in any frame
- [ ] Reduced-motion still exportable as a single frame
- [ ] Node ids of everything created returned
