import { screen } from "@testing-library/dom";

import { defineTabs, type ElementRegistry } from "../elements";
import { tabsHtml } from "./tabs.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/** Mount markup and let the root's first reconcile (a microtask) settle. */
async function mount(html: string) {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineTabs();
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

  it("defines exactly the four tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-tabs-list" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineTabs(registry);

    // Assert
    expect(defined).toEqual(["primitiv-tabs", "primitiv-tabs-trigger", "primitiv-tabs-content"]);
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
    const inactive = document.querySelector('primitiv-tabs-content[value="two"]');
    expect(inactive?.getAttribute("hidden")).toBe("");
    expect(inactive?.getAttribute("data-state")).toBe("inactive");
  });

  it("wires each tab to its panel with aria-controls", async () => {
    // Arrange & Act
    await mount(tabsHtml({ value: "one" }));

    // Assert
    const tab = screen.getByRole("tab", { name: "One" });
    expect(document.getElementById(tab.getAttribute("aria-controls") ?? "")?.textContent).toBe("First panel");
  });

  it("derives predictable ids from the root's own id, so a server can pre-render them", async () => {
    // Arrange & Act
    await mount(tabsHtml({ value: "one" }).replace("<primitiv-tabs", '<primitiv-tabs id="account"'));

    // Assert
    const tab = screen.getByRole("tab", { name: "One" });
    expect(tab.id).toBe("account-trigger-one");
    expect(tab.getAttribute("aria-controls")).toBe("account-panel-one");
  });

  it("gives two tab sets without ids ids that never collide", async () => {
    // Arrange & Act
    await mount(tabsHtml({ value: "one" }) + tabsHtml({ value: "one" }));

    // Assert
    const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(12);
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
    expect(tab.getAttribute("data-disabled")).toBe("");
    expect(screen.getByRole("tab", { name: "One" }).hasAttribute("aria-disabled")).toBe(false);
  });

  it("keeps an aria-label the list was given directly", async () => {
    // Arrange & Act
    await mount(tabsHtml({ value: "one" }).replace('label="Sections"', 'aria-label="Own name"'));

    // Assert
    expect(screen.getByRole("tablist").getAttribute("aria-label")).toBe("Own name");
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(tabsHtml({ value: "two", disabled: ["three"] }));
    const rendered = document.body.innerHTML;
    document.body.replaceChildren();
    const writes: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) writes.push(`${record.attributeName} on ${(record.target as Element).tagName}`);
    });
    observer.observe(document.body, { subtree: true, attributes: true });

    // Act
    document.body.innerHTML = rendered;
    await Promise.resolve();
    observer.disconnect();

    // Assert
    expect(writes).toEqual([]);
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
