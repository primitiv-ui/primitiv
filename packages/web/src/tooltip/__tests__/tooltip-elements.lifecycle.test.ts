import { fireEvent } from "@testing-library/dom";

import { tooltipHtml } from "./tooltip.fixtures";
import { content, mount, root, settle, shown, trigger } from "./mount";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  // Remove the tooltips first (an open one closes its skip window as it
  // leaves), then run that window out, so it never reaches the next test.
  document.body.replaceChildren();
  vi.runAllTimers();
  vi.useRealTimers();
});

describe("<primitiv-tooltip> lifecycle", () => {
  it("adopts a tooltip that arrives after the root, and describes the trigger by it", async () => {
    // Arrange
    await mount(
      `<primitiv-tooltip open><primitiv-tooltip-trigger><button type="button">Save</button></primitiv-tooltip-trigger></primitiv-tooltip>`,
    );

    // Act
    root().insertAdjacentHTML("beforeend", "<primitiv-tooltip-content>Late</primitiv-tooltip-content>");
    await settle();

    // Assert
    expect(shown()).toBe(true);
    expect(trigger().getAttribute("aria-describedby")).toBe(content().id);
  });

  it("listens to a replacement trigger button, and no longer to the old one", async () => {
    // Arrange
    await mount(tooltipHtml());
    const old = trigger();

    // Act
    old.replaceWith(Object.assign(document.createElement("button"), { textContent: "New" }));
    await settle();
    fireEvent.focus(old);
    const afterOld = root().hasAttribute("open");
    fireEvent.focus(trigger());

    // Assert
    expect(afterOld).toBe(false);
    expect(root().hasAttribute("open")).toBe(true);
  });

  it("listens to a replacement tooltip, and no longer to the old one", async () => {
    // Arrange
    await mount(tooltipHtml({ open: true }));
    const old = content();

    // Act
    old.replaceWith(Object.assign(document.createElement("primitiv-tooltip-content"), { textContent: "New" }));
    await settle();
    fireEvent.pointerLeave(old);
    const afterOld = root().hasAttribute("open");
    fireEvent.pointerLeave(content());

    // Assert
    expect(afterOld).toBe(true);
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("cancels a pending hover open and stops responding once removed from the document", async () => {
    // Arrange
    await mount(tooltipHtml());
    const element = root();
    const button = trigger();
    fireEvent.pointerEnter(button);

    // Act
    element.remove();
    vi.advanceTimersByTime(1000);
    fireEvent.focus(button);

    // Assert
    expect(element.hasAttribute("open")).toBe(false);
  });

  it("closes its group's skip window when removed while open, so later tooltips wait their delay", async () => {
    // Arrange
    await mount(tooltipHtml({ id: "a", open: true }) + tooltipHtml({ id: "b" }));
    const b = document.querySelectorAll<HTMLElement>("primitiv-tooltip-trigger > button")[1];
    fireEvent.focus(trigger());

    // Act
    document.getElementById("a")!.remove();
    vi.advanceTimersByTime(300);
    fireEvent.pointerEnter(b);

    // Assert
    expect(document.getElementById("b")!.hasAttribute("open")).toBe(false);
  });

  it("leaves the skip window alone when a closed tooltip is removed", async () => {
    // Arrange
    await mount(tooltipHtml({ id: "a" }) + tooltipHtml({ id: "b" }) + tooltipHtml({ id: "c" }));
    const [a, b] = document.querySelectorAll<HTMLElement>("primitiv-tooltip-trigger > button");
    fireEvent.focus(a);
    fireEvent.blur(a);
    vi.advanceTimersByTime(200);

    // Act: removing closed c must not restart the window a's close opened.
    document.getElementById("c")!.remove();
    vi.advanceTimersByTime(150);
    fireEvent.pointerEnter(b);

    // Assert
    expect(document.getElementById("b")!.hasAttribute("open")).toBe(false);
  });

  it("can be removed with no parts at all", async () => {
    // Arrange
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error);
    window.addEventListener("error", onError);
    await mount("<primitiv-tooltip></primitiv-tooltip>");

    // Act
    root().remove();
    window.removeEventListener("error", onError);

    // Assert
    expect(errors).toEqual([]);
  });

  it("shows an open tooltip once, however often it reconciles", async () => {
    // Arrange
    await mount(tooltipHtml({ open: true }));
    const showPopover = vi.spyOn(content(), "showPopover");
    const hidePopover = vi.spyOn(content(), "hidePopover");

    // Act
    content().insertAdjacentHTML("beforeend", "<span>more</span>");
    await settle();

    // Assert
    expect(showPopover).not.toHaveBeenCalled();
    expect(hidePopover).not.toHaveBeenCalled();
  });

  it("shows its tooltip again when moved while open, announcing nothing", async () => {
    // Arrange
    const seen: boolean[] = [];
    const listening = new AbortController();
    document.addEventListener(
      "primitiv-tooltip-change",
      (event) => seen.push((event as CustomEvent<{ open: boolean }>).detail.open),
      { signal: listening.signal },
    );
    await mount(tooltipHtml({ open: true }) + "<div id='elsewhere'></div>");
    const showPopover = vi.spyOn(content(), "showPopover");

    // Act
    document.getElementById("elsewhere")!.append(root());
    await settle();
    listening.abort();

    // Assert
    expect(showPopover).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([]);
  });
});
