import { fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { popoverHtml } from "./popover.fixtures";
import { close, content, mount, root, settle, shown, trigger } from "./mount";

let listeners = new AbortController();

afterEach(() => {
  document.body.replaceChildren();
  listeners.abort();
  listeners = new AbortController();
});

/** Record every primitiv-popover-change, optionally vetoing it. */
function changes(veto = false) {
  const seen: Array<{ open: boolean; bubbles: boolean; cancelable: boolean }> = [];
  document.addEventListener(
    "primitiv-popover-change",
    (event) => {
      const { detail, bubbles, cancelable } = event as CustomEvent<{ open: boolean }>;
      seen.push({ open: detail.open, bubbles, cancelable });
      if (veto) event.preventDefault();
    },
    { signal: listeners.signal },
  );
  return seen;
}

describe("<primitiv-popover> interaction", () => {
  it("toggles on clicks on the trigger, reflecting it into the open attribute", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(popoverHtml());

    // Act
    await user.click(trigger());
    const afterOpen = [root().hasAttribute("open"), shown()];
    await user.click(trigger());

    // Assert
    expect(afterOpen).toEqual([true, true]);
    expect(root().hasAttribute("open")).toBe(false);
    expect(shown()).toBe(false);
  });

  it("closes on a click on the close button", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(popoverHtml({ open: true }));

    // Act
    await user.click(close());

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("ignores a click inside the panel that is not on the close button", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(popoverHtml({ open: true }));

    // Act
    await user.click(document.querySelector("input")!);

    // Assert
    expect(root().hasAttribute("open")).toBe(true);
  });

  it("reports each change once with a bubbling, cancelable primitiv-popover-change event", async () => {
    // Arrange
    const user = userEvent.setup();
    const seen = changes();
    await mount(popoverHtml());

    // Act
    await user.click(trigger());
    await user.click(close());
    await settle();

    // Assert
    expect(seen).toEqual([
      { open: true, bubbles: true, cancelable: true },
      { open: false, bubbles: true, cancelable: true },
    ]);
  });

  it("stays closed when the change event is cancelled", async () => {
    // Arrange
    const user = userEvent.setup();
    changes(true);
    await mount(popoverHtml());

    // Act
    await user.click(trigger());

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
    expect(shown()).toBe(false);
  });

  it("closes on Escape and hands focus back to the trigger", async () => {
    // Arrange
    await mount(popoverHtml({ open: true }));

    // Act
    fireEvent.keyDown(document.querySelector("input")!, { key: "Escape" });
    await settle();

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
    expect(document.activeElement).toBe(trigger());
  });

  it("closes on a press outside", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(popoverHtml({ open: true }) + `<button id="outside">Outside</button>`);

    // Act
    await user.click(document.getElementById("outside")!);

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("follows the browser light-dismissing the panel", async () => {
    // Arrange
    const seen = changes();
    await mount(popoverHtml({ open: true }));

    // Act
    content().hidePopover();
    await settle();

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
    expect(seen.map(({ open }) => open)).toEqual([false]);
  });

  it("shows the panel again when a light dismiss is vetoed", async () => {
    // Arrange
    changes(true);
    await mount(popoverHtml({ open: true }));

    // Act
    content().hidePopover();
    await settle();

    // Assert
    expect(root().hasAttribute("open")).toBe(true);
    expect(shown()).toBe(true);
  });

  it("follows open set from outside, as an attribute or a property, announcing nothing", async () => {
    // Arrange
    const seen = changes();
    await mount(popoverHtml());

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
});
