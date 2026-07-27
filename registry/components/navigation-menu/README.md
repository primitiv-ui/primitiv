# NavigationMenu

The **desktop dropdown site nav** — a transparent bar of top-level entries, each
either a plain link or a trigger that discloses a panel, with one panel open at a
time. Implements the [ARIA APG Disclosure Navigation
Menu](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)
pattern, **not** a menubar: these are links to pages, so every entry stays in the
tab order.

```tsx
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuTriggerLabel,
  NavigationMenuTriggerIcon,
  NavigationMenuContent,
  NavigationMenuViewport,
  NavigationMenuIndicator,
  NavigationMenuLink,
  NavigationMenuLinkTitle,
  NavigationMenuLinkDescription,
} from "@/components/navigation-menu";
import { ChevronDownIcon } from "@primitiv-ui/icons";

<NavigationMenu size="md">
  <NavigationMenuList>
    <NavigationMenuItem value="concepts">
      <NavigationMenuTrigger>
        <NavigationMenuTriggerLabel>Concepts</NavigationMenuTriggerLabel>
        <NavigationMenuTriggerIcon>
          <ChevronDownIcon />
        </NavigationMenuTriggerIcon>
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuLink placement="panel" href="/tokens">
          <NavigationMenuLinkTitle>Tokens</NavigationMenuLinkTitle>
          <NavigationMenuLinkDescription>
            The three-tier token architecture
          </NavigationMenuLinkDescription>
        </NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>

    <NavigationMenuItem>
      <NavigationMenuLink href="/changelog">Changelog</NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>

  <NavigationMenuIndicator />
  <NavigationMenuViewport />
</NavigationMenu>;
```

## Scope: desktop only, by design

This is the **desktop** presentation. The mobile nav is a composition of `Drawer`
+ `Collapsible` reusing `NavigationMenuLink`, not a mode of this component — on
mobile several sections expand *in place*, versus one panel at a time here. See
RFC 0019 §3–4a. The stylesheet therefore styles the horizontal bar only; the
headless primitive still supports `orientation="vertical"`, but no vertical
styled surface ships.

## Files

| File | Role |
| --- | --- |
| `navigation-menu.tsx` | The wrapper — **hand-authored** (RFC 0004 D53), not generated |
| `navigation-menu.recipe.ts` | `cva` recipes mapping variant props to modifier classes |
| `styles.css` | The default theme |
| `styles.scss` | The same CSS plus `$primitiv-navigation-menu-*` aliases |
| `contract.json` | Metadata: modifiers, subcomponents, every custom property |

## The two Link placements

The headless has **one** `Link` part; it appears in two places with different
geometry, so the wrapper exposes a `placement` prop (mirroring the Figma
`Navigation Menu / Bar Link` and `Navigation Menu / Panel Link` sets):

| `placement` | Shape |
| --- | --- |
| `bar` (default) | A one-line top-level entry, sharing the trigger's geometry minus the chevron |
| `panel` | A row inside an open panel — title plus optional description, with optional leading/trailing slots |

It is an explicit prop rather than a descendant selector so the class is visible
in the markup and the two can't be confused.

## Panel rows

`LinkTitle`, `LinkDescription`, `LinkLeading` and `LinkTrailing` are
presentational spans with no headless counterpart — the same approach as
Dropdown's row slots. The description is bound **one size slot below** its title
(`body/sm` under `label/md`, and so on); bound to the same slot they read as
equals and the row loses its hierarchy. Omit `LinkDescription` for a one-line row.

`LinkTrailing` keeps its natural width and is pushed to the far edge, so a badge
or shortcut sits flush right while an icon stays square.

## Indicator

`marker="arrow"` (the default) is a rotated square sharing the panel's fill,
centred on the open trigger and straddling the panel's top edge.
`marker="underline"` is a rule beneath the trigger, the width of its label.

Both read the geometry the headless publishes on the indicator element —
`--primitiv-navigation-menu-indicator-position` (the trigger's `offsetLeft`) and
`-size` (its `offsetWidth`). This works without any anchor-positioning wiring
because the `<nav>` is `position: relative` and therefore the trigger's
`offsetParent`, so the published numbers are already in the right coordinate
space. Both fall back to `0` when the open value names an entry with no rendered
trigger.

## Panel positioning

The panel hugs its own content's width and centers itself under whichever
trigger is open — it does **not** stretch to the nav's full width, and it
isn't always anchored to the nav's start edge. This is CSS anchor positioning,
but unlike [`dropdown`](../dropdown/README.md) and
[`popover`](../popover/README.md) it needs **no consumer wiring at all**: every
`Trigger` publishes its own `anchor-name`, and `Root` publishes whichever one
is open as `--primitiv-navigation-menu-active-trigger-anchor`, which the
stylesheet's `position-anchor` reads directly.

A trigger near either end of the bar clamps instead of overflowing: the panel
grows away from the edge it's nearest to (toward the end when the trigger is
near the start, and vice versa) rather than spilling past the nav's own
boundary, via named `@position-try` fallbacks.

This only takes effect in browsers with CSS anchor-positioning support — the
whole mechanism sits behind `@supports (anchor-name: …)`. Elsewhere the panel
falls back to the plain nav-start-anchored insets, which is why NavigationMenu
keeps this fallback at all: unlike Dropdown/Popover it has to keep working
everywhere, not just in Chromium.

## Panel transitions

Three things happen when the open entry changes:

- **The box morphs.** `Viewport` measures the open panel and publishes
  `--primitiv-navigation-menu-viewport-width` / `-height`; the stylesheet
  transitions both, falling back to hugging its content before the first
  measurement lands.
- **The panels slide in the direction of travel.** `Content` publishes
  `data-motion` (`from-start` / `from-end` / `to-start` / `to-end`), and the
  stylesheet turns that into a translate of
  `--primitiv-navigation-menu-panel-slide`. Transitions with no direction — the
  first open and the full close — just fade.
- **Nothing reflows.** Every panel shares one grid cell in the viewport and is
  hidden with `visibility`, not `display`, so a switch can't stack them and the
  closing panel keeps its size and its place while it fades.

Override the size per entry if you'd rather pin it than measure it:

```css
.primitiv-navigation-menu__viewport[data-value="concepts"] {
  --primitiv-navigation-menu-viewport-height: 12rem;
}
```

`--primitiv-navigation-menu-panel-slide` (default `space-68`, 4.25rem/68px — the
scale's nearest step to a 64px target) is a hint about which way the pointer
travelled, not the full journey Radix's own reference implementation makes
(200px). Override it with any token or length to travel further or less:

```css
.primitiv-navigation-menu {
  --primitiv-navigation-menu-panel-slide: var(--primitiv-space-space-200);
}
```

## Hover forgiveness

Two things keep the panel from vanishing the moment the pointer strays:

- A transparent strip bridges the gap between the bar and the panel, so travelling
  down into the panel never leaves the nav.
- `--primitiv-navigation-menu-safe-area` (default `space-8`) adds a transparent
  collar just outside the open panel, so grazing its edge doesn't immediately trip
  the close timer. It only exists while the panel is open — an always-on collar
  would capture clicks on whatever sits beside a closed panel. Set it to `0` to
  opt out.

Neither is a substitute for the headless `closeDelay` prop (default 150 ms), which
is the other lever: raise it for a more forgiving nav, lower it for a snappier one.

Fading the panel in and out at all requires `forceMount` on `Content` /
`Viewport` / `Indicator` — without it the headless applies `hidden` when closed
and there is nothing left to transition.

## Borderless, by necessity

The panel has **no border**: one would draw a seam across the arrow's base. The
shadow is a chained `filter: drop-shadow(...)` rather than a `box-shadow`, so it
wraps panel + arrow as a single silhouette — the same technique
[`popover`](../popover/README.md) uses, and the reason `elevation/overlay` is
rebuilt here as three drop-shadow layers rather than referenced directly.

The panel surface is `surface/floating`, not `surface/default`: identical in
light, but in dark mode `floating` lifts to a raised neutral where `default` is
the page black.

## Tokens

Geometry comes from the **`nav-item/*`** Context family (a nav entry is not a
bordered control, so it carries no border tokens), with the radius and focus-ring
radii from `framed-control/*` and the panel's radius/padding from the shared
`dropdown/*/panel/*` tokens — resolved directly, with **no dependency on the
`dropdown` component**, the same approach `select` takes.

Every knob is listed in `contract.json`; override any of them on the root.

## Dependencies

- `@primitiv-ui/react` — the headless `NavigationMenu` primitive
- `class-variance-authority` — the recipe

No component dependencies.
