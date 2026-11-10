import { fireEvent } from "@testing-library/dom";

import { content, mount, root, settle, trigger } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("<primitiv-tooltip> edges", () => {
  it("reports a trigger without exactly one element child once, and leaves it undecorated", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(
      `<primitiv-tooltip><primitiv-tooltip-trigger>Bare</primitiv-tooltip-trigger>` +
        `<primitiv-tooltip-content>Tip</primitiv-tooltip-content></primitiv-tooltip>`,
    );
    root().setAttribute("open", "");
    await settle();

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0]).toBe(
      "<primitiv-tooltip-trigger> needs exactly one element child (a <button>) to decorate.",
    );
  });

  it("opens with no trigger, from its open attribute alone, shown with no anchor", async () => {
    // Arrange
    const showPopover = vi.spyOn(HTMLElement.prototype, "showPopover");

    // Act
    await mount(`<primitiv-tooltip open><primitiv-tooltip-content>Tip</primitiv-tooltip-content></primitiv-tooltip>`);

    // Assert
    expect(showPopover).toHaveBeenCalledWith();
  });

  it("gives a trigger with no tooltip no aria-describedby, and opens safely", async () => {
    // Arrange & Act
    await mount(
      `<primitiv-tooltip><primitiv-tooltip-trigger><button type="button">Save</button></primitiv-tooltip-trigger></primitiv-tooltip>`,
    );
    fireEvent.focus(trigger());
    await settle();

    // Assert
    expect(trigger().hasAttribute("aria-describedby")).toBe(false);
    expect(root().hasAttribute("open")).toBe(true);
  });

  it("decorates only the first trigger and tooltip", async () => {
    // Arrange & Act
    await mount(
      `<primitiv-tooltip id="t">` +
        `<primitiv-tooltip-trigger><button type="button">A</button></primitiv-tooltip-trigger>` +
        `<primitiv-tooltip-trigger><button type="button">B</button></primitiv-tooltip-trigger>` +
        `<primitiv-tooltip-content>One</primitiv-tooltip-content><primitiv-tooltip-content>Two</primitiv-tooltip-content>` +
        `</primitiv-tooltip>`,
    );

    // Assert
    const [a, b] = document.querySelectorAll("button");
    expect(a.getAttribute("aria-describedby")).toBe("t-content");
    expect(b.hasAttribute("aria-describedby")).toBe(false);
    expect(document.querySelectorAll("primitiv-tooltip-content")[1].hasAttribute("role")).toBe(false);
    expect(content().id).toBe("t-content");
  });
});
