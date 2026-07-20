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

`DrawerOverlay` is the decorative backdrop sibling (the native `::backdrop`
handles the real dim + click-outside).

## Usage

```tsx
import {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerOverlay,
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
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerContent side="right" size="md">
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
| `size` | `sm` · `md` · `lg` · `xl` | `md` | The panel's **cross-axis** extent — width for a left/right drawer (320 · 384 · 480 · 576px), height for a top/bottom sheet. |

Density is ambient: `data-density` on an ancestor scales the padding within each
size (the spacing reuses the `modal/*` tokens, so a drawer matches a modal).

## Files

| File | Purpose |
|---|---|
| `drawer.tsx` | The styled wrapper — parts wrapping the headless `Drawer` primitive. |
| `drawer.recipe.ts` | `cva` recipe mapping the `size` variant to modifier classes. |
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
