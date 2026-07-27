import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";

import { useNavigationMenuContext } from "../NavigationMenuContext";

type Size = { width: number; height: number } | null;

/**
 * Measures the open panel and hands its size back as custom properties.
 *
 * The same division of labour as the Indicator: the library ships no styles, so
 * the Viewport can't size itself — but only it can see which panel is open and
 * how big that panel is. Publishing the measurement as
 * `--primitiv-navigation-menu-viewport-width` / `-height` lets a stylesheet
 * transition the shared box between panels (the one-box morph), while leaving it
 * free to ignore both and let the box hug its content instead.
 *
 * The measurement is **kept through the close**: clearing it would collapse the
 * box to nothing at the very moment the exit animation needs its size, so the
 * last open panel's dimensions stay published until another panel opens.
 */
export function useNavigationMenuViewport(): {
  open: boolean;
  openValue: string;
  orientation: "horizontal" | "vertical";
  style: CSSProperties;
} {
  const { orientation, openValue, viewport } = useNavigationMenuContext();
  const open = openValue !== "";
  const [size, setSize] = useState<Size>(null);

  const measure = useCallback(() => {
    // Nothing open: hold the last measurement so the exit animates from the size
    // it was, rather than snapping to zero before it starts.
    if (openValue === "") return;
    if (!viewport) {
      setSize(null);
      return;
    }
    // Only a Content carries data-state inside the viewport, and only direct
    // children are projected panels — so this finds the open panel without the
    // headless layer needing a class to look for.
    const panel = Array.from(viewport.children).find(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.dataset.state === "open",
    );
    if (!panel) {
      setSize(null);
      return;
    }
    setSize({ width: panel.offsetWidth, height: panel.offsetHeight });
  }, [openValue, viewport]);

  useEffect(() => {
    measure();
    // A panel's very first paint can still be mid a browser-internal multi-pass
    // layout — confirmed live: a multi-line description's true wrapped height
    // was consistently one frame behind this effect's own synchronous read (a
    // CSS Grid intrinsic-sizing quirk on a genuinely new subtree), publishing a
    // too-short height that only self-corrected on the next real open. One
    // rAF-deferred re-measurement catches that up; it's harmless to repeat on
    // an already-settled panel, since re-measuring just republishes the same
    // numbers.
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [measure]);

  // Panel size is layout-dependent, so a reflow invalidates it — the same reason
  // the Indicator re-measures here.
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // A web font (e.g. Google Fonts' display=swap) can still be loading when this
  // effect's own measurement runs, and the swap's reflow lands asynchronously,
  // after — nothing else invalidates the published size when that happens, so it
  // stays locked to the pre-swap layout until some unrelated event (a resize, or
  // the next open) happens to re-measure. `document.fonts` is absent in jsdom
  // (and, historically, some very old browsers), hence the guard.
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts) return;
    fonts.addEventListener("loadingdone", measure);
    return () => fonts.removeEventListener("loadingdone", measure);
  }, [measure]);

  // `undefined` is dropped by React, so a viewport that has never hosted an open
  // panel publishes nothing at all rather than a zeroed size the stylesheet would
  // have to special-case.
  const style = {
    "--primitiv-navigation-menu-viewport-width": size
      ? `${size.width}px`
      : undefined,
    "--primitiv-navigation-menu-viewport-height": size
      ? `${size.height}px`
      : undefined,
  } as CSSProperties;

  return { open, openValue, orientation, style };
}
