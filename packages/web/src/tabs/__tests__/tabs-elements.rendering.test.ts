import { screen } from "@testing-library/dom";

import { defineTabs } from "../elements";
import { tabsHtml } from "./tabs.fixtures";

beforeAll(() => {
  defineTabs();
});

afterEach(() => {
  document.body.replaceChildren();
});

/** Mount markup and let the root's first reconcile (a microtask) settle. */
async function mount(html: string) {
  document.body.innerHTML = html;
  await Promise.resolve();
}

describe("<primitiv-tabs> rendering", () => {
  it("defines the four elements, and defining twice is harmless", () => {
    // Arrange & Act
    defineTabs();

    // Assert
    for (const name of ["primitiv-tabs", "primitiv-tabs-list", "primitiv-tabs-trigger", "primitiv-tabs-content"]) {
      expect(customElements.get(name)).toBeDefined();
    }
  });

  it("gives the list its tablist role, name and orientation", async () => {
    // Arrange & Act
    await mount(tabsHtml({ value: "one" }));

    // Assert
    const list = screen.getByRole("tablist", { name: "Sections" });
    expect(list.getAttribute("aria-orientation")).toBe("horizontal");
  });

  it("puts the tab role on each trigger's child, selecting the root's value", async () => {
    // Arrange & Act
    await mount(tabsHtml({ value: "two" }));

    // Assert
    expect(screen.getByRole("tab", { name: "One" }).getAttribute("aria-selected")).toBe("false");
    expect(screen.getByRole("tab", { name: "Two" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Two" }).tagName).toBe("BUTTON");
  });

  it("makes only the active tab the tab stop", async () => {
    // Arrange & Act
    await mount(tabsHtml({ value: "two" }));

    // Assert
    expect(screen.getByRole("tab", { name: "One" }).getAttribute("tabindex")).toBe("-1");
    expect(screen.getByRole("tab", { name: "Two" }).getAttribute("tabindex")).toBe("0");
  });

  it("makes the first tab the tab stop while none is active", async () => {
    // Arrange & Act
    await mount(tabsHtml({}));

    // Assert
    expect(screen.getByRole("tab", { name: "One" }).getAttribute("tabindex")).toBe("0");
    expect(screen.getByRole("tab", { name: "Two" }).getAttribute("tabindex")).toBe("-1");
  });

  it("shows only the active panel, and labels each panel by its tab", async () => {
    // Arrange & Act
    await mount(tabsHtml({ value: "one" }));

    // Assert
    const panel = screen.getByRole("tabpanel");
    expect(panel.textContent).toBe("First panel");
    expect(screen.getByRole("tabpanel", { name: "One" })).toBe(panel);
    expect(panel.getAttribute("tabindex")).toBe("0");
    expect(document.querySelector('primitiv-tabs-content[value="two"]')?.hasAttribute("hidden")).toBe(true);
  });

  it("wires each tab to its panel with aria-controls", async () => {
    // Arrange & Act
    await mount(tabsHtml({ value: "one" }));

    // Assert
    const tab = screen.getByRole("tab", { name: "One" });
    expect(document.getElementById(tab.getAttribute("aria-controls") ?? "")?.textContent).toBe("First panel");
  });

  it("keeps ids the markup already has", async () => {
    // Arrange & Act
    await mount(tabsHtml({ value: "one", triggerId: "my-tab", panelId: "my-panel" }));

    // Assert
    const tab = screen.getByRole("tab", { name: "One" });
    expect(tab.id).toBe("my-tab");
    expect(tab.getAttribute("aria-controls")).toBe("my-panel");
    expect(document.getElementById("my-panel")?.getAttribute("aria-labelledby")).toBe("my-tab");
  });

  it("publishes data-state and data-orientation for styling", async () => {
    // Arrange & Act
    await mount(tabsHtml({ value: "one", orientation: "vertical" }));

    // Assert
    const root = document.querySelector("primitiv-tabs");
    const tab = screen.getByRole("tab", { name: "One" });
    const other = screen.getByRole("tab", { name: "Two" });
    expect(root?.getAttribute("data-orientation")).toBe("vertical");
    expect(screen.getByRole("tablist").getAttribute("data-orientation")).toBe("vertical");
    expect(tab.getAttribute("data-state")).toBe("active");
    expect(tab.getAttribute("data-orientation")).toBe("vertical");
    expect(other.getAttribute("data-state")).toBe("inactive");
    expect(screen.getByRole("tabpanel").getAttribute("data-state")).toBe("active");
  });

  it("marks a disabled tab with aria-disabled and data-disabled", async () => {
    // Arrange & Act
    await mount(tabsHtml({ value: "one", disabled: ["two"] }));

    // Assert
    const tab = screen.getByRole("tab", { name: "Two" });
    expect(tab.getAttribute("aria-disabled")).toBe("true");
    expect(tab.hasAttribute("data-disabled")).toBe(true);
    expect(screen.getByRole("tab", { name: "One" }).hasAttribute("aria-disabled")).toBe(false);
  });

  it("writes no class and no style on anything", async () => {
    // Arrange & Act
    await mount(tabsHtml({ value: "one" }));

    // Assert
    for (const element of document.body.querySelectorAll("*")) {
      expect(element.hasAttribute("class")).toBe(false);
      expect(element.hasAttribute("style")).toBe(false);
    }
  });
});
