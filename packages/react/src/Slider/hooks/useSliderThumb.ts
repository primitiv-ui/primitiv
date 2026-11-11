import { useEffect, useId, useRef } from "react";

import { useSliderContext } from "../SliderContext";
import { getThumbStyle } from "../utils";

/**
 * A thumb's registration, value and inline position. Its keys are handled by
 * the shared SliderController on the root, which finds the thumb among the
 * registered ones in DOM order.
 */
export function useSliderThumb() {
  const { values, min, max, orientation, dir, inverted, disabled, registerThumb, orderedThumbIds } =
    useSliderContext();
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  // `id` and `registerThumb` are both stable for a thumb's lifetime.
  // Stryker disable ArrayDeclaration: equivalent — every dependency is stable, so the effect runs once either way.
  useEffect(() => {
    registerThumb(id, ref.current);
    return () => registerThumb(id, null);
  }, [id, registerThumb]);
  // Stryker restore ArrayDeclaration

  const registeredIndex = orderedThumbIds.indexOf(id);
  const index = registeredIndex === -1 ? 0 : registeredIndex;
  const value = values[index];
  const style = getThumbStyle(value, min, max, { orientation, dir, inverted });

  return { ref, value, min, max, orientation, disabled, style };
}
