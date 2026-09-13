"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The rendered height and corner radius of a control, read off the element.
 *
 * The density figures caption each column with the control's measured geometry
 * ("40px · r8"), and those numbers are **measured, never declared** — the same
 * rule the Figma build settled on (§6.0.10: the captions quote the instance's
 * own height and radius "so they cannot drift from what is drawn above them"),
 * and the same rule `gen-illustrations.mjs` applied to the PNG dimensions.
 *
 * A figure that printed `24 / 32 / 40 / 48` as literals would be asserting the
 * token scale rather than demonstrating it, and would go quietly wrong the day
 * `framed-control/{size}/height` moves. Reading `getComputedStyle` makes the caption
 * a consequence of the cascade that drew the control above it — which is the
 * whole claim the illustration exists to make.
 *
 * Returns `null` until the effect has run. The caller renders nothing in that
 * window and the stylesheet holds the caption's line box open, so the measured
 * text arrives without moving anything. That gap is real and unavoidable: the
 * static export has no layout, so there is no honest value to prerender.
 */
export type ControlMetrics = { readonly height: number; readonly radius: number };

export const useControlMetrics = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [metrics, setMetrics] = useState<ControlMetrics | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const style = getComputedStyle(el);
      setMetrics({
        height: Math.round(el.getBoundingClientRect().height),
        /* `borderRadius` resolves to a length even when the token behind it is
           a keyword or a calc, and the four corners are equal on every control
           in the system — so the first value is the whole answer. */
        radius: Math.round(parseFloat(style.borderTopLeftRadius)),
      });
    };

    measure();

    /* Density is not the only thing that moves these: the reader's own
       zoom and a font swap both reflow the control. A ResizeObserver keeps the
       caption honest through either, for the cost of one observer per column. */
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, metrics] as const;
};
