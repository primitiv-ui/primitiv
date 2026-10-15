# Promo video

The 55-second LinkedIn video for Primitiv (1080×1350, 4:5, 60fps, silent),
built as a React page and rendered frame by frame to MP4.

It renders the **docs site's registry components** (the canonical copies,
`apps/docs-site/src/components`) over the headless source, with the docs site's
`tokens.css`. So every density glide on screen is the real token layer doing its
job, and the video picks up component changes on its next render.

## Rendering

Needs Node 22, pnpm, ffmpeg (with libx264) and a Chromium for Playwright.

```sh
cd apps/promo-video
pnpm install --ignore-workspace   # its own pnpm root, like the docs site
npx playwright install chromium   # or set CHROMIUM_PATH to an existing Chromium
pnpm render                       # → out/primitiv-linkedin.mp4 (4 parallel jobs)
```

`pnpm build` fetches the fonts into `public/fonts/` on first run. They are
gitignored rather than committed.

While iterating, don't render the whole video:

```sh
pnpm dev                          # http://localhost:5173/?t=12.5 shows one moment, ?play loops
pnpm build && pnpm sheet 0 14.6 30 44   # out/sheet.png, a contact sheet of those times
pnpm build && pnpm stills 0             # out/still-0.00.png, e.g. for the thumbnail
```

## How it works

- **Every frame is a pure function of `t`.** `main.tsx` exposes
  `window.__seek(t)`, which re-renders `<Video t={t} />` synchronously. CSS
  transitions and animations are switched off globally (`video.css`), because
  they run on wall-clock time and would make the capture non-deterministic.
- **`Sequence`** (`timeline.tsx`) mounts a scene only inside its time window and
  re-bases time to the scene's start. Scene boundaries are the `*_START`/`*_END`
  exports in `src/scenes/`.
- **`DensityScope`** (`scopes.tsx`) glides between two densities by reading every
  density-scoped custom property from the live token layer at both ends, and
  blending the ones that differ inline (`lib/blend.ts`). At p = 0 or 1 it is
  exactly the real `data-density` attribute.
- **`ThemeScope`** sets `data-theme` and, during the rebrand, blends the brand
  ramp with `color-mix(in oklch, …)`. Setting `data-theme` on the same element
  is what makes the Intent roles re-resolve against the inline ramp.
- **The dark reveal** renders the frame twice and clips the dark copy to a
  growing circle.
- **The rebrand ramps** in `src/data/` are real `primitiv theme` output.
  Regenerate them with
  `primitiv theme --brand "#7c3aed" --format css --out src/data/theme-7c3aed.css`
  (likewise for `#e11d74`, `#ea6c0a` and `#0d9488`).
- **Swatch contrast ratios** are computed from the docs site's
  `palette-sheet.generated.json`. The lowest pairing in the shipped palette is
  4.50:1, which is why the video can say every pairing clears WCAG AA.

`pnpm test` covers the timing, blending, contrast, frame-chunking and font
helpers. `pnpm typecheck` checks the scenes against the docs-site components'
real prop types.
