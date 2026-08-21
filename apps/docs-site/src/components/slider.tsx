import "../styles/primitiv/slider/styles.css";
/*
 * Slider — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/slider/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Slider as SliderPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { slider, sliderTrack, sliderRange, sliderThumb } from "./slider.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A draggable, keyboard-accessible control for selecting one value (or a range) along a track.
 *
 * @see https://primitiv-ui.dev/docs/components/slider
 */
export type SliderProps = DistributiveOmit<ComponentPropsWithRef<typeof SliderPrimitive.Root>, "size"> & {
  /**
   * Track thickness + thumb size; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/slider
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export function Slider({ size, className, ...props }: SliderProps) {
  return <SliderPrimitive.Root className={[slider({ size }), className].filter(Boolean).join(" ")} {...props} />;
}

export type SliderTrackProps = ComponentPropsWithRef<typeof SliderPrimitive.Track>;

export function SliderTrack({ className, ...props }: SliderTrackProps) {
  return <SliderPrimitive.Track className={[sliderTrack(), className].filter(Boolean).join(" ")} {...props} />;
}

export type SliderRangeProps = ComponentPropsWithRef<typeof SliderPrimitive.Range>;

export function SliderRange({ className, ...props }: SliderRangeProps) {
  return <SliderPrimitive.Range className={[sliderRange(), className].filter(Boolean).join(" ")} {...props} />;
}

export type SliderThumbProps = ComponentPropsWithRef<typeof SliderPrimitive.Thumb>;

export function SliderThumb({ className, ...props }: SliderThumbProps) {
  return <SliderPrimitive.Thumb className={[sliderThumb(), className].filter(Boolean).join(" ")} {...props} />;
}
