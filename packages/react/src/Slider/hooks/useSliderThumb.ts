import { useCallback, useEffect, useId, useRef } from "react";
import type { KeyboardEvent } from "react";

import { useSliderContext } from "../SliderContext";
import { getKeyAction, getThumbStyle, snapToStep } from "../utils";

export function useSliderThumb() {
  const {
    values,
    min,
    max,
    step,
    orientation,
    dir,
    inverted,
    disabled,
    registerThumb,
    orderedThumbIds,
    setThumbValue,
    commit,
  } = useSliderContext();
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    registerThumb(id, ref.current);
    return () => registerThumb(id, null);
  }, [id, registerThumb]);

  const registeredIndex = orderedThumbIds.indexOf(id);
  const index = registeredIndex === -1 ? 0 : registeredIndex;
  const value = values[index];
  const style = getThumbStyle(value, min, max, { orientation, dir, inverted });

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLSpanElement>) => {
      if (disabled) {
        return;
      }
      const action = getKeyAction(event.key, { orientation, dir, inverted });
      if (action === null) {
        return;
      }
      let target: number;
      if (action === "min") {
        target = min;
      } else if (action === "max") {
        target = max;
      } else {
        const isPageKey = event.key === "PageUp" || event.key === "PageDown";
        const magnitude = isPageKey ? step * 10 : step;
        const delta = action === "increase" ? magnitude : -magnitude;
        target = snapToStep(value + delta, min, step);
      }
      event.preventDefault();
      const next = setThumbValue(index, target);
      if (next) {
        commit(next);
      }
    },
    [
      value,
      index,
      min,
      max,
      step,
      orientation,
      dir,
      inverted,
      disabled,
      setThumbValue,
      commit,
    ],
  );

  return { ref, value, min, max, orientation, disabled, style, onKeyDown };
}
