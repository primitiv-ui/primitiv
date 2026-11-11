import { screen } from "@testing-library/dom";

import { defineSlider, type ElementRegistry } from "../elements";
import { sliderHtml } from "./slider.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/** Mount markup and let the root's first reconcile settle. */
async function mount(html: string) {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineSlider();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const thumb = (n = 1) => screen.getByRole("slider", { name: `Thumb ${n}` });
const root = () => screen.getByTestId("root");
const range = () => screen.getByTestId("range");
const track = () => document.querySelector("primitiv-slider-track") as HTMLElement;
const inputs = () => [...document.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map((i) => [i.name, i.value]);

const ELEMENTS = ["primitiv-slider", "primitiv-slider-track", "primitiv-slider-range", "primitiv-slider-thumb"];

describe("<primitiv-slider> rendering", () => {
  it("defines its elements, and defining twice is harmless", () => {
    // Arrange & Act
    defineSlider();
    defineSlider();

    // Assert
    for (const name of ELEMENTS) {
      expect(customElements.get(name)).toBeDefined();
    }
  });

  it("defines exactly its tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-slider-range" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineSlider(registry);

    // Assert
    expect(defined).toEqual(["primitiv-slider", "primitiv-slider-track", "primitiv-slider-thumb"]);
  });

  it("does nothing where there is no registry", () => {
    // Arrange & Act & Assert
    expect(() => defineSlider(undefined)).not.toThrow();
  });

  it("makes each thumb a focusable slider over the default 0–100 scale", async () => {
    // Arrange & Act
    await mount(sliderHtml({ value: "25" }));

    // Assert
    expect(thumb().getAttribute("tabindex")).toBe("0");
    expect(thumb().getAttribute("aria-valuemin")).toBe("0");
    expect(thumb().getAttribute("aria-valuemax")).toBe("100");
    expect(thumb().getAttribute("aria-valuenow")).toBe("25");
    expect(thumb().hasAttribute("aria-disabled")).toBe(false);
    expect(thumb().hasAttribute("data-disabled")).toBe(false);
  });

  it("reads min, max and the values from its attributes", async () => {
    // Arrange & Act
    await mount(sliderHtml({ value: "15  45", attrs: 'min="10" max="50"' }));

    // Assert
    expect(thumb(2).getAttribute("aria-valuenow")).toBe("45");
    expect(thumb().getAttribute("aria-valuemin")).toBe("10");
    expect(thumb().getAttribute("aria-valuemax")).toBe("50");
    expect(thumb(2).style.left).toBe("87.5%");
  });

  it("starts a slider with no value at min", async () => {
    // Arrange & Act
    await mount(sliderHtml({ attrs: 'min="20"' }));

    // Assert
    expect(thumb().getAttribute("aria-valuenow")).toBe("20");
  });

  it("falls back to the defaults for attributes that are not numbers", async () => {
    // Arrange & Act
    await mount(sliderHtml({ value: "30", attrs: 'min="low" max="" step="x"' }));

    // Assert
    expect(thumb().getAttribute("aria-valuemin")).toBe("0");
    expect(thumb().getAttribute("aria-valuemax")).toBe("100");
  });

  it("states its orientation on the root, track, range and thumbs, horizontal by default", async () => {
    // Arrange & Act
    await mount(sliderHtml({ value: "30" }) + sliderHtml({ value: "30", attrs: 'orientation="vertical"' }).replaceAll("Thumb 1", "Upright"));

    // Assert
    const parts = (selector: string) => [...document.querySelectorAll(selector)].map((p) => p.getAttribute("data-orientation"));
    expect(parts("primitiv-slider")).toEqual(["horizontal", "vertical"]);
    expect(parts("primitiv-slider-track")).toEqual(["horizontal", "vertical"]);
    expect(parts("primitiv-slider-range")).toEqual(["horizontal", "vertical"]);
    expect(parts("primitiv-slider-thumb")).toEqual(["horizontal", "vertical"]);
    expect(screen.getByRole("slider", { name: "Upright" }).getAttribute("aria-orientation")).toBe("vertical");
    expect(screen.getByRole("slider", { name: "Upright" }).style.bottom).toBe("30%");
  });

  it("measures from the opposite edge when inverted", async () => {
    // Arrange & Act
    await mount(sliderHtml({ value: "30", attrs: "inverted" }));

    // Assert
    expect(thumb().style.right).toBe("30%");
    expect(thumb().style.left).toBe("");
    expect(range().style.right).toBe("0%");
    expect(range().style.left).toBe("70%");
  });

  it("positions the parts absolutely", async () => {
    // Arrange & Act
    await mount(sliderHtml({ value: "30" }));

    // Assert
    expect(thumb().style.position).toBe("absolute");
    expect(range().style.position).toBe("absolute");
  });

  it("marks every part disabled and takes the thumbs out of the Tab order", async () => {
    // Arrange & Act
    await mount(sliderHtml({ value: "30", attrs: "disabled" }));

    // Assert
    for (const part of [root(), track(), range(), thumb()]) {
      expect(part.getAttribute("data-disabled")).toBe("");
    }
    expect(thumb().getAttribute("aria-disabled")).toBe("true");
    expect(thumb().hasAttribute("tabindex")).toBe(false);
  });

  it("carries its values in hidden inputs named for it", async () => {
    // Arrange & Act
    await mount(sliderHtml({ value: "20 80", attrs: 'name="price"' }));

    // Assert
    expect(inputs()).toEqual([
      ["price[]", "20"],
      ["price[]", "80"],
    ]);
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(sliderHtml({ value: "20 60", attrs: 'name="price" disabled' }));
    const rendered = document.body.innerHTML;
    document.body.replaceChildren();
    const writes = vi.spyOn(Element.prototype, "setAttribute");
    const removals = vi.spyOn(Element.prototype, "removeAttribute");
    const appends = vi.spyOn(Element.prototype, "append");
    const styles = vi.spyOn(CSSStyleDeclaration.prototype, "setProperty");

    // Act
    document.body.innerHTML = rendered;
    await Promise.resolve();

    // Assert
    expect(writes).not.toHaveBeenCalled();
    expect(removals).not.toHaveBeenCalled();
    expect(appends).not.toHaveBeenCalled();
    expect(styles).not.toHaveBeenCalled();
    expect(thumb(2).style.left).toBe("60%");
    writes.mockRestore();
    removals.mockRestore();
    appends.mockRestore();
    styles.mockRestore();
  });

  it("writes no class on anything", async () => {
    // Arrange & Act
    await mount(sliderHtml({ value: "30" }));

    // Assert
    expect(document.querySelectorAll("[class]")).toHaveLength(0);
  });
});
