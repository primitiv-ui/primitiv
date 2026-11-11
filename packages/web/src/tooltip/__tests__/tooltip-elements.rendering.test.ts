import { defineTooltip, type ElementRegistry } from "../elements";
import { tooltipHtml } from "./tooltip.fixtures";
import { content, mount, root, shown, trigger } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
});

const ELEMENTS = [
  "primitiv-tooltip",
  "primitiv-tooltip-provider",
  "primitiv-tooltip-trigger",
  "primitiv-tooltip-content",
  "primitiv-tooltip-arrow",
];

describe("<primitiv-tooltip> rendering", () => {
  it("defines the five elements, and defining twice is harmless", () => {
    // Arrange & Act
    defineTooltip();
    defineTooltip();

    // Assert
    for (const name of ELEMENTS) expect(customElements.get(name)).toBeDefined();
  });

  it("defines exactly the five tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-tooltip-arrow" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineTooltip(registry);

    // Assert
    expect(defined).toEqual(ELEMENTS.filter((name) => name !== "primitiv-tooltip-arrow"));
  });

  it("does nothing where there is no registry", () => {
    // Arrange & Act & Assert
    expect(() => defineTooltip(undefined)).not.toThrow();
  });

  it("describes the trigger's button by the closed tooltip, which it makes a manual popover", async () => {
    // Arrange & Act
    await mount(tooltipHtml({ id: "tt" }));

    // Assert
    expect(trigger().getAttribute("aria-describedby")).toBe("tt-content");
    expect(trigger().getAttribute("data-state")).toBe("closed");
    expect(content().id).toBe("tt-content");
    expect(content().getAttribute("role")).toBe("tooltip");
    expect(content().getAttribute("popover")).toBe("manual");
    expect(content().getAttribute("data-state")).toBe("closed");
    expect(root().getAttribute("data-state")).toBe("closed");
    expect(shown()).toBe(false);
  });

  it("writes popover=manual on a tooltip the markup left it off", async () => {
    // Arrange & Act
    await mount(tooltipHtml().replace(' popover="manual"', ""));

    // Assert
    expect(content().getAttribute("popover")).toBe("manual");
  });

  it("shows a tooltip that starts open, anchored to its trigger, without moving focus", async () => {
    // Arrange
    const showPopover = vi.spyOn(HTMLElement.prototype, "showPopover");

    // Act
    await mount(tooltipHtml({ open: true }));

    // Assert
    expect(shown()).toBe(true);
    expect(showPopover).toHaveBeenCalledWith({ source: trigger() });
    expect(content().getAttribute("data-state")).toBe("open");
    expect(trigger().getAttribute("data-state")).toBe("open");
    expect(document.activeElement).toBe(document.body);
    showPopover.mockRestore();
  });

  it("keeps an id the markup already has, and gives two tooltips ids that never collide", async () => {
    // Arrange & Act
    await mount(tooltipHtml({ contentId: "mine" }) + tooltipHtml() + tooltipHtml());

    // Assert
    const [mine, a, b] = document.querySelectorAll("primitiv-tooltip-content");
    expect(mine.id).toBe("mine");
    expect(a.id).toMatch(/^primitiv-tooltip-\d+-content$/);
    expect(a.id).not.toBe(b.id);
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(tooltipHtml({ id: "tt" }));
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

  it("writes no class and no style on anything, and nothing on the arrow", async () => {
    // Arrange & Act
    await mount(tooltipHtml({ open: true }));

    // Assert
    for (const element of document.body.querySelectorAll("*")) {
      expect(element.hasAttribute("class")).toBe(false);
      expect(element.hasAttribute("style")).toBe(false);
    }
    expect(document.querySelector("primitiv-tooltip-arrow")!.attributes).toHaveLength(0);
  });

  it("marks the side the tooltip landed on against its trigger", async () => {
    // Arrange — jsdom lays nothing out: the tooltip sits below its trigger.
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const [left, top, width, height] = this.localName === "primitiv-tooltip-content" ? [80, 130, 100, 50] : [100, 100, 60, 20];
      return { left, top, right: left + width, bottom: top + height } as DOMRect;
    });

    // Act
    await mount(tooltipHtml({ open: true }));

    // Assert
    expect(content().getAttribute("data-side")).toBe("bottom");
    vi.restoreAllMocks();
  });
});
