import { defineCarousel } from "../elements";
import "./jsdom";
import { settle } from "./mount";

/**
 * The markup a server renders for page 1 of three, with every attribute the
 * root would write already in place.
 */
const PRERENDERED = `
<primitiv-carousel aria-label="Featured" page="1" autoplay role="region" aria-roledescription="carousel" data-orientation="horizontal" data-transition="slide" data-loop="none">
  <primitiv-carousel-viewport data-carousel-viewport="" data-snap-type="mandatory" tabindex="0" aria-live="polite">
    <primitiv-carousel-slide role="group" aria-roledescription="slide" data-carousel-slide="" data-index="0" data-total="3" data-state="inactive" aria-label="1 of 3" data-snap-align="center">One</primitiv-carousel-slide>
    <primitiv-carousel-slide role="group" aria-roledescription="slide" data-carousel-slide="" data-index="1" data-total="3" data-state="active" aria-label="2 of 3" data-snap-align="center">Two</primitiv-carousel-slide>
    <primitiv-carousel-slide role="group" aria-roledescription="slide" data-carousel-slide="" data-index="2" data-total="3" data-state="inactive" aria-label="3 of 3" data-snap-align="center">Three</primitiv-carousel-slide>
  </primitiv-carousel-viewport>
  <primitiv-carousel-previous-trigger><button type="button" aria-disabled="false">Previous</button></primitiv-carousel-previous-trigger>
  <primitiv-carousel-next-trigger><button type="button" aria-disabled="false">Next</button></primitiv-carousel-next-trigger>
  <primitiv-carousel-play-pause-trigger><button type="button" aria-label="Start automatic slide show" data-state="paused"><span data-play-state="paused">Play</span><span data-play-state="playing" hidden>Pause</span></button></primitiv-carousel-play-pause-trigger>
  <primitiv-carousel-indicators label="Choose slide" role="group" aria-label="Choose slide">
    <primitiv-carousel-indicator index="0"><button type="button" data-carousel-indicator="" data-state="inactive" aria-label="Slide 1" aria-disabled="false"></button></primitiv-carousel-indicator>
    <primitiv-carousel-indicator index="1"><button type="button" data-carousel-indicator="" data-state="active" aria-label="Slide 2" aria-disabled="true"></button></primitiv-carousel-indicator>
    <primitiv-carousel-indicator index="2"><button type="button" data-carousel-indicator="" data-state="inactive" aria-label="Slide 3" aria-disabled="false"></button></primitiv-carousel-indicator>
  </primitiv-carousel-indicators>
  <primitiv-carousel-progress-text>2 of 3</primitiv-carousel-progress-text>
</primitiv-carousel>`;

it("adopts server-rendered markup without writing an attribute or a node", async () => {
  // Arrange
  const holder = document.createElement("div");
  holder.innerHTML = PRERENDERED;
  document.body.append(holder);
  const writes: MutationRecord[] = [];
  const observer = new MutationObserver((records) => writes.push(...records));
  observer.observe(holder, { subtree: true, childList: true, attributes: true, characterData: true });

  // Act
  defineCarousel();
  await settle();
  observer.disconnect();

  // Assert — the measurements the styles read (`style`) are layout, not markup.
  expect(writes.filter((record) => record.attributeName !== "style")).toEqual([]);
  holder.remove();
});
