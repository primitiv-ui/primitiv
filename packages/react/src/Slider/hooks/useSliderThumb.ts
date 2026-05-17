import { useCallback, useEffect, useId, useRef } from "react";
import type { KeyboardEvent } from "react";

import { useSliderContext } from "../SliderContext";
import { getThumbStyle, snapToStep } from "../utils";

export function useSliderThumb() {
  const {
    values,
    min,
    max,
    step,
    orientation,
    dir,
    inverted,
    registerThumb,
    orderedThumbIds,
    setThumbValue,
  } = useSliderContext();
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    registerThumb(id, ref.current);
    return () => registerThumb(id, null);
  }, [id, registerThumb]);

  const index = orderedThumbIds.indexOf(id);
  const value = index === -1 ? undefined : values[index];
  const style = getThumbStyle(value, min, max, { orientation, dir, inverted });

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLSpanElement>) => {
      if (value === undefined) {
        return;
      }
      let target: number;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowUp":
          target = snapToStep(value + step, min, step);
          break;
        case "ArrowLeft":
        case "ArrowDown":
          target = snapToStep(value - step, min, step);
          break;
        case "PageUp":
          target = snapToStep(value + step * 10, min, step);
          break;
        case "PageDown":
          target = snapToStep(value - step * 10, min, step);
          break;
        case "Home":
          target = min;
          break;
        case "End":
          target = max;
          break;
        default:
          return;
      }
      event.preventDefault();
      setThumbValue(index, target);
    },
    [value, index, min, max, step, setThumbValue],
  );

  return { ref, value, min, max, orientation, style, onKeyDown };
}
