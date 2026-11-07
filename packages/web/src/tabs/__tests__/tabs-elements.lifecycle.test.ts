import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineTabs } from "../elements";
import { tabsHtml } from "./tabs.fixtures";

beforeAll(() => {
  defineTabs();
});

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

  it("forgets a tab once it is removed", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(tabsHtml({ value: "one" }));
    document.querySelector('primitiv-tabs-trigger[value="two"]')?.remove();
    await settle();
    screen.getByRole("tab", { name: "One" }).focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(screen.getByRole("tab", { name: "Three" })).toBe(document.activeElement);
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
