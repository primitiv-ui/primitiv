/**
 * The abstract roving-tabindex action that a keyboard event maps to.
 *
 * Consumers translate the action into whatever "go to" semantics suit
 * their pattern (focus only, focus + activate, focus + select, etc.).
 */
export type RovingKeyAction = "next" | "prev" | "first" | "last" | "activate";

type GetKeyToActionMapOptions = {
  /**
   * Which arrow-key axis is active. `"horizontal"` enables Arrow Left/Right,
   * `"vertical"` enables Arrow Up/Down, `"both"` enables all four. RTL
   * inversion (see {@link GetKeyToActionMapOptions.dir | `dir`}) swaps the
   * horizontal pair for both `"horizontal"` and `"both"`; the vertical pair
   * is never swapped, since vertical reading order does not depend on
   * direction.
   */
  orientation: "horizontal" | "vertical" | "both";
  /**
   * Reading direction. When `"rtl"`, swaps the meaning of Arrow Left and
   * Arrow Right — applied for both `"horizontal"` and `"both"` orientation
   * (never the vertical pair). Defaults to `"ltr"`.
   */
  dir?: "ltr" | "rtl";
  /**
   * When `true`, Home maps to `"first"` and End to `"last"`. Use for
   * patterns where Home/End jumping is part of the keyboard contract
   * (Tabs, Accordion). Defaults to `false`.
   */
  homeEnd?: boolean;
  /**
   * When `true`, Enter and Space map to `"activate"`. Use for patterns
   * where the focused item can be confirmed via the keyboard (Tabs in
   * `"manual"` activation mode). Defaults to `false`.
   */
  activate?: boolean;
};

/**
 * Builds the keyboard-key → roving-tabindex-action map for a single
 * focusable item in a compound widget. Each consumer shares the same
 * RTL / orientation / Home-End / Enter-Space conventions and just needs
 * to translate the abstract action ("next", "prev", "first", "last",
 * "activate") into its own movement / activation logic.
 *
 * Returns a plain `Record<string, RovingKeyAction>` so call sites can do
 * `const action = map[event.key]; if (action === "next") …`.
 *
 * @example Tabs trigger (horizontal, RTL, all features)
 * ```ts
 * const map = getKeyToActionMap({
 *   orientation: "horizontal",
 *   dir,
 *   homeEnd: true,
 *   activate: true,
 * });
 * const action = map[event.key];
 * ```
 *
 * @example Accordion trigger (vertical, no Enter/Space — handled separately)
 * ```ts
 * const map = getKeyToActionMap({ orientation: "vertical", homeEnd: true });
 * ```
 */
export function getKeyToActionMap({
  orientation,
  dir = "ltr",
  homeEnd = false,
  activate = false,
}: GetKeyToActionMapOptions): Record<string, RovingKeyAction> {
  const map: Record<string, RovingKeyAction> = {};

  if (orientation === "horizontal" || orientation === "both") {
    const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const backward = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    map[forward] = "next";
    map[backward] = "prev";
  }
  if (orientation === "vertical" || orientation === "both") {
    map.ArrowDown = "next";
    map.ArrowUp = "prev";
  }

  if (homeEnd) {
    map.Home = "first";
    map.End = "last";
  }

  if (activate) {
    map.Enter = "activate";
    map[" "] = "activate";
  }

  return map;
}
