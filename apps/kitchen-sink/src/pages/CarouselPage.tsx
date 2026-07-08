import type { ReactNode } from "react";

import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "@primitiv-ui/icons";

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
      <div className="primitiv-carousel__controls">
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

/**
 * Vertical orientation — the "External-column beside" composition: the viewport
 * scrolls on the block axis (up/down), with the controls stacked into a column
 * beside it (up-control, vertical dots, down-control). The whole thing is the
 * iteration-1 row rotated a quarter turn, driven by a single `orientation` prop.
 */
function VerticalSingle({ label }: { label: string }) {
  return (
    <Carousel ariaLabel={label} orientation="vertical">
      <CarouselViewport>
        {SLIDES.map((bg, i) => (
          <CarouselSlide key={i} style={{ background: bg }} />
        ))}
      </CarouselViewport>
      <div className="primitiv-carousel__controls">
        <CarouselPreviousTrigger aria-label="Previous slide">
          <ChevronUp />
        </CarouselPreviousTrigger>
        <CarouselIndicatorGroup label="Choose slide">
          {SLIDES.map((_, i) => (
            <CarouselIndicator key={i} index={i} />
          ))}
        </CarouselIndicatorGroup>
        <CarouselNextTrigger aria-label="Next slide">
          <ChevronDown />
        </CarouselNextTrigger>
      </div>
    </Carousel>
  );
}

function Example({
  title,
  note,
  children,
  dir,
}: {
  title: string;
  note: string;
  children: ReactNode;
  dir?: "rtl";
}) {
  return (
    <article className="carousel-page" dir={dir}>
      <h1>{title}</h1>
      <p className="carousel-page__note">{note}</p>
      {children}
    </article>
  );
}

export function CarouselDefault() {
  return (
    <Example
      title="Default — fills its container"
      note="One slide per view at 16:9, circular prev/next and dots sharing one row below. Resize the window to watch it adapt."
    >
      <BasicSingle label="Featured products — default" />
    </Example>
  );
}

export function CarouselResponsive() {
  return (
    <Example
      title="Container adaptation — narrow vs wide"
      note="The same carousel in a fixed-narrow column and a flexible-wide column, proving it adapts to whatever space it is given — no fixed dimensions."
    >
      <div className="carousel-page__row">
        <div className="carousel-page__narrow">
          <BasicSingle label="Featured products — narrow container" />
        </div>
        <div className="carousel-page__wide">
          <BasicSingle label="Featured products — wide container" />
        </div>
      </div>
    </Example>
  );
}

export function CarouselRtl() {
  return (
    <Example
      title={'RTL — dir="rtl"'}
      note="Layout is expressed in logical properties, so the whole carousel mirrors under a right-to-left container with no RTL-specific CSS."
      dir="rtl"
    >
      <BasicSingle label="Featured products — right to left" />
    </Example>
  );
}

export function CarouselSquare() {
  return (
    <Example
      title={'Square slides — radius="none"'}
      note="The slide radius modifier squares off the default rounding via the CarouselSlide radius=“none” prop."
    >
      <BasicSingle label="Featured products — square" radius="none" />
    </Example>
  );
}

export function CarouselVertical() {
  return (
    <Example
      title={'Vertical — orientation="vertical"'}
      note="The block-axis carousel: up/down controls and a column of dots beside a portrait viewport. ArrowDown/ArrowUp page it. The same layout under RTL puts the controls on the start (right) side — logical properties, no RTL-specific CSS."
    >
      <div className="carousel-page__row">
        <div className="carousel-page__vertical">
          <VerticalSingle label="Featured products — vertical" />
        </div>
        <div className="carousel-page__vertical" dir="rtl">
          <VerticalSingle label="Featured products — vertical, right to left" />
        </div>
      </div>
    </Example>
  );
}
