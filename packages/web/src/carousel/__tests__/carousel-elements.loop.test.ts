import { carouselHtml } from "./carousel.fixtures";
import { TestResizeObserver } from "./jsdom";
import { mount, root, settle, slides, viewport } from "./mount";

/**
 * The infinite loop's transform engine. jsdom lays nothing out, so the tests
 * give every real slide a box from its `data-index` (`start(index)`, 100px
 * wide), the track `track`px, and every other element (copies included) a box
 * at 0 — the engine reads positions as differences, so that is all it needs.
 */
function layout({ track = 100, start = (index: number) => index * 100 } = {}): void {
  const original = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const index = this.getAttribute("data-index");
    if (this.localName === "primitiv-carousel-track" || this.localName === "primitiv-carousel-viewport") {
      return { left: 0, top: 0, width: track, height: track, right: track, bottom: track } as DOMRect;
    }
    if (index !== null) {
      const at = start(Number(index));
      return { left: at, top: at, width: 100, height: 100, right: at + 100, bottom: at + 100 } as DOMRect;
    }
    return original.call(this);
  });
}

const track = (): HTMLElement => document.querySelector("primitiv-carousel-track") as HTMLElement;
const clones = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>("[data-carousel-clone]")];
const transform = (): string => track().style.transform;

/** Fire the track's transitionend for `property`. */
function settleGlide(property = "transform"): void {
  track().dispatchEvent(Object.assign(new Event("transitionend"), { propertyName: property }));
}

/** A pointer event with a timestamp, on the viewport. */
function pointer(type: string, client: number, { time = 0, id = 1, pointerType = "touch" } = {}): void {
  const event = Object.assign(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: client, clientY: client }), {
    pointerId: id,
    pointerType,
  });
  Object.defineProperty(event, "timeStamp", { value: time });
  viewport().dispatchEvent(event);
}

/** Mount an infinite carousel of `count` slides over the fake layout. */
async function loop(attrs = "", count = 3): Promise<void> {
  layout();
  await mount(carouselHtml({ slides: count, track: true, attrs: `loop="infinite" ${attrs}` }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<primitiv-carousel loop=infinite> copies", () => {
  it("puts a full period of inert, hidden, id-less copies either side of the real slides", async () => {
    // Arrange & Act
    await mount(
      carouselHtml({ track: true, attrs: 'loop="infinite"' }).replace(
        "Slide content 1",
        '<span id="inner">Slide content 1</span>',
      ),
    );

    // Assert
    const children = [...track().children];
    expect(children).toHaveLength(9);
    expect(children.slice(0, 3).every((child) => child.hasAttribute("data-carousel-clone"))).toBe(true);
    expect(children.slice(3, 6)).toEqual(slides());
    expect(children.slice(6).every((child) => child.hasAttribute("data-carousel-clone"))).toBe(true);
    for (const clone of clones()) {
      expect(clone.getAttribute("aria-hidden")).toBe("true");
      expect(clone.hasAttribute("inert")).toBe(true);
      expect(clone.hasAttribute("data-index")).toBe(false);
      expect(clone.hasAttribute("data-state")).toBe(false);
      expect(clone.querySelector("[id]")).toBeNull();
    }
    expect(document.querySelectorAll("#inner")).toHaveLength(1);
    expect(slides().every((slide) => slide.getAttribute("data-total") === "3")).toBe(true);
  });

  it("leaves a copy free of a slide's own id and transform", async () => {
    // Arrange & Act
    await mount(
      carouselHtml({ track: true, attrs: 'loop="infinite"' }).replace(
        "<primitiv-carousel-slide>",
        '<primitiv-carousel-slide id="first" style="transform: scale(2)">',
      ),
    );

    // Assert
    expect(clones()[0]?.hasAttribute("id")).toBe(false);
    expect(clones()[0]?.style.transform).toBe("");
  });

  it("makes no copies of fewer than two slides", async () => {
    // Arrange & Act
    await mount(carouselHtml({ slides: 1, track: true, attrs: 'loop="infinite"' }));

    // Assert
    expect(clones()).toEqual([]);
  });

  it("rebuilds the copies when a real slide's content changes, but not for its state or the engine's own writes", async () => {
    // Arrange
    await loop();
    const before = clones()[0];

    // Act
    slides()[1]?.setAttribute("data-state", "active");
    (slides()[0] as HTMLElement).style.visibility = "hidden";
    slides()[0]?.style.setProperty("--slide-progress", "0.5");
    await settle();

    // Assert
    expect(clones()[0]).toBe(before);

    // Act
    (slides()[0] as HTMLElement).style.background = "red";
    await settle();

    // Assert
    expect(clones()[0]).not.toBe(before);
    expect(clones()[0]?.style.background).toBe("red");

    // Act
    const rebuilt = clones()[0];
    (slides()[0] as HTMLElement).textContent = "Changed";
    await settle();

    // Assert
    expect(clones()[0]).not.toBe(rebuilt);
    expect(clones()[0]?.textContent).toBe("Changed");

    // Act
    const again = clones()[0];
    slides()[0]?.setAttribute("title", "Named");
    await settle();

    // Assert
    expect(clones()[0]).not.toBe(again);
  });

  it("rebuilds for a style a slide gains after losing its own", async () => {
    // Arrange
    await loop();
    const before = clones()[0];

    // Act — removing the engine's writes alone is not a change; a new style is.
    slides()[0]?.removeAttribute("style");
    await settle();
    const unchanged = clones()[0];
    (slides()[0] as HTMLElement).style.color = "red";
    await settle();

    // Assert
    expect(unchanged).toBe(before);
    expect(clones()[0]).not.toBe(before);
  });

  it("observes nothing once every slide has gone", async () => {
    // Arrange
    await loop();

    // Act
    for (const slide of slides()) slide.remove();
    await settle();

    // Assert
    expect(clones()).toEqual([]);
  });

  it("takes the copies out, and undoes the transform, when the loop ends", async () => {
    // Arrange
    await loop();
    (slides()[2] as HTMLElement).style.visibility = "hidden";

    // Act
    root().removeAttribute("loop");
    await settle();

    // Assert
    expect(clones()).toEqual([]);
    expect(transform()).toBe("");
    expect(track().style.transition).toBe("");
    expect(slides()[2]?.style.visibility).toBe("");
  });

  it("rebuilds the copies on refresh", async () => {
    // Arrange
    await loop();
    const before = clones()[0];

    // Act
    root().refresh();

    // Assert
    expect(clones()[0]).not.toBe(before);
  });
});

describe("<primitiv-carousel loop=infinite> gliding", () => {
  it("positions the first page at once", async () => {
    // Arrange & Act
    await loop();

    // Assert
    expect(track().style.transition).toBe("none");
    expect(transform()).toBe("translate(0px, 0px)");
  });

  it("glides a page with a transition, then settles", async () => {
    // Arrange
    await loop();

    // Act
    root().next();
    await settle();

    // Assert
    expect(track().style.transition).toBe("transform 500ms cubic-bezier(0, 0, 0.2, 1)");
    expect(transform()).toBe("translate(-100px, 0px)");
  });

  it("glides forward onto the copy past the last slide, re-basing to the real one once it settles", async () => {
    // Arrange
    await loop('page="2"');

    // Act
    root().next();
    await settle();

    // Assert
    expect(root().page).toBe(0);
    expect(transform()).toBe("translate(-300px, 0px)");

    // Act
    settleGlide("opacity");

    // Assert
    expect(transform()).toBe("translate(-300px, 0px)");

    // Act
    settleGlide();

    // Assert
    expect(track().style.transition).toBe("none");
    expect(transform()).toBe("translate(0px, 0px)");

    // Act — a second settle has nothing left to re-base.
    track().style.transform = "translate(7px, 0px)";
    settleGlide();

    // Assert
    expect(transform()).toBe("translate(7px, 0px)");
  });

  it("glides back onto the copy before the first slide", async () => {
    // Arrange
    await loop();

    // Act
    root().previous();
    await settle();

    // Assert
    expect(root().page).toBe(2);
    expect(transform()).toBe("translate(100px, 0px)");
  });

  it("travels the literal distance for a jump, not the short way round", async () => {
    // Arrange
    await loop();

    // Act
    root().goTo(2);
    await settle();

    // Assert
    expect(transform()).toBe("translate(-200px, 0px)");
  });

  it("re-bases before a glide, so a navigation interrupting another stays on the copies", async () => {
    // Arrange
    await loop('page="2"');
    root().next();
    await settle();

    // Act — no transitionend: the next glide starts from the copy at 300.
    root().next();
    await settle();

    // Assert — re-based to 0, then one stride on.
    expect(transform()).toBe("translate(-100px, 0px)");
  });

  it("moves at once for an instant move, or for a user who prefers reduced motion", async () => {
    // Arrange
    await loop();

    // Act
    root().goTo(2, true);
    await settle();

    // Assert
    expect(track().style.transition).toBe("none");
    expect(transform()).toBe("translate(-200px, 0px)");

    // Act
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    root().next();
    await settle();

    // Assert — onto the copy, normalised straight back to the first slide.
    expect(track().style.transition).toBe("none");
    expect(transform()).toBe("translate(0px, 0px)");
    vi.unstubAllGlobals();
  });

  it("reads the glide's duration and easing from the track's custom properties", async () => {
    // Arrange
    await loop();
    track().style.setProperty("--primitiv-carousel-glide-duration", "200ms");
    track().style.setProperty("--primitiv-carousel-glide-easing", "linear");

    // Act
    root().next();
    await settle();

    // Assert
    expect(track().style.transition).toBe("transform 200ms linear");
  });

  it("translates the block axis when vertical", async () => {
    // Arrange
    await loop('orientation="vertical"');

    // Act
    root().next();
    await settle();

    // Assert
    expect(transform()).toBe("translate(0px, -100px)");
  });

  it("mirrors the travel when the row runs backwards (RTL), ending a start-aligned page at the far edge", async () => {
    // Arrange
    layout({ track: 200, start: (index) => 100 - index * 100 });
    await mount(carouselHtml({ track: true, attrs: 'loop="infinite" snap-align="start"' }));

    // Act
    root().next();
    await settle();

    // Assert — slide 0 sits at 100, rests at the far edge (align 100), then moves right by a stride.
    expect(transform()).toBe("translate(100px, 0px)");
  });

  it("aligns a multi-slide page by the whole page", async () => {
    // Arrange — 2 a page in a 300px track: the page spans 200px, centred at 50.
    layout({ track: 300 });
    await mount(carouselHtml({ slides: 4, track: true, attrs: 'loop="infinite" slides-per-page="2"' }));

    // Act
    root().next();
    await settle();

    // Assert
    expect(transform()).toBe("translate(-150px, 0px)");
  });

  it("paints only the slides near the sweep, and sets each one's progress", async () => {
    // Arrange — a 100px track: only slides within a track's slack (to 200px) stay painted.
    await loop("", 7);

    // Assert
    expect(slides().map((slide) => slide.style.visibility)).toEqual(["", "", "", "hidden", "hidden", "hidden", "hidden"]);
    expect(slides().map((slide) => slide.style.getPropertyValue("--slide-progress"))).toEqual(["0", "1", "1", "1", "1", "1", "1"]);

    // Act
    root().goTo(3);
    await settle();

    // Assert — everything the glide passes over is painted.
    expect(slides().map((slide) => slide.style.visibility)).toEqual(["", "", "", "", "", "", "hidden"]);
  });

  it("stands down while there is no layout to measure", async () => {
    // Arrange & Act
    await mount(carouselHtml({ track: true, attrs: 'loop="infinite"' }));
    root().next();
    await settle();
    settleGlide();

    // Assert
    expect(transform()).toBe("");
  });

  it("follows the live position once a frame while a glide runs, until it settles", async () => {
    // Arrange
    await loop();
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => frames.push(callback));
    const cancel = vi.spyOn(window, "cancelAnimationFrame");

    // Act
    root().next();
    await settle();
    frames.shift()?.(0);

    // Assert — the live read uses the viewport's centre; a slide at 100 reads 1.
    expect(slides()[1]?.style.getPropertyValue("--slide-progress")).toBe("1");
    expect(frames).toHaveLength(1);

    // Act
    settleGlide();

    // Assert
    expect(cancel).toHaveBeenCalled();
  });

  it("reads a vertical slide's live position by its height", async () => {
    // Arrange
    await loop('orientation="vertical"');
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => frames.push(callback));

    // Act
    root().next();
    await settle();
    frames.shift()?.(0);

    // Assert
    expect(slides()[0]?.style.getPropertyValue("--slide-progress")).toBe("0");
  });
});

describe("<primitiv-carousel loop=infinite> resizing", () => {
  it("ignores a resize that changed nothing, and re-homes at once on one that did", async () => {
    // Arrange
    await loop('page="1"');
    track().style.transform = "translate(7px, 0px)";

    // Act
    TestResizeObserver.fireAll();

    // Assert
    expect(transform()).toBe("translate(7px, 0px)");

    // Act
    vi.restoreAllMocks();
    layout({ track: 300 });
    TestResizeObserver.fireAll();

    // Assert — slide 1 centred in 300px.
    expect(track().style.transition).toBe("none");
    expect(transform()).toBe("translate(0px, 0px)");
  });

  it("does nothing on a resize with no layout", async () => {
    // Arrange
    await loop();
    vi.restoreAllMocks();
    track().style.transform = "translate(7px, 0px)";

    // Act
    TestResizeObserver.fireAll();

    // Assert
    expect(transform()).toBe("translate(7px, 0px)");
  });
});

describe("<primitiv-carousel loop=infinite> dragging", () => {
  it("follows a touch drag once past the threshold, a frame at a time, and flings to a page on release", async () => {
    // Arrange
    await loop();
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => frames.push(callback));

    // Act
    pointer("pointerdown", 200, { time: 0 });
    pointer("pointermove", 198, { time: 10 });
    pointer("pointermove", 170, { time: 20 });
    pointer("pointermove", 140, { time: 30 });

    // Assert — one frame for both moves past the threshold.
    expect(frames).toHaveLength(1);

    // Act
    frames.shift()?.(0);

    // Assert
    expect(transform()).toBe("translate(-60px, 0px)");

    // Act — released moving 3px/ms: 60 + 3 × 120 → the boundary at 400, slide 1.
    pointer("pointerup", 140, { time: 40 });
    await settle();

    // Assert
    expect(root().page).toBe(1);
    expect(track().style.transition).toBe("transform 500ms cubic-bezier(0, 0, 0.2, 1)");
    expect(transform()).toBe("translate(-400px, 0px)");
  });

  it("paints the release position itself when a frame is still pending", async () => {
    // Arrange
    await loop();
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => frames.push(callback));
    const cancel = vi.spyOn(window, "cancelAnimationFrame");

    // Act
    pointer("pointerdown", 200);
    pointer("pointermove", 190, { time: 1000 });
    pointer("pointerup", 190, { time: 2000 });
    await settle();

    // Assert — slow: it settles back on the first page.
    expect(cancel).toHaveBeenCalled();
    expect(transform()).toBe("translate(0px, 0px)");
    expect(root().page).toBe(0);
  });

  it("still glides on the next navigation after a fling that stayed on its page", async () => {
    // Arrange
    await loop();
    pointer("pointerdown", 200);
    pointer("pointermove", 190, { time: 1000 });
    pointer("pointerup", 190, { time: 2000 });
    await settle();

    // Act
    root().next();
    await settle();

    // Assert
    expect(transform()).toBe("translate(-100px, 0px)");
  });

  it("drags a vertical track by the pointer's y, mirrors an RTL drag, and ignores another pointer", async () => {
    // Arrange
    layout({ start: (index) => -index * 100 });
    await mount(carouselHtml({ track: true, attrs: 'loop="infinite"' }));
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => frames.push(callback));

    // Act
    pointer("pointerdown", 100);
    pointer("pointermove", 50, { id: 2 });
    pointer("pointermove", 120, { time: 10 });
    frames.shift()?.(0);

    // Assert — a 20px drag right, under RTL, moves 20 forward: the track shifts right.
    expect(transform()).toBe("translate(20px, 0px)");

    // Act
    pointer("pointerup", 120, { id: 2 });
    root().setAttribute("orientation", "vertical");
    await settle();

    // Assert — the drag is still the first pointer's.
    expect(root().page).toBe(0);
  });

  it("follows a vertical drag by the pointer's y, through moves at the same instant", async () => {
    // Arrange
    await loop('orientation="vertical"');
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => frames.push(callback));

    // Act
    pointer("pointerdown", 200, { time: 5 });
    pointer("pointermove", 170, { time: 5 });
    frames.shift()?.(0);

    // Assert
    expect(transform()).toBe("translate(0px, -30px)");
  });

  it("needs allow-mouse-drag for a mouse, and ignores a press it never moved", async () => {
    // Arrange
    await loop();

    // Act
    pointer("pointerdown", 200, { pointerType: "mouse" });
    pointer("pointermove", 100, { pointerType: "mouse", time: 10 });
    pointer("pointerup", 100, { pointerType: "mouse", time: 20 });
    root().setAttribute("allow-mouse-drag", "");
    await settle();
    pointer("pointerdown", 200, { pointerType: "mouse" });
    pointer("pointermove", 199, { pointerType: "mouse", time: 10 });
    pointer("pointerup", 199, { pointerType: "mouse", time: 20 });
    pointer("pointermove", 100, { pointerType: "mouse", time: 30 });

    // Assert
    expect(transform()).toBe("translate(0px, 0px)");
    expect(root().page).toBe(0);
  });

  it("does not start a drag with no layout to measure", async () => {
    // Arrange
    await mount(carouselHtml({ track: true, attrs: 'loop="infinite"' }));

    // Act
    pointer("pointerdown", 200);
    pointer("pointermove", 100, { time: 10 });
    pointer("pointerup", 100, { time: 20 });
    await settle();

    // Assert
    expect(transform()).toBe("");
  });

  it("drops a pending drag frame when the loop ends", async () => {
    // Arrange
    await loop();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 9);
    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    pointer("pointerdown", 200);
    pointer("pointermove", 150, { time: 10 });

    // Act
    root().remove();

    // Assert
    expect(cancel).toHaveBeenCalledWith(9);
  });
});
