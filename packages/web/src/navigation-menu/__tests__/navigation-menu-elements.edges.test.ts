import userEvent from "@testing-library/user-event";

import { navigationMenuHtml } from "./navigation-menu.fixtures";
import { button, mount, panel, root, settle, listenerErrors } from "./mount";

afterEach(() => {
  expect(listenerErrors.splice(0)).toEqual([]);
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

const menu = (inner: string) => `<primitiv-navigation-menu>${inner}</primitiv-navigation-menu>`;

describe("<primitiv-navigation-menu> edge cases", () => {
  it.each([
    [
      "a trigger in an item with no value",
      '<primitiv-navigation-menu-item><primitiv-navigation-menu-trigger><button>Docs</button></primitiv-navigation-menu-trigger></primitiv-navigation-menu-item>',
      "<primitiv-navigation-menu-trigger> needs a value.",
    ],
    [
      "a trigger outside any item",
      "<primitiv-navigation-menu-trigger><button>Docs</button></primitiv-navigation-menu-trigger>",
      "<primitiv-navigation-menu-trigger> needs a value.",
    ],
    [
      "a trigger with two children",
      '<primitiv-navigation-menu-item value="docs"><primitiv-navigation-menu-trigger><button>Docs</button><span>x</span></primitiv-navigation-menu-trigger></primitiv-navigation-menu-item>',
      "<primitiv-navigation-menu-trigger> needs one <button> child.",
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
      "<primitiv-navigation-menu-content> needs a value.",
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
      "<primitiv-navigation-menu-link> needs one <a> child.",
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

  it("works around a panel-only entry, clicking and travelling the rest", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ openOnHover: false, viewport: true }).replace(
      '<primitiv-navigation-menu-item value="docs"><primitiv-navigation-menu-trigger><button type="button">Docs</button></primitiv-navigation-menu-trigger></primitiv-navigation-menu-item>',
      "",
    ));

    // Act
    await user.click(button("Blog"));
    const opened = root().getAttribute("value");
    await user.keyboard("{ArrowRight}");
    await user.click(document.activeElement as HTMLElement);

    // Assert
    expect(opened).toBe("blog");
    expect(root().hasAttribute("value")).toBe(false);
    expect(document.activeElement?.textContent).toBe("Pricing");
  });

  it("survives its entry leaving as the enter-panel arrow opens it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml());
    root().addEventListener("primitiv-navigation-menu-change", () =>
      document.querySelector('primitiv-navigation-menu-item[value="docs"]')?.remove(),
    );
    button("Docs").focus();

    // Act
    await user.keyboard("{ArrowDown}");
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("docs");
  });
});
