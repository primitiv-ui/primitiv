import type { ComponentProps } from "react";

/**
 * Layout axis of the slider track. `"horizontal"` lays the track out along
 * the x-axis and binds ArrowLeft/ArrowRight (plus ArrowUp/ArrowDown);
 * `"vertical"` lays it out along the y-axis, positions thumbs from the
 * bottom edge, and maps ArrowUp to *increase*.
 */
export type SliderOrientation = "horizontal" | "vertical";
/**
 * Reading direction of a **horizontal** slider, affecting which end of the
 * track is the minimum and the arrow-key direction. `"rtl"` mirrors the axis
 * so the value increases leftwards. Ignored on the vertical axis.
 */
export type SliderDirection = "ltr" | "rtl";

/**
 * Props common to both the controlled ({@link SliderRootControlledProps}) and
 * uncontrolled ({@link SliderRootUncontrolledProps}) `Slider.Root` shapes:
 * the range/step bounds, orientation, reading direction, form `name`, and the
 * native `<span>` attributes.
 *
 * `defaultValue` and `dir` are `Omit`-ted from the inherited `<span>` props
 * because both are redeclared with narrower slider-specific types — the
 * native `defaultValue` is a string/number DOM attribute (replaced by the
 * `number[]` value array) and the native `dir` is `string` (narrowed to
 * {@link SliderDirection}). Omitting them keeps the narrowed types (and this
 * JSDoc) visible to the docs-data extractor rather than the wider DOM ones.
 */
export type SliderRootSharedProps = Omit<
  ComponentProps<"span">,
  "defaultValue" | "dir"
> & {
  /**
   * Lowest value the slider can take — the value at the track's start edge.
   * Must be strictly less than {@link SliderRootSharedProps.max | `max`};
   * `Slider.Root` throws during render otherwise.
   * @default 0
   */
  min?: number;
  /**
   * Highest value the slider can take — the value at the track's end edge.
   * Must be strictly greater than {@link SliderRootSharedProps.min | `min`};
   * `Slider.Root` throws during render otherwise.
   * @default 100
   */
  max?: number;
  /**
   * Granularity of the value: every thumb value snaps to a multiple of `step`
   * anchored at `min`, and each arrow-key press moves by one `step` (Page
   * Up/Down move by ten). Fractional steps (e.g. `0.1`) are snapped to the
   * step's decimal precision. Must be greater than `0`; `Slider.Root` throws
   * during render otherwise.
   * @default 1
   */
  step?: number;
  /**
   * Minimum gap, expressed **in steps**, enforced between adjacent thumbs on a
   * multi-thumb slider. The gap in value units is `minStepsBetweenThumbs *
   * step`. A thumb is clamped so it can never come closer than this to its
   * neighbours (and can never cross them). Has no effect on a single-thumb
   * slider.
   * @default 0
   */
  minStepsBetweenThumbs?: number;
  /**
   * Layout axis of the track; see {@link SliderOrientation}. Sets
   * `data-orientation` and each thumb's `aria-orientation`, and selects which
   * pointer axis and arrow keys drive the value.
   * @default "horizontal"
   */
  orientation?: SliderOrientation;
  /**
   * Reading direction of a horizontal slider; see {@link SliderDirection}.
   * Affects which end is the minimum, the arrow-key direction, pointer
   * mapping, and the inline positioning styles. When omitted, it is inherited
   * from the nearest {@link DirectionProvider}, falling back to `"ltr"` when
   * there is no provider; an explicit prop always wins.
   */
  dir?: SliderDirection;
  /**
   * Reverse the direction the value increases along the axis. Combines with
   * {@link SliderRootSharedProps.orientation | `orientation`} and
   * {@link SliderRootSharedProps.dir | `dir`} to flip the pointer mapping,
   * arrow keys, and the edge the thumb/range offset is anchored to.
   * @default false
   */
  inverted?: boolean;
  /**
   * Disable all interaction. Every part receives `data-disabled=""`, thumbs
   * leave the tab order and gain `aria-disabled="true"`, and both keyboard and
   * pointer handlers become no-ops.
   * @default false
   */
  disabled?: boolean;
  /**
   * When set, `Slider.Root` renders one hidden `<input>` per thumb carrying
   * that thumb's value so the slider posts with a surrounding `<form>`. A
   * multi-thumb slider suffixes the name with `[]` (e.g. `name="range"` →
   * `range[]`); a single-thumb slider uses the bare name. When omitted, no
   * hidden inputs are rendered.
   */
  name?: string;
  /**
   * Render the child element in place of the default `<span>` via the
   * {@link Slot} pattern, merging `Slider.Root`'s `dir`, `data-*` hooks,
   * pointer handler, and ref onto it.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Uncontrolled variant of {@link SliderRootProps}: the component owns the
 * value array internally. Seed it with `defaultValue` (or omit it for a
 * single thumb seeded at `min`); `value` is forbidden.
 */
export type SliderRootUncontrolledProps = SliderRootSharedProps & {
  /**
   * The value array on first render — one number per
   * {@link SliderThumb | `Slider.Thumb`}, in order (`[value]` for a single
   * thumb, `[low, high]` for a range). After mount the component owns the
   * value. Defaults to `[min]` when omitted.
   */
  defaultValue?: number[];
  /** Forbidden in uncontrolled mode — use `defaultValue` instead. */
  value?: never;
  /**
   * Called with the full next value array on every change (each arrow-key
   * press and every pointer increment during a drag). Optional in
   * uncontrolled mode.
   */
  onValueChange?: (value: number[]) => void;
  /**
   * Called **once** with the settled value array when an interaction ends — a
   * pointer release, or a completed keyboard press. Use it to persist only the
   * final value rather than every intermediate step.
   */
  onValueCommit?: (value: number[]) => void;
};

/**
 * Controlled variant of {@link SliderRootProps}: the parent owns the value
 * array via `value` and is expected to keep it in sync through
 * `onValueChange`. `defaultValue` is forbidden.
 */
export type SliderRootControlledProps = SliderRootSharedProps & {
  /** Forbidden in controlled mode — use `value` instead. */
  defaultValue?: never;
  /**
   * The current value array — one number per
   * {@link SliderThumb | `Slider.Thumb`}, in order (`[value]` for a single
   * thumb, `[low, high]` for a range). Must be kept in sync by the parent via
   * `onValueChange`.
   */
  value: number[];
  /**
   * Called with the full next value array on every change (each arrow-key
   * press and every pointer increment during a drag). Update `value` from it
   * to keep the slider in sync.
   */
  onValueChange?: (value: number[]) => void;
  /**
   * Called **once** with the settled value array when an interaction ends — a
   * pointer release, or a completed keyboard press. Use it to persist only the
   * final value rather than every intermediate step.
   */
  onValueCommit?: (value: number[]) => void;
};

/** Props for {@link SliderRoot | `Slider.Root`} — the discriminated union of controlled ({@link SliderRootControlledProps}) and uncontrolled ({@link SliderRootUncontrolledProps}) modes; only one shape is accepted by TypeScript at a time. */
export type SliderRootProps =
  | SliderRootUncontrolledProps
  | SliderRootControlledProps;

/** Props for {@link SliderTrack | `Slider.Track`} — the full-length rail the thumbs travel along; all native `<span>` attributes plus `asChild`. */
export type SliderTrackProps = ComponentProps<"span"> & {
  /**
   * Render the child element in place of the default `<span>` via the
   * {@link Slot} pattern, merging the `data-orientation` / `data-disabled`
   * hooks onto it.
   * @default false
   */
  asChild?: boolean;
};
/** Props for {@link SliderRange | `Slider.Range`} — the filled segment between the lowest and highest thumb (or from the track start to the single thumb); all native `<span>` attributes plus `asChild`. */
export type SliderRangeProps = ComponentProps<"span"> & {
  /**
   * Render the child element in place of the default `<span>` via the
   * {@link Slot} pattern, merging the `data-orientation` / `data-disabled`
   * hooks and the computed inline positioning `style` onto it.
   * @default false
   */
  asChild?: boolean;
};
/** Props for {@link SliderThumb | `Slider.Thumb`} — a draggable, focusable handle; render one per entry in the value array. All native `<span>` attributes plus `asChild`. */
export type SliderThumbProps = ComponentProps<"span"> & {
  /**
   * Render the child element in place of the default `<span>` via the
   * {@link Slot} pattern, merging the `role="slider"` semantics, `aria-value*`
   * attributes, keyboard handler, positioning `style`, and ref onto it.
   * @default false
   */
  asChild?: boolean;
};
