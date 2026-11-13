import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/dom";

import { defineRadioCard, type PrimitivRadioCardElement } from "../elements";
import { radioCardHtml } from "./radio-card.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

async function mount(html: string) {
  defineRadioCard();
  document.body.innerHTML = `<form>${html}</form>`;
  await settle();
}

const form = () => document.querySelector("form") as HTMLFormElement;
const root = () => document.querySelector("primitiv-radio-card") as PrimitivRadioCardElement;
const submitted = () => [...new FormData(form()).entries()];

describe("<primitiv-radio-card> in a form", () => {
  it("takes no part in its form without a name", async () => {
    // Arrange & Act
    await mount(radioCardHtml({ value: "pro" }));

    // Assert
    expect(submitted()).toEqual([]);
    expect(root().querySelector("input")).toBeNull();
  });

  it("submits the selected value under its name", async () => {
    // Arrange & Act
    await mount(radioCardHtml({ value: "pro", name: "plan" }));

    // Assert
    expect(submitted()).toEqual([["plan", "pro"]]);
  });

  it("follows the selection as the user changes it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(radioCardHtml({ value: "pro", name: "plan" }));

    // Act
    await user.click(screen.getByRole("radio", { name: "Team" }));
    await settle();

    // Assert
    expect(submitted()).toEqual([["plan", "team"]]);
  });

  it("submits nothing while nothing is selected, as unchecked radios do", async () => {
    // Arrange & Act
    await mount(radioCardHtml({ name: "plan" }));

    // Assert
    expect(submitted()).toEqual([]);
  });

  it("follows a name that is added, changed or removed later", async () => {
    // Arrange
    await mount(radioCardHtml({ value: "pro" }));

    // Act
    root().setAttribute("name", "plan");
    await settle();
    const added = submitted();
    root().setAttribute("name", "tier");
    await settle();
    const renamed = submitted();
    root().removeAttribute("name");
    await settle();

    // Assert
    expect(added).toEqual([["plan", "pro"]]);
    expect(renamed).toEqual([["tier", "pro"]]);
    expect(submitted()).toEqual([]);
  });

  it("restores the value it first rendered with when its form resets", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(radioCardHtml({ value: "pro", name: "plan" }));
    await user.click(screen.getByRole("radio", { name: "Team" }));
    await settle();

    // Act
    form().reset();
    await settle();

    // Assert
    expect(root().value).toBe("pro");
    expect(submitted()).toEqual([["plan", "pro"]]);
  });

  it("stops following its old form's reset once it leaves it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(radioCardHtml({ value: "pro", name: "plan" }));
    const oldForm = form();
    document.body.append(root());
    await user.click(screen.getByRole("radio", { name: "Team" }));
    await settle();

    // Act
    oldForm.reset();
    await settle();

    // Assert
    expect(root().value).toBe("team");
  });
});
