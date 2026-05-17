import { composeEventHandlers, composeRefs } from "../Slot";

import { SliderContext } from "./SliderContext";
import { useSliderContext, useSliderRoot, useSliderThumb } from "./hooks";
import type {
  SliderRangeProps,
  SliderRootProps,
  SliderThumbProps,
  SliderTrackProps,
} from "./types";
import { getRangeStyle } from "./utils";

function SliderRoot({
  min = 0,
  max = 100,
  step = 1,
  orientation = "horizontal",
  dir = "ltr",
  inverted = false,
  defaultValue,
  value,
  onValueChange,
  children,
  ...rest
}: SliderRootProps) {
  const { contextValue } = useSliderRoot({
    min,
    max,
    step,
    orientation,
    dir,
    inverted,
    defaultValue,
    value,
    onValueChange,
  });
  return (
    <SliderContext.Provider value={contextValue}>
      <span {...rest} dir={dir} data-orientation={orientation}>
        {children}
      </span>
    </SliderContext.Provider>
  );
}

SliderRoot.displayName = "SliderRoot";

function SliderTrack({ children, ...rest }: SliderTrackProps) {
  const { orientation } = useSliderContext();
  return (
    <span {...rest} data-orientation={orientation}>
      {children}
    </span>
  );
}

SliderTrack.displayName = "SliderTrack";

function SliderRange({ style, ...rest }: SliderRangeProps) {
  const { values, min, max, orientation, dir, inverted } = useSliderContext();
  return (
    <span
      {...rest}
      data-orientation={orientation}
      style={{
        ...getRangeStyle(values, min, max, { orientation, dir, inverted }),
        ...style,
      }}
    />
  );
}

SliderRange.displayName = "SliderRange";

function SliderThumb({
  style,
  ref: forwardedRef,
  onKeyDown,
  ...rest
}: SliderThumbProps) {
  const {
    ref,
    value,
    min,
    max,
    orientation,
    style: positionStyle,
    onKeyDown: handleKeyDown,
  } = useSliderThumb();
  return (
    <span
      {...rest}
      ref={composeRefs(ref, forwardedRef)}
      role="slider"
      tabIndex={0}
      aria-orientation={orientation}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      data-orientation={orientation}
      onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
      style={{ ...positionStyle, ...style }}
    />
  );
}

SliderThumb.displayName = "SliderThumb";

type TSliderCompound = typeof SliderRoot & {
  Root: typeof SliderRoot;
  Track: typeof SliderTrack;
  Range: typeof SliderRange;
  Thumb: typeof SliderThumb;
};

const SliderCompound: TSliderCompound = Object.assign(SliderRoot, {
  Root: SliderRoot,
  Track: SliderTrack,
  Range: SliderRange,
  Thumb: SliderThumb,
});

SliderCompound.displayName = "Slider";

export { SliderCompound as Slider };
