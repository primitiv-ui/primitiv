# Tooltip

The Primitiv **Tooltip** — a deferred, non-modal label anchored to a trigger,
shown on hover / focus. A flat bubble with a pointer arrow, built on the headless
`Tooltip` (a portalled `<div role="tooltip">` with CSS anchor positioning).

`primitiv add tooltip` copies this styled surface into your project. The files are
yours to edit; the stable contract is the class names, the `--default`/`--inverted`
tone modifiers, the `--sm…--xl` size modifiers, the 12 placement modifiers, the
`data-state` hook, and the `--primitiv-tooltip-*` custom properties.

## Tone

- **`default`** — a high-contrast **dark** bubble (`content/primary` fill,
  `content/inverse` text). Both are theme-scoped, so it inverts: dark in light
  mode, light in dark mode. Use on normal (light-ish) surfaces.
- **`inverted`** — a **surface-coloured** bubble (`surface/default` fill,
  `content/primary` text). For use on dark backgrounds.

The bubble is flat (no shadow, no border) — the tone carries the contrast. The
arrow shares `--primitiv-tooltip-surface`, so it always matches the bubble.

## Usage

Wire `anchor-name` on the trigger and a matching `position-anchor` on the bubble
(unique per instance), and pass `forceMount` to the Portal so the exit can play:

```tsx
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow,
} from "@/components/tooltip";
import { Button } from "@/components/button";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button style={{ anchorName: "--save-tip" }}>Save</Button>
    </TooltipTrigger>
    <TooltipPortal forceMount>
      <TooltipContent
        forceMount
        placement="top"
        size="md"
        tone="default"
        style={{ positionAnchor: "--save-tip" }}
      >
        Save your changes
        <TooltipArrow />
      </TooltipContent>
    </TooltipPortal>
  </Tooltip>
</TooltipProvider>;
```

**`TooltipProvider` is required** — the headless Tooltip throws if its parts
render without one. Wrap it once high in your tree (it holds the shared hover
open/close delay); every `Tooltip` beneath it works.

## Props (on `TooltipContent`)

| Prop | Values | Default | Effect |
|---|---|---|---|
| `tone` | `default` · `inverted` | `default` | Bubble colour treatment (see [Tone](#tone)). |
| `size` | `sm` · `md` · `lg` · `xl` | `md` | Bubble size; `data-density` scales padding within each. |
| `placement` | `top`/`right`/`bottom`/`left` (+ `-start`/`-end`) | `top` | Side + alignment; sets `position-area` and points the arrow. |

## Animation

The bubble scales + fades in, and **out in reverse on close**. It's CSS
transitions keyed off `data-state` plus `@starting-style`; `transition-behavior:
allow-discrete` on `display` holds the bubble through the close so it animates out
instead of snapping. Unlike Modal / Drawer / Popover there's **no `overlay`** —
a tooltip `<div>` isn't a top-layer element — but it **does need `forceMount` on
both `TooltipPortal` and `TooltipContent`** (each gates on it independently:
without it on the Content, the `<div>` returns `null` on close and only the enter
shows). `prefers-reduced-motion: reduce` drops the animation.

## Files

| File | Purpose |
|---|---|
| `tooltip.tsx` | The styled wrapper — parts wrapping the headless `Tooltip`. |
| `tooltip.recipe.ts` | `cva` recipe mapping the tone / size / placement variants. |
| `styles.css` | The default theme (canonical). |
| `styles.scss` | The CSS plus a `$`-alias per custom property, for SCSS consumers. |
| `contract.json` | The stable surface metadata (parts, modifiers, custom properties). |

## Dependencies

- [`@primitiv-ui/react`](https://www.npmjs.com/package/@primitiv-ui/react) — the
  headless `Tooltip`.
- [`class-variance-authority`](https://cva.style) — the recipe.
- The **token layer** (`primitiv tokens`) for the `--primitiv-tooltip-*`,
  `--primitiv-content-*`, `--primitiv-surface-*`, `--primitiv-body-*`, and
  `--primitiv-motion-*` custom properties the stylesheet resolves.
