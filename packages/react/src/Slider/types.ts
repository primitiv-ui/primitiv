import type { ComponentProps } from "react";

export type SliderOrientation = "horizontal" | "vertical";
export type SliderDirection = "ltr" | "rtl";

type SliderRootSharedProps = Omit<
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
};

type SliderRootUncontrolledProps = SliderRootSharedProps & {
  defaultValue?: number[];
  value?: never;
  onValueChange?: (value: number[]) => void;
};

type SliderRootControlledProps = SliderRootSharedProps & {
  defaultValue?: never;
  value: number[];
  onValueChange?: (value: number[]) => void;
};

export type SliderRootProps =
  | SliderRootUncontrolledProps
  | SliderRootControlledProps;

export type SliderTrackProps = ComponentProps<"span">;
export type SliderRangeProps = ComponentProps<"span">;
export type SliderThumbProps = ComponentProps<"span">;
