import { navigationMenuHtml } from "./navigation-menu.fixtures";
import { button, mount, panel, root, settle } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

const menu = (inner: string) => `<primitiv-navigation-menu>${inner}</primitiv-navigation-menu>`;

describe("<primitiv-navigation-menu> edge cases", () => {
  it.each([
    [
      "a trigger in an item with no value",
      '<primitiv-navigation-menu-item><primitiv-navigation-menu-trigger><button>Docs</button></primitiv-navigation-menu-trigger></primitiv-navigation-menu-item>',
      "<primitiv-navigation-menu-trigger> needs a <primitiv-navigation-menu-item> with a value: an item without one is a plain link entry.",
    ],
    [
      "a trigger outside any item",
      "<primitiv-navigation-menu-trigger><button>Docs</button></primitiv-navigation-menu-trigger>",
      "<primitiv-navigation-menu-trigger> needs a <primitiv-navigation-menu-item> with a value: an item without one is a plain link entry.",
    ],
    [
      "a trigger with two children",
      '<primitiv-navigation-menu-item value="docs"><primitiv-navigation-menu-trigger><button>Docs</button><span>x</span></primitiv-navigation-menu-trigger></primitiv-navigation-menu-item>',
      "<primitiv-navigation-menu-trigger> needs exactly one element child (a <button>) to decorate.",
    ],
  ])("reports %s once and leaves it undecorated", async (_case, inner, message) => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(menu(inner));
    root().setAttribute("value", "docs");
    await settle();

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(message, expect.any(HTMLElement));
    expect(button("Docs").hasAttribute("aria-expanded")).toBe(false);
  });

  it("reports a panel with no value of its own or its item's", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(menu("<primitiv-navigation-menu-viewport><primitiv-navigation-menu-content>Lost</primitiv-navigation-menu-content></primitiv-navigation-menu-viewport>"));

    // Assert
    expect(error).toHaveBeenCalledWith(
      "<primitiv-navigation-menu-content> needs a value, its own or its <primitiv-navigation-menu-item>'s, naming the entry it belongs to.",
      expect.any(HTMLElement),
    );
    expect(document.querySelector("primitiv-navigation-menu-content")?.hasAttribute("data-state")).toBe(false);
  });

  it("reports a link with no anchor to decorate", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(menu("<primitiv-navigation-menu-item><primitiv-navigation-menu-link active>Pricing</primitiv-navigation-menu-link></primitiv-navigation-menu-item>"));

    // Assert
    expect(error).toHaveBeenCalledWith(
      "<primitiv-navigation-menu-link> needs exactly one element child (an <a href>) to decorate.",
      expect.any(HTMLElement),
    );
  });

  it("opens a panel whose entry has no trigger", async () => {
    // Arrange & Act
    await mount(menu('<primitiv-navigation-menu-item value="docs"><primitiv-navigation-menu-content hidden>Panel</primitiv-navigation-menu-content></primitiv-navigation-menu-item>'));
    root().setAttribute("value", "docs");
    await settle();

    // Assert
    expect(panel("docs").hidden).toBe(false);
  });

  it("opens nothing for a value no entry has, and publishes no indicator geometry", async () => {
    // Arrange & Act
    await mount(navigationMenuHtml({ value: "faq", indicator: true }));

    // Assert
    expect(panel("docs").hidden).toBe(true);
    const indicator = document.querySelector<HTMLElement>("primitiv-navigation-menu-indicator") as HTMLElement;
    expect(indicator.hidden).toBe(false);
    expect(indicator.style.getPropertyValue("--primitiv-navigation-menu-indicator-size")).toBe("");
  });

  it("gives a panel's own value precedence over its item's", async () => {
    // Arrange & Act
    await mount(
      menu(
        '<primitiv-navigation-menu-item value="docs"><primitiv-navigation-menu-trigger><button>Docs</button></primitiv-navigation-menu-trigger>' +
          '<primitiv-navigation-menu-content value="blog">Blog panel</primitiv-navigation-menu-content></primitiv-navigation-menu-item>',
      ),
    );

    // Assert
    expect(button("Docs").hasAttribute("aria-controls")).toBe(false);
  });
});
