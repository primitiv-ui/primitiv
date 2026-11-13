import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/dom";

import { defineToggleGroup, type PrimitivToggleGroupElement } from "../elements";
import { toggleGroupHtml } from "./toggle-group.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

async function mount(html: string) {
  defineToggleGroup();
  document.body.innerHTML = `<form>${html}</form>`;
  await settle();
}

const form = () => document.querySelector("form") as HTMLFormElement;
const root = () => document.querySelector("primitiv-toggle-group") as PrimitivToggleGroupElement;
const submitted = () => [...new FormData(form()).entries()];

describe("<primitiv-toggle-group> in a form", () => {
  it("takes no part in its form without a name", async () => {
    // Arrange & Act
    await mount(toggleGroupHtml({ type: "multiple", value: "bold italic" }));

    // Assert
    expect(submitted()).toEqual([]);
    expect(root().querySelector("input")).toBeNull();
  });

  it("submits every pressed value under its name, as same-named checkboxes do", async () => {
    // Arrange & Act
    await mount(toggleGroupHtml({ type: "multiple", value: "bold underline", name: "style" }));

    // Assert
    expect(submitted()).toEqual([
      ["style", "bold"],
      ["style", "underline"],
    ]);
  });

  it("submits the one pressed value of a single group", async () => {
    // Arrange & Act
    await mount(toggleGroupHtml({ type: "single", value: "italic", name: "style" }));

    // Assert
    expect(submitted()).toEqual([["style", "italic"]]);
  });

  it("follows the pressed items as the user toggles them, and submits nothing once none is", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(toggleGroupHtml({ type: "multiple", value: "bold", name: "style" }));

    // Act
    await user.click(screen.getByRole("button", { name: "Italic" }));
    await settle();
    const both = submitted();
    await user.click(screen.getByRole("button", { name: "Bold" }));
    await user.click(screen.getByRole("button", { name: "Italic" }));
    await settle();

    // Assert
    expect(both).toEqual([
      ["style", "bold"],
      ["style", "italic"],
    ]);
    expect(submitted()).toEqual([]);
  });

  it("follows a name that is added, changed or removed later", async () => {
    // Arrange
    await mount(toggleGroupHtml({ type: "multiple", value: "bold" }));

    // Act
    root().setAttribute("name", "style");
    await settle();
    const added = submitted();
    root().setAttribute("name", "format");
    await settle();
    const renamed = submitted();
    root().removeAttribute("name");
    await settle();

    // Assert
    expect(added).toEqual([["style", "bold"]]);
    expect(renamed).toEqual([["format", "bold"]]);
    expect(submitted()).toEqual([]);
  });

  it("restores the values it first rendered with when its form resets", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(toggleGroupHtml({ type: "multiple", value: "bold", name: "style" }));
    await user.click(screen.getByRole("button", { name: "Underline" }));
    await settle();

    // Act
    form().reset();
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("bold");
    expect(submitted()).toEqual([["style", "bold"]]);
  });

  it("stops following its old form's reset once it leaves it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(toggleGroupHtml({ type: "multiple", value: "bold", name: "style" }));
    const oldForm = form();
    document.body.append(root());
    await user.click(screen.getByRole("button", { name: "Underline" }));
    await settle();

    // Act
    oldForm.reset();
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("bold underline");
  });
});
