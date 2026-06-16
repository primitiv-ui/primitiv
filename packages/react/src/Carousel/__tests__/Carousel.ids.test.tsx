import { render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";

describe("Carousel custom ids", () => {
  it("should apply ids.root to the rendered <section>", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        ids={{ root: "promo-carousel" }}
        data-testid="carousel-root"
      />,
    );

    expect(screen.getByTestId("carousel-root")).toHaveAttribute(
      "id",
      "promo-carousel",
    );
  });

  it("should apply ids.viewport to the rendered Viewport element", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        ids={{ viewport: "promo-viewport" }}
      >
        <Carousel.Viewport data-testid="viewport" />
      </Carousel.Root>,
    );

    expect(screen.getByTestId("viewport")).toHaveAttribute(
      "id",
      "promo-viewport",
    );
  });

  it("should apply ids.previousTrigger and ids.nextTrigger to the prev/next buttons", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        ids={{ previousTrigger: "prev-btn", nextTrigger: "next-btn" }}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    expect(screen.getByRole("button", { name: "Previous" })).toHaveAttribute(
      "id",
      "prev-btn",
    );
    expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute(
      "id",
      "next-btn",
    );
  });

  it("should apply ids.playPauseTrigger to the PlayPauseTrigger button", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        autoplay
        ids={{ playPauseTrigger: "play-pause-btn" }}
      >
        <Carousel.PlayPauseTrigger />
      </Carousel.Root>,
    );

    expect(screen.getByRole("button")).toHaveAttribute("id", "play-pause-btn");
  });

  it("should apply ids.indicatorGroup to the IndicatorGroup wrapping element", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        ids={{ indicatorGroup: "indicator-row" }}
      >
        <Carousel.IndicatorGroup label="Choose slide" />
      </Carousel.Root>,
    );

    expect(screen.getByRole("group", { name: "Choose slide" })).toHaveAttribute(
      "id",
      "indicator-row",
    );
  });

  it("should apply ids.indicatorGroup to the wrapper auto-rendered by Carousel.Indicators", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        ids={{ indicatorGroup: "indicator-row" }}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose page" />
      </Carousel.Root>,
    );

    expect(screen.getByRole("group", { name: "Choose page" })).toHaveAttribute(
      "id",
      "indicator-row",
    );
  });

});
