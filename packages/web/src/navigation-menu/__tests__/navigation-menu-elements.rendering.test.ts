import { screen } from "@testing-library/dom";

import { PrimitivNavigationMenuElement } from "../elements";
import { navigationMenuHtml } from "./navigation-menu.fixtures";
import { anchor, button, mount, panel, part, root, settle, listenerErrors } from "./mount";

afterEach(() => {
  expect(listenerErrors.splice(0)).toEqual([]);
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("<primitiv-navigation-menu> rendering", () => {
  it("keeps a name the markup gives the landmark", async () => {
    // Arrange & Act
    await mount('<primitiv-navigation-menu aria-label="Docs"></primitiv-navigation-menu>');

    // Assert
    expect(screen.getByRole("navigation").getAttribute("aria-label")).toBe("Docs");
  });

  it("names nothing itself when the landmark is labelled by another element", async () => {
    // Arrange & Act
    await mount('<h2 id="site">Site</h2><primitiv-navigation-menu aria-labelledby="site"></primitiv-navigation-menu>');

    // Assert
    expect(root().hasAttribute("aria-label")).toBe(false);
    expect(screen.getByRole("navigation", { name: "Site" })).toBe(root());
  });

  it("publishes the orientation on the root, the list, the viewport and the indicator", async () => {
    // Arrange & Act
    await mount(navigationMenuHtml({ orientation: "vertical", viewport: true, indicator: true }));

    // Assert
    for (const element of [root(), part("list"), part("viewport"), part("indicator")]) {
      expect(element.getAttribute("data-orientation")).toBe("vertical");
    }
  });

  it("follows an orientation changed after it rendered", async () => {
    // Arrange
    await mount(navigationMenuHtml());

    // Act
    root().setAttribute("orientation", "vertical");
    await settle();

    // Assert
    expect(part("list").getAttribute("data-orientation")).toBe("vertical");
  });

  it("derives predictable ids from the root's own id, so a server can pre-render them", async () => {
    // Arrange & Act
    await mount(navigationMenuHtml({ id: "site" }));

    // Assert
    expect(button("Docs").id).toBe("site-trigger-docs");
    expect(panel("docs").id).toBe("site-panel-docs");
  });

  it("gives two menus without ids ids that never collide", async () => {
    // Arrange & Act
    await mount(navigationMenuHtml() + navigationMenuHtml());

    // Assert
    const [first, second] = screen.getAllByRole("button", { name: "Docs" });
    expect(first.id).toMatch(/^primitiv-navigation-menu-\d+-trigger-docs$/);
    expect(first.id).not.toBe(second.id);
  });

  it("keeps ids the markup already has, and points at them", async () => {
    // Arrange & Act
    await mount(
      '<primitiv-navigation-menu><primitiv-navigation-menu-item value="docs">' +
        '<primitiv-navigation-menu-trigger><button id="t">Docs</button></primitiv-navigation-menu-trigger>' +
        '<primitiv-navigation-menu-content id="p" hidden>Panel</primitiv-navigation-menu-content>' +
        "</primitiv-navigation-menu-item></primitiv-navigation-menu>",
    );

    // Assert
    expect(button("Docs").getAttribute("aria-controls")).toBe("p");
    expect(panel("docs").getAttribute("aria-labelledby")).toBe("t");
  });

  it("gives a trigger with no panel no aria-controls, and a panel with no trigger no label", async () => {
    // Arrange & Act
    await mount(
      '<primitiv-navigation-menu><primitiv-navigation-menu-item value="docs">' +
        "<primitiv-navigation-menu-trigger><button>Docs</button></primitiv-navigation-menu-trigger>" +
        '</primitiv-navigation-menu-item><primitiv-navigation-menu-viewport><primitiv-navigation-menu-content value="blog">Blog</primitiv-navigation-menu-content>' +
        "</primitiv-navigation-menu-viewport></primitiv-navigation-menu>",
    );

    // Assert
    expect(button("Docs").hasAttribute("aria-controls")).toBe(false);
    expect(panel("blog").hasAttribute("aria-labelledby")).toBe(false);
    expect(panel("blog").id).toMatch(/-panel-blog$/);
  });

  it("marks the open entry on the viewport and indicator, and drops it as the menu closes", async () => {
    // Arrange
    await mount(navigationMenuHtml({ value: "docs", viewport: true, indicator: true }));
    const open = [part("viewport"), part("indicator")].map((m) => [m.getAttribute("data-value"), m.hidden]);

    // Act
    (root() as PrimitivNavigationMenuElement).value = "";
    await settle();

    // Assert
    expect(open).toEqual([
      ["docs", false],
      ["docs", false],
    ]);
    expect(panel("docs").getAttribute("hidden")).toBe("");
    for (const marker of [part("viewport"), part("indicator")]) {
      expect(marker.getAttribute("hidden")).toBe("");
      expect(marker.hasAttribute("data-value")).toBe(false);
      expect(marker.hidden).toBe(true);
      expect(marker.getAttribute("data-state")).toBe("closed");
    }
  });

  it("keeps force-mounted parts rendered while closed, hiding a closed panel from assistive tech instead", async () => {
    // Arrange & Act
    await mount(navigationMenuHtml({ value: "docs", forceMount: true, viewport: true, indicator: true }));

    // Assert
    expect(panel("blog").hidden).toBe(false);
    expect(panel("blog").getAttribute("aria-hidden")).toBe("true");
    expect(panel("docs").hasAttribute("aria-hidden")).toBe(false);
    (root() as PrimitivNavigationMenuElement).value = "";
    await settle();
    expect(part("viewport").hidden).toBe(false);
    expect(part("indicator").hidden).toBe(false);
  });

  it("follows force-mount added after it rendered", async () => {
    // Arrange
    await mount(navigationMenuHtml());

    // Act
    panel("docs").setAttribute("force-mount", "");
    await settle();

    // Assert
    expect(panel("docs").hidden).toBe(false);
  });

  it("clears a panel's motion once it is a bystander", async () => {
    // Arrange
    await mount(navigationMenuHtml({ value: "docs" }));
    const element = root() as PrimitivNavigationMenuElement;
    element.value = "blog";
    await settle();

    // Act
    element.value = "";
    await settle();
    const closing = panel("blog").getAttribute("data-motion");
    element.value = "docs";
    await settle();

    // Assert
    expect(closing).toBeNull();
    expect(panel("blog").hasAttribute("data-motion")).toBe(false);
    expect(panel("docs").hasAttribute("data-motion")).toBe(false);
  });

  it("keeps a panel's motion through a reconcile that changes nothing open", async () => {
    // Arrange
    await mount(navigationMenuHtml({ value: "docs", active: true }));
    (root() as PrimitivNavigationMenuElement).value = "blog";
    await settle();

    // Act
    anchor("Pricing").parentElement?.removeAttribute("active");
    await settle();

    // Assert
    expect(panel("blog").getAttribute("data-motion")).toBe("from-end");
    expect(panel("docs").getAttribute("data-motion")).toBe("to-start");
  });

  it("follows a link's active attribute as it comes and goes", async () => {
    // Arrange
    await mount(navigationMenuHtml({ active: true }));
    const marked = anchor("Pricing").getAttribute("data-active");

    // Act
    anchor("Pricing").parentElement?.removeAttribute("active");
    await settle();

    // Assert
    expect(marked).toBe("");
    expect(anchor("Pricing").hasAttribute("aria-current")).toBe(false);
    expect(anchor("Pricing").hasAttribute("data-active")).toBe(false);
  });

  it("reflects the open entry, with nothing open as an absent value", async () => {
    // Arrange
    await mount(navigationMenuHtml());
    const element = root() as PrimitivNavigationMenuElement;
    const closed = element.value;

    // Act
    element.value = "docs";
    const opened = element.getAttribute("value");
    element.value = "";

    // Assert
    expect(closed).toBe("");
    expect(opened).toBe("docs");
    expect(element.hasAttribute("value")).toBe(false);
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(
      navigationMenuHtml({ id: "site", value: "docs", indicator: true, active: true }) +
        navigationMenuHtml({ id: "two", viewport: true, indicator: true, forceMount: true }),
    );
    const rendered = document.body.innerHTML;
    document.body.replaceChildren();
    const writes = vi.spyOn(Element.prototype, "setAttribute");
    const removals = vi.spyOn(Element.prototype, "removeAttribute");
    const styles = vi.spyOn(CSSStyleDeclaration.prototype, "setProperty");
    const unstyles = vi.spyOn(CSSStyleDeclaration.prototype, "removeProperty");

    // Act
    document.body.innerHTML = rendered;
    await settle();

    // Assert
    expect(writes).not.toHaveBeenCalled();
    expect(removals).not.toHaveBeenCalled();
    expect(styles).not.toHaveBeenCalled();
    expect(unstyles).not.toHaveBeenCalled();
  });
});
