import { fireEvent } from "@testing-library/dom";

import { tooltipHtml } from "./tooltip.fixtures";
import { content, mount, root, settle, shown, trigger } from "./mount";

let listeners = new AbortController();

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  // Remove the tooltips first (an open one closes its skip window as it
  // leaves), then run that window out, so it never reaches the next test.
  document.body.replaceChildren();
  vi.runAllTimers();
  vi.useRealTimers();
  listeners.abort();
  listeners = new AbortController();
});

/** Record every primitiv-tooltip-change, optionally vetoing it. */
function changes(veto = false) {
  const seen: Array<{ open: boolean; bubbles: boolean; cancelable: boolean }> = [];
  document.addEventListener(
    "primitiv-tooltip-change",
    (event) => {
      const { detail, bubbles, cancelable } = event as CustomEvent<{ open: boolean }>;
      seen.push({ open: detail.open, bubbles, cancelable });
      if (veto) event.preventDefault();
    },
    { signal: listeners.signal },
  );
  return seen;
}

describe("<primitiv-tooltip> interaction", () => {
  it("opens after the 700ms default delay on hover", async () => {
    // Arrange
    await mount(tooltipHtml());

    // Act
    fireEvent.pointerEnter(trigger());
    vi.advanceTimersByTime(699);
    await settle();
    const early = shown();
    vi.advanceTimersByTime(1);
    await settle();

    // Assert
    expect(early).toBe(false);
    expect(root().hasAttribute("open")).toBe(true);
    expect(shown()).toBe(true);
  });

  it("reads its delay from delay-duration", async () => {
    // Arrange
    await mount(tooltipHtml({ attrs: ' delay-duration="200"' }));

    // Act
    fireEvent.pointerEnter(trigger());
    vi.advanceTimersByTime(200);

    // Assert
    expect(root().hasAttribute("open")).toBe(true);
  });

  it("falls back to the default delay for a delay-duration that is not a number", async () => {
    // Arrange
    await mount(tooltipHtml({ attrs: ' delay-duration="soon"' }));

    // Act
    fireEvent.pointerEnter(trigger());
    vi.advanceTimersByTime(699);
    const early = root().hasAttribute("open");
    vi.advanceTimersByTime(1);

    // Assert
    expect(early).toBe(false);
    expect(root().hasAttribute("open")).toBe(true);
  });

  it("closes after the grace period once the pointer leaves, unless it reaches the tooltip", async () => {
    // Arrange
    await mount(tooltipHtml({ open: true }));

    // Act
    fireEvent.pointerLeave(trigger());
    fireEvent.pointerEnter(content());
    vi.advanceTimersByTime(500);
    const held = root().hasAttribute("open");
    fireEvent.pointerLeave(content());
    await settle();

    // Assert
    expect(held).toBe(true);
    expect(root().hasAttribute("open")).toBe(false);
    expect(shown()).toBe(false);
  });

  it("closes at once on leaving the trigger with disable-hoverable-content", async () => {
    // Arrange
    await mount(tooltipHtml({ open: true, attrs: " disable-hoverable-content" }));

    // Act
    fireEvent.pointerLeave(trigger());

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("opens at once on focus and closes on blur", async () => {
    // Arrange
    await mount(tooltipHtml());

    // Act
    fireEvent.focus(trigger());
    const afterFocus = root().hasAttribute("open");
    fireEvent.blur(trigger());

    // Assert
    expect(afterFocus).toBe(true);
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("closes on Escape, on the trigger or anywhere else", async () => {
    // Arrange
    await mount(tooltipHtml({ open: true }) + tooltipHtml({ id: "other", open: true }));
    const [first] = document.querySelectorAll("primitiv-tooltip");

    // Act
    fireEvent.keyDown(trigger(), { key: "Escape" });
    await settle();

    // Assert
    expect(first.hasAttribute("open")).toBe(false);
    expect(document.getElementById("other")!.hasAttribute("open")).toBe(false);
  });

  it("closes on a press outside, and not on one on the tooltip", async () => {
    // Arrange
    await mount(tooltipHtml({ open: true }));

    // Act
    fireEvent.pointerDown(content());
    const afterInside = root().hasAttribute("open");
    fireEvent.pointerDown(document.body);

    // Assert
    expect(afterInside).toBe(true);
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("reports each change once with a bubbling, cancelable primitiv-tooltip-change event, however often it closes", async () => {
    // Arrange
    const seen = changes();
    await mount(tooltipHtml());

    // Act
    fireEvent.focus(trigger());
    await settle();
    fireEvent.keyDown(trigger(), { key: "Escape" });
    await settle();
    fireEvent.blur(trigger());

    // Assert
    expect(seen).toEqual([
      { open: true, bubbles: true, cancelable: true },
      { open: false, bubbles: true, cancelable: true },
    ]);
  });

  it("stays closed when the change event is cancelled", async () => {
    // Arrange
    changes(true);
    await mount(tooltipHtml());

    // Act
    fireEvent.focus(trigger());
    await settle();

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
    expect(shown()).toBe(false);
  });

  it("follows open set from outside, as an attribute or a property, announcing nothing", async () => {
    // Arrange
    const seen = changes();
    await mount(tooltipHtml());

    // Act
    root().setAttribute("open", "");
    await settle();
    const afterAttribute = shown();
    root().open = false;
    await settle();

    // Assert
    expect(afterAttribute).toBe(true);
    expect(root().open).toBe(false);
    expect(shown()).toBe(false);
    expect(seen).toEqual([]);
  });

  it("opens the next tooltip at once while the first has only just closed", async () => {
    // Arrange
    await mount(tooltipHtml({ id: "a" }) + tooltipHtml({ id: "b" }));
    const [a, b] = document.querySelectorAll<HTMLElement>("primitiv-tooltip-trigger > button");

    // Act
    fireEvent.focus(a);
    fireEvent.blur(a);
    vi.advanceTimersByTime(100);
    fireEvent.pointerEnter(b);

    // Assert
    expect(document.getElementById("b")!.hasAttribute("open")).toBe(true);
  });

  it("waits again once the skip window has passed", async () => {
    // Arrange
    await mount(tooltipHtml({ id: "a" }) + tooltipHtml({ id: "b" }));
    const [a, b] = document.querySelectorAll<HTMLElement>("primitiv-tooltip-trigger > button");

    // Act
    fireEvent.focus(a);
    fireEvent.blur(a);
    vi.advanceTimersByTime(300);
    fireEvent.pointerEnter(b);

    // Assert
    expect(document.getElementById("b")!.hasAttribute("open")).toBe(false);
  });

  it("shares a skip window only within its provider, which sets the delays", async () => {
    // Arrange
    await mount(
      `<primitiv-tooltip-provider delay-duration="50" skip-delay-duration="1000">` +
        tooltipHtml({ id: "a" }) +
        tooltipHtml({ id: "b" }) +
        `</primitiv-tooltip-provider>` +
        tooltipHtml({ id: "c" }),
    );
    const [a, b, c] = document.querySelectorAll<HTMLElement>("primitiv-tooltip-trigger > button");

    // Act
    fireEvent.focus(a);
    fireEvent.blur(a);
    vi.advanceTimersByTime(500);
    fireEvent.pointerEnter(b);
    const bAtOnce = document.getElementById("b")!.hasAttribute("open");
    fireEvent.pointerEnter(c);
    const cEarly = document.getElementById("c")!.hasAttribute("open");
    vi.advanceTimersByTime(700);

    // Assert
    expect(bAtOnce).toBe(true);
    expect(cEarly).toBe(false);
    expect(document.getElementById("c")!.hasAttribute("open")).toBe(true);
  });

  it("takes its delay from the provider, and its own delay-duration over it", async () => {
    // Arrange
    await mount(
      `<primitiv-tooltip-provider delay-duration="50">` +
        tooltipHtml({ id: "a" }) +
        tooltipHtml({ id: "b", attrs: ' delay-duration="400"' }) +
        `</primitiv-tooltip-provider>`,
    );
    const [a, b] = document.querySelectorAll<HTMLElement>("primitiv-tooltip-trigger > button");

    // Act
    fireEvent.pointerEnter(a);
    fireEvent.pointerEnter(b);
    vi.advanceTimersByTime(50);
    const after50 = [document.getElementById("a")!.hasAttribute("open"), document.getElementById("b")!.hasAttribute("open")];

    // Assert
    expect(after50).toEqual([true, false]);
  });

  it("falls back to the default skip delay for a provider skip-delay-duration that is not a number", async () => {
    // Arrange
    await mount(
      `<primitiv-tooltip-provider skip-delay-duration="x">` +
        tooltipHtml({ id: "a" }) +
        tooltipHtml({ id: "b" }) +
        `</primitiv-tooltip-provider>`,
    );
    const [a, b] = document.querySelectorAll<HTMLElement>("primitiv-tooltip-trigger > button");

    // Act
    fireEvent.focus(a);
    fireEvent.blur(a);
    vi.advanceTimersByTime(299);
    fireEvent.pointerEnter(b);

    // Assert
    expect(document.getElementById("b")!.hasAttribute("open")).toBe(true);
  });
});
