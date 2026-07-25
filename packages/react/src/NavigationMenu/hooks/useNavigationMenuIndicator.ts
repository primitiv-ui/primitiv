import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";

import { useNavigationMenuContext } from "../NavigationMenuContext";
import { getTriggerAndPanelIds } from "../utils";

type Geometry = { position: number; size: number } | null;

/**
 * Measures the open trigger and hands back the geometry as custom properties.
 *
 * The library ships no styles, so the Indicator can't position itself — but
 * only it can know *where* the open trigger is. Publishing the measurement as
 * `--primitiv-navigation-menu-indicator-position` / `-size` splits that
 * correctly: the component measures, the stylesheet decides whether that means
 * `translate`, `left`, a border, or nothing at all.
 */
export function useNavigationMenuIndicator(): {
  open: boolean;
  openValue: string;
  orientation: "horizontal" | "vertical";
  style: CSSProperties;
} {
  const { orientation, openValue, navigationMenuId } =
    useNavigationMenuContext();
  const open = openValue !== "";
  const [geometry, setGeometry] = useState<Geometry>(null);

  const measure = useCallback(() => {
    if (openValue === "") {
      setGeometry(null);
      return;
    }
    const { triggerId } = getTriggerAndPanelIds(navigationMenuId, openValue);
    const trigger = document.getElementById(triggerId);
    if (!trigger) {
      setGeometry(null);
      return;
    }
    setGeometry(
      orientation === "horizontal"
        ? { position: trigger.offsetLeft, size: trigger.offsetWidth }
        : { position: trigger.offsetTop, size: trigger.offsetHeight },
    );
  }, [navigationMenuId, openValue, orientation]);

  useEffect(() => {
    measure();
  }, [measure]);

  // Offsets are layout-dependent, so a reflow invalidates them. Re-measuring on
  // resize is what stops the indicator drifting off its trigger after the nav
  // rewraps.
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // An `undefined` value is dropped by React, so a closed indicator simply
  // carries no geometry rather than a stale or zeroed one.
  const style = {
    "--primitiv-navigation-menu-indicator-position": geometry
      ? `${geometry.position}px`
      : undefined,
    "--primitiv-navigation-menu-indicator-size": geometry
      ? `${geometry.size}px`
      : undefined,
  } as CSSProperties;

  return { open, openValue, orientation, style };
}
