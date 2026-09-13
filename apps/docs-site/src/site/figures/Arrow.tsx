/**
 * The shared connector glyph — one asset, pointing down.
 *
 * Every arrow in the figure set is this one rotated: FAMILY-01 turns it up
 * (`--up`), CLI-01 draws its own horizontal variant because that one carries a
 * label along its length. Colour comes from the cascade via `currentColor`, so
 * a single SVG serves both themes and no second file exists to fall out of step.
 *
 * Always `aria-hidden`. An arrow is a visual relation between two things that
 * are themselves already labelled, and announcing "arrow" adds nothing a reader
 * can act on — the figure's caption carries the claim the arrow is making.
 */
export const Arrow = ({ className }: { className?: string }) => (
  <svg
    className={["docs-figure__arrow", className].filter(Boolean).join(" ")}
    viewBox="0 0 12 40"
    role="presentation"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M6 0 V33 M1 27 L6 34 L11 27"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);
