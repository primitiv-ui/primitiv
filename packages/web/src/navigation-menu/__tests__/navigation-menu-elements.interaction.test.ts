import userEvent from "@testing-library/user-event";

import { navigationMenuHtml } from "./navigation-menu.fixtures";
import { anchor, button, mount, panel, root, settle, sleep, listenerErrors } from "./mount";

afterEach(() => {
  expect(listenerErrors.splice(0)).toEqual([]);
  document.body.replaceChildren();
});

const changes = () => {
  const seen: unknown[] = [];
  root().addEventListener("primitiv-navigation-menu-change", (event) => seen.push((event as CustomEvent).detail));
  return seen;
};

describe("<primitiv-navigation-menu> interaction", () => {
  it("announces a change before it applies, as a bubbling, cancelable event", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ openOnHover: false }));
    let event: CustomEvent | undefined;
    let applied: boolean | undefined;
    document.body.addEventListener("primitiv-navigation-menu-change", (e) => {
      event = e as CustomEvent;
      applied = root().hasAttribute("value");
    });

    // Act
    await user.click(button("Docs"));

    // Assert
    expect(event?.detail).toEqual({ value: "docs" });
    expect(event?.bubbles).toBe(true);
    expect(event?.cancelable).toBe(true);
    expect(applied).toBe(false);
    expect(root().getAttribute("value")).toBe("docs");
  });

  it("lets a listener veto the change", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ openOnHover: false }));
    root().addEventListener("primitiv-navigation-menu-change", (event) => event.preventDefault());

    // Act
    await user.click(button("Docs"));

    // Assert
    expect(root().hasAttribute("value")).toBe(false);
    expect(panel("docs").hidden).toBe(true);
  });

  it("announces nothing for a change that changes nothing", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ closeDelay: 0 }));
    const seen = changes();

    // Act
    await user.hover(anchor("Pricing"));
    await user.unhover(root());
    await sleep(10);

    // Assert
    expect(seen).toEqual([]);
  });

  it("waits the default 200ms for the first hover open when the delay is not a number", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({}).replace("<primitiv-navigation-menu", '<primitiv-navigation-menu delay-duration="soon"'));

    // Act
    await user.hover(button("Docs"));
    await sleep(120);
    const early = panel("docs").hidden;
    await sleep(140);

    // Assert
    expect(early).toBe(true);
    expect(panel("docs").hidden).toBe(false);
  });

  it("closes 150ms after the pointer leaves by default", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ value: "docs" }));
    await user.hover(button("Docs"));

    // Act
    await user.unhover(root());
    await sleep(90);
    const early = panel("docs").hidden;
    await sleep(110);

    // Assert
    expect(early).toBe(false);
    expect(panel("docs").hidden).toBe(true);
  });

  it("opens on hover unless open-on-hover is exactly false", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ delay: 0 }).replace("<primitiv-navigation-menu", '<primitiv-navigation-menu open-on-hover="no"'));

    // Act
    await user.hover(button("Docs"));

    // Assert
    expect(panel("docs").hidden).toBe(false);
  });

  it("cancels a pending hover open as the pointer leaves the trigger", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ delay: 40, closeDelay: 5000 }));

    // Act
    await user.hover(button("Docs"));
    await user.hover(anchor("Pricing").closest("primitiv-navigation-menu-list") as HTMLElement);
    await sleep(80);

    // Assert
    expect(panel("docs").hidden).toBe(true);
  });

  it("keeps a panel open while the pointer moves over its links", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ value: "docs", closeDelay: 5000 }));

    // Act
    await user.hover(anchor("Guides"));

    // Assert
    expect(panel("docs").hidden).toBe(false);
  });

  it("leaves a panel link's arrow keys to the page", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ value: "docs" }));
    anchor("Guides").focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(document.activeElement).toBe(anchor("Guides"));
  });

  it("travels from a link entry that sits before the triggers, in DOM order", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(
      "<primitiv-navigation-menu><primitiv-navigation-menu-list>" +
        '<primitiv-navigation-menu-item><primitiv-navigation-menu-link><a href="#h">Home</a></primitiv-navigation-menu-link></primitiv-navigation-menu-item>' +
        '<primitiv-navigation-menu-item value="docs"><primitiv-navigation-menu-trigger><button>Docs</button></primitiv-navigation-menu-trigger></primitiv-navigation-menu-item>' +
        "</primitiv-navigation-menu-list></primitiv-navigation-menu>",
    );
    anchor("Home").focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(document.activeElement).toBe(button("Docs"));
  });

  it("closes with Escape when the open entry has no trigger", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ value: "faq" }));
    anchor("Pricing").focus();

    // Act
    await user.keyboard("{Escape}");

    // Assert
    expect(root().hasAttribute("value")).toBe(false);
  });

  it("moves into a panel in the viewport with ArrowDown", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ viewport: true }));
    button("Blog").focus();

    // Act
    await user.keyboard("{ArrowDown}");
    await settle();

    // Assert
    expect(document.activeElement).toBe(anchor("Latest"));
  });

  it("ignores a click on the nav outside every trigger and link", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ value: "docs", openOnHover: false }));
    const seen = changes();

    // Act
    await user.click(panel("docs"));

    // Assert
    expect(seen).toEqual([]);
  });

  it("keeps the arrival it recorded as the pointer moves onto the trigger's own label", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ delay: 0, closeDelay: 5000 }).replace(">Docs</button>", "><span>Docs</span></button>"));
    const trigger = document.querySelector("button") as HTMLElement;

    // Act
    await user.hover(trigger);
    await user.hover(trigger.firstElementChild as HTMLElement);
    await user.click(trigger.firstElementChild as HTMLElement);

    // Assert
    expect(root().getAttribute("value")).toBe("docs");
  });

  it("opens nothing with ArrowDown on a link entry", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml());
    const seen = changes();
    anchor("Pricing").focus();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(seen).toEqual([]);
  });

  it("leaves Home to the page inside an open panel", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ value: "docs" }));
    anchor("API").focus();

    // Act
    await user.keyboard("{Home}");

    // Assert
    expect(document.activeElement).toBe(anchor("API"));
  });

  it("still closes with Escape from an element in a panel that is no part", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(navigationMenuHtml({ value: "docs" }));
    panel("docs").insertAdjacentHTML("beforeend", "<button>More</button>");
    button("More").focus();

    // Act
    await user.keyboard("{Escape}");

    // Assert
    expect(root().hasAttribute("value")).toBe(false);
    expect(document.activeElement).toBe(button("Docs"));
  });
});
