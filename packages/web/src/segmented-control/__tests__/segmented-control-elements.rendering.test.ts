import { screen } from "@testing-library/dom";

import { defineSegmentedControl, type ElementRegistry } from "../elements";
import { segmentedControlHtml } from "./segmented-control.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/** Mount markup and let the root's first reconcile settle. */
async function mount(html: string) {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineSegmentedControl();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const radio = (name: string) => screen.getByRole("radio", { name });
const tabindexes = () => screen.getAllByRole("radio").map((r) => r.getAttribute("tabindex"));
const root = () => document.querySelector("primitiv-segmented-control") as HTMLElement;

const ELEMENTS = ["primitiv-segmented-control", "primitiv-segmented-control-item"];

describe("<primitiv-segmented-control> rendering", () => {
  it("defines both elements, and defining twice is harmless", () => {
    // Arrange & Act
    defineSegmentedControl();
    defineSegmentedControl();

    // Assert
    for (const name of ELEMENTS) {
      expect(customElements.get(name)).toBeDefined();
    }
  });

  it("defines exactly its tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-segmented-control-item" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineSegmentedControl(registry);

    // Assert
    expect(defined).toEqual(["primitiv-segmented-control"]);
  });

  it("does nothing where there is no registry", () => {
    // Arrange & Act & Assert
    expect(() => defineSegmentedControl(undefined)).not.toThrow();
  });

  it("makes the root a radio group and checks the segment in its value", async () => {
    // Arrange & Act
    await mount(segmentedControlHtml({ value: "week" }));

    // Assert
    expect(screen.getByRole("radiogroup", { name: "Range" })).toBeDefined();
    expect(screen.getAllByRole("radio").map((r) => r.getAttribute("aria-checked"))).toEqual(["false", "true", "false"]);
    expect(radio("Week").getAttribute("data-state")).toBe("checked");
    expect(radio("Day").getAttribute("data-state")).toBe("unchecked");
  });

  it("checks nothing with no value", async () => {
    // Arrange & Act
    await mount(segmentedControlHtml());

    // Assert
    expect(screen.getAllByRole("radio").map((r) => r.getAttribute("aria-checked"))).toEqual(["false", "false", "false"]);
  });

  it("publishes the orientation on the root, horizontal by default", async () => {
    // Arrange & Act
    await mount(segmentedControlHtml() + segmentedControlHtml({ orientation: "vertical", label: "Other" }));

    // Assert
    const [horizontal, vertical] = document.querySelectorAll("primitiv-segmented-control");
    expect(horizontal.getAttribute("aria-orientation")).toBe("horizontal");
    expect(horizontal.getAttribute("data-orientation")).toBe("horizontal");
    expect(vertical.getAttribute("aria-orientation")).toBe("vertical");
    expect(vertical.getAttribute("data-orientation")).toBe("vertical");
  });

  it("marks a disabled segment with aria-disabled and data-disabled, and an enabled one with neither", async () => {
    // Arrange & Act
    await mount(segmentedControlHtml({ disabled: ["week"] }));

    // Assert
    expect(radio("Week").getAttribute("aria-disabled")).toBe("true");
    expect(radio("Week").getAttribute("data-disabled")).toBe("");
    expect(radio("Day").hasAttribute("aria-disabled")).toBe(false);
    expect(radio("Day").hasAttribute("data-disabled")).toBe(false);
    expect(root().hasAttribute("data-disabled")).toBe(false);
  });

  it("marks the root and every segment while the whole control is disabled", async () => {
    // Arrange & Act
    await mount(segmentedControlHtml({ controlDisabled: true }));

    // Assert
    expect(root().getAttribute("data-disabled")).toBe("");
    expect(screen.getAllByRole("radio").map((r) => r.getAttribute("aria-disabled"))).toEqual(["true", "true", "true"]);
    expect(tabindexes()).toEqual(["-1", "-1", "-1"]);
  });

  it("makes the selected segment the tab stop", async () => {
    // Arrange & Act
    await mount(segmentedControlHtml({ value: "month" }));

    // Assert
    expect(tabindexes()).toEqual(["-1", "-1", "0"]);
  });

  it("makes the first enabled segment the tab stop while none is selected", async () => {
    // Arrange & Act
    await mount(segmentedControlHtml({ disabled: ["day"] }));

    // Assert
    expect(tabindexes()).toEqual(["-1", "0", "-1"]);
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(segmentedControlHtml({ value: "week", disabled: ["month"] }));
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
    await mount(segmentedControlHtml({ value: "day" }));

    // Assert
    expect(document.querySelectorAll("[class], [style]")).toHaveLength(0);
  });
});
