import { fireEvent } from "@testing-library/dom";

import { carouselHtml } from "./carousel.fixtures";
import { mount, root, settle, slides, viewport } from "./mount";

/** Record every autoplay status the root reports. */
function statuses(): Array<{ type: string; page: number; isPlaying: boolean }> {
  const seen: Array<{ type: string; page: number; isPlaying: boolean }> = [];
  root().addEventListener("primitiv-carousel-autoplay-status", (event) => seen.push((event as CustomEvent).detail));
  return seen;
}

/** A pointer event jsdom can dispatch. */
function pointer(type: string, pointerType: string): Event {
  return Object.assign(new MouseEvent(type, { bubbles: true }), { pointerType });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("<primitiv-carousel> autoplay", () => {
  it("advances a page after each delay while playing, reporting the session", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'autoplay autoplay-delay="1000"' }));
    const seen = statuses();

    // Act
    root().playing = true;
    await settle();
    vi.advanceTimersByTime(999);
    await settle();

    // Assert
    expect(root().page).toBe(0);
    expect(seen).toEqual([{ type: "autoplay.start", page: 0, isPlaying: true }]);

    // Act
    vi.advanceTimersByTime(1);
    await settle();
    vi.advanceTimersByTime(1000);
    await settle();

    // Assert — it stops at the last page without a loop.
    expect(root().page).toBe(2);
    expect(seen).toEqual([
      { type: "autoplay.start", page: 0, isPlaying: true },
      { type: "autoplay", page: 0, isPlaying: true },
      { type: "autoplay", page: 1, isPlaying: true },
      { type: "autoplay.stop", page: 2, isPlaying: false },
    ]);
  });

  it("waits four seconds by default, and wraps on while looping", async () => {
    // Arrange
    await mount(carouselHtml({ slides: 2, attrs: 'autoplay playing loop page="1"' }));

    // Act
    vi.advanceTimersByTime(3999);
    await settle();
    const before = root().page;
    vi.advanceTimersByTime(1);
    await settle();

    // Assert
    expect(before).toBe(1);
    expect(root().page).toBe(0);
  });

  it("does nothing while paused, or without autoplay", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: "autoplay" }));
    const seen = statuses();

    // Act
    vi.advanceTimersByTime(10_000);
    root().removeAttribute("autoplay");
    root().playing = true;
    await settle();
    vi.advanceTimersByTime(10_000);
    await settle();

    // Assert
    expect(root().page).toBe(0);
    expect(seen).toEqual([]);
  });

  it("pauses while the pointer is over the carousel", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'autoplay playing autoplay-delay="1000"' }));
    const seen = statuses();

    // Act
    fireEvent.mouseEnter(root());
    vi.advanceTimersByTime(2000);
    await settle();

    // Assert
    expect(root().page).toBe(0);
    expect(seen).toEqual([{ type: "autoplay.stop", page: 0, isPlaying: false }]);

    // Act
    fireEvent.mouseLeave(root());
    vi.advanceTimersByTime(1000);
    await settle();

    // Assert
    expect(root().page).toBe(1);
  });

  it("pauses while focus is inside, through moves between its own parts", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'autoplay playing autoplay-delay="1000"' }));
    const [previous, next] = document.querySelectorAll("button");

    // Act
    fireEvent.focusIn(next as HTMLElement);
    fireEvent.focusOut(next as HTMLElement, { relatedTarget: previous });
    vi.advanceTimersByTime(2000);
    await settle();

    // Assert
    expect(root().page).toBe(0);

    // Act
    fireEvent.focusOut(previous as HTMLElement, { relatedTarget: document.body });
    vi.advanceTimersByTime(1000);
    await settle();

    // Assert
    expect(root().page).toBe(1);

    // Act — focus leaving for nowhere releases the pause too.
    fireEvent.focusIn(viewport());
    fireEvent.focusOut(viewport());
    vi.advanceTimersByTime(1000);
    await settle();

    // Assert
    expect(root().page).toBe(2);
  });

  it("pauses while a touch is down, not for a mouse press", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'autoplay playing autoplay-delay="1000"' }));

    // Act
    root().dispatchEvent(pointer("pointerdown", "mouse"));
    vi.advanceTimersByTime(1000);
    await settle();

    // Assert
    expect(root().page).toBe(1);

    // Act
    root().dispatchEvent(pointer("pointerdown", "touch"));
    vi.advanceTimersByTime(2000);
    await settle();

    // Assert
    expect(root().page).toBe(1);

    // Act
    root().dispatchEvent(pointer("pointerup", "touch"));
    vi.advanceTimersByTime(1000);
    await settle();
    root().dispatchEvent(pointer("pointerdown", "touch"));
    root().dispatchEvent(pointer("pointercancel", "touch"));
    root().setAttribute("loop", "");
    await settle();
    vi.advanceTimersByTime(1000);
    await settle();

    // Assert
    expect(root().page).toBe(0);
  });

  it("keeps playing through hover once the user pressed play, for that session only", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'autoplay autoplay-delay="1000"' }));
    fireEvent.mouseEnter(root());

    // Act
    root().play();
    await settle();
    vi.advanceTimersByTime(1000);
    await settle();

    // Assert
    expect(root().page).toBe(1);

    // Act — a pause ends the session; playing again from outside does not inherit the override.
    root().pause();
    await settle();
    root().playing = true;
    await settle();
    vi.advanceTimersByTime(2000);
    await settle();

    // Assert
    expect(root().page).toBe(1);
  });

  it("restarts the timer for a new page, and stops it when the carousel leaves the page", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'autoplay playing autoplay-delay="1000"' }));

    // Act
    vi.advanceTimersByTime(600);
    root().page = 1;
    await settle();
    vi.advanceTimersByTime(600);
    await settle();

    // Assert
    expect(root().page).toBe(1);

    // Act
    const carousel = root();
    carousel.remove();
    vi.advanceTimersByTime(5000);

    // Assert
    expect(carousel.page).toBe(1);
    expect(slides()).toEqual([]);
  });

  it("stops listening once it has left the page", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'autoplay playing autoplay-delay="1000"' }));
    const carousel = root();
    carousel.remove();

    // Act — anything that would restart the timer, arriving after it left.
    fireEvent.focusOut(carousel);
    carousel.dispatchEvent(pointer("pointerup", "touch"));
    carousel.dispatchEvent(pointer("pointercancel", "touch"));
    vi.advanceTimersByTime(5000);

    // Assert
    expect(carousel.page).toBe(0);
  });

  it("forgets a touch that landed while it was away", async () => {
    // Arrange
    await mount(carouselHtml({ attrs: 'autoplay playing autoplay-delay="1000"' }));
    const carousel = root();
    carousel.remove();
    carousel.dispatchEvent(pointer("pointerdown", "touch"));

    // Act
    document.body.append(carousel);
    await settle();
    vi.advanceTimersByTime(1000);

    // Assert
    expect(carousel.page).toBe(1);
  });
});
