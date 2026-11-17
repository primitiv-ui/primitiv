import { screen } from "@testing-library/dom";

import { defineCarousel, type ElementRegistry } from "../elements";
import { carouselHtml, INDICATORS, NEXT, PREVIOUS } from "./carousel.fixtures";
import { button, indicators, mount, root, settle, slides, viewport } from "./mount";

const ELEMENTS = [
  "primitiv-carousel",
  "primitiv-carousel-viewport",
  "primitiv-carousel-track",
  "primitiv-carousel-slide",
  "primitiv-carousel-previous-trigger",
  "primitiv-carousel-next-trigger",
  "primitiv-carousel-play-pause-trigger",
  "primitiv-carousel-indicator-group",
  "primitiv-carousel-indicators",
  "primitiv-carousel-indicator",
  "primitiv-carousel-progress-text",
];

describe("<primitiv-carousel> definition", () => {
  it("defines the eleven elements, and defining twice is harmless", () => {
    // Arrange & Act
    defineCarousel();
    defineCarousel();

    // Assert
    for (const name of ELEMENTS) expect(customElements.get(name)).toBeDefined();
  });

  it("defines exactly the eleven tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-carousel-track" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineCarousel(registry);

    // Assert
    expect(defined).toEqual(ELEMENTS.filter((name) => name !== "primitiv-carousel-track"));
  });

  it("does nothing where there is no registry", () => {
    // Arrange & Act & Assert
    expect(() => defineCarousel(undefined)).not.toThrow();
  });
});

describe("<primitiv-carousel> rendering", () => {
  it("makes the root a carousel region and publishes its settings", async () => {
    // Arrange & Act
    await mount(carouselHtml());

    // Assert
    expect(screen.getByRole("region", { name: "Featured" })).toBe(root());
    expect(root().getAttribute("aria-roledescription")).toBe("carousel");
    expect(root().getAttribute("data-orientation")).toBe("horizontal");
    expect(root().getAttribute("data-transition")).toBe("slide");
    expect(root().getAttribute("data-loop")).toBe("none");
  });

  it("reads orientation, transition and loop from their attributes, ignoring values it does not know", async () => {
    // Arrange & Act
    await mount(carouselHtml({ attrs: 'orientation="vertical" transition="fade" loop' }));

    // Assert
    expect(root().getAttribute("data-orientation")).toBe("vertical");
    expect(root().getAttribute("data-transition")).toBe("fade");
    expect(root().getAttribute("data-loop")).toBe("wrap");

    // Act
    root().setAttribute("transition", "spin");
    root().setAttribute("loop", "infinite");
    await settle();

    // Assert
    expect(root().getAttribute("data-transition")).toBe("slide");
    expect(root().getAttribute("data-loop")).toBe("infinite");
  });

  it("makes the viewport a focusable polite live region with the snap type", async () => {
    // Arrange & Act
    await mount(carouselHtml());

    // Assert
    expect(viewport().getAttribute("data-carousel-viewport")).toBe("");
    expect(viewport().getAttribute("tabindex")).toBe("0");
    expect(viewport().getAttribute("aria-live")).toBe("polite");
    expect(viewport().getAttribute("data-snap-type")).toBe("mandatory");
    expect(viewport().hasAttribute("data-mouse-drag")).toBe(false);
  });

  it("keeps a viewport's own tab index, and mirrors proximity snapping and mouse drag", async () => {
    // Arrange & Act
    await mount(
      carouselHtml({ attrs: 'snap-type="proximity" allow-mouse-drag' }).replace(
        "<primitiv-carousel-viewport>",
        '<primitiv-carousel-viewport tabindex="-1">',
      ),
    );

    // Assert
    expect(viewport().getAttribute("tabindex")).toBe("-1");
    expect(viewport().getAttribute("data-snap-type")).toBe("proximity");
    expect(viewport().getAttribute("data-mouse-drag")).toBe("");
  });

  it("silences the live region while autoplay rotates", async () => {
    // Arrange & Act
    await mount(carouselHtml({ attrs: "autoplay playing" }));

    // Assert
    expect(viewport().getAttribute("aria-live")).toBe("off");
  });

  it("marks each slide as a labelled group with its position and state", async () => {
    // Arrange & Act
    await mount(carouselHtml());

    // Assert
    const groups = screen.getAllByRole("group");
    expect(groups).toEqual(slides());
    expect(slides().map((slide) => slide.getAttribute("aria-label"))).toEqual(["1 of 3", "2 of 3", "3 of 3"]);
    expect(slides().map((slide) => slide.getAttribute("data-index"))).toEqual(["0", "1", "2"]);
    expect(slides().every((slide) => slide.getAttribute("data-total") === "3")).toBe(true);
    expect(slides().every((slide) => slide.getAttribute("aria-roledescription") === "slide")).toBe(true);
    expect(slides().every((slide) => slide.getAttribute("data-carousel-slide") === "")).toBe(true);
    expect(slides().map((slide) => slide.getAttribute("data-state"))).toEqual(["active", "inactive", "inactive"]);
  });

  it("names a slide from its own label, or from the root's slide-label template", async () => {
    // Arrange & Act
    await mount(
      carouselHtml({ attrs: 'slide-label="{index} sur {total}"' }).replace(
        "<primitiv-carousel-slide>",
        '<primitiv-carousel-slide label="Hand-picked">',
      ),
    );

    // Assert
    expect(slides().map((slide) => slide.getAttribute("aria-label"))).toEqual(["Hand-picked", "2 sur 3", "3 sur 3"]);
  });

  it("follows the page attribute, held to the pages there are", async () => {
    // Arrange & Act
    await mount(carouselHtml({ attrs: 'page="1"' }));

    // Assert
    expect(slides().map((slide) => slide.getAttribute("data-state"))).toEqual(["inactive", "active", "inactive"]);

    // Act
    root().setAttribute("page", "9");
    await settle();

    // Assert
    expect(slides()[2]?.getAttribute("data-state")).toBe("active");
    expect(root().page).toBe(9);
  });

  it("reads a page that is not a number as the first", async () => {
    // Arrange & Act
    await mount(carouselHtml({ attrs: 'page="two"' }));

    // Assert
    expect(root().page).toBe(0);
    expect(slides()[0]?.getAttribute("data-state")).toBe("active");
  });

  it("shows a window of slides per page, and marks only each page's leading slide as a snap point", async () => {
    // Arrange & Act — 5 at 3 a page: [0,1,2] then [2,3,4].
    await mount(carouselHtml({ slides: 5, attrs: 'slides-per-page="3" page="1" snap-align="start"' }));

    // Assert
    expect(slides().map((slide) => slide.getAttribute("data-state"))).toEqual(["inactive", "inactive", "active", "active", "active"]);
    expect(slides().map((slide) => slide.getAttribute("data-snap-align"))).toEqual(["start", null, "start", null, null]);
  });

  it("windows the page by slides-per-move, and reads auto as a whole page", async () => {
    // Arrange & Act — 4 at 2 a page, moving 1: pages start at 0, 1, 2.
    await mount(carouselHtml({ slides: 4, attrs: 'slides-per-page="2" slides-per-move="1" page="1"' }));

    // Assert
    expect(slides().map((slide) => slide.getAttribute("data-state"))).toEqual(["inactive", "active", "active", "inactive"]);
    expect(slides().map((slide) => slide.hasAttribute("data-snap-align"))).toEqual([true, true, true, false]);

    // Act
    root().setAttribute("slides-per-move", "auto");
    await settle();

    // Assert — pages start at 0 and 2.
    expect(slides().map((slide) => slide.hasAttribute("data-snap-align"))).toEqual([true, false, true, false]);
  });

  it("aligns a slide by its own snap-align, ignoring a value it does not know", async () => {
    // Arrange & Act
    await mount(
      carouselHtml()
        .replace("<primitiv-carousel-slide>", '<primitiv-carousel-slide snap-align="end">')
        .replace("Slide content 2</primitiv-carousel-slide>", 'Slide content 2</primitiv-carousel-slide><primitiv-carousel-slide snap-align="sideways">Extra</primitiv-carousel-slide>'),
    );

    // Assert
    expect(slides().map((slide) => slide.getAttribute("data-snap-align"))).toEqual(["end", "center", "center", "center"]);
  });

  it("disables the previous trigger at the first page and the next at the last", async () => {
    // Arrange & Act
    await mount(carouselHtml());

    // Assert
    expect(button("Previous").disabled).toBe(true);
    expect(button("Previous").getAttribute("aria-disabled")).toBe("true");
    expect(button("Next").disabled).toBe(false);
    expect(button("Next").getAttribute("aria-disabled")).toBe("false");

    // Act
    root().page = 2;
    await settle();

    // Assert
    expect(button("Previous").disabled).toBe(false);
    expect(button("Next").disabled).toBe(true);
  });

  it("keeps both triggers enabled while looping, and honours a trigger's own disabled", async () => {
    // Arrange & Act
    await mount(
      carouselHtml({ attrs: "loop", controls: `${PREVIOUS}${NEXT}` }).replace(
        "<primitiv-carousel-next-trigger>",
        "<primitiv-carousel-next-trigger disabled>",
      ),
    );

    // Assert
    expect(button("Previous").disabled).toBe(false);
    expect(button("Next").disabled).toBe(true);
  });

  it("stamps one indicator per page from the template, or a bare button without one", async () => {
    // Arrange & Act
    await mount(
      carouselHtml({
        controls: `<primitiv-carousel-indicators label="Choose slide"><template><button type="button" class="dot"></button></template></primitiv-carousel-indicators>${INDICATORS}`,
      }),
    );

    // Assert
    const [templated, bare] = document.querySelectorAll("primitiv-carousel-indicators");
    expect(templated?.getAttribute("role")).toBe("group");
    expect(templated?.getAttribute("aria-label")).toBe("Choose slide");
    expect([...(templated as Element).querySelectorAll("primitiv-carousel-indicator > button.dot")]).toHaveLength(3);
    const plain = [...(bare as Element).querySelectorAll<HTMLButtonElement>("primitiv-carousel-indicator > button")];
    expect(plain.map((b) => b.type)).toEqual(["button", "button", "button"]);
    expect([...(bare as Element).querySelectorAll("primitiv-carousel-indicator")].map((i) => i.getAttribute("index"))).toEqual(["0", "1", "2"]);
  });

  it("names and marks each indicator for its page", async () => {
    // Arrange & Act
    await mount(carouselHtml({ controls: INDICATORS }));

    // Assert
    expect(indicators().map((i) => i.getAttribute("aria-label"))).toEqual(["Slide 1", "Slide 2", "Slide 3"]);
    expect(indicators().map((i) => i.getAttribute("aria-disabled"))).toEqual(["true", "false", "false"]);
    expect(indicators().map((i) => i.getAttribute("data-state"))).toEqual(["active", "inactive", "inactive"]);
    expect(indicators().every((i) => i.getAttribute("data-carousel-indicator") === "")).toBe(true);
  });

  it("names indicators from the root's indicator-label template", async () => {
    // Arrange & Act
    await mount(carouselHtml({ attrs: 'indicator-label="Diapositive {index}"', controls: INDICATORS }));

    // Assert
    expect(indicators()[1]?.getAttribute("aria-label")).toBe("Diapositive 2");
  });

  it("adds and removes stamped indicators as the page count changes, keeping those already there", async () => {
    // Arrange
    await mount(carouselHtml({ controls: INDICATORS }));
    const first = indicators()[0];

    // Act
    slides()[2]?.remove();
    await settle();

    // Assert
    expect(indicators()).toHaveLength(2);
    expect(indicators()[0]).toBe(first);

    // Act
    slides()[1]?.after(Object.assign(document.createElement("primitiv-carousel-slide"), { textContent: "New" }));
    slides()[1]?.after(Object.assign(document.createElement("primitiv-carousel-slide"), { textContent: "Newer" }));
    await settle();

    // Assert
    expect(indicators()).toHaveLength(4);
  });

  it("decorates indicators written by hand in a group, read-only ones hidden from assistive technology", async () => {
    // Arrange & Act
    await mount(
      carouselHtml({
        attrs: 'page="1"',
        controls:
          '<primitiv-carousel-indicator-group label="Thumbnails">' +
          '<primitiv-carousel-indicator index="0"><button type="button">A</button></primitiv-carousel-indicator>' +
          '<primitiv-carousel-indicator index="1" read-only><span>B</span></primitiv-carousel-indicator>' +
          '<primitiv-carousel-indicator><button type="button">C</button></primitiv-carousel-indicator>' +
          "</primitiv-carousel-indicator-group>",
      }),
    );

    // Assert
    const [a, b, c] = indicators();
    expect(screen.getByRole("group", { name: "Thumbnails" })).toBeDefined();
    expect(a?.getAttribute("aria-label")).toBe("Slide 1");
    expect(b?.getAttribute("aria-hidden")).toBe("true");
    expect(b?.hasAttribute("aria-label")).toBe(false);
    expect(b?.hasAttribute("aria-disabled")).toBe(false);
    expect(b?.getAttribute("data-state")).toBe("active");
    // An indicator with no index points at the first page.
    expect(c?.getAttribute("aria-label")).toBe("Slide 1");
  });

  it("leaves a group's own aria-labelledby alone when it has no label", async () => {
    // Arrange & Act
    await mount(carouselHtml({ controls: '<primitiv-carousel-indicators aria-labelledby="x"></primitiv-carousel-indicators>' }));

    // Assert
    const group = document.querySelector("primitiv-carousel-indicators") as HTMLElement;
    expect(group.hasAttribute("aria-label")).toBe(false);
    expect(group.getAttribute("aria-labelledby")).toBe("x");
  });

  it("writes the progress text, from the root's progress-label template when it has one", async () => {
    // Arrange & Act
    await mount(carouselHtml({ attrs: 'page="1"', controls: "<primitiv-carousel-progress-text></primitiv-carousel-progress-text>" }));
    const progress = document.querySelector("primitiv-carousel-progress-text") as HTMLElement;

    // Assert
    expect(progress.textContent).toBe("2 of 3");

    // Act
    root().setAttribute("progress-label", "Page {page} / {total}");
    await settle();

    // Assert
    expect(progress.textContent).toBe("Page 2 / 3");
  });

  it("names the play control for what it will do, and shows the glyph for the state", async () => {
    // Arrange & Act
    await mount(
      carouselHtml({
        attrs: "autoplay",
        controls:
          '<primitiv-carousel-play-pause-trigger><button type="button"><span data-play-state="paused">▶</span><span data-play-state="playing">❚❚</span></button></primitiv-carousel-play-pause-trigger>',
      }),
    );
    const control = document.querySelector("primitiv-carousel-play-pause-trigger > button") as HTMLElement;
    const [play, pause] = control.querySelectorAll("span");

    // Assert
    expect(control.getAttribute("aria-label")).toBe("Start automatic slide show");
    expect(control.getAttribute("data-state")).toBe("paused");
    expect(play?.hidden).toBe(false);
    expect(pause?.hidden).toBe(true);

    // Act
    root().playing = true;
    root().setAttribute("stop-label", "Arrêter");
    await settle();

    // Assert
    expect(control.getAttribute("aria-label")).toBe("Arrêter");
    expect(control.getAttribute("data-state")).toBe("playing");
    expect(play?.hidden).toBe(true);
    expect(pause?.hidden).toBe(false);
  });

  it("names the play control from start-label", async () => {
    // Arrange & Act
    await mount(
      carouselHtml({
        attrs: 'autoplay start-label="Lancer"',
        controls: '<primitiv-carousel-play-pause-trigger><button type="button"></button></primitiv-carousel-play-pause-trigger>',
      }),
    );

    // Assert
    expect(document.querySelector("primitiv-carousel-play-pause-trigger > button")?.getAttribute("aria-label")).toBe("Lancer");
  });

  it("marks the track an infinite loop translates", async () => {
    // Arrange & Act
    await mount(carouselHtml({ attrs: 'loop="infinite" slides-per-page="2"', track: true }));

    // Assert
    const track = document.querySelector("primitiv-carousel-track") as HTMLElement;
    expect(track.getAttribute("data-carousel-track")).toBe("");
    expect(track.getAttribute("data-slides-per-page")).toBe("2");
  });
});

describe("<primitiv-carousel> misuse", () => {
  let error: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    error = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    error.mockRestore();
  });

  it("reports a trigger without exactly one element child once, and leaves it undecorated", async () => {
    // Arrange & Act
    await mount(carouselHtml({ controls: "<primitiv-carousel-next-trigger>Next</primitiv-carousel-next-trigger>" }));
    root().page = 1;
    await settle();

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0]?.[0]).toContain("<primitiv-carousel-next-trigger> needs exactly one element child");
  });

  it("reports a play control on a carousel without autoplay, and leaves it undecorated", async () => {
    // Arrange & Act
    await mount(
      carouselHtml({ controls: '<primitiv-carousel-play-pause-trigger><button type="button">Play</button></primitiv-carousel-play-pause-trigger>' }),
    );

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0]?.[0]).toContain("needs autoplay on its <primitiv-carousel>");
    expect(button("Play").hasAttribute("aria-label")).toBe(false);
  });

  it("reports a play control or indicator with no element child", async () => {
    // Arrange & Act
    await mount(
      carouselHtml({
        attrs: "autoplay",
        controls:
          "<primitiv-carousel-play-pause-trigger></primitiv-carousel-play-pause-trigger><primitiv-carousel-indicator index=\"0\"></primitiv-carousel-indicator>",
      }),
    );

    // Assert
    expect(error).toHaveBeenCalledTimes(2);
  });

  it("reports an infinite loop with no track to translate", async () => {
    // Arrange & Act
    await mount(carouselHtml({ attrs: 'loop="infinite"' }));

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0]?.[0]).toContain('needs a <primitiv-carousel-track> around its slides');
  });

  it("does not ask for a track when an infinite loop fades instead of sliding", async () => {
    // Arrange & Act
    await mount(carouselHtml({ attrs: 'loop="infinite" transition="fade"' }));

    // Assert
    expect(error).not.toHaveBeenCalled();
  });
});
