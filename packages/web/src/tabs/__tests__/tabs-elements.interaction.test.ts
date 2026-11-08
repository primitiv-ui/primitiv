import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineTabs, type PrimitivTabsElement } from "../elements";
import { tabsHtml } from "./tabs.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

async function mount(html: string) {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineTabs();
  document.body.innerHTML = html;
  await settle();
}

/** Let a scheduled reconcile run. */
async function settle() {
  await Promise.resolve();
}

function root(): PrimitivTabsElement {
  return document.querySelector("primitiv-tabs") as PrimitivTabsElement;
}

describe("<primitiv-tabs> interaction", () => {
  it("activates a clicked tab", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(tabsHtml({ value: "one" }));

    // Act
    await user.click(screen.getByRole("tab", { name: "Two" }));

    // Assert
    expect(root().getAttribute("value")).toBe("two");
    expect(screen.getByRole("tab", { name: "Two" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").textContent).toBe("Second panel");
  });

  it("reports the change with a bubbling primitiv-tabs-change event", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(tabsHtml({ value: "one" }));
    const events: Array<{ value: string; index: number }> = [];
    document.body.addEventListener("primitiv-tabs-change", (event) => {
      events.push((event as CustomEvent<{ value: string; index: number }>).detail);
    });

    // Act
    await user.click(screen.getByRole("tab", { name: "Three" }));

    // Assert
    expect(events).toEqual([{ value: "three", index: 2 }]);
  });

  it("keeps the selection when the change event is cancelled", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(tabsHtml({ value: "one" }));
    root().addEventListener("primitiv-tabs-change", (event) => event.preventDefault());

    // Act
    await user.click(screen.getByRole("tab", { name: "Two" }));
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("one");
    expect(screen.getByRole("tab", { name: "One" }).getAttribute("aria-selected")).toBe("true");
  });

  it("moves between tabs with the arrow keys, activating as it goes", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(tabsHtml({ value: "one" }));
    screen.getByRole("tab", { name: "One" }).focus();

    // Act
    await user.keyboard("{ArrowRight}");
    await settle();

    // Assert
    const two = screen.getByRole("tab", { name: "Two" });
    expect(two).toBe(document.activeElement);
    expect(two.getAttribute("aria-selected")).toBe("true");
    expect(two.getAttribute("tabindex")).toBe("0");
  });

  it("moves focus only, in manual activation mode, until Enter confirms", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(tabsHtml({ value: "one", activationMode: "manual" }));
    screen.getByRole("tab", { name: "One" }).focus();

    // Act
    await user.keyboard("{ArrowRight}");
    await settle();
    const beforeEnter = root().getAttribute("value");
    await user.keyboard("{Enter}");
    await settle();

    // Assert
    expect(beforeEnter).toBe("one");
    expect(root().getAttribute("value")).toBe("two");
  });

  it("uses the vertical arrows when vertical", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(tabsHtml({ value: "one", orientation: "vertical" }));
    screen.getByRole("tab", { name: "One" }).focus();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(root().getAttribute("value")).toBe("two");
  });

  it("mirrors the horizontal arrows inside a right-to-left context", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<div dir="rtl">${tabsHtml({ value: "one" })}</div>`);
    screen.getByRole("tab", { name: "One" }).focus();

    // Act
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(root().getAttribute("value")).toBe("two");
  });

  it("lands on a disabled tab without activating it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(tabsHtml({ value: "one", disabled: ["two"] }));
    screen.getByRole("tab", { name: "One" }).focus();

    // Act
    await user.keyboard("{ArrowRight}");
    await user.click(screen.getByRole("tab", { name: "Two" }));

    // Assert
    expect(screen.getByRole("tab", { name: "Two" })).toBe(document.activeElement);
    expect(root().getAttribute("value")).toBe("one");
  });

  it("follows a value set from outside, as an attribute or a property", async () => {
    // Arrange
    await mount(tabsHtml({ value: "one" }));

    // Act
    root().setAttribute("value", "two");
    await settle();
    const afterAttribute = screen.getByRole("tabpanel").textContent;
    root().value = "three";
    await settle();

    // Assert
    expect(afterAttribute).toBe("Second panel");
    expect(root().value).toBe("three");
    expect(screen.getByRole("tabpanel").textContent).toBe("Third panel");
  });

  it("fires primitiv-tabs-show on a panel as it becomes active, not on first render", async () => {
    // Arrange
    const user = userEvent.setup();
    const shown: string[] = [];
    document.addEventListener("primitiv-tabs-show", (event) => {
      shown.push((event.target as HTMLElement).getAttribute("value") ?? "");
    });
    await mount(tabsHtml({ value: "one" }));

    // Act
    await user.click(screen.getByRole("tab", { name: "Two" }));
    await settle();

    // Assert
    expect(shown).toEqual(["two"]);
  });
});
