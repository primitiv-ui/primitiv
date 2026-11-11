import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineSlider, type PrimitivSliderElement } from "../elements";
import { sliderHtml } from "./slider.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mount(html: string) {
  defineSlider();
  document.body.innerHTML = html;
  await settle();
  screen.getByTestId("root").getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
}

const root = () => screen.getByTestId("root") as PrimitivSliderElement;
const thumb = (n = 1) => screen.getByRole("slider", { name: `Thumb ${n}` });

describe("<primitiv-slider> interaction", () => {
  it("reflects a key press into the value attribute", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(sliderHtml({ value: "20 80", attrs: 'step="5"' }));
    thumb(2).focus();

    // Act
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(root().getAttribute("value")).toBe("20 75");
  });

  it("reads min and max at each interaction", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(sliderHtml({ value: "30", attrs: 'min="10" max="50"' }));
    thumb().focus();

    // Act
    await user.keyboard("{Home}");
    const home = root().getAttribute("value");
    await user.keyboard("{End}");

    // Assert
    expect(home).toBe("10");
    expect(root().getAttribute("value")).toBe("50");
  });

  it("reads step and the thumb gap from its attributes", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(sliderHtml({ value: "20 80", attrs: 'step="10" min-steps-between-thumbs="2"' }));
    thumb(1).focus();

    // Act
    await user.keyboard("{End}");
    const end = root().getAttribute("value");
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(end).toBe("60 80");
    expect(root().getAttribute("value")).toBe("50 80");
  });

  it("reports each change with a bubbling, cancelable primitiv-slider-change event, and the end of it with primitiv-slider-commit", async () => {
    // Arrange
    const user = userEvent.setup();
    const changes: Array<CustomEvent<{ value: number[] }>> = [];
    const commits: Array<CustomEvent<{ value: number[] }>> = [];
    document.addEventListener("primitiv-slider-change", (event) => changes.push(event as CustomEvent<{ value: number[] }>));
    document.addEventListener("primitiv-slider-commit", (event) => commits.push(event as CustomEvent<{ value: number[] }>));
    await mount(sliderHtml({ value: "10" }));

    // Act
    await user.pointer({ keys: "[MouseLeft>]", target: root(), coords: { clientX: 30 } });
    await user.pointer({ target: root(), coords: { clientX: 40 } });
    const commitsDuringDrag = commits.length;
    await user.pointer({ keys: "[/MouseLeft]", target: root(), coords: { clientX: 40 } });

    // Assert
    expect(changes.map((event) => event.detail.value)).toEqual([[30], [40]]);
    expect(changes[0].bubbles).toBe(true);
    expect(changes[0].cancelable).toBe(true);
    expect(commitsDuringDrag).toBe(0);
    expect(commits.map((event) => event.detail.value)).toEqual([[40]]);
    expect(commits[0].bubbles).toBe(true);
    expect(commits[0].cancelable).toBe(false);
  });

  it("applies nothing when the change event is vetoed, and commits the values it kept", async () => {
    // Arrange
    const user = userEvent.setup();
    const commits: number[][] = [];
    await mount(sliderHtml({ value: "50" }));
    root().addEventListener("primitiv-slider-change", (event) => event.preventDefault());
    root().addEventListener("primitiv-slider-commit", (event) => commits.push((event as CustomEvent<{ value: number[] }>).detail.value));
    thumb().focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(root().getAttribute("value")).toBe("50");
    expect(thumb().getAttribute("aria-valuenow")).toBe("50");
    expect(commits).toEqual([[50]]);
  });

  it("reads and sets the values through the value property, as an array or a string", async () => {
    // Arrange
    await mount(sliderHtml({ value: "20 80" }));
    const read = root().value;

    // Act
    root().value = [30, 70];
    const fromArray = root().getAttribute("value");
    root().value = "40 60";
    await settle();

    // Assert
    expect(read).toEqual([20, 80]);
    expect(fromArray).toBe("30 70");
    expect(thumb(2).getAttribute("aria-valuenow")).toBe("60");
  });

  it("reads its axis from the inherited direction and the inverted attribute", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<div dir="rtl">${sliderHtml({ value: "50", attrs: "inverted" })}</div>`);
    thumb().focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(root().getAttribute("value")).toBe("51");
  });

  it("ignores a press while disabled", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(sliderHtml({ value: "50", attrs: "disabled" }));

    // Act
    await user.pointer({ keys: "[MouseLeft>]", target: root(), coords: { clientX: 20 } });

    // Assert
    expect(root().getAttribute("value")).toBe("50");
  });
});
