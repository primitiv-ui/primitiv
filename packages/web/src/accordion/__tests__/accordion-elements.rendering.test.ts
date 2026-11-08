import { screen } from "@testing-library/dom";

import { defineAccordion, type ElementRegistry } from "../elements";
import { accordionHtml } from "./accordion.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/** Mount markup and let the root's first reconcile settle. */
async function mount(html: string) {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineAccordion();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const button = (name: string) => screen.getByRole("button", { name });
const content = (index: number) => document.querySelectorAll("primitiv-accordion-content")[index] as HTMLElement;
const icon = (index: number) => document.querySelectorAll("primitiv-accordion-trigger-icon")[index] as HTMLElement;

const ELEMENTS = [
  "primitiv-accordion",
  "primitiv-accordion-item",
  "primitiv-accordion-trigger",
  "primitiv-accordion-content",
  "primitiv-accordion-trigger-icon",
];

describe("<primitiv-accordion> rendering", () => {
  it("defines the five elements, and defining twice is harmless", () => {
    // Arrange & Act
    defineAccordion();
    defineAccordion();

    // Assert
    for (const name of ELEMENTS) {
      expect(customElements.get(name)).toBeDefined();
    }
  });

  it("defines exactly the five tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-accordion-item" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineAccordion(registry);

    // Assert
    expect(defined).toEqual(ELEMENTS.filter((name) => name !== "primitiv-accordion-item"));
  });

  it("does nothing where there is no registry", () => {
    // Arrange & Act & Assert
    expect(() => defineAccordion(undefined)).not.toThrow();
  });

  it("decorates each trigger's button, expanding the items in the root's value", async () => {
    // Arrange & Act
    await mount(accordionHtml({ value: "one three", multiple: true }));

    // Assert
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-expanded"))).toEqual([
      "true",
      "false",
      "true",
    ]);
    expect(button("One").getAttribute("data-state")).toBe("open");
    expect(button("Two").getAttribute("data-state")).toBe("closed");
  });

  it("expands nothing with no value", async () => {
    // Arrange & Act
    await mount(accordionHtml());

    // Assert
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-expanded"))).toEqual([
      "false",
      "false",
      "false",
    ]);
  });

  it("makes each panel a region labelled by its trigger, hiding the closed ones", async () => {
    // Arrange & Act
    await mount(accordionHtml({ value: "two" }));

    // Assert
    const panel = screen.getByRole("region", { name: "Two" });
    expect(panel.textContent).toBe("Second panel");
    expect(button("Two").getAttribute("aria-controls")).toBe(panel.id);
    expect(content(0).getAttribute("hidden")).toBe("");
    expect(content(0).getAttribute("data-state")).toBe("closed");
    expect(panel.getAttribute("data-state")).toBe("open");
    expect(panel.hasAttribute("aria-hidden")).toBe(false);
  });

  it("also hides a closed panel from assistive technology, for a stylesheet whose display overrides hidden", async () => {
    // Arrange & Act
    await mount(accordionHtml({ value: "two" }));

    // Assert
    expect(content(0).getAttribute("aria-hidden")).toBe("true");
    expect(content(2).getAttribute("aria-hidden")).toBe("true");
  });

  it("keeps a force-mount panel unhidden, hiding it from assistive technology while closed", async () => {
    // Arrange & Act
    await mount(accordionHtml({ value: "two", forceMount: true }));

    // Assert
    expect(content(0).hidden).toBe(false);
    expect(content(0).getAttribute("aria-hidden")).toBe("true");
    expect(content(0).getAttribute("data-state")).toBe("closed");
    expect(content(1).hasAttribute("aria-hidden")).toBe(false);
  });

  it("keeps a role the panel was given, so a region landmark can be opted out of", async () => {
    // Arrange & Act
    await mount(accordionHtml({ value: "one" }).replace("<primitiv-accordion-content", '<primitiv-accordion-content role="none"'));

    // Assert
    expect(content(0).getAttribute("role")).toBe("none");
    expect(content(1).getAttribute("role")).toBe("region");
  });

  it("hides each trigger icon from assistive technology and mirrors its item's state", async () => {
    // Arrange & Act
    await mount(accordionHtml({ value: "one" }));

    // Assert
    expect(icon(0).getAttribute("aria-hidden")).toBe("true");
    expect(icon(0).getAttribute("data-state")).toBe("open");
    expect(icon(1).getAttribute("data-state")).toBe("closed");
  });

  it("marks a disabled trigger with aria-disabled and data-disabled, and an enabled one false", async () => {
    // Arrange & Act
    await mount(accordionHtml({ disabled: ["two"] }));

    // Assert
    expect(button("Two").getAttribute("aria-disabled")).toBe("true");
    expect(button("Two").getAttribute("data-disabled")).toBe("true");
    expect(button("One").getAttribute("aria-disabled")).toBe("false");
    expect(button("One").getAttribute("data-disabled")).toBe("false");
  });

  it("publishes data-orientation on the root, vertical by default", async () => {
    // Arrange & Act
    await mount(accordionHtml() + accordionHtml({ orientation: "horizontal" }));

    // Assert
    const [vertical, horizontal] = document.querySelectorAll("primitiv-accordion");
    expect(vertical.getAttribute("data-orientation")).toBe("vertical");
    expect(horizontal.getAttribute("data-orientation")).toBe("horizontal");
  });

  it("derives predictable ids from the root's own id, so a server can pre-render them", async () => {
    // Arrange & Act
    await mount(accordionHtml({ id: "faq" }));

    // Assert
    expect(button("One").id).toBe("faq-heading-one");
    expect(content(0).id).toBe("faq-panel-one");
  });

  it("gives two accordions without ids ids that never collide", async () => {
    // Arrange & Act
    await mount(accordionHtml() + accordionHtml());

    // Assert
    const [first, second] = screen.getAllByRole("button", { name: "One" });
    expect(first.id).toMatch(/^primitiv-accordion-\d+-heading-one$/);
    expect(first.id).not.toBe(second.id);
  });

  it("keeps ids the markup already has", async () => {
    // Arrange & Act
    await mount(accordionHtml({ value: "one", triggerId: "custom-trigger", panelId: "custom-panel" }));

    // Assert
    expect(button("One").id).toBe("custom-trigger");
    expect(button("One").getAttribute("aria-controls")).toBe("custom-panel");
    expect(content(0).getAttribute("aria-labelledby")).toBe("custom-trigger");
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(accordionHtml({ id: "faq", value: "one", disabled: ["three"] }));
    const rendered = document.body.innerHTML;
    document.body.replaceChildren();
    const writes = vi.spyOn(Element.prototype, "setAttribute");
    const removals = vi.spyOn(Element.prototype, "removeAttribute");

    // Act
    document.body.innerHTML = rendered;
    await Promise.resolve();

    // Assert
    expect(writes).not.toHaveBeenCalled();
    expect(removals).not.toHaveBeenCalled();
    writes.mockRestore();
    removals.mockRestore();
  });

  it("writes no class and no style on anything", async () => {
    // Arrange & Act
    await mount(accordionHtml({ value: "one" }));

    // Assert
    expect(document.querySelectorAll("[class], [style]")).toHaveLength(0);
  });
});
