/** Pure data: the markup each carousel test renders. */
export type CarouselFixture = {
  slides?: number;
  /** Extra attributes on the root, written as is. */
  attrs?: string;
  /** Wrap the slides in a <primitiv-carousel-track>. */
  track?: boolean;
  /** Controls after the viewport, written as is. */
  controls?: string;
};

export const PREVIOUS = '<primitiv-carousel-previous-trigger><button type="button">Previous</button></primitiv-carousel-previous-trigger>';
export const NEXT = '<primitiv-carousel-next-trigger><button type="button">Next</button></primitiv-carousel-next-trigger>';
export const INDICATORS = '<primitiv-carousel-indicators label="Choose slide"></primitiv-carousel-indicators>';

/** A labelled carousel of `slides` slides named "Slide content N", with the given controls. */
export function carouselHtml({ slides = 3, attrs = "", track = false, controls = `${PREVIOUS}${NEXT}` }: CarouselFixture = {}): string {
  const items = Array.from({ length: slides }, (_, i) => `<primitiv-carousel-slide>Slide content ${i + 1}</primitiv-carousel-slide>`).join("");
  const inner = track ? `<primitiv-carousel-track>${items}</primitiv-carousel-track>` : items;
  return `<primitiv-carousel aria-label="Featured" ${attrs}><primitiv-carousel-viewport>${inner}</primitiv-carousel-viewport>${controls}</primitiv-carousel>`;
}
