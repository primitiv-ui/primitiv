/*
 * The two illustration frames, shared by the scene, the sequence and the
 * recorder so a size can never be right in one and stale in the others.
 *
 * Both are 4:3 — 560/420 and 342/257 differ by a quarter of a percent, which is
 * rounding, not a different aspect. That makes a downscale *look* possible and
 * it is not: at 342 wide the desktop composition renders its 14px labels at
 * 8.5px, and the whole point of the frame is that the focus rings and the key
 * cap stay legible. Mobile is a recomposition, not a crop and not a scale.
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
  },

  /*
   * 257px will not hold five `md` rows at their real heights — measured, it
   * overflows by 47px — so mobile gives up one row and one size step. Both
   * choices were made against a render rather than arithmetic:
   *
   * - `sm` rather than `xs`. At `xs` all five rows do fit (content bottom 253
   *   of 257), but the labels land at 11px and the controls at 24px, and this
   *   frame's stated job is that moving to full content width makes the focus
   *   rings EASIER to see. Shrinking the ring to buy back a row inverts that.
   * - The **checkbox** is the row dropped, not the switch. Space toggles both,
   *   so the keyboard model on show is identical either way — and at 342px a
   *   sliding thumb with a colour change reads at a glance where a 16px tick
   *   does not. What survives is one of each kind: text entry, a disclosure, a
   *   toggle, and the button focus lands on last.
   * - **Two countries, not three.** With three the panel does not fit below the
   *   trigger, so `position-try-fallbacks: flip-block` flips it ABOVE — real
   *   behaviour, and here it lands squarely over the name that was just typed,
   *   which loses the reader's place at exactly the wrong moment. Two rows fit
   *   downward and the flip never fires. It costs one ArrowDown press.
   */
  mobile: {
    width: 342,
    height: 257,
    size: "sm",
    controls: ["input", "select", "switch", "button"],
    options: 2,
  },
};
