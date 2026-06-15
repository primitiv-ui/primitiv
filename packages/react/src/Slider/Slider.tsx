import { useDirection } from "../DirectionProvider/index.ts";
import { Slot, composeEventHandlers, composeRefs } from "../Slot/index.ts";

import { SliderContext } from "./SliderContext";
import { useSliderContext, useSliderRoot, useSliderThumb } from "./hooks/index.ts";
import type {
  SliderRangeProps,
  SliderRootProps,
  SliderThumbProps,
  SliderTrackProps,
} from "./types";
import { getRangeStyle } from "./utils";

/**
 * The root of a Slider — a `<span>` that owns the value array, provides
 * {@link SliderContext} to descendants, and turns pointer interaction on the
 * track into value changes.
 *
 * The value is always an **array of numbers**, one entry per
 * {@link SliderThumb | `Slider.Thumb`}. A single-thumb slider is `[value]`;
 * a range slider is `[low, high]`; any number of thumbs is supported.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass {@link SliderRootProps.defaultValue | `defaultValue`}
 *   (or omit it for a single thumb seeded at `min`). The component owns the
 *   value internally.
 * - **Controlled** — pass {@link SliderRootProps.value | `value`} *and*
 *   {@link SliderRootProps.onValueChange | `onValueChange`} together. The
 *   parent owns the value; every change defers back through the callback.
 *
 * {@link SliderRootProps.onValueCommit | `onValueCommit`} fires once with the
 * final array when an interaction ends (pointer up, or a keyboard press) —
 * useful for persisting only the settled value.
 *
 * **Form submission.** Pass {@link SliderRootProps.name | `name`} to render a
 * hidden input per thumb so the values post with a surrounding `<form>`.
 * Multi-thumb sliders suffix the name with `[]`.
 *
 * **Styling hooks.** `data-orientation="horizontal" | "vertical"` and
 * `data-disabled=""` (when disabled).
 *
 * **Reading direction.** `dir` (`"ltr"` / `"rtl"`) sets which end of the
 * track is the minimum and the arrow-key direction. When omitted, it is
 * inherited from the nearest {@link DirectionProvider}, falling back to
 * `"ltr"` when there is no provider.
 *
 * **`asChild` prop.** Render any element in place of the default `<span>`.
 *
 * @throws if `min` is not less than `max`, or `step` is not greater than 0.
 *
 * @example Single-thumb, uncontrolled
 * ```tsx
 * <Slider.Root defaultValue={[50]}>
 *   <Slider.Track><Slider.Range /></Slider.Track>
 *   <Slider.Thumb />
 * </Slider.Root>
 * ```
 *
 * @example Range slider, controlled
 * ```tsx
 * const [value, setValue] = useState([20, 80]);
 *
 * <Slider.Root value={value} onValueChange={setValue}>
 *   <Slider.Track><Slider.Range /></Slider.Track>
 *   <Slider.Thumb />
 *   <Slider.Thumb />
 * </Slider.Root>
 * ```
 */
function SliderRoot({
  min = 0,
  max = 100,
  step = 1,
  minStepsBetweenThumbs = 0,
  orientation = "horizontal",
  dir,
  inverted = false,
  disabled = false,
  defaultValue,
  value,
  onValueChange,
  onValueCommit,
  name,
  asChild = false,
  onPointerDown,
  ref,
  children,
  ...rest
}: SliderRootProps) {
  const resolvedDir = dir ?? useDirection();
  const {
    contextValue,
    rootRef,
    onPointerDown: handlePointerDown,
  } = useSliderRoot({
    min,
    max,
    step,
    minStepsBetweenThumbs,
    orientation,
    dir: resolvedDir,
    inverted,
    disabled,
    defaultValue,
    value,
    onValueChange,
    onValueCommit,
  });
  const rootProps = {
    ...rest,
    ref: composeRefs(rootRef, ref),
    dir: resolvedDir,
    "data-orientation": orientation,
    "data-disabled": disabled ? "" : undefined,
    onPointerDown: composeEventHandlers(onPointerDown, handlePointerDown),
  };
  return (
    <SliderContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...rootProps}>{children}</Slot>
      ) : (
        <span {...rootProps}>{children}</span>
      )}
      {name !== undefined &&
        contextValue.values.map((thumbValue, index) => (
          <input
            key={index}
            type="hidden"
            name={contextValue.values.length > 1 ? `${name}[]` : name}
            value={thumbValue}
            readOnly
          />
        ))}
    </SliderContext.Provider>
  );
}

SliderRoot.displayName = "SliderRoot";

/**
 * The track rail the thumbs travel along. A decorative `<span>` carrying
 * `data-orientation` and `data-disabled` for CSS. Wrap a
 * {@link SliderRange | `Slider.Range`} inside it to show the filled portion.
 *
 * **`asChild` prop.** Render a consumer element in place of the `<span>`.
 *
 * @throws if rendered outside a `Slider.Root`.
 */
function SliderTrack({ children, asChild = false, ...rest }: SliderTrackProps) {
  const { orientation, disabled } = useSliderContext();
  const trackProps = {
    ...rest,
    "data-orientation": orientation,
    "data-disabled": disabled ? "" : undefined,
  };
  return asChild ? (
    <Slot {...trackProps}>{children}</Slot>
  ) : (
    <span {...trackProps}>{children}</span>
  );
}

SliderTrack.displayName = "SliderTrack";

/**
 * The filled portion of the track between the lowest and highest thumb (or
 * from the track start to the single thumb). Its position is set through an
 * inline `style` computed from the current values, orientation, reading
 * direction, and `inverted` — consumer `style` is shallow-merged on top.
 *
 * **`asChild` prop.** Render a consumer element in place of the `<span>`.
 *
 * @throws if rendered outside a `Slider.Root`.
 */
function SliderRange({
  style,
  asChild = false,
  children,
  ...rest
}: SliderRangeProps) {
  const { values, min, max, orientation, dir, inverted, disabled } =
    useSliderContext();
  const rangeProps = {
    ...rest,
    "data-orientation": orientation,
    "data-disabled": disabled ? "" : undefined,
    style: {
      ...getRangeStyle(values, min, max, { orientation, dir, inverted }),
      ...style,
    },
  };
  return asChild ? (
    <Slot {...rangeProps}>{children}</Slot>
  ) : (
    <span {...rangeProps} />
  );
}

SliderRange.displayName = "SliderRange";

/**
 * A draggable handle — render one `Slider.Thumb` per entry in the value
 * array, in order. Each is a `<span role="slider">` with `aria-valuemin` /
 * `aria-valuemax` / `aria-valuenow`, `aria-orientation`, and a `tabIndex` so
 * it is independently focusable.
 *
 * **Keyboard.** Arrow keys move by `step`; `PageUp` / `PageDown` by ten
 * steps; `Home` / `End` jump to `min` / `max`. Arrow direction follows
 * orientation, reading direction, and `inverted`. A thumb is clamped between
 * its neighbours (plus `minStepsBetweenThumbs`).
 *
 * **Styling hooks.** `data-orientation` and `data-disabled`. Position is set
 * via an inline `style` offset; consumer `style` is shallow-merged on top.
 *
 * Provide an accessible name with `aria-label` / `aria-labelledby`.
 *
 * **`asChild` prop.** Render a consumer element in place of the `<span>`;
 * the slider role, ARIA value attributes, keyboard handler, and ref merge in.
 *
 * @throws if rendered outside a `Slider.Root`.
 */
function SliderThumb({
  style,
  ref: forwardedRef,
  onKeyDown,
  asChild = false,
  children,
  ...rest
}: SliderThumbProps) {
  const {
    ref,
    value,
    min,
    max,
    orientation,
    disabled,
    style: positionStyle,
    onKeyDown: handleKeyDown,
  } = useSliderThumb();
  const thumbProps = {
    ...rest,
    ref: composeRefs(ref, forwardedRef),
    role: "slider" as const,
    tabIndex: disabled ? undefined : 0,
    "aria-orientation": orientation,
    "aria-valuemin": min,
    "aria-valuemax": max,
    "aria-valuenow": value,
    "aria-disabled": disabled || undefined,
    "data-orientation": orientation,
    "data-disabled": disabled ? "" : undefined,
    onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
    style: { ...positionStyle, ...style },
  };
  return asChild ? (
    <Slot {...thumbProps}>{children}</Slot>
  ) : (
    <span {...thumbProps}>{children}</span>
  );
}

SliderThumb.displayName = "SliderThumb";

type TSliderCompound = typeof SliderRoot & {
  Root: typeof SliderRoot;
  Track: typeof SliderTrack;
  Range: typeof SliderRange;
  Thumb: typeof SliderThumb;
};

/**
 * Headless, accessible **Slider** — a compound component implementing the
 * [WAI-ARIA Slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/)
 * (and [Multi-Thumb Slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/)).
 * The value is always an array, with one thumb per entry. Zero styles ship.
 *
 * `Slider` is both callable (an alias of {@link SliderRoot | `Slider.Root`})
 * and carries its sub-components as static properties.
 *
 * - {@link SliderRoot | `Slider.Root`} — value owner, context provider.
 * - {@link SliderTrack | `Slider.Track`} — the rail the thumbs travel along.
 * - {@link SliderRange | `Slider.Range`} — the filled portion of the track.
 * - {@link SliderThumb | `Slider.Thumb`} — a draggable handle; one per value.
 *
 * @example
 * ```tsx
 * import { Slider } from "@primitiv-ui/react";
 *
 * <Slider.Root defaultValue={[40]} aria-label="Volume">
 *   <Slider.Track><Slider.Range /></Slider.Track>
 *   <Slider.Thumb />
 * </Slider.Root>
 * ```
 *
 * @see {@link SliderRoot} for state modes, form submission, and validation.
 * @see {@link SliderThumb} for keyboard interaction.
 */
const SliderCompound: TSliderCompound = Object.assign(SliderRoot, {
  Root: SliderRoot,
  Track: SliderTrack,
  Range: SliderRange,
  Thumb: SliderThumb,
});

SliderCompound.displayName = "Slider";

export { SliderCompound as Slider };
