// Observes an element's content-box size so the picker can paint its canvases at
// the size they are actually rendered (RFC 0010 §5, the responsive-charts pass).
// The charts fill their container at a fixed aspect ratio, so the painted backing
// store must track the measured CSS size (then scale by devicePixelRatio for a
// crisp blit — see resolution.ts). Returns `{ width, height }` in CSS pixels,
// starting at zero until the first ResizeObserver callback.

import { useEffect, useState, type RefObject } from "react";

/** The measured content size of `ref`'s element, in CSS pixels. */
export function useElementSize(
  ref: RefObject<HTMLElement | null>,
): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
