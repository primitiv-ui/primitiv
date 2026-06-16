import { render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";

describe("Carousel translations", () => {
  it("should override the slide aria-label format via translations.slideLabel", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        translations={{
          slideLabel: ({ index, total }) => `Page ${index} sur ${total}`,
        }}
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "aria-label",
      "Page 1 sur 2",
    );
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "aria-label",
      "Page 2 sur 2",
    );
  });

  it("should still allow per-slide ariaLabel overrides to take precedence over translations.slideLabel", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        translations={{ slideLabel: ({ index }) => `auto-${index}` }}
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide
            ariaLabel="Hand-picked for you"
            data-testid="slide-1"
          />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "aria-label",
      "auto-1",
    );
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "aria-label",
      "Hand-picked for you",
    );
  });

  it("should override the indicator aria-label format via translations.indicatorLabel", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        translations={{ indicatorLabel: ({ index }) => `Diapositive ${index}` }}
      >
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} />
          <Carousel.Indicator index={1} />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    expect(
      screen.getByRole("button", { name: "Diapositive 1" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Diapositive 2" }),
    ).toBeVisible();
  });

  it("should override the PlayPauseTrigger accessible name via translations.startSlideshow when paused", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        translations={{ startSlideshow: "Démarrer le diaporama" }}
      >
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    expect(
      screen.getByRole("button", { name: "Démarrer le diaporama" }),
    ).toBeVisible();
  });

  it("should override the PlayPauseTrigger accessible name via translations.stopSlideshow when playing", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        defaultPlaying
        translations={{ stopSlideshow: "Arrêter le diaporama" }}
      >
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    expect(
      screen.getByRole("button", { name: "Arrêter le diaporama" }),
    ).toBeVisible();
  });

  it("should fall back to defaults for any translation keys not specified", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        translations={{ startSlideshow: "Démarrer" }}
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} />
        </Carousel.IndicatorGroup>
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    // startSlideshow override applied
    expect(screen.getByRole("button", { name: "Démarrer" })).toBeVisible();
    // slideLabel default still applied
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "aria-label",
      "1 of 2",
    );
    // indicatorLabel default still applied
    expect(screen.getByRole("button", { name: "Slide 1" })).toBeVisible();
  });

  it("should apply translations.indicatorLabel to indicators auto-rendered by Carousel.Indicators", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        translations={{ indicatorLabel: ({ index }) => `Page ${index}` }}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose page" />
      </Carousel.Root>,
    );

    expect(screen.getByRole("button", { name: "Page 1" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Page 2" })).toBeVisible();
  });
});
