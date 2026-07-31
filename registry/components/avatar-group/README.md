# AvatarGroup

An overlapping row of Avatars with an optional `+N` overflow counter — the
collaborators/attendees pattern.

```sh
primitiv add avatar-group
```

## Usage

```tsx
import { AvatarGroup } from "@/components/avatar-group";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/avatar";

<AvatarGroup size="md" max={4}>
  {members.map((m) => (
    <Avatar key={m.id} size="md">
      <AvatarImage src={m.avatar} alt="" />
      <AvatarFallback>{m.initials}</AvatarFallback>
    </Avatar>
  ))}
</AvatarGroup>;
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Drives overlap and ring width. **Pass the same value to each `Avatar`** — they are your elements, so the group can't set it for them. |
| `direction` | `"ltr" \| "rtl"` | `"ltr"` | Which way the stack advances; also decides which end the counter lands on. |
| `max` | `number` | — | Show at most this many faces and replace the rest with `+N`. Omit for no counter. |
| `overflowLabel` | `(count: number) => string` | ``(n) => `${n} more` `` | Accessible label for the counter. |

## Notes

**The counter is an Avatar, not a Badge.** Badge ships only
`success | warning | info | danger` with no neutral, so it would force a
semantic colour onto something that isn't a status — and a counter Badge is a
dot beside a 40px avatar. An Avatar-shaped counter inherits the ring, size,
shape and radius for free.

**Tooltips are not owned here.** Naming faces would mean the group owning
member data, which no Primitiv composite does (RFC 0019 §4c). Wrap each
`Avatar` in your own `Tooltip` when you need names.

**Circles only.** Overlapping squares turn the separating ring into a notch and
lose the row-of-faces read, so there's no `shape` prop.

## Gotchas

**The ring breaks on a non-surface background.** It's `surface/default`-coloured
to read as a cutout between overlapping faces, so on a coloured or dark panel
re-point it:

```css
.hero .primitiv-avatar-group {
  --primitiv-avatar-group-ring-color: var(--primitiv-color-brand-600);
}
```

**Stacking order is set inline, not in CSS.** Each face gets a descending
`z-index` so the *first* face paints on top; CSS can't see the child count, so
the wrapper assigns it. The counter is lifted above all of them by
`.primitiv-avatar-group__item--counter`.

**The overlap token is positive; the CSS negates it.** `--primitiv-avatar-group-*-overlap`
is a positive space step and the stylesheet applies
`calc(-1 * …)`. The Figma variable stores the *negative* instead, because Figma
can't negate a bound variable — the opposite signs are deliberate.

## Files

| File | Purpose |
| --- | --- |
| `avatar-group.tsx` | The wrapper — truncation + stacking order. |
| `avatar-group.recipe.ts` | `cva` recipe for size and direction. |
| `styles.css` | Default theme. |
| `styles.scss` | The same CSS plus `$primitiv-avatar-group-*` aliases. |
| `contract.json` | Class names and custom properties. |

## Dependencies

- The registry `avatar` component (the counter is an `Avatar`).
- The token layer (`primitiv tokens`).
