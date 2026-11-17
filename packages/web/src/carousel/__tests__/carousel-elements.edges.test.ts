import { fireEvent } from "@testing-library/dom";

import { CarouselController, type CarouselControllerHost } from "../CarouselController";
import { carouselHtml, INDICATORS, NEXT, PREVIOUS } from "./carousel.fixtures";
import { box, place, TestIntersectionObserver, TestResizeObserver } from "./jsdom";
import { mount, root, settle, slides, viewport } from "./mount";

/** Record every `type` event that reaches `target`, with its detail. */
function record(type: string, target: EventTarget = root()): unknown[] {
  const seen: unknown[] = [];
  target.addEventListener(type, (event) => seen.push((event as CustomEvent).detail));
  return seen;
}

/** A pointer event jsdom can dispatch. */
function pointer(type: string, init: { clientX?: number; clientY?: number; pointerId?: number; pointerType?: string } = {}): Event {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: init.clientX ?? 0, clientY: init.clientY ?? 0 });
  return Object.assign(event, { pointerType: init.pointerType ?? "mouse", pointerId: init.pointerId ?? 1 });
}

const snap = (target: Element | undefined, axis: "Inline" | "Block" = "Inline") =>
  Object.assign(new Event("scrollsnapchange"), { [`snapTarget${axis}`]: target });

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("<primitiv-carousel> first moves", () => {
  it("scrolls smoothly as it connects", async () => {
    // Arrange
    const scrollTo = vi.spyOn(Element.prototype, "scrollTo");

    // Act
    await mount(carouselHtml());

    // Assert
    expect(scrollTo.mock.calls[0]?.[0]).toMatchObject({ behavior: "smooth" });
  });

  it("follows what is in view straight away in a carousel with no viewport to scroll", async () => {
    // Arrange
    await mount(
      '<primitiv-carousel aria-label="Bare"><primitiv-carousel-slide>One</primitiv-carousel-slide><primitiv-carousel-slide>Two</primitiv-carousel-slide></primitiv-carousel>',
    );
    const changes = record("primitiv-carousel-change");

    // Act
    TestIntersectionObserver.latest.fire([{ target: slides()[1] as Element, ratio: 1 }]);

    // Assert
    expect(changes).toEqual([{ page: 1 }]);
  });

  it("reports no autoplay status for a carousel that is not playing", async () => {
    // Arrange
    const seen = record("primitiv-carousel-autoplay-status", document);

    // Act
    await mount(carouselHtml({ attrs: "autoplay" }));

    // Assert
    expect(seen).toEqual([]);
  });
});

describe("<primitiv-carousel> once removed", () => {
  it("stops listening on its root, even after connecting twice", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: "autoplay playing" }));
    const carousel = root();
    carousel.connectedCallback();
    carousel.remove();
    const seen = record("primitiv-carousel-autoplay-status", carousel);

    // Act
    carousel.dispatchEvent(new MouseEvent("mouseleave"));

    // Assert
    expect(seen).toEqual([]);
  });

  it("forgets hover and focus it saw while away, and plays again once back", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: "autoplay playing" }));
    const carousel = root();
    carousel.remove();
    carousel.dispatchEvent(new MouseEvent("mouseenter"));
    carousel.dispatchEvent(new FocusEvent("focusin"));
    const seen = record("primitiv-carousel-autoplay-status", carousel);

    // Act
    document.body.append(carousel);

    // Assert
    expect(seen).toEqual([{ type: "autoplay.start", page: 0, isPlaying: true }]);
  });

  it("does nothing on refresh", async () => {
    // Arrange
    await mount(carouselHtml());
    const scrollTo = vi.spyOn(viewport(), "scrollTo");
    const carousel = root();
    carousel.remove();

    // Act
    carousel.refresh();

    // Assert
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe("<primitiv-carousel> attributes it watches", () => {
  const cases: Array<[string, string, string, () => string | null]> = [
    ["autoplay", "playing", "autoplay", () => viewport().getAttribute("aria-live")],
    ["slides-per-page", "", 'slides-per-page="2"', () => slides()[1]?.getAttribute("data-state") ?? null],
    ["snap-align", "", 'snap-align="start"', () => slides()[0]?.getAttribute("data-snap-align") ?? null],
    ["snap-type", "", 'snap-type="proximity"', () => viewport().getAttribute("data-snap-type")],
    ["orientation", "", 'orientation="vertical"', () => root().getAttribute("data-orientation")],
    ["allow-mouse-drag", "", "allow-mouse-drag", () => viewport().getAttribute("data-mouse-drag")],
    ["slide-label", "", 'slide-label="#{index}"', () => slides()[0]?.getAttribute("aria-label") ?? null],
    ["indicator-label", "", 'indicator-label="Go {index}"', () => document.querySelector("primitiv-carousel-indicator > *")?.getAttribute("aria-label") ?? null],
  ];

  it.each(cases)("reconciles when %s changes", async (_name, start, change, read) => {
    // Arrange
    await mount(carouselHtml({ attrs: start, controls: INDICATORS }));
    const before = read();
    const [name, value = ""] = change.split("=");

    // Act
    root().setAttribute(name as string, value.replaceAll('"', ""));
    await settle();

    // Assert
    expect(read()).not.toBe(before);
  });

  it("reconciles when a play control's labels change", async () => {
    // Arrange
    await mount(
      carouselHtml({ attrs: "autoplay", controls: '<primitiv-carousel-play-pause-trigger><button type="button"></button></primitiv-carousel-play-pause-trigger>' }),
    );
    const control = () => document.querySelector("primitiv-carousel-play-pause-trigger > button") as HTMLElement;

    // Act & Assert
    root().setAttribute("start-label", "Go");
    await settle();
    expect(control().getAttribute("aria-label")).toBe("Go");
    root().playing = true;
    await settle();
    root().setAttribute("stop-label", "Halt");
    await settle();
    expect(control().getAttribute("aria-label")).toBe("Halt");
  });

  it("reconciles when a part's own attributes change", async () => {
    // Arrange
    await mount(
      carouselHtml({
        controls: `${NEXT}<primitiv-carousel-indicator-group label="Marks"><primitiv-carousel-indicator index="0"><button type="button">A</button></primitiv-carousel-indicator></primitiv-carousel-indicator-group>`,
      }),
    );
    const indicator = document.querySelector("primitiv-carousel-indicator") as HTMLElement;
    const mark = indicator.firstElementChild as HTMLElement;
    const nextPart = document.querySelector("primitiv-carousel-next-trigger") as HTMLElement;

    // Act & Assert
    slides()[0]?.setAttribute("label", "Named");
    await settle();
    expect(slides()[0]?.getAttribute("aria-label")).toBe("Named");
    indicator.setAttribute("index", "2");
    await settle();
    expect(mark.getAttribute("aria-label")).toBe("Slide 3");
    indicator.setAttribute("read-only", "");
    await settle();
    expect(mark.getAttribute("aria-hidden")).toBe("true");
    nextPart.setAttribute("disabled", "");
    await settle();
    expect((nextPart.firstElementChild as HTMLButtonElement).getAttribute("disabled")).toBe("");
  });

  it("restarts autoplay at a new delay", async () => {
    // Arrange
    vi.useFakeTimers();
    await mount(carouselHtml({ attrs: 'autoplay playing autoplay-delay="5000"' }));

    // Act
    root().setAttribute("autoplay-delay", "1000");
    await settle();
    vi.advanceTimersByTime(1000);
    await settle();

    // Assert
    expect(root().page).toBe(1);
  });

  it("keeps the autoplay timer running through a change it does not depend on", async () => {
    // Arrange
    vi.useFakeTimers();
    await mount(carouselHtml({ attrs: 'autoplay playing autoplay-delay="1000"' }));

    // Act
    vi.advanceTimersByTime(600);
    root().setAttribute("slide-label", "{index}");
    await settle();
    vi.advanceTimersByTime(400);
    await settle();

    // Assert
    expect(root().page).toBe(1);
  });
});

describe("<primitiv-carousel> what it announces", () => {
  it("steps by a slides-per-move of more than one", async () => {
    // Arrange & Act
    await mount(carouselHtml({ slides: 5, attrs: 'slides-per-page="3" slides-per-move="2"' }));

    // Assert
    expect(slides().map((slide) => slide.hasAttribute("data-snap-align"))).toEqual([true, false, true, false, false]);
  });

  it("reads an explicit slides-per-move of auto as a whole page", async () => {
    // Arrange & Act
    await mount(carouselHtml({ slides: 4, attrs: 'slides-per-page="2" slides-per-move="auto"' }));

    // Assert
    expect(slides().map((slide) => slide.hasAttribute("data-snap-align"))).toEqual([true, false, true, false]);
  });

  it("lets its status events bubble", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'allow-mouse-drag autoplay playing page="2"' }));
    const autoplay = record("primitiv-carousel-autoplay-status", document);
    const drags = record("primitiv-carousel-drag-status", document);
    const overscrolls = record("primitiv-carousel-overscroll-status", document);

    // Act
    fireEvent.mouseLeave(root());
    root().page = 1;
    await settle();
    viewport().dispatchEvent(pointer("pointerdown", { clientX: 100 }));
    viewport().dispatchEvent(pointer("pointermove", { clientX: 90 }));
    root().page = 2;
    await settle();
    fireEvent.keyDown(viewport(), { key: "ArrowRight" });

    // Assert
    expect(autoplay.length).toBeGreaterThan(0);
    expect(drags).toHaveLength(1);
    expect(overscrolls).toHaveLength(1);
  });

  it("announces no change to the page it is already on, nor to playing as it plays", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: "autoplay playing" }));
    const changes = record("primitiv-carousel-change");
    const playing = record("primitiv-carousel-playing-change");

    // Act
    fireEvent.keyDown(viewport(), { key: "Home" });
    root().goTo(0);
    root().play();
    await settle();

    // Assert
    expect(changes).toEqual([]);
    expect(playing).toEqual([]);
  });

  it("ignores a click on a control part that holds no element", async () => {
    // Arrange
    vi.spyOn(console, "error").mockImplementation(() => {});
    await mount(carouselHtml({ controls: "<primitiv-carousel-next-trigger>Next</primitiv-carousel-next-trigger>" }));

    // Act
    fireEvent.click(document.querySelector("primitiv-carousel-next-trigger") as HTMLElement);
    await settle();

    // Assert
    expect(root().hasAttribute("page")).toBe(false);
  });

  it("aligns each slide by its own start, centre or end", async () => {
    // Arrange & Act
    await mount(
      carouselHtml({ slides: 1 })
        .replace("<primitiv-carousel-slide>", '<primitiv-carousel-slide snap-align="start">')
        .replace(
          "</primitiv-carousel-viewport>",
          '<primitiv-carousel-slide snap-align="center">b</primitiv-carousel-slide><primitiv-carousel-slide snap-align="end">c</primitiv-carousel-slide></primitiv-carousel-viewport>',
        ),
    );

    // Assert
    expect(slides().map((slide) => slide.getAttribute("data-snap-align"))).toEqual(["start", "center", "end"]);

    // Act — each slide's own value outranks the root's, whichever the root holds.
    root().setAttribute("snap-align", "end");
    await settle();

    // Assert
    expect(slides().map((slide) => slide.getAttribute("data-snap-align"))).toEqual(["start", "center", "end"]);
  });

  it("keeps a group's own aria-label when it has no label", async () => {
    // Arrange & Act
    await mount(carouselHtml({ controls: '<primitiv-carousel-indicators aria-label="Mine"></primitiv-carousel-indicators>' }));

    // Assert
    expect(document.querySelector("primitiv-carousel-indicators")?.getAttribute("aria-label")).toBe("Mine");
  });
});

describe("<primitiv-carousel> mouse drag edges", () => {
  it("starts a drag at exactly the threshold, marking the viewport", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'allow-mouse-drag page="1"' }));

    // Act
    viewport().dispatchEvent(pointer("pointerdown", { clientX: 100 }));
    viewport().dispatchEvent(pointer("pointermove", { clientX: 97 }));

    // Assert
    expect(root().isDragging()).toBe(true);
    expect(viewport().getAttribute("data-dragging")).toBe("");
  });

  it("reports no overscroll for a drag with somewhere to go", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'allow-mouse-drag page="1"' }));
    const overscrolls = record("primitiv-carousel-overscroll-status");

    // Act
    viewport().dispatchEvent(pointer("pointerdown", { clientX: 100 }));
    viewport().dispatchEvent(pointer("pointermove", { clientX: 90 }));
    viewport().dispatchEvent(pointer("pointermove", { clientX: 80 }));
    viewport().dispatchEvent(pointer("pointerup"));

    // Assert
    expect(overscrolls).toEqual([]);
  });
});

describe("<primitiv-carousel> wheel edges", () => {
  it("leaves the wheel to a fading carousel and to an infinite one", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'transition="fade"' }));

    // Act & Assert
    expect(fireEvent.wheel(viewport(), { deltaY: 30 })).toBe(true);
    document.body.innerHTML = carouselHtml({ attrs: 'loop="infinite"', track: true });
    await settle();
    expect(fireEvent.wheel(viewport(), { deltaY: 30 })).toBe(true);
  });

  it("reports nothing for a notch away from the end it is at, or for no movement", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'page="2"' }));
    const overscrolls = record("primitiv-carousel-overscroll-status");

    // Act
    fireEvent.wheel(viewport(), { deltaY: -30 });
    fireEvent.wheel(viewport(), { deltaY: 0 });
    root().page = 0;
    await settle();
    fireEvent.wheel(viewport(), { deltaY: 0 });

    // Assert
    expect(overscrolls).toEqual([]);
  });

  it("stops listening for the wheel on a viewport that was replaced", async () => {
    // Arrange
    await mount(carouselHtml());
    const old = viewport();
    const fresh = document.createElement("primitiv-carousel-viewport");
    fresh.append(...old.children);
    old.replaceWith(fresh);
    await settle();

    // Act
    const handled = fireEvent.wheel(old, { deltaY: 30 });

    // Assert
    expect(handled).toBe(true);
    expect(old.scrollLeft).toBe(0);
  });
});

describe("<primitiv-carousel> swipe edges", () => {
  it("ignores a swipe in a fading carousel", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'transition="fade"' }));
    const changes = record("primitiv-carousel-change");

    // Act
    viewport().dispatchEvent(snap(slides()[2]));

    // Assert
    expect(changes).toEqual([]);
  });

  it("ignores a target that is not a slide, and follows a swipe back to the first", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'page="1"' }));
    const changes = record("primitiv-carousel-change");

    // Act
    viewport().dispatchEvent(snap(viewport()));
    viewport().dispatchEvent(snap(slides()[0]));

    // Assert
    expect(changes).toEqual([{ page: 0 }]);
  });

  it("reads a vertical carousel's block target, not its inline one", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'orientation="vertical"' }));
    const changes = record("primitiv-carousel-change");

    // Act
    viewport().dispatchEvent(Object.assign(snap(slides()[2]), { snapTargetBlock: slides()[1] }));

    // Assert
    expect(changes).toEqual([{ page: 1 }]);
  });

  it("still scrolls for the next move after a swipe to the page it was on", async () => {
    // Arrange
    await mount(carouselHtml());
    const scrollTo = vi.spyOn(viewport(), "scrollTo");

    // Act
    viewport().dispatchEvent(snap(slides()[0]));
    root().next();
    await settle();

    // Assert
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("skips only the swipe's own scroll", async () => {
    // Arrange
    await mount(carouselHtml());
    const scrollTo = vi.spyOn(viewport(), "scrollTo");

    // Act
    viewport().dispatchEvent(snap(slides()[2]));
    await settle();
    const afterSwipe = scrollTo.mock.calls.length;
    root().previous();
    await settle();

    // Assert
    expect(afterSwipe).toBe(0);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
});

describe("<primitiv-carousel> observer edges", () => {
  /** Mount, and let the first programmatic scroll settle. */
  async function settled(attrs = ""): Promise<void> {
    await mount(carouselHtml({ attrs }));
    viewport().dispatchEvent(new Event("scrollend"));
  }

  it("follows the first of several slides in view", async () => {
    // Arrange
    await settled();
    const changes = record("primitiv-carousel-change");

    // Act
    TestIntersectionObserver.latest.fire([
      { target: slides()[2] as Element, ratio: 1 },
      { target: slides()[1] as Element, ratio: 1 },
    ]);

    // Assert
    expect(changes).toEqual([{ page: 1 }]);
  });

  it("does not scroll again for a page it followed from what was in view", async () => {
    // Arrange
    await settled();
    const scrollTo = vi.spyOn(viewport(), "scrollTo");

    // Act
    TestIntersectionObserver.latest.fire([{ target: slides()[2] as Element, ratio: 1 }]);
    await settle();

    // Assert
    expect(root().page).toBe(2);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("still scrolls for the next move after seeing the page it was on in view", async () => {
    // Arrange
    await settled();
    const scrollTo = vi.spyOn(viewport(), "scrollTo");

    // Act
    TestIntersectionObserver.latest.fire([{ target: slides()[0] as Element, ratio: 1 }]);
    root().next();
    await settle();

    // Assert
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("keeps its observers through a page change", async () => {
    // Arrange
    await mount(carouselHtml({ slides: 4, attrs: 'slides-per-page="2"' }));
    const resize = TestResizeObserver.instances.length;
    const intersection = TestIntersectionObserver.instances.length;

    // Act
    root().next();
    await settle();

    // Assert
    expect(TestResizeObserver.instances.length).toBe(resize);
    expect(TestIntersectionObserver.instances.length).toBe(intersection);
  });
});

describe("<primitiv-carousel> measuring edges", () => {
  it("measures the page against a viewport that does not start at the edge", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'snap-align="start"' }));
    place(viewport(), box(50, 100, 30, 100));
    slides().forEach((slide, index) => place(slide, box(50 + index * 100, 100, 30, 100)));
    const scrollTo = vi.spyOn(viewport(), "scrollTo");

    // Act
    root().next();
    await settle();
    root().setAttribute("orientation", "vertical");
    slides().forEach((slide, index) => place(slide, box(50, 100, 30 + index * 100, 100)));
    root().next();
    await settle();

    // Assert
    expect(scrollTo.mock.calls).toEqual([[{ left: 100, behavior: "smooth" }], [{ top: 200, behavior: "smooth" }]]);
  });

  it("measures the pages slides add, and gives a new slide its progress", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'slides-per-page="2"' }));

    // Act
    viewport().insertAdjacentHTML("beforeend", "<primitiv-carousel-slide>4</primitiv-carousel-slide><primitiv-carousel-slide>5</primitiv-carousel-slide>");
    await settle();

    // Assert — pages now start at 0, 2 and 3.
    expect(slides()[3]?.style.scrollMarginInlineEnd).toBe("0px");
    expect(slides()[4]?.style.getPropertyValue("--slide-progress")).toBe("0");
  });

  it("clears the other axis's margins when the orientation changes", async () => {
    // Arrange
    await mount(carouselHtml({ slides: 4, attrs: 'slides-per-page="2"' }));
    slides().forEach((slide, index) => place(slide, box(index * 80, 80)));
    TestResizeObserver.fireAll();

    // Act
    root().setAttribute("orientation", "vertical");
    await settle();

    // Assert
    expect(slides()[0]?.style.scrollMarginInlineEnd).toBe("");
    expect(slides()[0]?.style.scrollMarginBlockEnd).toBe("0px");

    // Act
    root().setAttribute("orientation", "horizontal");
    await settle();

    // Assert
    expect(slides()[0]?.style.scrollMarginBlockEnd).toBe("");
  });

  it("stops recomputing progress on scroll once removed", async () => {
    // Arrange
    await mount(carouselHtml());
    const frames: FrameRequestCallback[] = [];
    const request = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => frames.push(callback));
    viewport().dispatchEvent(new Event("scroll"));
    frames.shift()?.(0);
    const old = viewport();
    root().remove();

    // Act
    old.dispatchEvent(new Event("scroll"));

    // Assert
    expect(request).toHaveBeenCalledTimes(1);
  });
});

describe("<primitiv-carousel> autoplay edges", () => {
  it("keeps the user's play through hover for the whole session", async () => {
    // Arrange
    vi.useFakeTimers();
    await mount(carouselHtml({ attrs: 'autoplay autoplay-delay="1000"' }));
    fireEvent.mouseEnter(root());

    // Act
    root().play();
    await settle();
    vi.advanceTimersByTime(1000);
    await settle();
    vi.advanceTimersByTime(1000);
    await settle();

    // Assert
    expect(root().page).toBe(2);
  });

  it("reports a fresh start after a pause for hover", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: "autoplay playing" }));
    const seen = record("primitiv-carousel-autoplay-status");

    // Act
    fireEvent.mouseEnter(root());
    fireEvent.mouseLeave(root());

    // Assert
    expect(seen.map((status) => (status as { type: string }).type)).toEqual(["autoplay.stop", "autoplay.start"]);
  });
});

describe("<primitiv-carousel> controls in a nested viewport-less carousel", () => {
  it("pages with its previous trigger", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'page="1"', controls: PREVIOUS }));

    // Act
    fireEvent.click(document.querySelector("primitiv-carousel-previous-trigger > button") as HTMLElement);
    await settle();

    // Assert
    expect(root().page).toBe(0);
  });
});

describe("<primitiv-carousel> animation frames", () => {
  it("cancels only frames it asked for", async () => {
    // Arrange
    let id = 0;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => ++id);
    const cancel = vi.spyOn(window, "cancelAnimationFrame");

    // Act — a native carousel with no frame pending leaves.
    await mount(carouselHtml());
    root().remove();

    // Assert
    expect(cancel).not.toHaveBeenCalled();
  });
});

describe("CarouselController", () => {
  it("lets a controller that never connected disconnect", () => {
    // Arrange
    const controller = new CarouselController({} as CarouselControllerHost);

    // Act & Assert
    expect(() => controller.disconnect()).not.toThrow();
  });
});
