import { fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { carouselHtml, INDICATORS, NEXT, PREVIOUS } from "./carousel.fixtures";
import { box, place, TestIntersectionObserver } from "./jsdom";
import { button, indicators, mount, root, settle, slides, viewport } from "./mount";

/** The page each slide says is active. */
const active = (): number[] => slides().flatMap((slide, index) => (slide.getAttribute("data-state") === "active" ? [index] : []));

/** Record every `type` event the root fires, with its detail. */
function record(type: string): unknown[] {
  const seen: unknown[] = [];
  root().addEventListener(type, (event) => seen.push((event as CustomEvent).detail));
  return seen;
}

/** A pointer event jsdom can dispatch: it has no PointerEvent constructor of its own. */
function pointer(type: string, init: { pointerType?: string; pointerId?: number; clientX?: number; clientY?: number }): Event {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: init.clientX ?? 0, clientY: init.clientY ?? 0 });
  return Object.assign(event, { pointerType: init.pointerType ?? "mouse", pointerId: init.pointerId ?? 1 });
}

describe("<primitiv-carousel> controls", () => {
  it("pages forward and back with the triggers, firing a cancelable change before each", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(carouselHtml());
    const changes = record("primitiv-carousel-change");

    // Act
    await user.click(button("Next"));
    await settle();

    // Assert
    expect(changes).toEqual([{ page: 1 }]);
    expect(root().getAttribute("page")).toBe("1");
    expect(active()).toEqual([1]);

    // Act
    await user.click(button("Previous"));
    await settle();

    // Assert
    expect(root().getAttribute("page")).toBe("0");
  });

  it("keeps the page when a listener vetoes the change", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(carouselHtml());
    root().addEventListener("primitiv-carousel-change", (event) => event.preventDefault());

    // Act
    await user.click(button("Next"));
    await settle();

    // Assert
    expect(root().hasAttribute("page")).toBe(false);
    expect(active()).toEqual([0]);
  });

  it("does nothing for a trigger disabled at an end, or by its own disabled", async () => {
    // Arrange
    await mount(
      carouselHtml({ attrs: 'page="2"' }).replace("<primitiv-carousel-previous-trigger>", "<primitiv-carousel-previous-trigger disabled>"),
    );
    const changes = record("primitiv-carousel-change");

    // Act — a click reaches a disabled button's handlers only when fired directly.
    fireEvent.click(button("Next"));
    fireEvent.click(button("Previous"));
    await settle();

    // Assert
    expect(changes).toEqual([]);
  });

  it("wraps past either end while looping", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(carouselHtml({ attrs: 'loop page="2"' }));

    // Act
    await user.click(button("Next"));
    await settle();

    // Assert
    expect(root().page).toBe(0);

    // Act
    await user.click(button("Previous"));
    await settle();

    // Assert
    expect(root().page).toBe(2);
  });

  it("ignores a click that is not on a control's own child", async () => {
    // Arrange
    await mount(carouselHtml({ controls: `<primitiv-carousel-next-trigger><button type="button">Next</button><span>Extra</span></primitiv-carousel-next-trigger>` }));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const changes = record("primitiv-carousel-change");
    const extra = document.querySelector("primitiv-carousel-next-trigger > span") as HTMLElement;

    // Act
    fireEvent.click(extra);
    fireEvent.click(button("Next"));
    fireEvent.click(document.querySelector("primitiv-carousel-next-trigger") as HTMLElement);
    await settle();

    // Assert — the part has two children, so nothing in it is a control.
    expect(changes).toEqual([]);
    error.mockRestore();
  });

  it("jumps to an indicator's page, but not from a read-only one", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(
      carouselHtml({
        controls:
          INDICATORS +
          '<primitiv-carousel-indicator-group label="Marks"><primitiv-carousel-indicator index="1" read-only><button type="button">Mark</button></primitiv-carousel-indicator></primitiv-carousel-indicator-group>',
      }),
    );

    // Act
    await user.click(indicators()[2] as HTMLElement);
    await settle();

    // Assert
    expect(root().page).toBe(2);

    // Act
    await user.click(button("Mark"));
    await settle();

    // Assert
    expect(root().page).toBe(2);
  });

  it("starts and stops autoplay from the play control, firing a cancelable playing change", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(
      carouselHtml({
        attrs: "autoplay",
        controls: '<primitiv-carousel-play-pause-trigger><button type="button">Toggle</button></primitiv-carousel-play-pause-trigger>',
      }),
    );
    const changes = record("primitiv-carousel-playing-change");

    // Act
    await user.click(button("Start automatic slide show"));
    await settle();

    // Assert
    expect(root().playing).toBe(true);

    // Act
    await user.click(button("Stop automatic slide show"));
    await settle();

    // Assert
    expect(root().playing).toBe(false);
    expect(changes).toEqual([{ playing: true }, { playing: false }]);
  });

  it("keeps autoplay paused when a listener vetoes playing", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: "autoplay" }));
    root().addEventListener("primitiv-carousel-playing-change", (event) => event.preventDefault());

    // Act
    root().play();
    await settle();

    // Assert
    expect(root().playing).toBe(false);
  });

  it("ignores the play control's click on a carousel without autoplay", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await mount(carouselHtml({ controls: '<primitiv-carousel-play-pause-trigger><button type="button">Toggle</button></primitiv-carousel-play-pause-trigger>' }));

    // Act
    fireEvent.click(button("Toggle"));
    await settle();

    // Assert
    expect(root().playing).toBe(false);
    error.mockRestore();
  });

  it("leaves a nested carousel's controls to it", async () => {
    // Arrange
    const user = userEvent.setup();
    const inner = carouselHtml({ controls: NEXT }).replace('aria-label="Featured"', 'aria-label="Inner"').replaceAll("Slide content", "Inner slide");
    await mount(carouselHtml({ controls: PREVIOUS }).replace("Slide content 1", inner));
    const outer = root();

    // Act
    await user.click(button("Next"));
    await settle();

    // Assert
    expect(outer.hasAttribute("page")).toBe(false);
    expect(document.querySelector('[aria-label="Inner"]')?.getAttribute("page")).toBe("1");
  });
});

describe("<primitiv-carousel> keyboard", () => {
  it("pages with the arrow keys on the viewport, and jumps with Home and End", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(carouselHtml());
    viewport().focus();

    // Act & Assert
    await user.keyboard("{ArrowRight}");
    await settle();
    expect(root().page).toBe(1);
    await user.keyboard("{End}");
    await settle();
    expect(root().page).toBe(2);
    await user.keyboard("{ArrowLeft}");
    await settle();
    expect(root().page).toBe(1);
    await user.keyboard("{Home}");
    await settle();
    expect(root().page).toBe(0);
  });

  it("pages with the vertical arrows when vertical", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(carouselHtml({ attrs: 'orientation="vertical"' }));
    viewport().focus();

    // Act
    await user.keyboard("{ArrowRight}");
    await user.keyboard("{ArrowDown}");
    await settle();

    // Assert
    expect(root().page).toBe(1);

    // Act
    await user.keyboard("{ArrowUp}");
    await settle();

    // Assert
    expect(root().page).toBe(0);
  });

  it("reports an overscroll for an arrow pushing past an end, and claims the key", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'page="2"' }));
    const overscrolls = record("primitiv-carousel-overscroll-status");

    // Act
    const forward = fireEvent.keyDown(viewport(), { key: "ArrowRight" });
    root().page = 0;
    await settle();
    fireEvent.keyDown(viewport(), { key: "ArrowLeft" });

    // Assert
    expect(forward).toBe(false);
    expect(overscrolls).toEqual([
      { type: "overscroll", edge: "end", source: "keyboard", amount: 0, page: 2 },
      { type: "overscroll", edge: "start", source: "keyboard", amount: 0, page: 0 },
    ]);
  });

  it("leaves other keys, and keys inside a slide, alone", async () => {
    // Arrange
    await mount(carouselHtml().replace("Slide content 1", '<input aria-label="Field">'));
    const field = document.querySelector("input") as HTMLInputElement;

    // Act
    const other = fireEvent.keyDown(viewport(), { key: "Enter" });
    const inside = fireEvent.keyDown(field, { key: "ArrowRight" });
    await settle();

    // Assert
    expect(other).toBe(true);
    expect(inside).toBe(true);
    expect(root().hasAttribute("page")).toBe(false);
  });
});

describe("<primitiv-carousel> imperative API", () => {
  it("navigates, and reports the page model", async () => {
    // Arrange
    await mount(carouselHtml({ slides: 5, attrs: 'slides-per-page="2"' }));

    // Act & Assert
    expect(root().getProgress()).toEqual({ page: 0, totalPages: 3, value: 0 });
    expect(root().getPageSnapPoints()).toEqual([0, 2, 3]);
    root().next();
    await settle();
    expect(root().getProgress()).toEqual({ page: 1, totalPages: 3, value: 0.5 });
    root().previous();
    await settle();
    expect(root().page).toBe(0);
    root().goTo(2);
    await settle();
    expect(root().page).toBe(2);
    root().scrollToIndex(1);
    await settle();
    expect(root().page).toBe(0);
  });

  it("goes nowhere past an end without a loop", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'page="2"' }));
    const changes = record("primitiv-carousel-change");

    // Act
    root().next();
    root().page = 0;
    await settle();
    root().previous();
    await settle();

    // Assert
    expect(changes).toEqual([]);
  });

  it("reports no progress for a single page", async () => {
    // Arrange
    await mount(carouselHtml({ slides: 1 }));

    // Act & Assert
    expect(root().getProgress()).toEqual({ page: 0, totalPages: 1, value: 0 });
  });

  it("plays and pauses", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: "autoplay" }));

    // Act
    root().play();
    await settle();

    // Assert
    expect(root().playing).toBe(true);

    // Act
    root().pause();
    await settle();

    // Assert
    expect(root().playing).toBe(false);
  });

  it("starts out with nothing in view, dragging or overscrolling", async () => {
    // Arrange
    await mount(carouselHtml());

    // Act & Assert
    expect(root().isInView(0)).toBe(false);
    expect(root().isDragging()).toBe(false);
    expect(root().isOverscrolling()).toBe(false);
    expect(root().getScrollProgress()).toBe(0);
    expect(root().getSlideProgress(7)).toBe(0);
  });
});

describe("<primitiv-carousel> scroll", () => {
  /** Lay three 100px slides out in a 100px viewport scrolled to `scrollLeft`. */
  function layOut(): void {
    place(viewport(), box(0, 100));
    slides().forEach((slide, index) => place(slide, box(index * 100, 100)));
  }

  it("scrolls the viewport smoothly to the page, aligned by the leading slide", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'snap-align="start"' }));
    layOut();
    const scrollTo = vi.spyOn(viewport(), "scrollTo");

    // Act
    root().next();
    await settle();

    // Assert
    expect(scrollTo).toHaveBeenCalledWith({ left: 100, behavior: "smooth" });
  });

  it("scrolls at once for an instant move, just that once", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'snap-align="start"' }));
    layOut();
    const scrollTo = vi.spyOn(viewport(), "scrollTo");

    // Act
    root().goTo(2, true);
    await settle();
    root().previous();
    await settle();

    // Assert
    expect(scrollTo.mock.calls).toEqual([[{ left: 200, behavior: "instant" }], [{ left: 100, behavior: "smooth" }]]);
  });

  it("follows the user's own swipe to the snapped slide's page, without scrolling again", async () => {
    // Arrange
    await mount(carouselHtml());
    const scrollTo = vi.spyOn(viewport(), "scrollTo");
    const changes = record("primitiv-carousel-change");

    // Act
    viewport().dispatchEvent(Object.assign(new Event("scrollsnapchange"), { snapTargetInline: slides()[2] }));
    await settle();

    // Assert
    expect(changes).toEqual([{ page: 2 }]);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("follows a vertical swipe by its block target, and ignores a target that is not a slide or is already the page", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'orientation="vertical" page="1"' }));
    const changes = record("primitiv-carousel-change");

    // Act
    viewport().dispatchEvent(Object.assign(new Event("scrollsnapchange"), { snapTargetInline: slides()[2], snapTargetBlock: viewport() }));
    viewport().dispatchEvent(Object.assign(new Event("scrollsnapchange"), { snapTargetBlock: slides()[1] }));
    viewport().dispatchEvent(Object.assign(new Event("scrollsnapchange"), { snapTargetBlock: slides()[0] }));
    await settle();

    // Assert
    expect(changes).toEqual([{ page: 0 }]);
  });

  it("follows the first slide in view where there is no scrollsnapchange, once a programmatic scroll has settled", async () => {
    // Arrange
    await mount(carouselHtml());
    const changes = record("primitiv-carousel-change");
    viewport().dispatchEvent(new Event("scrollend"));
    const observer = TestIntersectionObserver.latest;

    // Act
    observer.fire([
      { target: slides()[0] as Element, ratio: 0.1 },
      { target: slides()[2] as Element, ratio: 0.9 },
    ]);
    await settle();

    // Assert
    expect(root().isInView(2)).toBe(true);
    expect(root().isInView(0)).toBe(false);
    expect(changes).toEqual([{ page: 2 }]);
  });

  it("stays on its page when the slide in view leaves it with nothing yet in its place", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'page="1"' }));
    const changes = record("primitiv-carousel-change");
    viewport().dispatchEvent(new Event("scrollend"));

    // Act
    TestIntersectionObserver.latest.fire([{ target: slides()[1] as Element, ratio: 0 }]);
    await settle();

    // Assert
    expect(changes).toEqual([]);
  });

  it("does not follow what is in view while a programmatic scroll is still running", async () => {
    // Arrange
    await mount(carouselHtml());
    const changes = record("primitiv-carousel-change");

    // Act — the first scroll, on connect, has not settled.
    TestIntersectionObserver.latest.fire([{ target: slides()[2] as Element, ratio: 1 }]);
    await settle();

    // Assert
    expect(changes).toEqual([]);
  });
});

describe("<primitiv-carousel> wheel", () => {
  it("turns a vertical wheel notch into horizontal scroll, reporting an overscroll at an end", async () => {
    // Arrange
    await mount(carouselHtml());
    const overscrolls = record("primitiv-carousel-overscroll-status");

    // Act
    const handled = fireEvent.wheel(viewport(), { deltaY: 30 });

    // Assert — jsdom does not clamp scrollLeft, so the delta lands as is.
    expect(handled).toBe(false);
    expect(viewport().scrollLeft).toBe(30);
    expect(overscrolls).toEqual([]);

    // Act
    fireEvent.wheel(viewport(), { deltaY: -1, deltaMode: 1 });
    root().page = 2;
    await settle();
    Object.defineProperty(viewport(), "clientWidth", { value: 100 });
    fireEvent.wheel(viewport(), { deltaY: 1, deltaMode: 2 });

    // Assert — a line is 16 px, a page the viewport's width.
    expect(viewport().scrollLeft).toBe(114);
    expect(overscrolls).toEqual([
      { type: "overscroll", edge: "start", source: "wheel", amount: 0, page: 0 },
      { type: "overscroll", edge: "end", source: "wheel", amount: 0, page: 2 },
    ]);
  });

  it("leaves a horizontal swipe, a vertical carousel and a fading one to the browser", async () => {
    // Arrange
    await mount(carouselHtml());

    // Act & Assert
    expect(fireEvent.wheel(viewport(), { deltaX: 20, deltaY: 30 })).toBe(true);
    root().setAttribute("orientation", "vertical");
    await settle();
    expect(fireEvent.wheel(viewport(), { deltaY: 30 })).toBe(true);
    root().setAttribute("transition", "fade");
    await settle();
    expect(fireEvent.wheel(viewport(), { deltaY: 30 })).toBe(true);
  });
});

describe("<primitiv-carousel> mouse drag", () => {
  it("drags the viewport's scroll once past the threshold, reporting the drag and suppressing the click", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'allow-mouse-drag page="1"' }));
    const drags = record("primitiv-carousel-drag-status");
    const link = vi.fn();
    slides()[1]?.addEventListener("click", link);

    // Act
    viewport().dispatchEvent(pointer("pointerdown", { clientX: 100 }));
    viewport().dispatchEvent(pointer("pointermove", { clientX: 99 }));
    const during = root().isDragging();
    viewport().dispatchEvent(pointer("pointermove", { clientX: 90 }));
    viewport().dispatchEvent(pointer("pointermove", { clientX: 80 }));

    // Assert
    expect(during).toBe(false);
    expect(root().isDragging()).toBe(true);
    expect(viewport().hasAttribute("data-dragging")).toBe(true);
    expect(viewport().scrollLeft).toBe(40);

    // Act
    viewport().dispatchEvent(pointer("pointerup", {}));
    fireEvent.click(slides()[1] as HTMLElement);
    fireEvent.click(slides()[1] as HTMLElement);

    // Assert
    expect(root().isDragging()).toBe(false);
    expect(viewport().hasAttribute("data-dragging")).toBe(false);
    expect(link).toHaveBeenCalledTimes(1);
    expect(drags).toEqual([
      { type: "dragging.start", page: 1, isDragging: true },
      { type: "dragging", page: 1, isDragging: true },
      { type: "dragging.end", page: 1, isDragging: false },
    ]);
  });

  it("reports and marks an overscroll while the drag pushes past an end", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: "allow-mouse-drag" }));
    const overscrolls = record("primitiv-carousel-overscroll-status");

    // Act
    viewport().dispatchEvent(pointer("pointerdown", { clientX: 100 }));
    viewport().dispatchEvent(pointer("pointermove", { clientX: 110 }));
    viewport().dispatchEvent(pointer("pointermove", { clientX: 120 }));
    const edge = viewport().getAttribute("data-overscroll");
    const pushing = root().isOverscrolling();
    viewport().dispatchEvent(pointer("pointermove", { clientX: 90 }));

    // Assert
    expect(edge).toBe("start");
    expect(pushing).toBe(true);
    expect(root().isOverscrolling()).toBe(false);
    expect(viewport().hasAttribute("data-overscroll")).toBe(false);
    expect(overscrolls).toEqual([
      { type: "overscroll.start", edge: "start", source: "drag", amount: 20, page: 0 },
      { type: "overscroll", edge: "start", source: "drag", amount: 40, page: 0 },
      { type: "overscroll.end", edge: "start", source: "drag", amount: 0, page: 0 },
    ]);
  });

  it("ends an overscroll with the drag, at the far end too", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'allow-mouse-drag page="2"' }));
    const overscrolls = record("primitiv-carousel-overscroll-status");

    // Act
    viewport().dispatchEvent(pointer("pointerdown", { clientX: 100 }));
    viewport().dispatchEvent(pointer("pointermove", { clientX: 90 }));
    viewport().dispatchEvent(pointer("pointercancel", {}));

    // Assert
    expect(overscrolls.map((status) => (status as { type: string }).type)).toEqual(["overscroll.start", "overscroll.end"]);
    expect(root().isOverscrolling()).toBe(false);
  });

  it("drags a vertical carousel's block scroll", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'allow-mouse-drag orientation="vertical" page="1"' }));

    // Act
    viewport().dispatchEvent(pointer("pointerdown", { clientY: 100 }));
    viewport().dispatchEvent(pointer("pointermove", { clientY: 90 }));

    // Assert
    expect(viewport().scrollTop).toBe(20);
  });

  it("leaves touch, a disabled drag, a fade, another pointer, and a press without a drag alone", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'page="1"' }));
    const drags = record("primitiv-carousel-drag-status");

    // Act — drag is off.
    viewport().dispatchEvent(pointer("pointerdown", { clientX: 100 }));
    viewport().dispatchEvent(pointer("pointermove", { clientX: 50 }));
    root().setAttribute("allow-mouse-drag", "");
    await settle();
    viewport().dispatchEvent(pointer("pointerdown", { clientX: 100, pointerType: "touch" }));
    viewport().dispatchEvent(pointer("pointermove", { clientX: 50, pointerType: "touch" }));
    viewport().dispatchEvent(pointer("pointerdown", { clientX: 100 }));
    viewport().dispatchEvent(pointer("pointermove", { clientX: 50, pointerId: 2 }));
    viewport().dispatchEvent(pointer("pointerup", {}));
    viewport().dispatchEvent(pointer("pointerup", {}));
    root().setAttribute("transition", "fade");
    await settle();
    viewport().dispatchEvent(pointer("pointerdown", { clientX: 100 }));
    viewport().dispatchEvent(pointer("pointermove", { clientX: 50 }));

    // Assert
    expect(drags).toEqual([]);
    expect(viewport().scrollLeft).toBe(0);
  });

  it("holds off a native image or link drag only while mouse drag is on", async () => {
    // Arrange
    await mount(carouselHtml());

    // Act & Assert
    expect(fireEvent.dragStart(slides()[0] as HTMLElement)).toBe(true);
    root().setAttribute("allow-mouse-drag", "");
    await settle();
    expect(fireEvent.dragStart(slides()[0] as HTMLElement)).toBe(false);
  });
});
