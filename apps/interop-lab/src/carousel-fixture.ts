/** The carousel the Carousel pages render, read from the URL so one spec drives each page. */
export type CarouselFixture = {
  page: string | null;
  loop: string | null;
  orientation: string | null;
  dir: string | null;
  drag: boolean;
  autoplay: boolean;
};

export function carouselFixtureFromUrl(search: string = location.search): CarouselFixture {
  const params = new URLSearchParams(search);
  return {
    page: params.get("page"),
    loop: params.get("loop"),
    orientation: params.get("orientation"),
    dir: params.get("dir"),
    drag: params.has("drag"),
    autoplay: params.has("autoplay"),
  };
}

/**
 * The plain-HTML rendering, as a server would send it, shared by the html page
 * and the HTMX fragments. The lab loads no stylesheet, so the page gives the
 * viewport and slides their scroll-snap layout inline: a 300px window onto
 * 300px slides (100px tall when vertical).
 */
export function carouselHtml(fixture: Partial<CarouselFixture> = {}, id = "carousel", count = 3): string {
  const { page, loop, orientation, drag, autoplay } = fixture;
  const vertical = orientation === "vertical";
  const infinite = loop === "infinite";
  const attrs = [
    `id="${id}"`,
    `aria-label="${id} carousel"`,
    page ? `page="${page}"` : "",
    loop === null || loop === undefined ? "" : loop === "wrap" ? "loop" : `loop="${loop}"`,
    orientation ? `orientation="${orientation}"` : "",
    drag ? "allow-mouse-drag" : "",
    autoplay ? 'autoplay playing autoplay-delay="400"' : "",
    'style="display:block"',
  ]
    .filter(Boolean)
    .join(" ");
  const axis = vertical ? "y" : "x";
  const viewportStyle = infinite
    ? "display:block;overflow:hidden;width:300px"
    : `display:flex;${vertical ? "flex-direction:column;height:100px;overflow-y:auto" : "overflow-x:auto"};width:300px;scroll-snap-type:${axis} mandatory;scrollbar-width:none`;
  const slides = Array.from(
    { length: count },
    (_, index) =>
      `<primitiv-carousel-slide style="display:block;flex:0 0 ${vertical ? "100px" : "300px"};height:100px;scroll-snap-align:center">${id} slide ${index + 1}</primitiv-carousel-slide>`,
  ).join("");
  const inner = infinite ? `<primitiv-carousel-track style="display:flex">${slides}</primitiv-carousel-track>` : slides;
  const wrapper = 'style="display:contents"';
  return (
    `<primitiv-carousel ${attrs}><primitiv-carousel-viewport style="${viewportStyle}">${inner}</primitiv-carousel-viewport>` +
    `<primitiv-carousel-previous-trigger ${wrapper}><button type="button">${id} previous</button></primitiv-carousel-previous-trigger>` +
    `<primitiv-carousel-next-trigger ${wrapper}><button type="button">${id} next</button></primitiv-carousel-next-trigger>` +
    `<primitiv-carousel-indicators label="${id} slides"></primitiv-carousel-indicators></primitiv-carousel>`
  );
}
