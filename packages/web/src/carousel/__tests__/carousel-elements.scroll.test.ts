import { carouselHtml } from "./carousel.fixtures";
import { box, place, TestIntersectionObserver, TestResizeObserver } from "./jsdom";
import { mount, root, settle, slides, viewport } from "./mount";

/** Give the viewport a client size jsdom does not compute. */
function size(width: number, height = 100): void {
  Object.defineProperty(viewport(), "clientWidth", { value: width, configurable: true });
  Object.defineProperty(viewport(), "clientHeight", { value: height, configurable: true });
}

/** Lay the slides out in a row of `width` each from the viewport's left edge at 0. */
function row(width: number): void {
  place(viewport(), box(0, 300));
  slides().forEach((slide, index) => place(slide, box(index * width, width)));
}

describe("<primitiv-carousel> scrolling to the page", () => {
  it("centres a page by default, measuring the whole page", async () => {
    // Arrange — 5 slides of 80px, 2 a page, in a 300px viewport.
    await mount(carouselHtml({ slides: 5, attrs: 'slides-per-page="2"' }));
    size(300);
    row(80);
    const scrollTo = vi.spyOn(viewport(), "scrollTo");

    // Act
    root().next();
    await settle();

    // Assert — page 1 starts at slide 2 (160px) and spans 160px: 160 − (300 − 160) / 2.
    expect(scrollTo).toHaveBeenCalledWith({ left: 90, behavior: "smooth" });
  });

  it("rests a page at the viewport's end for end alignment, counting the current scroll", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'snap-align="end"' }));
    size(300);
    row(100);
    viewport().scrollLeft = 50;
    const scrollTo = vi.spyOn(viewport(), "scrollTo");

    // Act
    root().goTo(2);
    await settle();

    // Assert — 50 + 200 − (300 − 100).
    expect(scrollTo).toHaveBeenCalledWith({ left: 50, behavior: "smooth" });
  });

  it("scrolls the block axis when vertical", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'orientation="vertical" snap-align="start"' }));
    size(100, 100);
    place(viewport(), box(0, 100, 0, 100));
    slides().forEach((slide, index) => place(slide, box(0, 100, index * 100, 100)));
    viewport().scrollTop = 10;
    const scrollTo = vi.spyOn(viewport(), "scrollTo");

    // Act
    root().next();
    await settle();

    // Assert
    expect(scrollTo).toHaveBeenCalledWith({ top: 110, behavior: "smooth" });
  });

  it("measures a page's last member by height when vertical", async () => {
    // Arrange — 2 a page of 40px slides in a 100px viewport, centred.
    await mount(carouselHtml({ slides: 4, attrs: 'orientation="vertical" slides-per-page="2"' }));
    size(100, 100);
    place(viewport(), box(0, 100, 0, 100));
    slides().forEach((slide, index) => place(slide, box(0, 100, index * 40, 40)));
    const scrollTo = vi.spyOn(viewport(), "scrollTo");

    // Act
    root().next();
    await settle();

    // Assert — 80 − (100 − 80) / 2.
    expect(scrollTo).toHaveBeenCalledWith({ top: 70, behavior: "smooth" });
  });

  it("scrolls at once for a user who prefers reduced motion", async () => {
    // Arrange
    const matchMedia = vi.fn(() => ({ matches: true }));
    vi.stubGlobal("matchMedia", matchMedia);
    await mount(carouselHtml({ attrs: 'snap-align="start"' }));
    row(100);
    const scrollTo = vi.spyOn(viewport(), "scrollTo");

    // Act
    root().next();
    await settle();

    // Assert
    expect(matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
    expect(scrollTo).toHaveBeenCalledWith({ left: 100, behavior: "instant" });
    vi.unstubAllGlobals();
  });

  it("scrolls again on refresh without a page change", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'snap-align="start"' }));
    row(100);
    const scrollTo = vi.spyOn(viewport(), "scrollTo");

    // Act
    root().refresh();

    // Assert
    expect(scrollTo).toHaveBeenCalledWith({ left: 0, behavior: "smooth" });
  });

  it("scrolls nothing while fading, while looping infinitely, or with no slides", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'transition="fade"' }));
    const scrollTo = vi.spyOn(viewport(), "scrollTo");

    // Act
    root().next();
    await settle();
    root().setAttribute("transition", "slide");
    root().setAttribute("loop", "infinite");
    await settle();
    root().next();
    await settle();
    for (const slide of slides()) slide.remove();
    root().removeAttribute("loop");
    await settle();

    // Assert
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("lets the observer follow the user once the scroll ends, or once it has had time to", async () => {
    // Arrange
    vi.useFakeTimers();
    await mount(carouselHtml());
    const changes: unknown[] = [];
    root().addEventListener("primitiv-carousel-change", (event) => changes.push((event as CustomEvent).detail));
    const fire = (index: number) => TestIntersectionObserver.latest.fire(slides().map((slide, i) => ({ target: slide, ratio: i === index ? 1 : 0 })));

    // Act — still within the settle time of the first scroll.
    vi.advanceTimersByTime(599);
    fire(1);
    vi.advanceTimersByTime(1);
    fire(2);
    await settle();

    // Assert
    expect(changes).toEqual([{ page: 2 }]);
    vi.useRealTimers();
  });

  it("forgets an unsettled scroll's timer when the page changes again", async () => {
    // Arrange
    vi.useFakeTimers();
    await mount(carouselHtml());
    const removed = vi.spyOn(viewport(), "removeEventListener");

    // Act
    root().next();
    await settle();

    // Assert — the first scroll's scrollend listener went with it.
    expect(removed).toHaveBeenCalledWith("scrollend", expect.any(Function));
    vi.useRealTimers();
  });

  it("observes with the in-view threshold, counting the highest of several as in view", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'in-view-threshold="0.2 0.8"' }));
    viewport().dispatchEvent(new Event("scrollend"));
    const observer = TestIntersectionObserver.latest;

    // Act
    observer.fire([{ target: slides()[1] as Element, ratio: 0.5 }]);

    // Assert
    expect(observer.options?.threshold).toEqual([0.2, 0.8]);
    expect(root().isInView(1)).toBe(false);

    // Act
    root().setAttribute("in-view-threshold", "0.3");
    await settle();
    TestIntersectionObserver.latest.fire([{ target: slides()[1] as Element, ratio: 0.3 }]);

    // Assert
    expect(TestIntersectionObserver.latest.options?.threshold).toBe(0.3);
    expect(root().isInView(1)).toBe(true);
  });

  it("observes at 0.6 by default, and observes nothing while fading", async () => {
    // Arrange
    await mount(carouselHtml());

    // Assert
    expect(TestIntersectionObserver.latest.options?.threshold).toBe(0.6);
    expect(TestIntersectionObserver.latest.observed.size).toBe(3);

    // Act
    root().setAttribute("transition", "none");
    await settle();

    // Assert
    expect(TestIntersectionObserver.latest.observed.size).toBe(0);
  });

  it("leaves the page to scrollsnapchange where the browser fires it", async () => {
    // Arrange
    Object.assign(window, { onscrollsnapchange: null });
    await mount(carouselHtml());
    viewport().dispatchEvent(new Event("scrollend"));
    const changes: unknown[] = [];
    root().addEventListener("primitiv-carousel-change", (event) => changes.push((event as CustomEvent).detail));

    // Act
    TestIntersectionObserver.latest.fire([{ target: slides()[2] as Element, ratio: 1 }]);
    await settle();

    // Assert
    expect(root().isInView(2)).toBe(true);
    expect(changes).toEqual([]);
    delete (window as { onscrollsnapchange?: unknown }).onscrollsnapchange;
  });

  it("does not follow an empty view, or a view of the page already active", async () => {
    // Arrange
    await mount(carouselHtml());
    viewport().dispatchEvent(new Event("scrollend"));
    const changes: unknown[] = [];
    root().addEventListener("primitiv-carousel-change", (event) => changes.push((event as CustomEvent).detail));

    // Act
    TestIntersectionObserver.latest.fire([{ target: slides()[1] as Element, ratio: 0 }]);
    TestIntersectionObserver.latest.fire([{ target: slides()[0] as Element, ratio: 1 }]);
    await settle();

    // Assert
    expect(changes).toEqual([]);
  });

  it("does not follow what is in view while looping infinitely", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'loop="infinite"', track: true }));
    viewport().dispatchEvent(new Event("scrollend"));
    const changes: unknown[] = [];
    root().addEventListener("primitiv-carousel-change", (event) => changes.push((event as CustomEvent).detail));

    // Act
    TestIntersectionObserver.latest.fire([{ target: slides()[2] as Element, ratio: 1 }]);
    viewport().dispatchEvent(Object.assign(new Event("scrollsnapchange"), { snapTargetInline: slides()[1] }));
    await settle();

    // Assert
    expect(changes).toEqual([]);
  });
});

describe("<primitiv-carousel> multi-slide scroll margins", () => {
  it("extends each page's leading slide to the page's last member, and again on resize", async () => {
    // Arrange
    await mount(carouselHtml({ slides: 5, attrs: 'slides-per-page="2"' }));
    row(80);

    // Act
    TestResizeObserver.fireAll();

    // Assert — leaders 0, 2, 3 each reach 80px further.
    expect(slides().map((slide) => slide.style.scrollMarginInlineEnd)).toEqual(["80px", "", "80px", "80px", ""]);
    expect(slides()[0]?.style.scrollMarginBlockEnd).toBe("");
  });

  it("extends on the block axis when vertical, and clamps a short last page", async () => {
    // Arrange
    await mount(carouselHtml({ slides: 1, attrs: 'slides-per-page="3" orientation="vertical"' }));
    slides().forEach((slide) => place(slide, box(0, 100, 0, 40)));

    // Act
    TestResizeObserver.fireAll();

    // Assert
    expect(slides()[0]?.style.scrollMarginBlockEnd).toBe("0px");
    expect(slides()[0]?.style.scrollMarginInlineEnd).toBe("");
  });

  it("does nothing for a single slide a page, or while fading", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'transition="fade" slides-per-page="2"' }));

    // Assert
    expect(slides()[0]?.style.scrollMarginInlineEnd).toBe("");

    // Act
    root().setAttribute("transition", "slide");
    root().setAttribute("slides-per-page", "1");
    await settle();

    // Assert
    expect(slides()[0]?.style.scrollMarginInlineEnd).toBe("");
  });
});

describe("<primitiv-carousel> scroll progress", () => {
  it("publishes how far the viewport has scrolled and each slide's distance from centre", async () => {
    // Arrange
    await mount(carouselHtml());
    place(viewport(), box(0, 100));
    slides().forEach((slide, index) => place(slide, box(index * 50 - 25, 50)));
    Object.defineProperty(viewport(), "scrollWidth", { value: 300 });
    size(100);
    viewport().scrollLeft = 100;
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => frames.push(callback));

    // Act — two scrolls in one frame recompute once.
    viewport().dispatchEvent(new Event("scroll"));
    viewport().dispatchEvent(new Event("scroll"));
    frames.shift()?.(0);

    // Assert
    expect(frames).toEqual([]);
    expect(viewport().style.getPropertyValue("--carousel-progress")).toBe("0.5");
    expect(root().getScrollProgress()).toBe(0.5);
    expect(slides().map((slide) => slide.style.getPropertyValue("--slide-progress"))).toEqual(["-1", "0", "1"]);
    expect(root().getSlideProgress(2)).toBe(1);
    vi.restoreAllMocks();
  });

  it("measures the block axis when vertical, and recomputes on resize", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'orientation="vertical"' }));
    place(viewport(), box(0, 100, 0, 200));
    slides().forEach((slide, index) => place(slide, box(0, 100, index * 100 + 50, 100)));
    Object.defineProperty(viewport(), "scrollHeight", { value: 400 });
    size(100, 200);
    viewport().scrollTop = 50;
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => frames.push(callback));

    // Act
    TestResizeObserver.fireAll();
    frames.shift()?.(0);

    // Assert
    expect(viewport().style.getPropertyValue("--carousel-progress")).toBe("0.25");
    expect(slides().map((slide) => slide.style.getPropertyValue("--slide-progress"))).toEqual(["0", "1", "1"]);
    vi.restoreAllMocks();
  });

  it("stops listening, and drops a pending frame, when the carousel leaves", async () => {
    // Arrange
    await mount(carouselHtml());
    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 7);
    viewport().dispatchEvent(new Event("scroll"));
    const view = viewport();

    // Act
    root().remove();
    view.dispatchEvent(new Event("scroll"));

    // Assert
    expect(cancel).toHaveBeenCalledWith(7);
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });
});
