# Slider

Headless, accessible **Slider** — a compound component implementing the
[WAI-ARIA Slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/)
and the
[Multi-Thumb Slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/).
The value is always an **array of numbers**, with one thumb per entry. Zero
styles ship.

```tsx
import { Slider } from "@primitiv/react";

<Slider.Root defaultValue={[40]} aria-label="Volume">
  <Slider.Track>
    <Slider.Range />
  </Slider.Track>
  <Slider.Thumb />
</Slider.Root>
```

## Sub-components

| Export | Element | ARIA / data hooks | `asChild` |
|--------|---------|-------------------|-----------|
| `Slider.Root` | `<span>` | `data-orientation`, `data-disabled` | yes |
| `Slider.Track` | `<span>` | `data-orientation`, `data-disabled` | yes |
| `Slider.Range` | `<span>` | `data-orientation`, `data-disabled`, inline position `style` | yes |
| `Slider.Thumb` | `<span>` | `role="slider"`, `aria-valuemin/max/now`, `aria-orientation`, `aria-disabled`, `data-orientation`, `data-disabled`, inline position `style` | yes |

Render **one `Slider.Thumb` per entry** in the value array, in order. A
single-thumb slider has one thumb; a range slider has two; any number is
supported.

## Root props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `min` | `number` | `0` | Lowest value. |
| `max` | `number` | `100` | Highest value. Must be greater than `min`. |
| `step` | `number` | `1` | Granularity. Must be greater than `0`. |
| `minStepsBetweenThumbs` | `number` | `0` | Minimum gap (in steps) kept between adjacent thumbs. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Layout axis. |
| `dir` | `"ltr" \| "rtl"` | inherited | Reading direction (horizontal). Inherited from `DirectionProvider`, else `"ltr"`. |
| `inverted` | `boolean` | `false` | Reverse the direction the value increases. |
| `disabled` | `boolean` | `false` | Disable all interaction. |
| `name` | `string` | — | Render hidden inputs for form submission. |
| `defaultValue` / `value` | `number[]` | `[min]` | Uncontrolled / controlled value. |
| `onValueChange` | `(value: number[]) => void` | — | Fires on every change. |
| `onValueCommit` | `(value: number[]) => void` | — | Fires once when an interaction ends. |

## State modes

### Uncontrolled

Pass `defaultValue` (or omit it for a single thumb seeded at `min`). The
component owns the value internally.

```tsx
<Slider.Root defaultValue={[25, 75]} aria-label="Price range">
  <Slider.Track>
    <Slider.Range />
  </Slider.Track>
  <Slider.Thumb />
  <Slider.Thumb />
</Slider.Root>
```

### Controlled

Pass `value` and `onValueChange` together. The parent owns the value.

```tsx
const [value, setValue] = useState([20, 80]);

<Slider.Root value={value} onValueChange={setValue}>
  <Slider.Track>
    <Slider.Range />
  </Slider.Track>
  <Slider.Thumb />
  <Slider.Thumb />
</Slider.Root>
```

### Committing the final value

`onValueChange` fires on every increment during a drag. `onValueCommit` fires
**once** with the settled array when the interaction ends — use it to persist
only the final value.

```tsx
<Slider.Root
  defaultValue={[40]}
  onValueCommit={(value) => save(value)}
>
  …
</Slider.Root>
```

## Keyboard interaction

Each thumb is independently focusable.

| Key | Behaviour |
|-----|-----------|
| `Arrow Right` / `Arrow Up` | Increase by `step` |
| `Arrow Left` / `Arrow Down` | Decrease by `step` |
| `Page Up` / `Page Down` | Increase / decrease by ten steps |
| `Home` / `End` | Jump to `min` / `max` |

Arrow direction follows `orientation`, `dir`, and `inverted`. A thumb cannot
cross its neighbours, and `minStepsBetweenThumbs` enforces a configurable gap.

## Orientation

Pass `orientation="vertical"` for a vertical slider. Pointer interaction maps
the Y axis to the value and thumbs are positioned from the bottom edge.

## Reading direction & inversion

`dir="rtl"` flips a horizontal slider so the value increases leftwards.
`inverted` reverses the direction the value increases on either axis. Both
affect keyboard arrows, pointer mapping, and the inline positioning styles.

When `dir` is omitted, it is inherited from the nearest
[`DirectionProvider`](../DirectionProvider/README.md), falling back to `"ltr"`
when there is no provider. An explicit `dir` prop always wins over the
inherited value.

## Disabled

Pass `disabled` on the Root. Every part receives `data-disabled=""`, thumbs
leave the tab order and gain `aria-disabled="true"`, and keyboard and pointer
interaction are ignored.

## Form submission

Pass `name` to render a hidden `<input>` per thumb so the values post with a
surrounding `<form>`. Multi-thumb sliders suffix the name with `[]`
(`name="range[]"`).

```tsx
<form>
  <Slider.Root defaultValue={[10, 90]} name="price">
    …
  </Slider.Root>
</form>
```

## `asChild` composition

Every sub-component accepts `asChild`. The library's ARIA attributes,
`data-*` hooks, positioning `style`, event handlers, and ref are merged onto
the consumer's element.

```tsx
<Slider.Thumb asChild>
  <MyHandle />
</Slider.Thumb>
```

## Positioning

`Slider.Range` and `Slider.Thumb` ship an inline `style` placing them along
the track as a percentage offset. Give `Slider.Root` / `Slider.Track` a size
and `position: relative`; the parts position themselves absolutely. Centre a
thumb on its point with a `translate`.

```scss
.slider-root {
  position: relative;
  display: flex;
  align-items: center;
  width: 12rem;
  height: 1.25rem;
}

.slider-track {
  position: relative;
  flex: 1;
  height: 0.25rem;
  border-radius: 9999px;
  background: #d1d5db;
}

.slider-range {
  height: 100%;
  border-radius: inherit;
  background: #6366f1;
}

.slider-thumb {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: white;
  box-shadow: 0 0 0 1px #6366f1;
  translate: -50% 0;

  &[data-disabled] {
    opacity: 0.5;
  }
}
```

## Styling hooks

| Attribute | Values | Set on |
|-----------|--------|--------|
| `data-orientation` | `"horizontal"` \| `"vertical"` | every part |
| `data-disabled` | `""` (present when disabled) | every part |

## Validation

`Slider.Root` throws a descriptive error during render when `min` is not less
than `max`, or when `step` is not greater than `0`.
