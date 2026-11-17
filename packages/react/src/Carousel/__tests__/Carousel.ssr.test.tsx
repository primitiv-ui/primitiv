// @vitest-environment node
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Carousel } from "../Carousel.tsx";

/**
 * The Viewport chose its scroll behaviour by reading
 * `window.matchMedia` in a `useMemo` — during render, so a server render
 * (no `window`) threw `ReferenceError: window is not defined`. Guarded with a
 * `typeof window` check, the primitive renders a static snapshot on the server.
 */
describe("Carousel SSR", () => {
  it("should render to static markup when there is no window", () => {
    expect(typeof window).toBe("undefined");

    const markup = renderToStaticMarkup(
      <Carousel.Root ariaLabel="Featured">
        <Carousel.Viewport>
          <Carousel.Slide>First</Carousel.Slide>
          <Carousel.Slide>Second</Carousel.Slide>
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(markup).toContain("First");
    expect(markup).toContain("Second");
  });
});

describe("Carousel SSR slides", () => {
  it("names no slide and snaps none before the slides have registered", () => {
    // Arrange & Act — on the server no slide has a position yet.
    const markup = renderToStaticMarkup(
      <Carousel.Root ariaLabel="Featured">
        <Carousel.Viewport>
          <Carousel.Slide>First</Carousel.Slide>
          <Carousel.Slide>Second</Carousel.Slide>
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const slides = markup.match(/<div[^>]*aria-roledescription="slide"[^>]*>/g) ?? [];

    // Assert — not "0 of 0", and no snap point to rest on.
    expect(slides).toHaveLength(2);
    for (const slide of slides) {
      expect(slide).not.toContain("aria-label=");
      expect(slide).not.toContain("data-snap-align=");
    }
  });
});
