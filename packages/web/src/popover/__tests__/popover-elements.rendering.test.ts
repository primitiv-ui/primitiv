import { definePopover, type ElementRegistry } from "../elements";
import { popoverHtml } from "./popover.fixtures";
import { close, content, heading, mount, paragraph, root, shown, trigger } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
});

const ELEMENTS = [
  "primitiv-popover",
  "primitiv-popover-trigger",
  "primitiv-popover-anchor",
  "primitiv-popover-content",
  "primitiv-popover-title",
  "primitiv-popover-description",
  "primitiv-popover-close",
];

describe("<primitiv-popover> rendering", () => {
  it("defines the seven elements, and defining twice is harmless", () => {
    // Arrange & Act
    definePopover();
    definePopover();

    // Assert
    for (const name of ELEMENTS) expect(customElements.get(name)).toBeDefined();
  });

  it("defines exactly the seven tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-popover-title" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    definePopover(registry);

    // Assert
    expect(defined).toEqual(ELEMENTS.filter((name) => name !== "primitiv-popover-title"));
  });

  it("does nothing where there is no registry", () => {
    // Arrange & Act & Assert
    expect(() => definePopover(undefined)).not.toThrow();
  });

  it("wires the trigger's button to the closed panel, which it makes a dialog popover", async () => {
    // Arrange & Act
    await mount(popoverHtml({ id: "pp" }));

    // Assert
    expect(trigger().getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().getAttribute("aria-controls")).toBe("pp-content");
    expect(content().id).toBe("pp-content");
    expect(content().getAttribute("role")).toBe("dialog");
    expect(content().getAttribute("popover")).toBe("auto");
    expect(content().getAttribute("tabindex")).toBe("-1");
    expect(content().getAttribute("data-state")).toBe("closed");
    expect(root().getAttribute("data-state")).toBe("closed");
    expect(shown()).toBe(false);
  });

  it("writes popover=auto on a panel the markup left it off", async () => {
    // Arrange & Act
    await mount(popoverHtml().replace(' popover="auto"', ""));

    // Assert
    expect(content().getAttribute("popover")).toBe("auto");
  });

  it("names and describes the panel by its title and description", async () => {
    // Arrange & Act
    await mount(popoverHtml({ id: "pp" }));

    // Assert
    expect(heading().id).toBe("pp-title");
    expect(paragraph().id).toBe("pp-description");
    expect(content().getAttribute("aria-labelledby")).toBe("pp-title");
    expect(content().getAttribute("aria-describedby")).toBe("pp-description");
  });

  it("leaves the panel unnamed and undescribed without a title or description", async () => {
    // Arrange & Act
    await mount(popoverHtml({ noTitle: true, noDescription: true }));

    // Assert
    expect(content().hasAttribute("aria-labelledby")).toBe(false);
    expect(content().hasAttribute("aria-describedby")).toBe(false);
  });

  it("shows the panel when it starts open, and moves focus into it", async () => {
    // Arrange & Act
    await mount(popoverHtml({ open: true }));

    // Assert
    expect(shown()).toBe(true);
    expect(content().getAttribute("data-state")).toBe("open");
    expect(root().getAttribute("data-state")).toBe("open");
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(document.querySelector("input"));
  });

  it("anchors the panel to the trigger's button, or to the anchor's element when there is one", async () => {
    // Arrange
    const showPopover = vi.spyOn(HTMLElement.prototype, "showPopover");

    // Act
    await mount(popoverHtml({ open: true }));
    const button = trigger();
    const toTrigger = showPopover.mock.calls[0][0];
    document.body.replaceChildren();
    await mount(popoverHtml({ open: true, anchor: true }));

    // Assert
    expect(toTrigger).toEqual({ source: button });
    expect(showPopover.mock.calls[1][0]).toEqual({ source: document.querySelector("primitiv-popover-anchor > span") });
    showPopover.mockRestore();
  });

  it("gives two popovers without ids ids that never collide", async () => {
    // Arrange & Act
    await mount(popoverHtml() + popoverHtml());

    // Assert
    const [first, second] = document.querySelectorAll("primitiv-popover-content");
    expect(first.id).toMatch(/^primitiv-popover-\d+-content$/);
    expect(first.id).not.toBe(second.id);
  });

  it("keeps ids the markup already has", async () => {
    // Arrange & Act
    await mount(popoverHtml({ contentId: "c", titleId: "t", descriptionId: "d" }));

    // Assert
    expect(content().id).toBe("c");
    expect(trigger().getAttribute("aria-controls")).toBe("c");
    expect(content().getAttribute("aria-labelledby")).toBe("t");
    expect(content().getAttribute("aria-describedby")).toBe("d");
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(popoverHtml({ id: "pp" }));
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

  it("writes no class and no style on anything", async () => {
    // Arrange & Act
    await mount(popoverHtml({ open: true }));

    // Assert
    for (const element of document.body.querySelectorAll("*")) {
      expect(element.hasAttribute("class")).toBe(false);
      expect(element.hasAttribute("style")).toBe(false);
    }
    expect(close().getAttribute("aria-expanded")).toBeNull();
  });
});
