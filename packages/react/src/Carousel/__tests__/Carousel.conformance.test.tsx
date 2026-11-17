import { CAROUSEL, runCarouselConformance } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { Carousel } from "..";

// The React reference surface runs the shared Carousel suite (RFC 0033 §6.2).
// It is expected to pass here first: React is the implementation the suite
// describes, so a failure is a real React bug, fixed in its own cycle.
runCarouselConformance(
  async ({ slides = 3, page = 0, loop, orientation, slidesPerPage, indicators, autoplay, field }) => {
    let unmount = () => {};
    await act(async () => {
      ({ unmount } = render(
        <Carousel.Root
          ariaLabel={CAROUSEL.label}
          defaultPage={page}
          loop={loop}
          orientation={orientation}
          slidesPerPage={slidesPerPage}
          autoplay={autoplay}
        >
          <Carousel.Viewport>
            {Array.from({ length: slides }, (_, i) => (
              <Carousel.Slide key={i}>
                {field && i === 0 ? <input aria-label="Field" /> : null}
                {CAROUSEL.slide(i + 1)}
              </Carousel.Slide>
            ))}
          </Carousel.Viewport>
          <Carousel.PreviousTrigger>{CAROUSEL.previous}</Carousel.PreviousTrigger>
          <Carousel.NextTrigger>{CAROUSEL.next}</Carousel.NextTrigger>
          {indicators ? <Carousel.Indicators label={CAROUSEL.indicators} /> : null}
          {autoplay ? <Carousel.PlayPauseTrigger /> : null}
        </Carousel.Root>,
      ));
    });
    return unmount;
  },
);
