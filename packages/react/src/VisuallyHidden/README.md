# VisuallyHidden

Visually hides its children while keeping them in the accessibility tree,
implementing the standard
[screen-reader-only pattern](https://www.w3.org/WAI/WCAG21/Techniques/css/C7).

```tsx
import { VisuallyHidden } from "@primitiv/react";

<button>
  <SearchIcon aria-hidden="true" />
  <VisuallyHidden>Search</VisuallyHidden>
</button>;
```

## Props

| Prop        | Type                     | Default | Notes                                              |
| ----------- | ------------------------ | ------- | -------------------------------------------------- |
| `asChild`   | `boolean`                | `false` | Render the consumer's element instead of a `<span>` |
| `style`     | `CSSProperties`          | —       | Merged on top of the clip styles                  |
| `className` | `string`                 | —       | Applied directly to the rendered element          |
| `...rest`   | `ComponentProps<"span">` | —       | All other `<span>` props, including `aria-*`       |

## Functional styles

Unlike other `@primitiv/react` components, `VisuallyHidden` ships inline
styles — the clip rectangle that removes content from the visual layout
*is* the component's behaviour, not decoration:

```css
position: absolute;
width: 1px;
height: 1px;
padding: 0;
margin: -1px;
overflow: hidden;
clip: rect(0 0 0 0);
clip-path: inset(50%);
white-space: nowrap;
border-width: 0;
```

A consumer `style` is merged on top, so any individual property can still
be overridden.

## asChild

Pass `asChild` to hide the consumer's own element instead of a `<span>` —
useful when the hidden content needs specific semantics:

```tsx
<VisuallyHidden asChild>
  <h2>Section heading</h2>
</VisuallyHidden>
```

The clip styles are merged onto the child element via the `Slot` utility.
