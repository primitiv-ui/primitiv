/*
 * The two illustration frames, shared by the scene, the sequence and the
 * recorder so a size can never be right in one and stale in the others.
 *
 * Both are 4:3 — 560/420 and 342/257 differ by a quarter of a percent, which is
 * rounding, not a different aspect. That makes a downscale *look* possible and
 * it is not: at 342 wide the desktop composition renders its 14px labels at
 * 8.5px. Mobile is a recomposition, not a crop and not a scale.
 *
 * Density is `comfortable` on both. It is what the rest of the page
 * demonstrates, and a denser mobile frame would introduce a second variable
 * into an illustration whose subject is neither density nor size.
 */
export const FRAMES = {
  desktop: {
    width: 560,
    height: 420,
    size: "md",
    controls: ["input", "select", "checkbox", "switch", "button"],
    options: 3,
    /**
     * Gap between form rows, as a `space/*` token.
     *
     * This is the one number that decides whether the card looks designed. It
     * has to clearly beat the Field's own label-to-control gap, or the form
     * stops reading as a set of labelled groups and becomes one
     * undifferentiated stack of eight things. Measured, that internal gap is
     * **8 at md and 4 at xs**, so both frames run a ratio of 2.5.
     */
    rowGap: "20",
  },

  /*
   * 257px will not hold five `md` rows at their real heights — measured, it
   * overflows by 47px — so mobile drops a size step rather than dropping rows.
   *
   * **This corrects an earlier build here**, which used `sm` with the checkbox
   * removed on the stated grounds that `xs` would shrink the focus ring, the
   * one thing this illustration exists to show. That reasoning was wrong, and
   * measuring it is what showed it: the ring is FIXED geometry — a 2px gap band
   * and a 2px ring, `box-shadow: 0 0 0 2px, 0 0 0 4px` — identical on a 40px md
   * control and a 24px xs one. Nothing about the ring scales with size.
   *
   * What `sm` actually cost was the row gap. Four `sm` rows leave room for a
   * gap of 8 against a label-to-control gap of 6 — a ratio of 1.3, which is no
   * grouping at all, and it looked it. `xs` fits all five rows AND a gap of 10
   * against an internal 4, which is the 2.5 the desktop frame runs. The type is
   * smaller; the composition is right, and the two frames now show the same
   * form, the same controls and the same sequence.
   */
  mobile: {
    width: 342,
    height: 257,
    size: "xs",
    controls: ["input", "select", "checkbox", "switch", "button"],
    options: 3,
    rowGap: "10",
  },
};
