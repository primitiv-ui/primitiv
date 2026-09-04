# A11Y-01 recorder

Records the docs-site home page's accessibility illustration by **driving the
real components in a real browser**, rather than animating a drawing of them.

The section's rhetorical job is that accessibility is the one claim on that page
which can be *shown* instead of asserted. A hand-keyframed animation cannot do
that — it is a picture of a focus ring, choreographed by whoever drew it. What
this produces is the source code running: the headless behaviour from
`packages/react`, the styled surface from `registry/components/*` exactly as
`primitiv add` copies it, the token layer as `primitiv tokens` emits it, and a
focus ring that is wherever the component puts it.

## Run it

```sh
# once — fetches the three faces so the capture never waits on a font
node tools/a11y-recorder/scripts/vendor-fonts.mjs

node tools/a11y-recorder/scripts/record.mjs                    # desktop, light
node tools/a11y-recorder/scripts/record.mjs --theme dark
node tools/a11y-recorder/scripts/record.mjs --frame mobile --theme dark
```

Each run writes `out/a11y-01-<frame>-<theme>-<density>.{mp4,webm}`, a
`-still.png` at the same resolution — the `prefers-reduced-motion` fallback, and
the frame the sequence ends on, so the still and the video cannot disagree — and
a `.timeline.json` giving each step's offset from the start of capture.

Flags: `--frame` (desktop | mobile) · `--theme` · `--density` · `--scale`
(device pixel ratio, default 3) · `--fps` (default 30) · `--out` ·
`--keep-frames`.

## `frames.mjs` is the single source of truth

The scene, the key sequence and the recorder all read it, so they cannot
disagree about what is on screen: it carries each frame's pixel size, its
control size, which rows appear, and how many options the Select lists. Adding a
frame is one entry there.

Mobile is a **recomposition, not a scale** — 342/257 and 560/420 are the same
4:3 aspect to within a quarter of a percent, which is exactly what makes a
downscale look possible. It is not: at 342 wide the desktop composition renders
its 14px labels at 8.5px. Mobile is `xs` and otherwise identical: same form,
same five controls, same 13-step sequence.

**`rowGap` is the number that decides whether the card looks designed.** A
Field's own label-to-control gap is 8 at md and 4 at xs; the gap between rows
has to clearly beat it, or the form stops reading as a set of labelled groups
and becomes one undifferentiated stack. Both frames run a ratio of 2.5 — 20
against 8, and 10 against 4. An earlier mobile build ran 6 against 6 and looked
exactly as flat as that sounds. The reasoning behind every mobile value is in
`frames.mjs` beside the value it justifies.

Two component behaviours worth knowing before changing any of it, both found the
hard way:

- **The Select panel flips.** When it does not fit below the trigger,
  `position-try-fallbacks: flip-block` puts it above — which, in a build with
  larger controls, landed it over the name that had just been typed.
- **Roving focus wraps.** Two ArrowDowns in a two-item list return to the top,
  so Enter chooses the row the cursor started on. A take did exactly that —
  appearing to move twice while silently selecting the first option, visible
  only in the finished video. Cursor presses are derived as `options - 1`,
  never fixed.

## How it is wired

- **No `node_modules` of its own, and no workspace entry.** Every dependency is
  aliased by absolute path into the store `packages/react` already has, and vite
  is invoked from `packages/react/node_modules/.bin/vite`. A tool that exists to
  emit a video is not worth a lockfile entry.
- **`@primitiv-ui/react` is consumed as source**, the same aliasing the
  kitchen-sink uses (and the same `dedupe: ['react', 'react-dom']`, for the same
  reason — two React copies fail at the first context provider).
- **A production build, previewed** — not the dev server, whose error overlay
  could paint over the scene and be recorded without anyone noticing. The
  recorder also fails the run outright on any page error or console error, so a
  broken take cannot be published as a good one.

## Two things that will bite

1. **`Page.startScreencast` ignores Playwright's viewport emulation.** It
   captures the real compositor surface, so a page created with
   `{ viewport: 560x420, deviceScaleFactor: 3 }` casts **560x333** frames — the
   untouched window, at 1x, wrong aspect and all. Resolution has to come from
   the window: `--force-device-scale-factor` plus `--window-size`, then converge
   `innerWidth`/`innerHeight` on the target with `Browser.setWindowBounds`
   (new headless keeps ~87px of the outer height for itself, and that number is
   a property of the browser build, not something to hardcode).
   `recordVideo` is not the alternative — it captures at the viewport's CSS size
   and cannot exceed 1x at all.
2. **h264 will not encode an odd dimension.** The mobile frame is 257 tall, so
   3x is 771 and ffmpeg refuses. Padding to even adds a black hairline and
   scaling to even stretches the frame by a pixel, so the recorder raises the
   capture to the next scale that comes out even (4x, 1368x1028) and reports it.
   It is the one adjustment that changes nothing about the image.
3. **The frame stream is variable-rate.** Chromium only emits a screencast frame
   when something paints, so a still hold produces no frames. Each frame's own
   duration goes into an ffmpeg concat list and the encoder resamples to a
   constant rate; that is what keeps the recorded timing identical to the timing
   the driver performed. Dropping the durations and assuming a fixed rate makes
   the whole sequence run fast and unevenly.

## What the recording found

**The Select does not open on ArrowDown.** `SelectTrigger` is a plain
`<button>` whose only opener is `onClick`, so native Enter/Space activation
opens it and ArrowDown does nothing — probed directly, `aria-expanded` stays
`false`. The ARIA APG's listbox-button pattern says ArrowDown (and ArrowUp)
should open it and move the cursor in one gesture, so this is a real gap in the
component, not a scripting mistake. The brief for this illustration assumed
ArrowDown; `scripts/sequence.mjs` records what the code actually does instead.

Two smaller notes from the same probe: once open, focus moves onto the option
itself, so a row's highlight is a genuine `:focus-visible` ring rather than a
painted cursor state; and choosing an option refocuses the trigger, so the
following Tab continues from the right place with no help from the driver.
