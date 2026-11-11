/** A box's edges in viewport coordinates, as `getBoundingClientRect()` gives them. */
export type PlacementBox = { left: number; top: number; right: number; bottom: number };

/** Where an anchored panel landed. */
export type PanelPlacement = {
  /** The side of the anchor the panel is on. */
  side: "top" | "right" | "bottom" | "left";
  /**
   * The third of the panel's facing edge that the anchor's centre is in:
   * `left` / `center` / `right` on a top or bottom panel, `top` / `center` /
   * `bottom` on a left or right one. An arrow placed there points at the anchor.
   */
  align: "left" | "center" | "right" | "top" | "bottom";
};

/**
 * Where a panel positioned against an anchor actually landed — after the
 * browser's `position-try-fallbacks` have had their say, so a host can point
 * an arrow at the anchor whichever way the panel flipped. The side is the one
 * the panel stands furthest out on.
 */
export function panelPlacement(panel: PlacementBox, anchor: PlacementBox): PanelPlacement {
  const out = {
    top: anchor.top - panel.bottom,
    bottom: panel.top - anchor.bottom,
    left: anchor.left - panel.right,
    right: panel.left - anchor.right,
  };
  const side = (Object.keys(out) as PanelPlacement["side"][]).reduce((best, key) => (out[key] > out[best] ? key : best));
  const vertical = side === "top" || side === "bottom";
  const [start, end, centre] = vertical
    ? [panel.left, panel.right, (anchor.left + anchor.right) / 2]
    : [panel.top, panel.bottom, (anchor.top + anchor.bottom) / 2];
  const third = (centre - start) / (end - start);
  const align = third < 1 / 3 ? (vertical ? "left" : "top") : third > 2 / 3 ? (vertical ? "right" : "bottom") : "center";
  return { side, align };
}
