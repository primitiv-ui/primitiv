import { CAROUSEL, runCarouselConformance } from "@primitiv-ui/conformance";

import { defineCarousel } from "../elements";
import "./jsdom";

runCarouselConformance(async ({ slides = 3, page = 0, loop, orientation, slidesPerPage, indicators, autoplay, field }) => {
  defineCarousel();
  const attrs = [
    `aria-label="${CAROUSEL.label}"`,
    `page="${page}"`,
    loop ? "loop" : "",
    orientation ? `orientation="${orientation}"` : "",
    slidesPerPage ? `slides-per-page="${slidesPerPage}"` : "",
    autoplay ? "autoplay" : "",
  ].join(" ");
  const items = Array.from(
    { length: slides },
    (_, i) =>
      `<primitiv-carousel-slide>${field && i === 0 ? '<input aria-label="Field">' : ""}${CAROUSEL.slide(i + 1)}</primitiv-carousel-slide>`,
  ).join("");
  document.body.innerHTML = `<primitiv-carousel ${attrs}>
    <primitiv-carousel-viewport>${items}</primitiv-carousel-viewport>
    <primitiv-carousel-previous-trigger><button type="button">${CAROUSEL.previous}</button></primitiv-carousel-previous-trigger>
    <primitiv-carousel-next-trigger><button type="button">${CAROUSEL.next}</button></primitiv-carousel-next-trigger>
    ${indicators ? `<primitiv-carousel-indicators label="${CAROUSEL.indicators}"></primitiv-carousel-indicators>` : ""}
    ${autoplay ? '<primitiv-carousel-play-pause-trigger><button type="button"></button></primitiv-carousel-play-pause-trigger>' : ""}
  </primitiv-carousel>`;
  await Promise.resolve();
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
