import userEvent from "@testing-library/user-event";

import { content, mount, root, settle, trigger } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("<primitiv-popover> edges", () => {
  it("reports a trigger, anchor, title, description or close without exactly one element child, once each", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(
      `<primitiv-popover><primitiv-popover-trigger>Bare</primitiv-popover-trigger>` +
        `<primitiv-popover-anchor>Bare</primitiv-popover-anchor>` +
        `<primitiv-popover-content><primitiv-popover-title>Bare</primitiv-popover-title>` +
        `<primitiv-popover-description>Bare</primitiv-popover-description>` +
        `<primitiv-popover-close>Bare</primitiv-popover-close></primitiv-popover-content></primitiv-popover>`,
    );
    root().setAttribute("open", "");
    await Promise.resolve();

    // Assert
    expect(error.mock.calls.map(([message]) => message)).toEqual([
      "<primitiv-popover-trigger> needs exactly one element child (a <button>) to decorate.",
      "<primitiv-popover-anchor> needs exactly one element child (the element to anchor to) to decorate.",
      "<primitiv-popover-title> needs exactly one element child (a heading) to decorate.",
      "<primitiv-popover-description> needs exactly one element child (a <p>) to decorate.",
      "<primitiv-popover-close> needs exactly one element child (a <button>) to decorate.",
    ]);
    expect(content().hasAttribute("aria-labelledby")).toBe(false);
  });

  it("gives a trigger with no panel no aria-controls, and toggles safely", async () => {
    // Arrange & Act
    await mount(
      `<primitiv-popover><primitiv-popover-trigger><button type="button">Edit</button></primitiv-popover-trigger></primitiv-popover>`,
    );
    trigger().click();
    await Promise.resolve();

    // Assert
    expect(trigger().hasAttribute("aria-controls")).toBe(false);
    expect(root().hasAttribute("open")).toBe(true);
  });

  it("opens with no trigger, from its open attribute alone, shown with no anchor", async () => {
    // Arrange
    const showPopover = vi.spyOn(HTMLElement.prototype, "showPopover");

    // Act
    await mount(`<primitiv-popover open><primitiv-popover-content>Panel</primitiv-popover-content></primitiv-popover>`);

    // Assert
    expect(showPopover).toHaveBeenCalledWith();
    expect(document.activeElement).toBe(content());
  });

  it("vetoes a trigger with no panel safely", async () => {
    // Arrange
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error);
    window.addEventListener("error", onError);
    const veto = (event: Event) => event.preventDefault();
    document.addEventListener("primitiv-popover-change", veto);
    await mount(
      `<primitiv-popover><primitiv-popover-trigger><button type="button">Edit</button></primitiv-popover-trigger></primitiv-popover>`,
    );

    // Act
    trigger().click();
    await settle();
    document.removeEventListener("primitiv-popover-change", veto);
    window.removeEventListener("error", onError);

    // Assert
    expect(errors).toEqual([]);
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("closes from any of its close buttons, with or without a trigger, past a malformed one", async () => {
    // Arrange
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    await mount(
      `<primitiv-popover open><primitiv-popover-content>` +
        `<primitiv-popover-close>Bare</primitiv-popover-close>` +
        `<primitiv-popover-close><button type="button">X</button></primitiv-popover-close>` +
        `<primitiv-popover-close><button type="button">Y</button></primitiv-popover-close>` +
        `</primitiv-popover-content></primitiv-popover>`,
    );

    // Act
    await user.click(document.querySelectorAll("button")[1]);

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("decorates only the first trigger, panel and title", async () => {
    // Arrange & Act
    await mount(
      `<primitiv-popover id="p">` +
        `<primitiv-popover-trigger><button type="button">A</button></primitiv-popover-trigger>` +
        `<primitiv-popover-trigger><button type="button">B</button></primitiv-popover-trigger>` +
        `<primitiv-popover-content><primitiv-popover-title><h2>One</h2></primitiv-popover-title>` +
        `<primitiv-popover-title><h2>Two</h2></primitiv-popover-title></primitiv-popover-content>` +
        `<primitiv-popover-content>Second</primitiv-popover-content></primitiv-popover>`,
    );

    // Assert
    const [a, b] = document.querySelectorAll("button");
    expect(a.getAttribute("aria-controls")).toBe("p-content");
    expect(b.hasAttribute("aria-controls")).toBe(false);
    const [one, two] = document.querySelectorAll("h2");
    expect(one.id).toBe("p-title");
    expect(two.hasAttribute("id")).toBe(false);
    expect(document.querySelectorAll("primitiv-popover-content")[1].hasAttribute("role")).toBe(false);
  });
});
