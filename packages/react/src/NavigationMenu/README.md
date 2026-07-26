# NavigationMenu

The **desktop dropdown site nav**: a `<nav>` landmark wrapping a list of
top-level entries, each either a plain link or a trigger that discloses a
panel. One panel is open at a time.

Implements the [ARIA APG Disclosure Navigation
Menu](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)
pattern — **not** a menubar. These are links to pages, so the semantics are
list-and-link and every top-level entry stays in the tab order.

```tsx
import { NavigationMenu } from "@primitiv-ui/react";

<NavigationMenu.Root>
  <NavigationMenu.List>
    <NavigationMenu.Item value="concepts">
      <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <NavigationMenu.Link href="/tokens">Tokens</NavigationMenu.Link>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
    <NavigationMenu.Item>
      <NavigationMenu.Link href="/changelog">Changelog</NavigationMenu.Link>
    </NavigationMenu.Item>
  </NavigationMenu.List>
</NavigationMenu.Root>;
```

## Scope: desktop only, by design

This component is the **desktop** presentation. The mobile nav is deliberately
not a mode of it: several sections expand *in place* on mobile, versus one
panel at a time on desktop, and pushing both state models into one primitive
makes it larger without making the consumer's job smaller.

Mobile is instead a composition of [`Drawer`](../Drawer/README.md) +
[`Collapsible`](../Collapsible/README.md), reusing this component's
`NavigationMenu.Link`. What stays single-sourced across both:

| Concern | Where it lives | Duplicated? |
| --- | --- | --- |
| Nav data (sections → children) | one module in your app, `.map()`ed by both | **No** |
| Active state / `aria-current` | `NavigationMenu.Link`, used verbatim in both | **No** |
| Panel/row wrapper elements | `List`/`Item`/`Trigger`/`Content` vs `Collapsible.*` | Yes — ~15 lines each |

There is also an accessibility argument for the split: rendering one shared
tree and hiding half of it by breakpoint puts duplicate landmarks and
duplicate `id`s in the accessibility tree. See RFC 0019 §3–4a.

## Sub-components

| Export | Role | Notes |
| --- | --- | --- |
| `NavigationMenu.Root` | `<nav>` + state owner | `aria-label="Main"` by default; uncontrolled (`defaultValue`) or controlled (`value` + `onValueChange`), where `""` means closed |
| `NavigationMenu.List` | `<ul>` | Top-level entries; carries `data-orientation` |
| `NavigationMenu.Item` | `<li>` | Its `value` is what makes the entry a disclosure — omit it for a plain link entry |
| `NavigationMenu.Trigger` | `<button>` | `aria-expanded`/`aria-controls`, hover-intent, keyboard; supports `asChild` and ref composition |
| `NavigationMenu.Content` | The panel | `hidden` while closed; `forceMount` for CSS animation; portals into a `Viewport` when one exists |
| `NavigationMenu.Viewport` | Shared panel host | **Optional.** All panels render into this one box so the open one morphs into the next |
| `NavigationMenu.Indicator` | Marker | **Optional.** Publishes the open trigger's measured geometry as custom properties; supports `asChild` so the marker can be an icon |
| `NavigationMenu.Link` | `<a>` | `active` → `aria-current="page"` + `data-active`; closes the menu on click; supports `asChild` |

## `Item` value: disclosure vs plain link

`value` on `NavigationMenu.Item` is the whole distinction:

```tsx
{/* A disclosure — has a panel */}
<NavigationMenu.Item value="concepts">
  <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
  <NavigationMenu.Content>…</NavigationMenu.Content>
</NavigationMenu.Item>

{/* A plain link — no panel, no value */}
<NavigationMenu.Item>
  <NavigationMenu.Link href="/changelog">Changelog</NavigationMenu.Link>
</NavigationMenu.Item>
```

A `Trigger` or `Content` inside a value-less `Item` **throws** with the fix in
the message, rather than silently deriving an id that could never be opened.

Note `value=""` is *not* the same as omitting it: the empty string is the
"nothing is open" sentinel, so an `Item` that adopts it gets a `Trigger` and
`Content` that can never report open. Give every disclosure entry a real value.

## State modes

- **Uncontrolled** — pass `defaultValue` to start with one panel open, or omit
  it to start closed.
- **Controlled** — pass `value` and `onValueChange` together. Closing calls
  `onValueChange("")`.

The two shapes are discriminated at the type level: passing `defaultValue`
alongside `value` is a type error.

A common controlled use is closing the menu on every route change:

```tsx
const [open, setOpen] = useState("");
const { pathname } = useLocation();
useEffect(() => setOpen(""), [pathname]);

<NavigationMenu.Root value={open} onValueChange={setOpen}>…</NavigationMenu.Root>;
```

## Hover intent

| Prop | Default | Behaviour |
| --- | --- | --- |
| `openOnHover` | `true` | Whether hover opens a panel at all |
| `delayDuration` | `200` | ms of hover before the **first** panel opens; `0` opens immediately |
| `closeDelay` | `150` | ms the panel survives after the pointer leaves the `<nav>` |

Two details worth knowing:

- **Switching is instant.** `delayDuration` guards only the first open. Once a
  panel is open, crossing to a sibling trigger swaps panels with no delay —
  waiting again feels broken.
- **The close intent lives on the `<nav>`, not the trigger.** That is what lets
  the pointer travel from a trigger down into its own panel without dismissing
  it. Returning to the nav within `closeDelay` cancels the pending close.

Set `openOnHover={false}` for a click-only nav. Hover-to-open has no touch
equivalent, so this is the right choice if the same markup serves touch.

### Click after hover

A pointer that arrives to click fires `pointerenter` first, which with
hover-to-open opens the panel *before* the click lands. The trigger therefore
toggles against what was open when the pointer **arrived**, so a click never
undoes the user's own hover. A second click on a still-hovered trigger closes,
as expected.

## Keyboard interaction

| Key | Behaviour |
| --- | --- |
| `Enter` / `Space` | Toggle the focused trigger's panel |
| `ArrowRight` / `ArrowLeft` | Move between top-level entries (horizontal), mirrored under `dir="rtl"` |
| `ArrowUp` / `ArrowDown` | Move between top-level entries (vertical) |
| `Home` / `End` | First / last top-level entry |
| `ArrowDown` (horizontal), `ArrowRight`/`ArrowLeft` (vertical) | Open the panel and move focus to its first link |
| `Escape` | Close the open panel and return focus to its trigger |

Movement **wraps** at the ends.

**Not a roving tabindex.** Every top-level entry keeps `tabIndex` untouched and
stays in the tab order — a keyboard user must be able to Tab through page links
without discovering that arrow keys are required. `useRovingTabindex` is used
internally for its orientation/RTL-aware keymap only.

**Panel links are not top-level entries.** A `Link` inside a `Content` is
reached by Tab and is excluded from the top-level arrow order, so `Home`/`End`
inside a panel don't jump out of it.

`Escape` is handled once on the `<nav>` so it works from anywhere inside the
menu, including a link deep in an open panel, and returns focus to the trigger
so the user is never stranded on an element that just became `hidden`.

## Viewport — the shared panel box

Mount a `Viewport` when you want the desktop "one panel morphs into the next"
behaviour. Every `Content` portals into it, so a CSS transition on its size
animates between panels instead of each entry expanding separately:

```tsx
<NavigationMenu.Root>
  <NavigationMenu.List>…</NavigationMenu.List>
  <NavigationMenu.Viewport className="viewport" />
</NavigationMenu.Root>
```

```css
.viewport { transition: height 200ms; }
.viewport[data-value="registry"] { height: 12rem; }
```

Authoring does not change: always nest each `Content` inside its `Item`, next
to its `Trigger`. Omit the `Viewport` entirely and panels render in place.

## Indicator — geometry, not styling

No styles ship with the library, so the `Indicator` cannot position itself —
but it is the only part that can know *where* the open trigger is. It measures
that trigger and publishes the result as two inline custom properties:

| Custom property | Horizontal | Vertical |
| --- | --- | --- |
| `--primitiv-navigation-menu-indicator-position` | trigger `offsetLeft` | trigger `offsetTop` |
| `--primitiv-navigation-menu-indicator-size` | trigger `offsetWidth` | trigger `offsetHeight` |

```css
.indicator {
  position: absolute;
  inset-block-end: 0;
  block-size: 2px;
  inline-size: var(--primitiv-navigation-menu-indicator-size);
  translate: var(--primitiv-navigation-menu-indicator-position) 0;
  transition: translate 200ms, inline-size 200ms;
}
```

Both are re-measured when the open entry changes and on window `resize`.
When the open value names an entry with no rendered trigger, neither property
is set — better an unpositioned marker than one parked at `0`.

`Indicator` also supports `asChild`, so the marker can be an icon rather than a
styled box — the `data-*` hooks and the geometry properties are merged onto your
element either way:

```tsx
<NavigationMenu.Indicator asChild>
  <ChevronUpIcon aria-hidden />
</NavigationMenu.Indicator>
```

## Panel motion — which way the pointer travelled

When the open entry changes, the two panels involved report the direction of
travel as `data-motion`, so a stylesheet can slide them instead of cross-fading
every switch:

| Value | Meaning |
| --- | --- |
| `from-end` | Entering, and the previous entry was earlier in the list |
| `from-start` | Entering, and the previous entry was later |
| `to-start` | Leaving, and the newly-open entry is later |
| `to-end` | Leaving, and the newly-open entry is earlier |

The attribute is **absent** for the two transitions with no direction — the first
open (nothing to travel from) and the full close (nothing to travel to) — and for
an entry with no registered trigger, since a direction derived from an unknown
position would be a guess. Those cases just fade.

## Viewport size — the one-box morph

`Viewport` measures the open panel and publishes it, the same split the
`Indicator` uses:

| Custom property | Value |
| --- | --- |
| `--primitiv-navigation-menu-viewport-width` | the open panel's `offsetWidth` |
| `--primitiv-navigation-menu-viewport-height` | its `offsetHeight` |

```css
.viewport {
  inline-size: var(--primitiv-navigation-menu-viewport-width, auto);
  block-size: var(--primitiv-navigation-menu-viewport-height, auto);
  transition: inline-size 200ms, block-size 200ms;
}
```

The measurement is **kept through the close** rather than cleared: clearing it
would collapse the box at the very moment the exit needs its size. Re-measured on
window `resize`, like the Indicator.

## Link active state

`NavigationMenu.Link` does **no route matching**. You own the router, so you
own the comparison:

```tsx
<NavigationMenu.Link href="/tokens" active={pathname === "/tokens"}>
  Tokens
</NavigationMenu.Link>
```

**A top-level link also closes on hover** (when `openOnHover` is on), so
travelling along the bar past a plain entry behaves like travelling onto another
trigger — without it, moving from an open trigger onto a link beside it leaves
that panel hanging over the page. Links *inside* a panel are exempt, for the
obvious reason.

Clicking any `Link` closes the open panel, whether the link sits in a panel or
beside one — leaving a panel hanging open over the page the user just navigated
to is the bug this avoids. Veto it by calling `event.preventDefault()` in your
own `onClick`.

## `asChild`

`Trigger`, `Link` and `Indicator` all support `asChild`, merging their props onto a
consumer element via [`Slot`](../Slot/README.md) — handlers compose, `style`
shallow-merges with the child winning, `className` concatenates, refs compose.

```tsx
<NavigationMenu.Link asChild active={isActive}>
  <RouterLink to="/tokens">Tokens</RouterLink>
</NavigationMenu.Link>
```

`Trigger`'s internal registry ref composes with a consumer `ref`, so arrow-key
travel keeps working through either escape hatch.

## Styling hooks

| Element | Attributes |
| --- | --- |
| `Root` (`<nav>`) | `data-orientation` |
| `List` (`<ul>`) | `data-orientation` |
| `Trigger` | `data-state="open" \| "closed"` |
| `Content` | `data-state="open" \| "closed"`, `data-motion` |
| `Viewport` | `data-state`, `data-orientation`, `data-value`, measured-size custom properties |
| `Indicator` | `data-state`, `data-orientation`, `data-value`, geometry custom properties |
| `Link` | `data-active=""` when active (omitted otherwise) |

## Animation

`Content`, `Viewport` and `Indicator` each take `forceMount`, which swaps the
`hidden` attribute for `aria-hidden` while closed. `hidden` cannot be animated
away from; `aria-hidden` keeps the element out of the accessibility tree while
leaving CSS free to transition it:

```tsx
<NavigationMenu.Content forceMount className="panel" />
```

```css
.panel { opacity: 0; transition: opacity 150ms; }
.panel[data-state="open"] { opacity: 1; }
```

## Reading direction

`dir` (`"ltr"` / `"rtl"`) sets the horizontal arrow-key direction and the
`<nav>`'s `dir` attribute. When omitted it is inherited from the nearest
[`DirectionProvider`](../DirectionProvider/README.md), falling back to `"ltr"`.
Only the horizontal arrow pair mirrors; `Home`/`End` stay anchored to the start
and end of the list.
