import { screen } from "@testing-library/dom";

import { defineCollapsible, type ElementRegistry } from "../elements";
import { collapsibleHtml, LABEL, PANEL } from "./collapsible.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/** Mount markup and let the root's first reconcile settle. */
async function mount(html: string) {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineCollapsible();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const root = () => document.querySelector("primitiv-collapsible") as HTMLElement;
const button = () => screen.getByRole("button", { name: LABEL });
const content = () => document.querySelector("primitiv-collapsible-content") as HTMLElement;
const icon = () => document.querySelector("primitiv-collapsible-trigger-icon") as HTMLElement;

const ELEMENTS = [
  "primitiv-collapsible",
  "primitiv-collapsible-trigger",
  "primitiv-collapsible-content",
  "primitiv-collapsible-trigger-icon",
];

describe("<primitiv-collapsible> rendering", () => {
  it("defines the four elements, and defining twice is harmless", () => {
    // Arrange & Act
    defineCollapsible();
    defineCollapsible();

    // Assert
    for (const name of ELEMENTS) {
      expect(customElements.get(name)).toBeDefined();
    }
  });

  it("defines exactly the four tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-collapsible-content" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineCollapsible(registry);

    // Assert
    expect(defined).toEqual(ELEMENTS.filter((name) => name !== "primitiv-collapsible-content"));
  });

  it("does nothing where there is no registry", () => {
    // Arrange & Act & Assert
    expect(() => defineCollapsible(undefined)).not.toThrow();
  });

  it("decorates the trigger's button and hides the closed panel", async () => {
    // Arrange & Act
    await mount(collapsibleHtml());

    // Assert
    expect(button().getAttribute("aria-expanded")).toBe("false");
    expect(button().getAttribute("aria-controls")).toBe(content().id);
    expect(button().getAttribute("data-state")).toBe("closed");
    expect(content().textContent).toBe(PANEL);
    expect(content().getAttribute("hidden")).toBe("");
    expect(content().getAttribute("data-state")).toBe("closed");
  });

  it("shows the panel of an open collapsible", async () => {
    // Arrange & Act
    await mount(collapsibleHtml({ open: true }));

    // Assert
    expect(button().getAttribute("aria-expanded")).toBe("true");
    expect(button().getAttribute("data-state")).toBe("open");
    expect(content().hidden).toBe(false);
    expect(content().hasAttribute("aria-hidden")).toBe(false);
    expect(content().getAttribute("data-state")).toBe("open");
  });

  it("publishes data-state and data-disabled on the root", async () => {
    // Arrange & Act
    await mount(collapsibleHtml({ open: true }) + collapsibleHtml({ disabled: true }));

    // Assert
    const [open, disabled] = document.querySelectorAll("primitiv-collapsible");
    expect(open.getAttribute("data-state")).toBe("open");
    expect(open.getAttribute("data-disabled")).toBe("false");
    expect(disabled.getAttribute("data-state")).toBe("closed");
    expect(disabled.getAttribute("data-disabled")).toBe("true");
  });

  it("also hides a closed panel from assistive technology, for a stylesheet whose display overrides hidden", async () => {
    // Arrange & Act
    await mount(collapsibleHtml());

    // Assert
    expect(content().getAttribute("aria-hidden")).toBe("true");
  });

  it("keeps a force-mount panel unhidden, hiding it from assistive technology while closed", async () => {
    // Arrange & Act
    await mount(collapsibleHtml({ forceMount: true }));

    // Assert
    expect(content().hidden).toBe(false);
    expect(content().getAttribute("aria-hidden")).toBe("true");
    expect(content().getAttribute("data-state")).toBe("closed");
  });

  it.each([
    ["a bare number as pixels", "72", "72px"],
    ["a fractional number as pixels", "12.5", "12.5px"],
    ["a CSS length verbatim", "4rem", "4rem"],
  ])("shows a collapsed-height panel as a readable preview, publishing %s", async (_case, attr, published) => {
    // Arrange & Act
    await mount(collapsibleHtml({ collapsedHeight: attr }));

    // Assert
    expect(content().hidden).toBe(false);
    expect(content().hasAttribute("aria-hidden")).toBe(false);
    expect(content().getAttribute("data-clamped")).toBe("true");
    expect(content().style.getPropertyValue("--primitiv-collapsible-collapsed-height")).toBe(published);
  });

  it("marks only a collapsed-height panel as clamped, and publishes no height without one", async () => {
    // Arrange & Act
    await mount(collapsibleHtml());

    // Assert
    expect(content().hasAttribute("data-clamped")).toBe(false);
    expect(content().hasAttribute("style")).toBe(false);
  });

  it("hides the trigger icon from assistive technology and mirrors the state", async () => {
    // Arrange & Act
    await mount(collapsibleHtml({ open: true }) + collapsibleHtml());

    // Assert
    const [open, closed] = document.querySelectorAll("primitiv-collapsible-trigger-icon");
    expect(open.getAttribute("aria-hidden")).toBe("true");
    expect(open.getAttribute("data-state")).toBe("open");
    expect(closed.getAttribute("data-state")).toBe("closed");
  });

  it("marks a disabled collapsible's button with aria-disabled and data-disabled, and an enabled one without", async () => {
    // Arrange & Act
    await mount(collapsibleHtml({ disabled: true }) + collapsibleHtml());

    // Assert
    const [disabled, enabled] = screen.getAllByRole("button");
    expect(disabled.getAttribute("aria-disabled")).toBe("true");
    expect(disabled.getAttribute("data-disabled")).toBe("true");
    expect(content().getAttribute("data-disabled")).toBe("true");
    expect(enabled.hasAttribute("aria-disabled")).toBe(false);
    expect(enabled.getAttribute("data-disabled")).toBe("false");
  });

  it("derives predictable ids from the root's own id, so a server can pre-render them", async () => {
    // Arrange & Act
    await mount(collapsibleHtml({ id: "details" }));

    // Assert
    expect(button().id).toBe("details-trigger");
    expect(content().id).toBe("details-content");
  });

  it("gives two collapsibles without ids ids that never collide", async () => {
    // Arrange & Act
    await mount(collapsibleHtml() + collapsibleHtml());

    // Assert
    const [first, second] = screen.getAllByRole("button");
    expect(first.id).toMatch(/^primitiv-collapsible-\d+-trigger$/);
    expect(first.id).not.toBe(second.id);
  });

  it("keeps ids the markup already has", async () => {
    // Arrange & Act
    await mount(collapsibleHtml({ triggerId: "custom-trigger", panelId: "custom-panel" }));

    // Assert
    expect(button().id).toBe("custom-trigger");
    expect(button().getAttribute("aria-controls")).toBe("custom-panel");
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(collapsibleHtml({ id: "details", open: true, collapsedHeight: "72" }) + collapsibleHtml({ disabled: true }));
    const rendered = document.body.innerHTML;
    document.body.replaceChildren();
    const writes = vi.spyOn(Element.prototype, "setAttribute");
    const removals = vi.spyOn(Element.prototype, "removeAttribute");
    const styles = vi.spyOn(CSSStyleDeclaration.prototype, "setProperty");

    // Act
    document.body.innerHTML = rendered;
    await Promise.resolve();

    // Assert
    expect(writes).not.toHaveBeenCalled();
    expect(removals).not.toHaveBeenCalled();
    expect(styles).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("writes no class and no style on anything without a collapsed height", async () => {
    // Arrange & Act
    await mount(collapsibleHtml({ open: true }));

    // Assert
    expect(document.querySelectorAll("[class], [style]")).toHaveLength(0);
    expect(root().isConnected).toBe(true);
    expect(icon()).not.toBeNull();
  });
});
