import {
  CAROUSEL_LABELS,
  carouselAlignOffset,
  carouselAutoplayRuns,
  carouselBounds,
  carouselClampPage,
  carouselDragOverscroll,
  carouselFormat,
  carouselInViewCutoff,
  carouselKeydown,
  carouselLayout,
  carouselLoopMode,
  carouselPageForSlide,
  carouselPageOffset,
  carouselScrollProgress,
  carouselSlideActive,
  carouselSlideProgress,
  carouselSnapPoints,
  carouselSnapStart,
  carouselStep,
  carouselWheelDelta,
} from "../policy";

describe("carouselLayout", () => {
  it("is one page per slide by default", () => {
    // Arrange & Act & Assert
    expect(carouselLayout(3, 1, "auto")).toEqual({ total: 3, perPage: 1, move: 1, maxOffset: 2, totalPages: 3 });
  });

  it("has no pages without slides, and one when every slide fits a page", () => {
    // Arrange & Act & Assert
    expect(carouselLayout(0, 1, "auto").totalPages).toBe(0);
    expect(carouselLayout(3, 3, "auto").totalPages).toBe(1);
    expect(carouselLayout(2, 3, "auto")).toEqual({ total: 2, perPage: 3, move: 3, maxOffset: 0, totalPages: 1 });
  });

  it("counts an end-aligned last page when the slides are not a whole number of pages", () => {
    // Arrange & Act & Assert — 5 at 3 a page: [0,1,2] then [2,3,4].
    expect(carouselLayout(5, 3, "auto")).toEqual({ total: 5, perPage: 3, move: 3, maxOffset: 2, totalPages: 2 });
    expect(carouselLayout(7, 3, "auto").totalPages).toBe(3);
  });

  it("steps by a numeric move, clamped to a page", () => {
    // Arrange & Act & Assert
    expect(carouselLayout(6, 3, 1)).toMatchObject({ move: 1, maxOffset: 3, totalPages: 4 });
    expect(carouselLayout(6, 3, 5)).toMatchObject({ move: 3, totalPages: 2 });
  });

  it("degrades a nonsensical count to a whole number of at least one", () => {
    // Arrange & Act & Assert
    expect(carouselLayout(4, 0, "auto").perPage).toBe(1);
    expect(carouselLayout(4, 2.7, "auto").perPage).toBe(2);
    expect(carouselLayout(4, Number.NaN, "auto").perPage).toBe(1);
    expect(carouselLayout(4, Number.POSITIVE_INFINITY, "auto").perPage).toBe(1);
    expect(carouselLayout(4, 2, -3).move).toBe(1);
    expect(carouselLayout(4, 2, Number.NaN).move).toBe(1);
  });
});

describe("carouselPageOffset", () => {
  it("is the page's leading slide, end-aligning the last page", () => {
    // Arrange
    const layout = carouselLayout(5, 3, "auto");

    // Act & Assert
    expect(carouselPageOffset(layout, 0)).toBe(0);
    expect(carouselPageOffset(layout, 1)).toBe(2);
  });
});

describe("carouselSnapPoints", () => {
  it("lists every page's leading slide", () => {
    // Arrange & Act & Assert
    expect(carouselSnapPoints(carouselLayout(7, 3, "auto"))).toEqual([0, 3, 4]);
    expect(carouselSnapPoints(carouselLayout(0, 1, "auto"))).toEqual([]);
  });
});

describe("carouselPageForSlide", () => {
  it("is the page whose leading slide is nearest, ties going to the earlier page", () => {
    // Arrange
    const layout = carouselLayout(7, 3, "auto"); // offsets 0, 3, 4

    // Act & Assert
    expect(carouselPageForSlide(layout, 0)).toBe(0);
    expect(carouselPageForSlide(layout, 1)).toBe(0);
    expect(carouselPageForSlide(layout, 2)).toBe(1);
    expect(carouselPageForSlide(layout, 3)).toBe(1);
    expect(carouselPageForSlide(layout, 4)).toBe(2);
    expect(carouselPageForSlide(layout, 6)).toBe(2);
  });

  it("breaks an exact tie toward the earlier page", () => {
    // Arrange — 5 at 2 a page: offsets 0, 2, 3; slide 1 is one from both 0 and 2.
    const layout = carouselLayout(5, 2, "auto");

    // Act & Assert
    expect(carouselPageForSlide(layout, 1)).toBe(0);
  });

  it("is the first page without slides", () => {
    // Arrange & Act & Assert
    expect(carouselPageForSlide(carouselLayout(0, 1, "auto"), 3)).toBe(0);
  });
});

describe("carouselSlideActive", () => {
  it("is every slide in the window the page shows", () => {
    // Arrange
    const layout = carouselLayout(5, 3, "auto");

    // Act & Assert — page 1 shows [2, 3, 4].
    expect([0, 1, 2, 3, 4].map((index) => carouselSlideActive(layout, 1, index))).toEqual([false, false, true, true, true]);
    expect([0, 1, 2, 3].map((index) => carouselSlideActive(layout, 0, index))).toEqual([true, true, true, false]);
  });

  it("is never a slide that has not registered", () => {
    // Arrange & Act & Assert
    expect(carouselSlideActive(carouselLayout(3, 1, "auto"), 0, -1)).toBe(false);
  });
});

describe("carouselSnapStart", () => {
  it("is a page's leading slide only", () => {
    // Arrange
    const layout = carouselLayout(7, 3, "auto"); // offsets 0, 3, 4

    // Act & Assert
    expect([0, 1, 2, 3, 4, 5, 6].map((index) => carouselSnapStart(layout, index))).toEqual([
      true,
      false,
      false,
      true,
      true,
      false,
      false,
    ]);
  });

  it("is never a slide that has not registered", () => {
    // Arrange & Act & Assert
    expect(carouselSnapStart(carouselLayout(3, 1, "auto"), -1)).toBe(false);
  });
});

describe("carouselLoopMode", () => {
  it("reads true and the empty attribute as wrap", () => {
    // Arrange & Act & Assert
    expect(carouselLoopMode(true)).toBe("wrap");
    expect(carouselLoopMode("")).toBe("wrap");
    expect(carouselLoopMode("wrap")).toBe("wrap");
  });

  it("reads infinite as itself", () => {
    // Arrange & Act & Assert
    expect(carouselLoopMode("infinite")).toBe("infinite");
  });

  it("reads anything else as no loop", () => {
    // Arrange & Act & Assert
    expect(carouselLoopMode(false)).toBe("none");
    expect(carouselLoopMode(undefined)).toBe("none");
    expect(carouselLoopMode(null)).toBe("none");
    expect(carouselLoopMode("none")).toBe("none");
  });
});

describe("carouselClampPage", () => {
  it("holds a page within the pages that exist", () => {
    // Arrange & Act & Assert
    expect(carouselClampPage(5, 3)).toBe(2);
    expect(carouselClampPage(-1, 3)).toBe(0);
    expect(carouselClampPage(1, 3)).toBe(1);
  });

  it("leaves the page alone while there are no pages", () => {
    // Arrange & Act & Assert
    expect(carouselClampPage(4, 0)).toBe(4);
  });
});

describe("carouselBounds", () => {
  it("clamps at the ends without a loop", () => {
    // Arrange & Act & Assert
    expect(carouselBounds({ page: 0, totalPages: 3, loop: "none" })).toEqual({ previous: false, next: true });
    expect(carouselBounds({ page: 2, totalPages: 3, loop: "none" })).toEqual({ previous: true, next: false });
    expect(carouselBounds({ page: 0, totalPages: 0, loop: "none" })).toEqual({ previous: false, next: false });
  });

  it("goes nowhere before any slide has registered, whatever the page", () => {
    // Arrange & Act & Assert — a server render, or a controlled page ahead of its slides.
    expect(carouselBounds({ page: 2, totalPages: 0, loop: "none" })).toEqual({ previous: false, next: false });
  });

  it("goes both ways while looping, given a second page to wrap to", () => {
    // Arrange & Act & Assert
    expect(carouselBounds({ page: 0, totalPages: 2, loop: "wrap" })).toEqual({ previous: true, next: true });
    expect(carouselBounds({ page: 0, totalPages: 1, loop: "infinite" })).toEqual({ previous: false, next: false });
  });
});

describe("carouselStep", () => {
  it("moves one page, or nowhere at an end without a loop", () => {
    // Arrange & Act & Assert
    expect(carouselStep({ page: 0, totalPages: 3, loop: "none" }, 1)).toBe(1);
    expect(carouselStep({ page: 2, totalPages: 3, loop: "none" }, 1)).toBeNull();
    expect(carouselStep({ page: 2, totalPages: 3, loop: "none" }, -1)).toBe(1);
    expect(carouselStep({ page: 1, totalPages: 3, loop: "none" }, -1)).toBe(0);
    expect(carouselStep({ page: 0, totalPages: 3, loop: "none" }, -1)).toBeNull();
  });

  it("wraps past either end while looping", () => {
    // Arrange & Act & Assert
    expect(carouselStep({ page: 2, totalPages: 3, loop: "wrap" }, 1)).toBe(0);
    expect(carouselStep({ page: 0, totalPages: 3, loop: "infinite" }, -1)).toBe(2);
  });

  it("goes nowhere while looping with a single page", () => {
    // Arrange & Act & Assert
    expect(carouselStep({ page: 0, totalPages: 1, loop: "wrap" }, 1)).toBeNull();
    expect(carouselStep({ page: 0, totalPages: 1, loop: "wrap" }, -1)).toBeNull();
  });
});

describe("carouselKeydown", () => {
  it("pages with the horizontal arrows when horizontal", () => {
    // Arrange & Act & Assert
    expect(carouselKeydown("horizontal", "ArrowRight")).toBe("next");
    expect(carouselKeydown("horizontal", "ArrowLeft")).toBe("previous");
    expect(carouselKeydown("horizontal", "ArrowDown")).toBeNull();
  });

  it("pages with the vertical arrows when vertical", () => {
    // Arrange & Act & Assert
    expect(carouselKeydown("vertical", "ArrowDown")).toBe("next");
    expect(carouselKeydown("vertical", "ArrowUp")).toBe("previous");
    expect(carouselKeydown("vertical", "ArrowRight")).toBeNull();
  });

  it("jumps to the ends with Home and End on either axis", () => {
    // Arrange & Act & Assert
    expect(carouselKeydown("horizontal", "Home")).toBe("first");
    expect(carouselKeydown("vertical", "End")).toBe("last");
    expect(carouselKeydown("horizontal", "Enter")).toBeNull();
  });
});

describe("carouselAutoplayRuns", () => {
  const runs = { enabled: true, playing: true, canGoNext: true, suspended: false };

  it("runs while enabled, playing, able to advance and not suspended", () => {
    // Arrange & Act & Assert
    expect(carouselAutoplayRuns(runs)).toBe(true);
  });

  it("stops when any of them is not so", () => {
    // Arrange & Act & Assert
    expect(carouselAutoplayRuns({ ...runs, enabled: false })).toBe(false);
    expect(carouselAutoplayRuns({ ...runs, playing: false })).toBe(false);
    expect(carouselAutoplayRuns({ ...runs, canGoNext: false })).toBe(false);
    expect(carouselAutoplayRuns({ ...runs, suspended: true })).toBe(false);
  });
});

describe("carouselAlignOffset", () => {
  it("is how far a page sits in from the viewport's start for its alignment", () => {
    // Arrange & Act & Assert
    expect(carouselAlignOffset("start", 200)).toBe(0);
    expect(carouselAlignOffset("center", 200)).toBe(100);
    expect(carouselAlignOffset("end", 200)).toBe(200);
  });
});

describe("carouselScrollProgress", () => {
  it("is the distance travelled over the distance there is, in either direction", () => {
    // Arrange & Act & Assert
    expect(carouselScrollProgress(50, 200)).toBe(0.25);
    expect(carouselScrollProgress(-50, 200)).toBe(0.25);
  });

  it("clamps an overshoot, and is 0 with nowhere to scroll", () => {
    // Arrange & Act & Assert
    expect(carouselScrollProgress(300, 200)).toBe(1);
    expect(carouselScrollProgress(20, 0)).toBe(0);
  });
});

describe("carouselSlideProgress", () => {
  it("is the slide centre's distance from the viewport centre, in half-viewports", () => {
    // Arrange & Act & Assert
    expect(carouselSlideProgress(150, 100, 100)).toBe(0.5);
    expect(carouselSlideProgress(50, 100, 100)).toBe(-0.5);
  });

  it("clamps to −1..1, and is 0 for a viewport with no size", () => {
    // Arrange & Act & Assert
    expect(carouselSlideProgress(400, 100, 100)).toBe(1);
    expect(carouselSlideProgress(-400, 100, 100)).toBe(-1);
    expect(carouselSlideProgress(400, 100, 0)).toBe(0);
  });
});

describe("carouselDragOverscroll", () => {
  it("is the edge a drag pushes past with nowhere further to go", () => {
    // Arrange & Act & Assert — a positive delta drags toward the start.
    expect(carouselDragOverscroll(10, { previous: false, next: true })).toBe("start");
    expect(carouselDragOverscroll(-10, { previous: true, next: false })).toBe("end");
  });

  it("is no edge while the drag has somewhere to go, or is still", () => {
    // Arrange & Act & Assert
    expect(carouselDragOverscroll(10, { previous: true, next: false })).toBeNull();
    expect(carouselDragOverscroll(-10, { previous: false, next: true })).toBeNull();
    expect(carouselDragOverscroll(0, { previous: false, next: false })).toBeNull();
  });
});

describe("carouselWheelDelta", () => {
  it("passes a vertical pixel delta through", () => {
    // Arrange & Act & Assert
    expect(carouselWheelDelta({ deltaX: 0, deltaY: 30, deltaMode: 0 }, 400)).toBe(30);
  });

  it("converts lines and pages to pixels", () => {
    // Arrange & Act & Assert
    expect(carouselWheelDelta({ deltaX: 0, deltaY: 3, deltaMode: 1 }, 400)).toBe(48);
    expect(carouselWheelDelta({ deltaX: 0, deltaY: 1, deltaMode: 2 }, 400)).toBe(400);
  });

  it("stands down for a real horizontal swipe", () => {
    // Arrange & Act & Assert
    expect(carouselWheelDelta({ deltaX: 0.6, deltaY: 30, deltaMode: 0 }, 400)).toBeNull();
    expect(carouselWheelDelta({ deltaX: -0.6, deltaY: 30, deltaMode: 0 }, 400)).toBeNull();
    expect(carouselWheelDelta({ deltaX: 0.5, deltaY: 30, deltaMode: 0 }, 400)).toBe(30);
  });
});

describe("carouselInViewCutoff", () => {
  it("is a single threshold, or the highest of several", () => {
    // Arrange & Act & Assert
    expect(carouselInViewCutoff(0.3)).toBe(0.3);
    expect(carouselInViewCutoff([0.2, 0.8, 0.5])).toBe(0.8);
  });
});

describe("CAROUSEL_LABELS", () => {
  it("names slides, indicators, the play control and progress in English", () => {
    // Arrange & Act & Assert
    expect(CAROUSEL_LABELS.slideLabel({ index: 1, total: 3 })).toBe("1 of 3");
    expect(CAROUSEL_LABELS.indicatorLabel({ index: 2 })).toBe("Slide 2");
    expect(CAROUSEL_LABELS.startSlideshow).toBe("Start automatic slide show");
    expect(CAROUSEL_LABELS.stopSlideshow).toBe("Stop automatic slide show");
    expect(CAROUSEL_LABELS.progressText({ page: 0, totalPages: 4 })).toBe("1 of 4");
  });
});

describe("carouselFormat", () => {
  it("fills every {name} in a template from the values", () => {
    // Arrange & Act & Assert
    expect(carouselFormat("{index} sur {total}", { index: 2, total: 5 })).toBe("2 sur 5");
    expect(carouselFormat("{index}/{index}", { index: 1 })).toBe("1/1");
  });

  it("leaves a name it has no value for as written", () => {
    // Arrange & Act & Assert
    expect(carouselFormat("Slide {n}", { index: 1 })).toBe("Slide {n}");
  });
});
