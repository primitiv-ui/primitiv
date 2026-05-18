import type { CSSProperties } from "react";

import { Carousel } from "@primitiv/react";

import { carouselImages } from "../fixtures";
import "./_variableSizes.scss";

const slideWidths = [
  "50%",
  "30%",
  "60%",
  "30%",
  "70%",
  "30%",
  "50%",
];

/**
 * Slides of mixed widths in a single carousel. Already supported by
 * the JS — the viewport's scroll target is derived from each slide's
 * `getBoundingClientRect`, so no fixed width is assumed.
 *
 * JS owns: `snapAlign="center"` so programmatic navigation lands
 *   each slide centred regardless of its individual width. Without
 *   this, `goTo` against a 70%-wide slide would offset differently
 *   to the browser's snap engine.
 * CSS owns: per-slide `flex: 0 0 var(--w)` driven by an inline
 *   custom property the example sets per slide;
 *   `scroll-snap-align: center` to match the JS scroll target.
 */
export function VariableSizes() {
  return (
    <Carousel.Root
      className="variable-sizes"
      ariaLabel="Metal primitives — mixed slide widths"
      loop
      snapAlign="center"
    >
      <Carousel.Viewport className="variable-sizes__viewport">
        {carouselImages.map(({ src, description }, index) => (
          <Carousel.Slide
            key={src}
            className="variable-sizes__slide"
            style={{ "--w": slideWidths[index] } as CSSProperties}
          >
            <img
              className="variable-sizes__image"
              src={src}
              alt={description}
            />
          </Carousel.Slide>
        ))}
      </Carousel.Viewport>
      <div className="variable-sizes__controls">
        <Carousel.PreviousTrigger
          className="variable-sizes__trigger"
          aria-label="Previous"
        >
          {"<"}
        </Carousel.PreviousTrigger>
        <Carousel.Indicators
          className="variable-sizes__indicator-group"
          label="Choose slide"
        />
        <Carousel.NextTrigger
          className="variable-sizes__trigger"
          aria-label="Next"
        >
          {">"}
        </Carousel.NextTrigger>
      </div>
    </Carousel.Root>
  );
}
