import userEvent from "@testing-library/user-event";

import type { PrimitivNavigationMenuElement } from "../elements";
import { navigationMenuHtml } from "./navigation-menu.fixtures";
import { anchor, button, mount, panel, part, root, settle, sleep, listenerErrors } from "./mount";

afterEach(() => {
  expect(listenerErrors.splice(0)).toEqual([]);
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

/** Give `element` layout offsets jsdom does not compute. */
function layout(element: HTMLElement, box: Partial<Record<"offsetLeft" | "offsetTop" | "offsetWidth" | "offsetHeight", number>>) {
  for (const [name, value] of Object.entries(box)) {
    Object.defineProperty(element, name, { configurable: true, get: () => value });
  }
}

const style = (element: HTMLElement, name: string) => element.style.getPropertyValue(`--primitiv-navigation-menu-${name}`);

describe("<primitiv-navigation-menu> lifecycle", () => {
  it("decorates a trigger that arrives after it rendered, and travels to it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ value: "faq" }));

    // Act
    part("list").insertAdjacentHTML(
      "beforeend",
      '<primitiv-navigation-menu-item value="faq"><primitiv-navigation-menu-trigger><button>FAQ</button></primitiv-navigation-menu-trigger></primitiv-navigation-menu-item>',
    );
    await settle();
    anchor("Pricing").focus();
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(button("FAQ").getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(button("FAQ"));
  });

  it("stops responding once removed from the document", async () => {
    // Arrange
    await mount(navigationMenuHtml({ openOnHover: false }));
    const element = root();
    const docs = button("Docs");
    element.remove();

    // Act
    docs.click();
    await settle();

    // Assert
    expect(element.hasAttribute("value")).toBe(false);
  });

  it("cancels a pending hover open as it leaves the document", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ delay: 30 }));
    const element = root();
    await user.hover(button("Docs"));

    // Act
    element.remove();
    await sleep(60);

    // Assert
    expect(element.hasAttribute("value")).toBe(false);
  });

  it("handles each click once after a move", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ openOnHover: false }));
    const element = root();
    const seen: unknown[] = [];
    element.addEventListener("primitiv-navigation-menu-change", (e) => seen.push((e as CustomEvent).detail));

    // Act
    document.body.append(element);
    await settle();
    await user.click(button("Docs"));

    // Assert
    expect(seen).toEqual([{ value: "docs" }]);
  });

  it("publishes the open trigger's geometry on the indicator, along the bar's axis", async () => {
    // Arrange
    await mount(navigationMenuHtml({ indicator: true }));
    layout(button("Blog"), { offsetLeft: 80, offsetTop: 40, offsetWidth: 60, offsetHeight: 20 });
    const element = root() as PrimitivNavigationMenuElement;

    // Act
    element.value = "blog";
    await settle();
    const horizontal = [style(part("indicator"), "indicator-position"), style(part("indicator"), "indicator-size")];
    element.setAttribute("orientation", "vertical");
    await settle();

    // Assert
    expect(horizontal).toEqual(["80px", "60px"]);
    expect(style(part("indicator"), "indicator-position")).toBe("40px");
    expect(style(part("indicator"), "indicator-size")).toBe("20px");
  });

  it("drops the indicator's geometry as the menu closes", async () => {
    // Arrange
    await mount(navigationMenuHtml({ value: "docs", indicator: true }));
    const element = root() as PrimitivNavigationMenuElement;

    // Act
    element.value = "";
    await settle();

    // Assert
    expect(style(part("indicator"), "indicator-position")).toBe("");
    expect(part("indicator").hasAttribute("style")).toBe(true);
  });

  it("re-measures the indicator as the window resizes", async () => {
    // Arrange
    await mount(navigationMenuHtml({ value: "docs", indicator: true }));
    layout(button("Docs"), { offsetLeft: 12, offsetWidth: 30 });

    // Act
    window.dispatchEvent(new Event("resize"));

    // Assert
    expect(style(part("indicator"), "indicator-position")).toBe("12px");
  });

  it("publishes the open panel's size on the viewport, and keeps it through a close", async () => {
    // Arrange
    await mount(navigationMenuHtml({ viewport: true }));
    layout(panel("docs"), { offsetWidth: 320, offsetHeight: 180 });
    const element = root() as PrimitivNavigationMenuElement;

    // Act
    element.value = "docs";
    await settle();
    element.value = "";
    await settle();

    // Assert
    expect(style(part("viewport"), "viewport-width")).toBe("320px");
    expect(style(part("viewport"), "viewport-height")).toBe("180px");
  });

  it("clears the viewport's size when the open panel is not in it", async () => {
    // Arrange
    await mount(navigationMenuHtml({ viewport: true, value: "docs" }));

    // Act
    (root() as PrimitivNavigationMenuElement).value = "faq";
    await settle();

    // Assert
    expect(style(part("viewport"), "viewport-width")).toBe("");
    expect(style(part("viewport"), "viewport-height")).toBe("");
  });

  it("re-measures the viewport a frame after a panel opens", async () => {
    // Arrange
    await mount(navigationMenuHtml({ viewport: true, value: "docs" }));
    layout(panel("docs"), { offsetWidth: 400, offsetHeight: 90 });

    // Act
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Assert
    expect(style(part("viewport"), "viewport-width")).toBe("400px");
  });

  it("does not re-measure a frame later once it has left the document", async () => {
    // Arrange
    await mount(navigationMenuHtml({ viewport: true, value: "docs" }));
    const viewport = part("viewport");
    layout(panel("docs"), { offsetWidth: 400 });

    // Act
    root().remove();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Assert
    expect(style(viewport, "viewport-width")).toBe("0px");
  });

  it("re-measures the viewport once a web font finishes loading", async () => {
    // Arrange
    const fonts = new EventTarget();
    Object.defineProperty(document, "fonts", { configurable: true, value: fonts });
    await mount(navigationMenuHtml({ viewport: true, value: "docs" }));
    layout(panel("docs"), { offsetHeight: 77 });

    // Act
    fonts.dispatchEvent(new Event("loadingdone"));

    // Assert
    expect(style(part("viewport"), "viewport-height")).toBe("77px");
    delete (document as { fonts?: unknown }).fonts;
  });
});
