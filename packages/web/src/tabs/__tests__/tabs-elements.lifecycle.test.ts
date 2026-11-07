import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineTabs } from "../elements";
import { tabsHtml } from "./tabs.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/**
 * Let mutation-observer callbacks and the reconcile they schedule run. Each is
 * a microtask; a macrotask boundary drains both.
 */
async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mount(html: string) {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineTabs();
  document.body.innerHTML = html;
  await settle();
}

function root() {
  return document.querySelector("primitiv-tabs") as HTMLElement;
}

describe("<primitiv-tabs> lifecycle", () => {
  it("picks up a tab and panel added after it rendered", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(tabsHtml({ value: "one" }));
    const list = document.querySelector("primitiv-tabs-list") as HTMLElement;
    list.insertAdjacentHTML(
      "beforeend",
      '<primitiv-tabs-trigger value="four"><button type="button">Four</button></primitiv-tabs-trigger>',
    );
    root().insertAdjacentHTML("beforeend", '<primitiv-tabs-content value="four">Fourth panel</primitiv-tabs-content>');
    await settle();
    screen.getByRole("tab", { name: "Three" }).focus();

    // Act
    await user.keyboard("{ArrowRight}");
    await settle();

    // Assert
    expect(screen.getByRole("tab", { name: "Four" })).toBe(document.activeElement);
    expect(screen.getByRole("tabpanel", { name: "Four" }).textContent).toBe("Fourth panel");
  });

  it("forgets a tab once it is removed, so Home and End skip it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(tabsHtml({ value: "two" }));
    document.querySelector('primitiv-tabs-trigger[value="three"]')?.remove();
    document.querySelector('primitiv-tabs-trigger[value="one"]')?.remove();
    await settle();
    screen.getByRole("tab", { name: "Two" }).focus();

    // Act
    await user.keyboard("{End}");
    await settle();
    const afterEnd = root().getAttribute("value");
    await user.keyboard("{Home}");
    await settle();

    // Assert
    expect(afterEnd).toBe("two");
    expect(root().getAttribute("value")).toBe("two");
  });

  it("follows a trigger's, a panel's and a list's attributes changing later", async () => {
    // Arrange
    await mount(tabsHtml({ value: "one" }));

    // Act
    document.querySelector('primitiv-tabs-trigger[value="one"]')?.setAttribute("value", "uno");
    document.querySelector('primitiv-tabs-content[value="one"]')?.setAttribute("value", "uno");
    document.querySelector("primitiv-tabs-list")?.setAttribute("label", "Renamed");
    root().setAttribute("value", "uno");
    await settle();

    // Assert
    expect(screen.getByRole("tablist", { name: "Renamed" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "One" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").textContent).toBe("First panel");
  });

  it("follows a list's label changing on its own", async () => {
    // Arrange
    await mount(tabsHtml({ value: "one" }));

    // Act
    document.querySelector("primitiv-tabs-list")?.setAttribute("label", "Renamed");
    await settle();

    // Assert
    expect(screen.getByRole("tablist", { name: "Renamed" })).toBeDefined();
  });

  it("follows an orientation set later", async () => {
    // Arrange
    await mount(tabsHtml({ value: "one" }));

    // Act
    root().setAttribute("orientation", "vertical");
    await settle();

    // Assert
    expect(screen.getByRole("tablist").getAttribute("aria-orientation")).toBe("vertical");
  });

  it("announces a shown panel once, not again on an unrelated change", async () => {
    // Arrange
    const user = userEvent.setup();
    const shown: string[] = [];
    document.addEventListener("primitiv-tabs-show", (event) => {
      shown.push((event.target as HTMLElement).getAttribute("value") ?? "");
    });
    await mount(tabsHtml({ value: "one" }));
    await user.click(screen.getByRole("tab", { name: "Two" }));
    await settle();

    // Act
    document.querySelector('primitiv-tabs-trigger[value="three"]')?.setAttribute("disabled", "");
    await settle();

    // Assert
    expect(shown).toEqual(["two"]);
  });

  it("decorates a trigger's child again when it is replaced", async () => {
    // Arrange
    await mount(tabsHtml({ value: "one" }));
    const trigger = document.querySelector('primitiv-tabs-trigger[value="two"]') as HTMLElement;

    // Act
    trigger.innerHTML = '<a href="#two">Two, as a link</a>';
    await settle();

    // Assert
    const tab = screen.getByRole("tab", { name: "Two, as a link" });
    expect(tab.tagName).toBe("A");
    expect(tab.getAttribute("aria-selected")).toBe("false");
  });

  it("follows a trigger that becomes disabled", async () => {
    // Arrange
    await mount(tabsHtml({ value: "one" }));

    // Act
    document.querySelector('primitiv-tabs-trigger[value="two"]')?.setAttribute("disabled", "");
    await settle();

    // Assert
    expect(screen.getByRole("tab", { name: "Two" }).getAttribute("aria-disabled")).toBe("true");
  });

  it("stops responding once removed from the document", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(tabsHtml({ value: "one" }));
    const tabs = root();
    const holder = document.createElement("div");
    tabs.remove();
    holder.append(tabs);

    // Act
    await user.click(within(holder).getByRole("tab", { name: "Two" }));

    // Assert
    expect(tabs.getAttribute("value")).toBe("one");
  });

  it("handles each event exactly once after being moved", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<section id="a">${tabsHtml({ value: "one" })}</section><section id="b"></section>`);
    const changes: string[] = [];
    document.addEventListener("primitiv-tabs-change", (event) => {
      changes.push((event as CustomEvent<{ value: string }>).detail.value);
    });

    // Act
    document.getElementById("b")?.append(root());
    await settle();
    await user.click(screen.getByRole("tab", { name: "Two" }));

    // Assert
    expect(changes).toEqual(["two"]);
  });

  it("keeps a tab set nested in a panel independent of its parent", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(tabsHtml({ value: "one" }));
    const firstPanel = document.querySelector('primitiv-tabs-content[value="one"]') as HTMLElement;
    firstPanel.innerHTML =
      '<primitiv-tabs value="inner-a"><primitiv-tabs-list label="Inner">' +
      '<primitiv-tabs-trigger value="inner-a"><button type="button">Inner A</button></primitiv-tabs-trigger>' +
      '<primitiv-tabs-trigger value="inner-b"><button type="button">Inner B</button></primitiv-tabs-trigger>' +
      '</primitiv-tabs-list><primitiv-tabs-content value="inner-a">A</primitiv-tabs-content>' +
      '<primitiv-tabs-content value="inner-b">B</primitiv-tabs-content></primitiv-tabs>';
    await settle();

    // Act
    await user.click(screen.getByRole("tab", { name: "Inner B" }));
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("one");
    expect(within(screen.getByRole("tablist", { name: "Sections" })).getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tab", { name: "Inner B" }).getAttribute("aria-selected")).toBe("true");
  });
});
