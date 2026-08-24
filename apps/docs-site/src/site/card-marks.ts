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
 * ## The layout family
 *
 * A layout primitive is the exception that proves the rule, and settling it
 * took an exploration of its own (the Figma page carries the boards). It has no
 * content of its own, so three rules fall out:
 *
 * - Its **own box is dashed** — the container renders nothing of itself.
 * - Its **children stay neutral** — they are not the primitive's business.
 * - The **primary marks the space the primitive controls**: the gap for `Stack`
 *   and `Grid`, the equal margins for `Container`, the four equal offsets for
 *   `Center` (the marks being the same length IS the centring).
 *
 * Three exceptions, each for a reason. `Spacer` and `Divider` get **no box** —
 * they are not containers — and they are deliberately a matched pair: identical
 * neighbours, but Spacer's primary mark is short and centred where Divider's
 * runs the full width, because Divider draws real ink and Spacer draws none.
 * `AspectRatio` is **solid rather than dashed**, since its box is the whole
 * point, with a primary diagonal for the ratio it holds. And `Box` is empty but
 * for a primary handle at one corner: its contract calls it "the escape hatch —
 * a bare polymorphic element with no visual opinion" with zero modifiers, so
 * there is no space for the primary to mark, and the handle stands for the one
 * thing it is for — somewhere to attach a custom property. An entirely empty
 * dashed rectangle was the more honest drawing and was rejected for reading as
 * artwork that had failed to load.
 *
 * A mark may also be **solid** rather than outlined, and that is the strongest
 * distinction in the set: `Button` is a filled primary block with a knocked-out
 * label, `Input` an outlined field with a value and a caret. Mass versus void
 * survives being 40px tall on a card, where two rounded rectangles differing
 * only in width did not — and it is what the two components genuinely look
 * like, since the default Button variant is solid brand.
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
  /**
   * A rounded rectangle. Its `fill` names the role that paints it; omit it and
   * the rectangle is stroked chrome instead.
   *
   * - `"content"` — the primary, for what sits INSIDE a component.
   * - `"knockout"` — the colour that reads ON a primary fill, for a label lying
   *   over one. It is `action/primary/foreground/default`, the same token a real
   *   primary Button's text uses, so it stays legible whatever the brand ramp
   *   does.
   */
  | {
      readonly kind: "rect";
      readonly x: number; readonly y: number;
      readonly w: number; readonly h: number;
      readonly r: number;
      readonly fill?: MarkRole;
      /**
       * The outline's role. Defaults to neutral chrome when the rect has no
       * fill, and to nothing when it does — set it explicitly for a shape that
       * needs both, like a masked avatar in a group.
       */
      readonly stroke?: MarkRole;
      /**
       * Draw the outline dashed. Reserved for a LAYOUT primitive's own box: a
       * dashed edge says the container renders nothing of itself, which is the
       * literal truth for `Stack`, `Grid`, `Box`, `Center` and `Container`.
       * `AspectRatio` is solid because its box IS the point, and `Spacer` and
       * `Divider` have no box at all — they are not containers.
       */
      readonly dash?: boolean;
    }
  /**
   * A path. `stroke` names the outline's role (neutral chrome by default);
   * `fill` names the interior's, and omitting it leaves the path unfilled.
   *
   * The two are independent because Button's pointer needs both: it is drawn
   * the way a real cursor is, a **white fill with a neutral edge**, and it has
   * to be, because it crosses the button's own boundary. Filled white alone
   * would vanish against the page behind it; stroked neutral alone would
   * vanish against the brand colour in front of it.
   */
  | {
      readonly kind: "path";
      readonly d: string;
      readonly stroke?: MarkRole;
      readonly fill?: MarkRole;
    };

/**
 * A paint role. Each maps to one semantic token and nothing else — see the
 * class pairs in `components-index.css`.
 */
export type MarkRole =
  | "chrome"
  | "content"
  | "knockout"
  | "on-action"
  /**
   * The page surface. Only for MASKING — an `AvatarGroup`'s faces overlap, and
   * an outlined circle over another outlined circle reads as a Venn diagram
   * unless each one hides what is behind it.
   */
  | "surface";

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
