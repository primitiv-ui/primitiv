import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/dom";

import { defineSegmentedControl, type PrimitivSegmentedControlElement } from "../elements";
import { segmentedControlHtml } from "./segmented-control.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

async function mount(html: string) {
  defineSegmentedControl();
  document.body.innerHTML = `<form>${html}</form>`;
  await settle();
}

const form = () => document.querySelector("form") as HTMLFormElement;
const root = () => document.querySelector("primitiv-segmented-control") as PrimitivSegmentedControlElement;
const submitted = () => [...new FormData(form()).entries()];

describe("<primitiv-segmented-control> in a form", () => {
  it("takes no part in its form without a name", async () => {
    // Arrange & Act
    await mount(segmentedControlHtml({ value: "week" }));

    // Assert
    expect(submitted()).toEqual([]);
    expect(root().querySelector("input")).toBeNull();
  });

  it("submits the selected value under its name", async () => {
    // Arrange & Act
    await mount(segmentedControlHtml({ value: "week", name: "range" }));

    // Assert
    expect(submitted()).toEqual([["range", "week"]]);
    const input = root().querySelector("input") as HTMLInputElement;
    expect(input.type).toBe("hidden");
    expect(input.getAttribute("data-primitiv-form")).toBe("");
  });

  it("follows the selection as the user changes it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(segmentedControlHtml({ value: "week", name: "range" }));

    // Act
    await user.click(screen.getByRole("radio", { name: "Month" }));
    await settle();

    // Assert
    expect(submitted()).toEqual([["range", "month"]]);
  });

  it("submits nothing while nothing is selected, as unchecked radios do", async () => {
    // Arrange & Act
    await mount(segmentedControlHtml({ name: "range" }));

    // Assert
    expect(submitted()).toEqual([]);
  });

  it("submits nothing while the whole control is disabled", async () => {
    // Arrange & Act
    await mount(segmentedControlHtml({ value: "week", name: "range", controlDisabled: true }));

    // Assert
    expect(submitted()).toEqual([]);
  });

  it("follows a name that is added, changed or removed later", async () => {
    // Arrange
    await mount(segmentedControlHtml({ value: "week" }));

    // Act
    root().setAttribute("name", "range");
    await settle();
    const added = submitted();
    root().setAttribute("name", "period");
    await settle();
    const renamed = submitted();
    root().removeAttribute("name");
    await settle();

    // Assert
    expect(added).toEqual([["range", "week"]]);
    expect(renamed).toEqual([["period", "week"]]);
    expect(submitted()).toEqual([]);
  });

  it("restores the value it first rendered with when its form resets", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(segmentedControlHtml({ value: "week", name: "range" }));
    await user.click(screen.getByRole("radio", { name: "Month" }));
    await settle();

    // Act
    form().reset();
    await settle();

    // Assert
    expect(root().value).toBe("week");
    expect(submitted()).toEqual([["range", "week"]]);
  });

  it("returns to nothing selected when its form resets, if that is how it rendered", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(segmentedControlHtml({ name: "range" }));
    await user.click(screen.getByRole("radio", { name: "Month" }));
    await settle();

    // Act
    form().reset();
    await settle();

    // Assert
    expect(root().hasAttribute("value")).toBe(false);
    expect(submitted()).toEqual([]);
  });

  it("keeps the value it first rendered with across a move within its form", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(segmentedControlHtml({ value: "week", name: "range" }));
    await user.click(screen.getByRole("radio", { name: "Month" }));
    await settle();
    form().append(root());
    await settle();

    // Act
    form().reset();
    await settle();

    // Assert
    expect(root().value).toBe("week");
  });

  it("stops following its old form's reset once it leaves it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(segmentedControlHtml({ value: "week", name: "range" }));
    const oldForm = form();
    document.body.append(root());
    await user.click(screen.getByRole("radio", { name: "Month" }));
    await settle();

    // Act
    oldForm.reset();
    await settle();

    // Assert
    expect(root().value).toBe("month");
  });
});
