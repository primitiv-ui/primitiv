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

## Panel transitions

The viewport is sized by `--primitiv-navigation-menu-viewport-width` /
`-height`, each falling back to `auto`. **The headless does not publish these
yet**, so today the panel hugs its content and cross-fades between entries. When
the primitive starts publishing measured panel dimensions, the same rules animate
the box between panels — the Radix viewport-morph effect — with no stylesheet
change. Until then, a consumer can drive the morph by setting the size per open
value:

```css
.primitiv-navigation-menu__viewport[data-value="concepts"] {
  --primitiv-navigation-menu-viewport-height: 12rem;
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
