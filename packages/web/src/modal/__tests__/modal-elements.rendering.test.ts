import { defineModal, type ElementRegistry } from "../elements";
import { modalHtml } from "./modal.fixtures";
import { close, dialog, heading, mount, paragraph, root, trigger } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
});

const ELEMENTS = [
  "primitiv-modal",
  "primitiv-modal-trigger",
  "primitiv-modal-content",
  "primitiv-modal-title",
  "primitiv-modal-description",
  "primitiv-modal-close",
];

describe("<primitiv-modal> rendering", () => {
  it("defines the six elements, and defining twice is harmless", () => {
    // Arrange & Act
    defineModal();
    defineModal();

    // Assert
    for (const name of ELEMENTS) {
      expect(customElements.get(name)).toBeDefined();
    }
  });

  it("defines exactly the six tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-modal-title" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineModal(registry);

    // Assert
    expect(defined).toEqual(ELEMENTS.filter((name) => name !== "primitiv-modal-title"));
  });

  it("does nothing where there is no registry", () => {
    // Arrange & Act & Assert
    expect(() => defineModal(undefined)).not.toThrow();
  });

  it("wires the trigger's button to the closed dialog", async () => {
    // Arrange & Act
    await mount(modalHtml({ id: "pay" }));

    // Assert
    expect(trigger().getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().getAttribute("aria-controls")).toBe("pay-content");
    expect(dialog().id).toBe("pay-content");
    expect(dialog().open).toBe(false);
    expect(dialog().getAttribute("data-state")).toBe("closed");
    expect(root().getAttribute("data-state")).toBe("closed");
  });

  it("names and describes the dialog by its title and description", async () => {
    // Arrange & Act
    await mount(modalHtml({ id: "pay" }));

    // Assert
    expect(heading().id).toBe("pay-title");
    expect(paragraph().id).toBe("pay-description");
    expect(dialog().getAttribute("aria-labelledby")).toBe("pay-title");
    expect(dialog().getAttribute("aria-describedby")).toBe("pay-description");
  });

  it("leaves the dialog unnamed and undescribed without a title or description", async () => {
    // Arrange & Act
    await mount(modalHtml({ noTitle: true, noDescription: true }));

    // Assert
    expect(dialog().hasAttribute("aria-labelledby")).toBe(false);
    expect(dialog().hasAttribute("aria-describedby")).toBe(false);
  });

  it("shows the dialog modally when it starts open", async () => {
    // Arrange & Act
    await mount(modalHtml({ open: true }));

    // Assert
    expect(dialog().open).toBe(true);
    expect(dialog().getAttribute("data-state")).toBe("open");
    expect(root().getAttribute("data-state")).toBe("open");
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
  });

  it("gives two modals without ids ids that never collide", async () => {
    // Arrange & Act
    await mount(modalHtml() + modalHtml());

    // Assert
    const [first, second] = document.querySelectorAll("dialog");
    expect(first.id).toMatch(/^primitiv-modal-\d+-content$/);
    expect(second.id).toMatch(/^primitiv-modal-\d+-content$/);
    expect(first.id).not.toBe(second.id);
  });

  it("keeps ids the markup already has", async () => {
    // Arrange & Act
    await mount(modalHtml({ dialogId: "d", titleId: "t", descriptionId: "p" }));

    // Assert
    expect(dialog().id).toBe("d");
    expect(trigger().getAttribute("aria-controls")).toBe("d");
    expect(dialog().getAttribute("aria-labelledby")).toBe("t");
    expect(dialog().getAttribute("aria-describedby")).toBe("p");
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(modalHtml({ id: "pay" }));
    const rendered = document.body.innerHTML;
    document.body.replaceChildren();
    const writes: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) writes.push(`${(record.target as Element).localName}[${record.attributeName}]`);
    });

    // Act
    document.body.innerHTML = rendered;
    observer.observe(document.body, { subtree: true, attributes: true });
    await mount(rendered);
    observer.disconnect();

    // Assert
    expect(writes).toEqual([]);
  });

  it("writes no class, no style and no role on anything", async () => {
    // Arrange & Act
    await mount(modalHtml({ open: true }));

    // Assert
    for (const element of document.body.querySelectorAll("*")) {
      expect(element.hasAttribute("class")).toBe(false);
      expect(element.hasAttribute("style")).toBe(false);
      expect(element.hasAttribute("role")).toBe(false);
    }
    expect(close().getAttribute("aria-expanded")).toBeNull();
  });
});
