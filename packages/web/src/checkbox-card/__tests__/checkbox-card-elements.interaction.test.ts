import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineCheckboxCard, type PrimitivCheckboxCardElement } from "../elements";
import { checkboxCardHtml } from "./checkbox-card.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mount(html: string) {
  defineCheckboxCard();
  document.body.innerHTML = html;
  await settle();
}

const root = () => document.querySelector("primitiv-checkbox-card") as PrimitivCheckboxCardElement;
const card = () => screen.getByRole("checkbox");

describe("<primitiv-checkbox-card> interaction", () => {
  it("reflects a click into the checked attribute, and out again", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(checkboxCardHtml());

    // Act
    await user.click(card());
    const on = root().getAttribute("checked");
    await user.click(card());

    // Assert
    expect(on).toBe("");
    expect(root().hasAttribute("checked")).toBe(false);
  });

  it("resolves checked=\"indeterminate\" to a plain checked attribute", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(checkboxCardHtml({ checked: "indeterminate" }));

    // Act
    await user.click(card());

    // Assert
    expect(root().getAttribute("checked")).toBe("");
  });

  it("reports the change with a bubbling, cancelable primitiv-checkbox-card-change event", async () => {
    // Arrange
    const user = userEvent.setup();
    const events: Array<CustomEvent<{ checked: boolean }>> = [];
    document.addEventListener("primitiv-checkbox-card-change", (event) => {
      events.push(event as CustomEvent<{ checked: boolean }>);
    });
    await mount(checkboxCardHtml({ checked: true }));

    // Act
    await user.click(card());

    // Assert
    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ checked: false });
    expect(events[0].bubbles).toBe(true);
    expect(events[0].cancelable).toBe(true);
  });

  it("applies nothing when the change event is vetoed", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(checkboxCardHtml());
    root().addEventListener("primitiv-checkbox-card-change", (event) => event.preventDefault());

    // Act
    await user.click(card());
    await settle();

    // Assert
    expect(root().hasAttribute("checked")).toBe(false);
    expect(card().getAttribute("aria-checked")).toBe("false");
  });

  it("reads and sets the state through the checked property", async () => {
    // Arrange
    await mount(checkboxCardHtml({ checked: "indeterminate" }));
    const read = root().checked;

    // Act
    root().checked = true;
    const on = root().getAttribute("checked");
    root().checked = false;
    const off = root().hasAttribute("checked");
    root().checked = "indeterminate";
    await settle();

    // Assert
    expect(read).toBe("indeterminate");
    expect(on).toBe("");
    expect(off).toBe(false);
    expect(card().getAttribute("aria-checked")).toBe("mixed");
  });

  it("reads a plain checked attribute as true, and none as false", async () => {
    // Arrange & Act
    await mount(checkboxCardHtml({ checked: true }) + checkboxCardHtml({ label: "Other" }));
    const [on, off] = document.querySelectorAll("primitiv-checkbox-card");

    // Assert
    expect((on as PrimitivCheckboxCardElement).checked).toBe(true);
    expect((off as PrimitivCheckboxCardElement).checked).toBe(false);
  });
});
