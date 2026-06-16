import type { ComponentProps } from "react";

/** Layout axis of the slider track. */
export type SliderOrientation = "horizontal" | "vertical";
/** Reading direction of the slider, affecting which end is the minimum. */
export type SliderDirection = "ltr" | "rtl";

/** Props common to both controlled and uncontrolled `Slider.Root`: range/step bounds, orientation, direction, and the native `<span>` attributes. */
export type SliderRootSharedProps = Omit<
  ComponentProps<"span">,
  "defaultValue" | "dir"
> & {
  min?: number;
  max?: number;
  step?: number;
  minStepsBetweenThumbs?: number;
  orientation?: SliderOrientation;
  dir?: SliderDirection;
  inverted?: boolean;
  disabled?: boolean;
  name?: string;
  asChild?: boolean;
};

/** Uncontrolled `Slider.Root` props: seed with `defaultValue`; `value` is disallowed. */
export type SliderRootUncontrolledProps = SliderRootSharedProps & {
  defaultValue?: number[];
  value?: never;
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
};

/** Controlled `Slider.Root` props: drive with `value`; `defaultValue` is disallowed. */
export type SliderRootControlledProps = SliderRootSharedProps & {
  defaultValue?: never;
  value: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
};

/** Props for `Slider.Root` — the discriminated union of controlled ({@link SliderRootControlledProps}) and uncontrolled ({@link SliderRootUncontrolledProps}) modes. */
export type SliderRootProps =
  | SliderRootUncontrolledProps
  | SliderRootControlledProps;

/** Props for `Slider.Track` — the full-length rail; native `<span>` props plus `asChild`. */
export type SliderTrackProps = ComponentProps<"span"> & {
  asChild?: boolean;
};
/** Props for `Slider.Range` — the filled segment between the minimum and the active thumb; native `<span>` props plus `asChild`. */
export type SliderRangeProps = ComponentProps<"span"> & {
  asChild?: boolean;
};
/** Props for `Slider.Thumb` — a draggable handle; native `<span>` props plus `asChild`. */
export type SliderThumbProps = ComponentProps<"span"> & {
  asChild?: boolean;
};
