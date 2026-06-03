import { useState } from "react";

import { Carousel } from "@primitiv/react";

import { carouselImages } from "../fixtures";
import "./thumbnails.css";

/**
 * Thumbnails — a main carousel synced with a thumbnail strip below it.
 * Clicking a thumbnail jumps directly to that slide; navigating the main
 * carousel highlights the corresponding thumbnail.
 *
 * Both are bound to a single `page` state in the parent so they stay in
 * sync. The thumbnail strip is a plain button group (not a second Carousel)
 * since all 7 thumbnails fit comfortably without needing to scroll.
 *
 * JS owns: controlled `page` + `onPageChange` (shared state drives both).
 * CSS owns: thumbnail active indicator via `aria-pressed` attribute.
 */
export function Thumbnails() {
  const [page, setPage] = useState(0);

  return (
    <div className="thumbnails cx-frame">
      <Carousel.Root
        className="thumbnails__carousel"
        ariaLabel="Metal primitives — thumbnails"
        page={page}
        onPageChange={setPage}
      >
        <Carousel.Viewport className="thumbnails__viewport cx-viewport-track">
          {carouselImages.map(({ src, description }) => (
            <Carousel.Slide key={src} className="thumbnails__slide cx-slide-surface">
              <img
                className="thumbnails__image cx-image"
                src={src}
                alt={description}
              />
            </Carousel.Slide>
          ))}
        </Carousel.Viewport>
        <div className="thumbnails__controls cx-controls">
          <Carousel.PreviousTrigger
            className="thumbnails__trigger cx-trigger"
            aria-label="Previous"
          >
            {"<"}
          </Carousel.PreviousTrigger>
          <Carousel.NextTrigger
            className="thumbnails__trigger cx-trigger"
            aria-label="Next"
          >
            {">"}
          </Carousel.NextTrigger>
        </div>
      </Carousel.Root>

      <div
        role="group"
        aria-label="Slide thumbnails"
        className="thumbnails__strip"
      >
        {carouselImages.map(({ src, description }, index) => (
          <button
            key={src}
            type="button"
            className="thumbnails__thumb"
            aria-label={`Slide ${index + 1}: ${description.split(",")[0]}`}
            aria-pressed={index === page}
            onClick={() => setPage(index)}
          >
            <img src={src} alt="" className="thumbnails__thumb-image cx-image" />
          </button>
        ))}
      </div>
    </div>
  );
}
