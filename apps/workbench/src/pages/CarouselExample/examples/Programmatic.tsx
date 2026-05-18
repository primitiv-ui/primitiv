import { useRef, useState } from "react";

import { Carousel } from "@primitiv/react";
import type { CarouselImperativeApi } from "@primitiv/react";

import { carouselImages } from "../fixtures";
import "./_programmatic.scss";

/**
 * Single image visible at a time, with consumer-owned controls
 * that drive `goTo` via the imperative API and a progress bar
 * keyed on `onPageChange`. Demonstrates Ark UI's
 * `scrollToIndex`-equivalent and the `getProgress` reader.
 *
 * JS owns: imperative `goTo(index)` for the quick-jump toolbar,
 *   `onPageChange` callback to mirror page state in React for
 *   the progress bar, `loop`.
 * CSS owns: same single-slide-scroll layout as the canonical
 *   Single · Slide example, plus a `width: calc(var(--progress)
 *   * 100%)` rule on a `::after` pseudo-element for the bar.
 */
export function Programmatic() {
  const carouselRef = useRef<CarouselImperativeApi>(null);
  const [page, setPage] = useState(0);
  const totalPages = carouselImages.length;
  const progress = totalPages > 1 ? page / (totalPages - 1) : 0;

  return (
    <div className="programmatic">
      <div
        className="programmatic__progress"
        style={{ "--progress": progress } as React.CSSProperties}
        aria-hidden="true"
      />
      <div className="programmatic__quick-jump">
        {carouselImages.map(({ name }, index) => (
          <button
            key={name}
            type="button"
            className="programmatic__jump"
            onClick={() => carouselRef.current?.goTo(index)}
          >
            Go to {name.split(" ")[0]}
          </button>
        ))}
      </div>
      <Carousel.Root
        ref={carouselRef}
        className="programmatic__carousel"
        ariaLabel="Metal primitives — programmatic"
        loop
        page={page}
        onPageChange={setPage}
      >
        <Carousel.Viewport className="programmatic__viewport">
          {carouselImages.map(({ src, description }) => (
            <Carousel.Slide
              key={src}
              className="programmatic__slide"
            >
              <img
                className="programmatic__image"
                src={src}
                alt={description}
              />
            </Carousel.Slide>
          ))}
        </Carousel.Viewport>
        <div className="programmatic__controls">
          <Carousel.PreviousTrigger
            className="programmatic__trigger"
            aria-label="Previous"
          >
            {"<"}
          </Carousel.PreviousTrigger>
          <Carousel.Indicators
            className="programmatic__indicator-group"
            label="Choose slide"
          />
          <Carousel.NextTrigger
            className="programmatic__trigger"
            aria-label="Next"
          >
            {">"}
          </Carousel.NextTrigger>
        </div>
      </Carousel.Root>
    </div>
  );
}
