/**
 * Shared Slider markup for the element tests: one function, pure string output,
 * mirroring how `tabs.fixtures.ts` keeps its suites' data in one place.
 */
export type SliderFixture = {
  /** The root's `value` attribute, verbatim; omitted when undefined. */
  value?: string;
  /** How many thumbs to render. Defaults to one per value. */
  thumbs?: number;
  /** Further root attributes, verbatim (e.g. `min="10" disabled`). */
  attrs?: string;
};

export function sliderHtml({ value, thumbs, attrs = "" }: SliderFixture = {}): string {
  const count = thumbs ?? (value ?? "0").split(" ").length;
  const thumbParts = Array.from(
    { length: count },
    (_, index) => `<primitiv-slider-thumb aria-label="Thumb ${index + 1}"></primitiv-slider-thumb>`,
  ).join("");
  return (
    `<primitiv-slider${value === undefined ? "" : ` value="${value}"`}${attrs ? ` ${attrs}` : ""} data-testid="root">` +
    `<primitiv-slider-track><primitiv-slider-range data-testid="range"></primitiv-slider-range></primitiv-slider-track>` +
    `${thumbParts}</primitiv-slider>`
  );
}
