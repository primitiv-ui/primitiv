import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineCheckboxCard } from "../elements";
import { checkboxCardHtml } from "./checkbox-card.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/** Let mutation-observer callbacks and the reconcile they schedule run. */
async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mount(html: string) {
  defineCheckboxCard();
  document.body.innerHTML = html;
  await settle();
}

const root = () => document.querySelector("primitiv-checkbox-card") as HTMLElement;
const card = () => screen.getByRole("checkbox");
const indicator = () => document.querySelector("primitiv-checkbox-card-indicator") as HTMLElement;

describe("<primitiv-checkbox-card> lifecycle", () => {
  it("follows checked set from outside", async () => {
    // Arrange
    await mount(checkboxCardHtml());

    // Act
    root().setAttribute("checked", "");
    await settle();

    // Assert
    expect(card().getAttribute("aria-checked")).toBe("true");
  });

  it("follows becoming disabled, then stops toggling", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(checkboxCardHtml());

    // Act
    root().setAttribute("disabled", "");
    await settle();
    await user.click(card());

    // Assert
    expect(card().getAttribute("aria-disabled")).toBe("true");
    expect(root().hasAttribute("checked")).toBe(false);
  });

  it("follows an indicator gaining force-mount", async () => {
    // Arrange
    await mount(checkboxCardHtml());

    // Act
    indicator().setAttribute("force-mount", "");
    await settle();

    // Assert
    expect(indicator().hasAttribute("hidden")).toBe(false);
  });

  it("decorates its button again when it is replaced", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(checkboxCardHtml({ checked: true }));

    // Act
    root().innerHTML = '<button type="button">Replaced</button>';
    await settle();
    await user.click(screen.getByRole("checkbox", { name: "Replaced" }));

    // Assert
    expect(root().hasAttribute("checked")).toBe(false);
  });

  it("leaves a nested card's indicator to that card", async () => {
    // Arrange
    await mount(checkboxCardHtml({ checked: true }));

    // Act
    card().insertAdjacentHTML("beforeend", checkboxCardHtml({ label: "Inner" }));
    await settle();

    // Assert
    expect(screen.getByRole("checkbox", { name: "Inner" }).querySelector("primitiv-checkbox-card-indicator")?.getAttribute("data-state")).toBe(
      "unchecked",
    );
  });

  it("stops responding once removed from the document", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(checkboxCardHtml());
    const element = root();
    const holder = document.createElement("div");
    element.remove();
    holder.append(element);

    // Act
    await user.click(within(holder).getByRole("checkbox", { hidden: true }));

    // Assert
    expect(element.hasAttribute("checked")).toBe(false);
  });

  it("handles each event exactly once after being moved", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<section id="a">${checkboxCardHtml()}</section><section id="b"></section>`);
    const changes: boolean[] = [];
    document.addEventListener("primitiv-checkbox-card-change", (event) => {
      changes.push((event as CustomEvent<{ checked: boolean }>).detail.checked);
    });

    // Act
    document.getElementById("b")?.append(root());
    await settle();
    await user.click(card());

    // Assert
    expect(changes).toEqual([true]);
  });
});
