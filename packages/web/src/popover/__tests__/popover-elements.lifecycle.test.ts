import userEvent from "@testing-library/user-event";

import { popoverHtml } from "./popover.fixtures";
import { content, mount, root, settle, shown, trigger } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
});

describe("<primitiv-popover> lifecycle", () => {
  it("picks up a title added after it rendered, and drops it once it leaves", async () => {
    // Arrange
    await mount(popoverHtml({ id: "pp", noTitle: true }));

    // Act
    content().insertAdjacentHTML("afterbegin", "<primitiv-popover-title><h2>Late</h2></primitiv-popover-title>");
    await settle();
    const named = content().getAttribute("aria-labelledby");
    document.querySelector("primitiv-popover-title")!.remove();
    await settle();

    // Assert
    expect(named).toBe("pp-title");
    expect(content().hasAttribute("aria-labelledby")).toBe(false);
  });

  it("adopts a panel that arrives after the root, and opens it", async () => {
    // Arrange
    await mount(
      `<primitiv-popover open><primitiv-popover-trigger><button type="button">Edit</button></primitiv-popover-trigger></primitiv-popover>`,
    );

    // Act
    root().insertAdjacentHTML("beforeend", "<primitiv-popover-content>Late</primitiv-popover-content>");
    await settle();

    // Assert
    expect(shown()).toBe(true);
    expect(trigger().getAttribute("aria-controls")).toBe(content().id);
  });

  it("listens to a replacement panel, and no longer to the old one", async () => {
    // Arrange
    await mount(popoverHtml({ open: true }));
    const old = content();

    // Act
    old.replaceWith(Object.assign(document.createElement("primitiv-popover-content"), { textContent: "New" }));
    await settle();
    old.dispatchEvent(Object.assign(new Event("toggle"), { newState: "closed" }));
    await settle();
    const afterOld = root().hasAttribute("open");
    content().dispatchEvent(Object.assign(new Event("toggle"), { newState: "closed" }));
    await settle();

    // Assert
    expect(afterOld).toBe(true);
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("forgets its panel once it leaves", async () => {
    // Arrange
    await mount(popoverHtml({ open: true }));
    const old = content();

    // Act
    old.remove();
    await settle();
    old.dispatchEvent(Object.assign(new Event("toggle"), { newState: "closed" }));
    await settle();

    // Assert
    expect(root().hasAttribute("open")).toBe(true);
    expect(trigger().hasAttribute("aria-controls")).toBe(false);
  });

  it("stops responding once removed from the document", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(popoverHtml());
    const element = root();
    const button = trigger();

    // Act
    element.remove();
    await user.click(button);

    // Assert
    expect(element.hasAttribute("open")).toBe(false);
  });

  it("shows its panel again when moved while open, announcing nothing", async () => {
    // Arrange
    const seen: boolean[] = [];
    const listening = new AbortController();
    document.addEventListener(
      "primitiv-popover-change",
      (event) => seen.push((event as CustomEvent<{ open: boolean }>).detail.open),
      { signal: listening.signal },
    );
    await mount(popoverHtml({ open: true }) + "<div id='elsewhere'></div>");
    const showPopover = vi.spyOn(content(), "showPopover");

    // Act
    document.getElementById("elsewhere")!.append(root());
    await settle();
    listening.abort();

    // Assert
    expect(showPopover).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([]);
    expect(root().hasAttribute("open")).toBe(true);
  });

  it("keeps a popover nested in a panel independent of its parent", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(popoverHtml({ id: "outer", open: true }));
    content().insertAdjacentHTML("beforeend", popoverHtml({ id: "inner" }));
    await settle();
    const inner = document.getElementById("inner")!;

    // Act
    await user.click(inner.querySelector("primitiv-popover-trigger > button")!);
    await user.click(inner.querySelector("primitiv-popover-close > button")!);
    await settle();

    // Assert
    expect(document.getElementById("outer")!.hasAttribute("open")).toBe(true);
    expect(inner.hasAttribute("open")).toBe(false);
    expect(content().getAttribute("aria-labelledby")).toBe("outer-title");
    expect(inner.querySelector("primitiv-popover-content")!.getAttribute("aria-labelledby")).toBe("inner-title");
  });
});
