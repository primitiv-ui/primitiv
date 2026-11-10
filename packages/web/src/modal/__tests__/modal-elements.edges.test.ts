import { dialog, mount, root, trigger } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("<primitiv-modal> edges", () => {
  it("reports a trigger with no single element child once, and leaves it undecorated", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(
      `<primitiv-modal><primitiv-modal-trigger>Open</primitiv-modal-trigger>` +
        `<primitiv-modal-content><dialog></dialog></primitiv-modal-content></primitiv-modal>`,
    );
    root().setAttribute("open", "");
    await Promise.resolve();

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0]).toBe(
      "<primitiv-modal-trigger> needs exactly one element child (a <button>) to decorate.",
    );
  });

  it("reports content that does not hold exactly one <dialog>, and opens nothing", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(
      `<primitiv-modal open><primitiv-modal-content><div>Not a dialog</div></primitiv-modal-content></primitiv-modal>`,
    );

    // Assert
    expect(error).toHaveBeenCalledWith(
      "<primitiv-modal-content> needs exactly one <dialog> child to decorate.",
      document.querySelector("primitiv-modal-content"),
    );
    expect(document.querySelector("div")!.hasAttribute("id")).toBe(false);
  });

  it("reports content holding two elements", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(
      `<primitiv-modal><primitiv-modal-content><dialog></dialog><dialog></dialog></primitiv-modal-content></primitiv-modal>`,
    );

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(document.querySelector("dialog")!.hasAttribute("id")).toBe(false);
  });

  it("reports a title or description with no single element child", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(
      `<primitiv-modal><primitiv-modal-content><dialog>` +
        `<primitiv-modal-title>Bare</primitiv-modal-title>` +
        `<primitiv-modal-description>Bare</primitiv-modal-description>` +
        `</dialog></primitiv-modal-content></primitiv-modal>`,
    );

    // Assert
    expect(error.mock.calls.map(([message]) => message)).toEqual([
      "<primitiv-modal-title> needs exactly one element child (a heading) to decorate.",
      "<primitiv-modal-description> needs exactly one element child (a <p>) to decorate.",
    ]);
    expect(dialog().hasAttribute("aria-labelledby")).toBe(false);
  });

  it("gives a trigger with no dialog no aria-controls", async () => {
    // Arrange & Act
    await mount(
      `<primitiv-modal><primitiv-modal-trigger><button type="button">Open</button></primitiv-modal-trigger></primitiv-modal>`,
    );

    // Assert
    expect(trigger().hasAttribute("aria-controls")).toBe(false);
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
  });

  it("decorates every trigger, and only the first title", async () => {
    // Arrange & Act
    await mount(
      `<primitiv-modal id="m">` +
        `<primitiv-modal-trigger><button type="button">A</button></primitiv-modal-trigger>` +
        `<primitiv-modal-trigger><button type="button">B</button></primitiv-modal-trigger>` +
        `<primitiv-modal-content><dialog>` +
        `<primitiv-modal-title><h2>One</h2></primitiv-modal-title><primitiv-modal-title><h2>Two</h2></primitiv-modal-title>` +
        `</dialog></primitiv-modal-content></primitiv-modal>`,
    );

    // Assert
    const [a, b] = document.querySelectorAll("button");
    expect(a.getAttribute("aria-controls")).toBe("m-content");
    expect(b.getAttribute("aria-controls")).toBe("m-content");
    const [one, two] = document.querySelectorAll("h2");
    expect(one.id).toBe("m-title");
    expect(two.hasAttribute("id")).toBe(false);
  });
});
