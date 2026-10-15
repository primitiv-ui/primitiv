---
name: promo-video
description: Playbook for making a product / promo / social video of Primitiv (LinkedIn, X, YouTube, Reels, a launch or feature teaser) with apps/promo-video — a React page of the real docs-site components rendered frame-by-frame to MP4 by Playwright + ffmpeg. Covers format choice, storyboarding, the shared animation kit (density glides, rebrand, dark reveal, kinetic type, brand panel), fact-checking every on-screen claim, the contact-sheet review loop, parallel rendering, thumbnails, and the traps that only showed up in rendered frames. TRIGGER when asked to make, edit, re-render, re-cut or resize a video, animation, reel or teaser of Primitiv, or to write the post that goes with one. SKIP for docs-site pages (see docs-site-component-page), Figma work, and the components themselves.
---

# Promo videos

`apps/promo-video` renders videos of **the real product**: the docs site's
registry components (the canonical copies, `apps/docs-site/src/components`) and
its `tokens.css`. A density glide on screen is the token layer reflowing, not a
mock-up — that authenticity is the point, so keep it.

The first video, `linkedin-launch` (55s, 1080×1350, 60fps), is the reference
implementation. Read its scenes before writing new ones. The app README covers
how the pipeline works internally.

## Commands

```sh
cd apps/promo-video
pnpm install --ignore-workspace          # its own pnpm root, excluded from the root workspace
pnpm build                               # also fetches fonts into public/fonts/ (gitignored)
node render.mjs sheet 0 3 9.5 --video <id>     # out/sheet.png — THE review loop
node render.mjs stills 0 --video <id>          # out/still-0.00.png — thumbnails
node render.mjs video --video <id> --jobs 4    # out/<id>.mp4
pnpm dev   # http://localhost:5173/?video=<id>&t=12.5   (?play loops in real time)
pnpm test && pnpm typecheck
```

`pnpm render` is `build` + the full parallel render of the default video. In the
cloud sandbox Playwright finds Chromium itself (`PLAYWRIGHT_BROWSERS_PATH`);
elsewhere `npx playwright install chromium` or set `CHROMIUM_PATH`.

**Render cost:** about 3.8 fps for one job at 2× scale, about 10 fps with
`--jobs 4` on 4 cores, so a 55s/60fps video takes about 6 minutes. Review
with contact sheets, never with full renders.

## Making a new video

1. **Pick the format.** Canvas is CSS px, rendered at 2× (`SCALE`):

   | Target | Ratio | `width × height` | File |
   |---|---|---|---|
   | LinkedIn / Instagram feed | 4:5 | 540 × 675 | 1080 × 1350 |
   | Square, any feed | 1:1 | 540 × 540 | 1080 × 1080 |
   | Reels / Shorts / TikTok | 9:16 | 540 × 960 | 1080 × 1920 |
   | YouTube / X / site hero | 16:9 | 960 × 540 | 1920 × 1080 |

   Keep the canvas near 540 wide for portrait. Feeds show the video about 400px
   wide on a phone, so a larger canvas makes every control tiny. Social feeds
   autoplay **muted**, so on-screen text must carry the whole message, with no
   reliance on a voice-over.

2. **Storyboard first, with times**, and show it to the human if they did not
   specify one. Rules that held up:
   - The hook moves within the first second, and **frame 0 is fully composed**
     because feeds use it as the poster.
   - Use one idea per scene, a 2-line Khand headline, and one optional sub-line.
   - Lead with density. It is the differentiator, and it reads instantly as motion.
   - Aim for 45–60s and end on the lockup plus `primitiv-ui.dev`, held for about 2s.

3. **Take the copy from the product, then verify every claim.** The docs-site
   landing sections (`apps/docs-site/src/site/*Section.tsx`, `Hero.tsx`) hold
   the reviewed messaging. Before anything goes on screen:
   - Component count: `ls registry/components | wc -l`.
   - Contrast claims: compute from
     `apps/docs-site/src/content/palette-sheet.generated.json`. The lowest
     pairing was 4.5035:1 (dark info-500), so "every pairing clears AA" held.
     Recompute it if the palette changes.
   - CLI output: run the real binary (`cargo build --release -p primitiv-cli`)
     in a scratch project and copy its output verbatim. Never paraphrase a path.
   - Rebrand ramps: real `primitiv theme --brand <hex> --format css` output, in
     `src/data/`.
   - **Never show `npx primitiv …` or `pnpm dlx primitiv …` without an install
     step.** The npm package `primitiv` belongs to an unrelated project. Show
     `npm i -D primitiv-ui`, then `primitiv add …`.

4. **Build it** as `src/videos/<id>/Video.tsx`, which exports a `VideoSpec`
   (`width`, `height`, `duration`, `Video`), plus `scenes/`. Register it in
   `src/videos/index.ts`. Reuse the kit:

   | Kit piece | What it gives you |
   |---|---|
   | `@kit/timeline` | `Sequence` mounts a scene in `[from, to)` with local time; `useTime()` |
   | `@kit/scopes` | `DensityScope from/to/p` (a real density glide), `ThemeScope theme/from/to/p` (light/dark + brand blend), `useTheme()` |
   | `@kit/ui` | `Header` (overline + kinetic headline + sub), `Words`, `fadeStyle`, `Dial`, `retype`, `Caret`, `Mark`, `Wordmark`, `Footer` |
   | `@kit/panel` | `Panel` (slanted brand wipe in/out), `BrandLockup` (mark springs up, wordmark wipes in) |
   | `@kit/Dashboard` | A believable product surface (table, badges, segmented control, switch, progress) |
   | `@lib/time` | `progress`, `interpolate`, easings, closed-form `spring` |
   | `@lib/glide` | `glideAt(t, initial, steps, dur, ease)` for chained mode or brand steps |
   | `@lib/contrast` | WCAG ratio for on-screen numbers |

   The scenes in `linkedin-launch` cover the other recurring set pieces: seed
   swatch to ramp to strip, the terminal typing `primitiv theme`, the dark reveal,
   the keyboard-only focus pass, and the three ways to build. Copy and adapt them.

5. **Review with contact sheets** at every scene's middle and at every
   **transition** (each `*_START`/`*_END` and panel in/out). Then render, probe
   with `ffprobe -count_frames` (frame count = duration × fps), and extract a few
   frames from the MP4 itself, especially at the `--jobs` chunk seams.

6. **Deliver** the MP4 plus two cover JPGs (frame 0, and the most informative
   frame) via `SendUserFile`. If asked for a post, see "The post" below.

## Rules

- **Every frame is a pure function of `t`.** `kit/video.css` kills all CSS
  transitions and animations, so drive motion only from `useTime()`. Anything on
  wall-clock time (a CSS transition, `setTimeout`, a component's own animation)
  will differ between runs. The renderer depends on this: the same `t` gives
  byte-identical PNGs, which is also how to prove a refactor changed nothing
  (render stills before and after and `cmp` them).
- **Inside a density scope, every gap must come from a density-scaled token**
  (`--primitiv-card-*-gap`, `-padding`, `flow-*`, `framed-control-*`). A
  primitive like `space-space-12` stays put while everything around it moves,
  which defeats the demo.
- **Use size `sm` inside density scopes** and let density do the scaling.
- **Real focus rings:** call `el.focus({ focusVisible: true })` from a layout
  effect keyed on `t`. Only one frame copy may own focus (see the dark reveal below).
- **Brand blends need `data-theme` on the element carrying the inline ramp.**
  Intent roles are declared under `[data-theme]` and only re-resolve where that
  attribute is.

## Traps (each cost a render)

- **The dark reveal renders the frame twice** (light, plus dark clipped to a
  growing circle). Both copies run the same scenes, so anything stateful
  (focus) must live only in scenes that exist after the reveal.
- **A panel wipe must cover until the next scene is mounted.** A scene whose
  `*_END` falls before the panel finishes leaves an empty band for a few frames.
- **Content revealed under a lifting panel must already be animating in.** The
  panel lifts bottom-first, so start the next scene's cards about 0.3s before it
  clears, or the reveal shows an empty frame.
- **The base layer sets `box-sizing: border-box`.** A fixed-height box's
  height includes its padding, and the last line of a terminal gets clipped.
- **A sliding pill over labels:** a single label layer is unreadable mid-slide.
  Draw a second, white label layer clipped to the pill (`Dial` does this).
- **Rows growing from zero height** show as hairlines. Fade opacity in with height.
- **Long cards against the footer:** check the tallest density (Spacious) in
  every multi-density grid. It is the one that collides.
- **Piping the renderer through `grep`** block-buffers its progress lines until
  exit. Watch `out/` or the raw log instead.
- **`$TMPDIR` is unset in the cloud sandbox.** Use the scratchpad path, or
  `"$TMPDIR/x"` resolves to `/x`.
- **`pnpm typecheck` catches real misuse** of the docs-site components'
  controlled props (e.g. a controlled `SegmentedControl` needs
  `onValueChange`). Run it before rendering.

## The post (LinkedIn)

- The first ~210 characters show before "…see more", so put the hook there. The
  density pitch is the docs copy: libraries tuned for one kind of product feel
  bloated when dense and cramped when roomy.
- Use short paragraphs and `→` bullets for the feature list. Keep every claim
  as verified for the video.
- Use 3–6 hashtags at the end (`#DesignSystems #React #Accessibility
  #OpenSource #FrontendDevelopment #UXDesign`).
- Upload the MP4 natively, not as a link, and set the cover JPG. Feeds tend to
  favour posts without outbound links, so the URL can go in the first comment.
