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

node tools/a11y-recorder/scripts/record.mjs                 # light, comfortable
node tools/a11y-recorder/scripts/record.mjs --theme dark
node tools/a11y-recorder/scripts/record.mjs --density compact --scale 4
```

Each run writes `out/a11y-01-<theme>-<density>.{mp4,webm}` plus a
`-still.png` at the same resolution, which is the `prefers-reduced-motion`
fallback: the frame the sequence ends on, so the still and the video agree.

Flags: `--theme` · `--density` · `--scale` (device pixel ratio, default 3) ·
`--fps` (default 30) · `--out` · `--keep-frames`.

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
2. **The frame stream is variable-rate.** Chromium only emits a screencast frame
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
