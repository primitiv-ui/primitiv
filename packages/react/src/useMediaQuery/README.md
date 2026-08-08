# useMediaQuery

Tracks whether a CSS media query currently matches, re-rendering the
consumer whenever it changes.

```tsx
import { useMediaQuery } from "@primitiv-ui/react";

function NavigationMenu() {
  const isDesktop = useMediaQuery("(min-width: 64rem)");

  return isDesktop ? <DesktopNav /> : <MobileMenu />;
}
```

## Signature

```ts
function useMediaQuery(query: string): boolean;
```

| Param   | Type     | Notes                                             |
| ------- | -------- | -------------------------------------------------- |
| `query` | `string` | A media query string, e.g. `"(min-width: 40rem)"`. |

Returns whether `query` currently matches.

## Generic, not tied to Primitiv's breakpoint scale

`useMediaQuery` doesn't know about Primitiv's own `xs`/`sm`/`md`/`lg`/`xl`/`2xl`
tokens or any other design values — pass whatever query string you need,
including features other than width:

```tsx
const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
const isCompact = useMediaQuery("(max-width: 40rem)");
```

If you're using the styled registry components and want Primitiv's own
breakpoint values, `primitiv tokens` generates a `breakpoints` constants file
into your project alongside the CSS token layer — build the query string from
that rather than hardcoding the numbers:

```tsx
import { useMediaQuery } from "@primitiv-ui/react";
import { breakpoints } from "./styles/primitiv/breakpoints";

const isCompact = useMediaQuery(`(max-width: ${breakpoints.sm})`);
```

## Server rendering

`useMediaQuery` renders `false` during server rendering and on the client's
very first paint before hydration confirms the real value — there is no
`window`/`matchMedia` available on the server, so `false` is the safest
default rather than guessing. Design around a possible flash/reflow on
hydration if you're conditionally rendering off the result, the same as any
other client-only media query hook.

## Live updates

Unlike a one-time `window.matchMedia(query).matches` read, the hook
subscribes to the query's real `MediaQueryList` and re-renders on `change` —
resizing the window, rotating a device, or the query itself changing between
renders (the hook unsubscribes from the old query and resubscribes to the new
one automatically) all update the returned value.
