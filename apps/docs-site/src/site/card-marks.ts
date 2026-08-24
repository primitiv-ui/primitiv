import data from "./card-marks.json";

/**
 * The symbolic marks drawn in each component card's media region.
 *
 * **`card-marks.json` is the single source of truth**, read by BOTH surfaces:
 * this module renders it as inline SVG, and the Figma script on the page
 * "Docs — Component Card Marks" builds its components from the same file. The
 * geometry is deliberately data rather than hand-written JSX — with 63 marks to
 * draw, a second hand-maintained copy is a guarantee of drift.
 *
 * ## The grid
 *
 * A 256x144 trim (16:9, matching the card's media band, so nothing letterboxes)
 * on an **8-unit module**, with a 208x112 live area — a 24/16 margin that every
 * mark respects. Coordinates are multiples of 4; row heights and gaps within a
 * mark are equal by construction, not by eye.
 *
 * **The trim is dense on purpose.** A mark renders about 280px wide, so the
 * viewBox scales roughly 1.1x and `stroke-width: 2` lands at ~2.2px on screen.
 * The first pass drew on a 64-unit trim, where the same nominal 1.5 scaled 4.4x
 * to a ~6.6px slab — the arithmetic, not the design, is what made those marks
 * look heavy. Stroke weight here is an on-screen target first and a viewBox
 * number second.
 *
 * Per the icon-design rules: stroke 2 wants its line centres on integers, which
 * every coordinate here satisfies; bars are 8 tall with `r: 4`, so they are true
 * pills rather than nearly-round rectangles.
 *
 * ## The visual language, in two rules
 *
 * Chrome — frames, dividers, chevrons — is a **stroke in the neutral**. Content
 * — the filled bars and blocks standing for what sits inside a component — is a
 * **fill in the primary**. That split is what makes a populated component read
 * differently from an empty container, and it is why a layout primitive like
 * `Stack` is entirely neutral: it has no content of its own.
 *
 * **Colour comes only from tokens**, never a literal, so a mark tracks light and
 * dark in both directions and survives a change to the brand ramp.
 * `currentColor` would have been simpler and is deliberately not used: it
 * carries one colour, and these need two.
 *
 * Marks are icon-like and symbolic — never a screenshot or a scaled-down live
 * instance, which would be illegible at this size and stale the moment the
 * component changed.
 */
export type MarkShape =
  /** A rounded rectangle. `fill` paints it in the primary; otherwise it is stroked chrome. */
  | { readonly kind: "rect"; readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly r: number; readonly fill?: boolean }
  /** A stroked path — chevrons, dividers, the modal's close cross. Never filled. */
  | { readonly kind: "path"; readonly d: string };

export const MARK_GRID: {
  readonly viewBox: { readonly width: number; readonly height: number };
  readonly module: number;
  readonly live: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly stroke: number;
} = data.grid;

const marks = data.marks as Record<string, readonly MarkShape[]>;

/**
 * The stand-in for a component whose mark has not been drawn yet.
 *
 * Deliberately generic — a frame with two content bars — so an undrawn card
 * reads as "artwork pending" rather than as a wrong guess at the component.
 * Underscore-prefixed in the JSON so it cannot collide with a registry id.
 */
export const PLACEHOLDER_MARK: readonly MarkShape[] = marks._placeholder;

/** Every drawn mark, keyed by registry id. Excludes the placeholder. */
export const CARD_MARKS: Readonly<Record<string, readonly MarkShape[]>> =
  Object.fromEntries(Object.entries(marks).filter(([id]) => !id.startsWith("_")));
