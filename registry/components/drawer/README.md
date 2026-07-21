# Drawer

The Primitiv **Drawer** — an accessible dialog that slides in from a screen edge,
built on the native `<dialog>` element. It is a [Modal](../modal/README.md) docked
to an edge: it reuses Modal's `<dialog>` machinery wholesale (focus trap, inert
background, top layer, `Esc`, click-outside, controlled / uncontrolled state, the
imperative open/close API) and adds a single presentational axis — **`side`**.

`primitiv add drawer` copies this styled surface into your project. The files are
yours to edit; the stable contract is the class names, the `--sm…--xl` size
modifiers, the `data-state` / `data-side` hooks, and the `--primitiv-drawer-*`
custom properties (RFC 0006 Principle 2 — names are stable, values are not).

## Anatomy

A vertical stack of three regions, mirroring Modal:

- **`DrawerHeader`** — the title row (`DrawerTitle` + close), divided below.
- **`DrawerBody`** — the description + content; the one region that **scrolls**
  when content overflows, so the header and footer stay pinned to the edges.
- **`DrawerFooter`** — right-aligned actions, divided above.

The native `::backdrop` is the dim (and the click-outside surface). `DrawerOverlay`
is an optional decorative sibling for a custom backdrop layer — not needed for the
default dim.

**Pass `forceMount` to `DrawerPortal`** so the panel stays mounted while closed and
its slide-out exit can play (see [Animation](#animation)).

## Usage

```tsx
import {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from "@/components/drawer";
import { Button } from "@/components/button";
import { Close } from "@primitiv-ui/icons";

<Drawer>
  <DrawerTrigger asChild>
    <Button variant="secondary">Open filters</Button>
  </DrawerTrigger>
  <DrawerPortal forceMount>
    <DrawerContent side="right" width="md">
      <DrawerHeader>
        <DrawerTitle>Filters</DrawerTitle>
        <DrawerClose asChild>
          <Button variant="ghost" size="sm" aria-label="Close">
            <Close />
          </Button>
        </DrawerClose>
      </DrawerHeader>
      <DrawerBody>
        <DrawerDescription>Narrow the results below.</DrawerDescription>
        {/* form fields, lists, copy… */}
      </DrawerBody>
      <DrawerFooter>
        <DrawerClose asChild>
          <Button variant="secondary">Cancel</Button>
        </DrawerClose>
        <Button variant="primary">Apply</Button>
      </DrawerFooter>
    </DrawerContent>
  </DrawerPortal>
</Drawer>;
```

## Props

`DrawerContent` carries the two presentational axes; every other part forwards
its native element props (plus `asChild` on the headless parts).

| Prop | Values | Default | Effect |
|---|---|---|---|
| `side` | `top` · `right` · `bottom` · `left` | `right` | Which edge the panel docks to and slides in from. Emitted as `data-side`. |
| `width` | `xs` · `sm` · `md` · `lg` · `xl` | `md` | The panel's **cross-axis** extent, off the `size/*` scale — width for a left/right drawer (168 · 200 · 240 · 288 · 344px), height for a top/bottom sheet. The long axis always fills the viewport. |

For an arbitrary cross-axis size, override the `--primitiv-drawer-size` custom
property via `style` (e.g. `style={{ "--primitiv-drawer-size": "32rem" }}`)
instead of the `width` prop.

Padding, gap, and radius stay density-driven and **independent of `width`** —
`data-density` on an ancestor scales them (they reuse the `modal/*` tokens, so a
drawer's inner spacing matches a modal's), whatever width you pick.

## Animation

The panel slides in from its `side` and the `::backdrop` fades — and on close it
slides **back out the same way** (the exit is the reverse of the enter). It's done
with CSS transitions keyed off the native `[open]` attribute plus `@starting-style`
(for the enter's starting frame); `transition-behavior: allow-discrete` on
`display` + `overlay` keeps the dialog painted in the top layer through the close,
so it animates out instead of snapping (a native `<dialog>` sets `display: none`
the instant it closes). Both phases use `--primitiv-motion-duration-overlay` with
`--primitiv-motion-easing-enter` / `-exit`; `prefers-reduced-motion: reduce` drops
them.

**The exit only plays if the panel stays mounted while closed — pass `forceMount`
to `DrawerPortal`** (without it the subtree unmounts immediately and you'll see the
enter but not the exit).

## Files

| File | Purpose |
|---|---|
| `drawer.tsx` | The styled wrapper — parts wrapping the headless `Drawer` primitive. |
| `drawer.recipe.ts` | `cva` recipe mapping the `width` variant to modifier classes. |
| `styles.css` | The default theme (canonical). |
| `styles.scss` | The CSS plus a `$`-alias per custom property, for SCSS consumers. |
| `contract.json` | The stable surface metadata (parts, modifiers, custom properties). |

## Dependencies

- [`@primitiv-ui/react`](https://www.npmjs.com/package/@primitiv-ui/react) — the
  headless `Drawer` (and `Modal`) primitives.
- [`class-variance-authority`](https://cva.style) — the recipe.
- The **token layer** (`primitiv tokens`) for the `--primitiv-surface-*`,
  `--primitiv-content-*`, `--primitiv-modal-*`, `--primitiv-elevation-*`,
  `--primitiv-motion-*`, and related custom properties the stylesheet resolves.
