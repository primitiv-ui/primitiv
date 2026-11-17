import userEvent from "@testing-library/user-event";

import { carouselHtml, INDICATORS } from "./carousel.fixtures";
import { TestIntersectionObserver } from "./jsdom";
import { button, indicators, mount, root, settle, slides, viewport } from "./mount";

describe("<primitiv-carousel> lifecycle", () => {
  it("handles a click once after being moved, never stacking listeners", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(carouselHtml({ slides: 4 }));
    const carousel = root();
    const holder = document.createElement("div");
    document.body.append(holder);

    // Act
    holder.append(carousel);
    await settle();
    await user.click(button("Next"));
    await settle();

    // Assert
    expect(carousel.page).toBe(1);
  });

  it("is not affected by its connection callback running twice", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(carouselHtml({ slides: 4 }));

    // Act
    root().connectedCallback();
    await user.click(button("Next"));
    await settle();

    // Assert
    expect(root().page).toBe(1);
  });

  it("stops handling events once it leaves the page", async () => {
    // Arrange
    await mount(carouselHtml());
    const carousel = root();
    const next = button("Next");
    const view = viewport();
    carousel.remove();

    // Act
    next.click();
    view.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await settle();

    // Assert
    expect(carousel.hasAttribute("page")).toBe(false);
  });

  it("picks up slides and indicators that arrive later", async () => {
    // Arrange
    await mount(carouselHtml({ slides: 1, controls: INDICATORS }));

    // Act
    viewport().insertAdjacentHTML("beforeend", "<primitiv-carousel-slide>Late</primitiv-carousel-slide>");
    await settle();

    // Assert
    expect(slides().map((slide) => slide.getAttribute("aria-label"))).toEqual(["1 of 2", "2 of 2"]);
    expect(indicators()).toHaveLength(2);
    expect(TestIntersectionObserver.latest.observed.size).toBe(2);
  });

  it("moves its keys to a viewport that replaces the first", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(carouselHtml());
    const old = viewport();
    const fresh = document.createElement("primitiv-carousel-viewport");
    fresh.append(...old.children);

    // Act
    old.replaceWith(fresh);
    await settle();
    old.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await settle();
    const after = root().page;
    fresh.focus();
    await user.keyboard("{ArrowRight}");
    await settle();

    // Assert
    expect(after).toBe(0);
    expect(root().page).toBe(1);
    expect(fresh.getAttribute("tabindex")).toBe("0");
  });

  it("runs without a viewport at all", async () => {
    // Arrange & Act
    await mount('<primitiv-carousel aria-label="Bare"><primitiv-carousel-slide>One</primitiv-carousel-slide><primitiv-carousel-slide>Two</primitiv-carousel-slide></primitiv-carousel>');
    root().next();
    await settle();

    // Assert
    expect(root().page).toBe(1);
  });

  it("lets go of a viewport that leaves, and does nothing on a refresh once disconnected", async () => {
    // Arrange
    await mount(carouselHtml());
    const old = viewport();
    const slideList = slides();
    const scrollTo = vi.spyOn(old, "scrollTo");

    // Act
    viewport().after(...slideList);
    old.remove();
    await settle();
    old.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const carousel = root();
    carousel.remove();
    carousel.refresh();
    await settle();

    // Assert
    expect(carousel.hasAttribute("page")).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("keeps a nested carousel's slides and controls out of its own", async () => {
    // Arrange
    const inner = carouselHtml({ slides: 2, controls: INDICATORS }).replace('aria-label="Featured"', 'aria-label="Inner"');

    // Act
    await mount(carouselHtml({ controls: INDICATORS }).replace("Slide content 1", inner));

    // Assert
    const outer = root();
    const innerRoot = document.querySelector('[aria-label="Inner"]') as HTMLElement;
    expect(outer.querySelectorAll(':scope > primitiv-carousel-viewport > [data-total="3"]')).toHaveLength(3);
    expect(innerRoot.querySelectorAll('[data-total="2"]')).toHaveLength(2);
    expect(innerRoot.querySelectorAll("primitiv-carousel-indicator")).toHaveLength(2);
  });
});
