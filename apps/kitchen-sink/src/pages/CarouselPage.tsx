import { ChevronLeft, ChevronRight } from "@primitiv-ui/icons";

import {
  Carousel,
  CarouselViewport,
  CarouselSlide,
  CarouselPreviousTrigger,
  CarouselNextTrigger,
  CarouselIndicatorGroup,
  CarouselIndicator,
} from "../components";
import "./CarouselPage.css";

// Gradients stand in for photography (the Figma examples do the same — real
// imagery is a per-slide fill override the consumer supplies).
const SLIDES = [
  "linear-gradient(135deg, #1e3a8a, #14b8a6)",
  "linear-gradient(135deg, #7c3aed, #ec4899)",
  "linear-gradient(135deg, #ea580c, #16a34a)",
  "linear-gradient(135deg, #0ea5e9, #6366f1)",
];

/**
 * Iteration 1 — the basic responsive single-slide composition: one slide per
 * view, circular external prev/next controls and dots sharing one row below
 * (the "External-row + dots" design). The whole carousel fills its container.
 */
function BasicSingle({
  label,
  radius,
}: {
  label: string;
  radius?: "md" | "none";
}) {
  return (
    <Carousel ariaLabel={label}>
      <CarouselViewport>
        {SLIDES.map((bg, i) => (
          <CarouselSlide key={i} radius={radius} style={{ background: bg }} />
        ))}
      </CarouselViewport>
      <div className="carousel-page__controls">
        <CarouselPreviousTrigger aria-label="Previous slide">
          <ChevronLeft />
        </CarouselPreviousTrigger>
        <CarouselIndicatorGroup label="Choose slide">
          {SLIDES.map((_, i) => (
            <CarouselIndicator key={i} index={i} />
          ))}
        </CarouselIndicatorGroup>
        <CarouselNextTrigger aria-label="Next slide">
          <ChevronRight />
        </CarouselNextTrigger>
      </div>
    </Carousel>
  );
}

export function CarouselPage() {
  return (
    <div className="carousel-page">
      <h1>Carousel</h1>
      <p className="carousel-page__note">
        Iteration 1 — basic responsive single-slide (External-row + dots). Every
        instance fills its container and each slide keeps a 16:9 ratio; resize
        the window to see the carousel adapt.
      </p>

      <section className="carousel-page__specimen">
        <h2>Default — fills its container</h2>
        <BasicSingle label="Featured products — default" />
      </section>

      <section className="carousel-page__specimen">
        <h2>Container adaptation — narrow vs wide</h2>
        <div className="carousel-page__row">
          <div className="carousel-page__narrow">
            <BasicSingle label="Featured products — narrow container" />
          </div>
          <div className="carousel-page__wide">
            <BasicSingle label="Featured products — wide container" />
          </div>
        </div>
      </section>

      <section className="carousel-page__specimen" dir="rtl">
        <h2>RTL — dir=&quot;rtl&quot;</h2>
        <BasicSingle label="Featured products — right to left" />
      </section>

      <section className="carousel-page__specimen">
        <h2>Square slides — radius=&quot;none&quot;</h2>
        <BasicSingle label="Featured products — square" radius="none" />
      </section>
    </div>
  );
}
