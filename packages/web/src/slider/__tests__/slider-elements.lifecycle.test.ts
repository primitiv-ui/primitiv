import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineSlider } from "../elements";
import { sliderHtml } from "./slider.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/** Let mutation-observer callbacks and the reconcile they schedule run. */
async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mount(html: string) {
  defineSlider();
  document.body.innerHTML = html;
  await settle();
}

const root = () => screen.getByTestId("root");
const thumb = (n = 1) => screen.getByRole("slider", { name: `Thumb ${n}` });
const inputs = () => [...document.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map((i) => [i.name, i.value]);

describe("<primitiv-slider> lifecycle", () => {
  it.each([
    ["value", "40", "aria-valuenow", "40"],
    ["min", "10", "aria-valuemin", "10"],
    ["max", "90", "aria-valuemax", "90"],
  ])("follows %s changing later", async (attribute, value, aria, expected) => {
    // Arrange
    await mount(sliderHtml({ value: "30" }));

    // Act
    root().setAttribute(attribute, value);
    await settle();

    // Assert
    expect(thumb().getAttribute(aria)).toBe(expected);
  });

  it.each([
    ["orientation", "vertical", "bottom"],
    ["inverted", "", "right"],
    ["dir", "rtl", "right"],
  ])("moves its thumb when %s changes later", async (attribute, value, edge) => {
    // Arrange
    await mount(sliderHtml({ value: "30" }));

    // Act
    root().setAttribute(attribute, value);
    await settle();

    // Assert
    expect(thumb().style.getPropertyValue(edge)).toBe("30%");
    expect(thumb().style.left).toBe("");
  });

  it("follows becoming disabled", async () => {
    // Arrange
    await mount(sliderHtml({ value: "30" }));

    // Act
    root().setAttribute("disabled", "");
    await settle();

    // Assert
    expect(thumb().getAttribute("aria-disabled")).toBe("true");
  });

  it("adds, renames and drops its hidden inputs as its name and values change", async () => {
    // Arrange
    await mount(sliderHtml({ value: "30", attrs: 'name="volume"' }));

    // Act
    root().setAttribute("value", "20 60");
    root().insertAdjacentHTML("beforeend", '<primitiv-slider-thumb aria-label="Thumb 2"></primitiv-slider-thumb>');
    await settle();
    const two = inputs();
    root().setAttribute("value", "45");
    thumb(2).remove();
    await settle();
    const one = inputs();
    root().removeAttribute("name");
    await settle();

    // Assert
    expect(two).toEqual([
      ["volume[]", "20"],
      ["volume[]", "60"],
    ]);
    expect(one).toEqual([["volume", "45"]]);
    expect(inputs()).toEqual([]);
  });

  it("leaves hidden inputs it did not make alone", async () => {
    // Arrange
    await mount(`<form>${sliderHtml({ value: "30", attrs: 'name="volume"' })}<input type="hidden" name="csrf" value="t"></form>`);

    // Act
    root().removeAttribute("name");
    await settle();

    // Assert
    expect(inputs()).toEqual([["csrf", "t"]]);
  });

  it("picks up a thumb added after it rendered, keyed by its order", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(sliderHtml({ value: "20 80", thumbs: 1 }));
    root().insertAdjacentHTML("beforeend", '<primitiv-slider-thumb aria-label="Thumb 2"></primitiv-slider-thumb>');
    await settle();
    thumb(2).focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(root().getAttribute("value")).toBe("20 81");
  });

  it("stops responding once removed from the document", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(sliderHtml({ value: "30" }));
    const slider = root();
    const holder = document.createElement("div");
    slider.remove();
    holder.append(slider);
    const handle = within(holder).getByRole("slider", { hidden: true });
    handle.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(slider.getAttribute("value")).toBe("30");
  });

  it("handles each event exactly once after being moved", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<section id="a">${sliderHtml({ value: "30" })}</section><section id="b"></section>`);
    const changes: number[][] = [];
    document.addEventListener("primitiv-slider-change", (event) => {
      changes.push((event as CustomEvent<{ value: number[] }>).detail.value);
    });

    // Act
    document.getElementById("b")?.append(root());
    await settle();
    thumb().focus();
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(changes).toEqual([[31]]);
  });

  it("keeps a slider nested in another independent of it", async () => {
    // Arrange
    await mount(sliderHtml({ value: "30" }));

    // Act
    root().insertAdjacentHTML(
      "beforeend",
      '<primitiv-slider value="70"><primitiv-slider-thumb aria-label="Inner"></primitiv-slider-thumb></primitiv-slider>',
    );
    await settle();

    // Assert
    expect(screen.getByRole("slider", { name: "Inner" }).getAttribute("aria-valuenow")).toBe("70");
    expect(thumb().getAttribute("aria-valuenow")).toBe("30");
  });
});
