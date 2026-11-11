import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineRadioCard, type PrimitivRadioCardElement } from "../elements";
import { radioCardHtml } from "./radio-card.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mount(html: string) {
  defineRadioCard();
  document.body.innerHTML = html;
  await settle();
}

const root = () => document.querySelector("primitiv-radio-card") as PrimitivRadioCardElement;
const radio = (name: string) => screen.getByRole("radio", { name });

describe("<primitiv-radio-card> interaction", () => {
  it("reflects a clicked card into the value attribute, moving the indicator", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(radioCardHtml({ value: "basic" }));

    // Act
    await user.click(radio("Team"));
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("team");
    expect(radio("Team").getAttribute("aria-checked")).toBe("true");
    expect(radio("Team").getAttribute("tabindex")).toBe("0");
    expect(radio("Team").querySelector("primitiv-radio-card-indicator")?.hasAttribute("hidden")).toBe(false);
    expect(radio("Basic").querySelector("primitiv-radio-card-indicator")?.hasAttribute("hidden")).toBe(true);
  });

  it("selects with the vertical arrows by default, where cards wrap into a grid", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(radioCardHtml({ value: "basic" }));
    radio("Basic").focus();

    // Act
    await user.keyboard("{ArrowDown}");
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("pro");
    expect(document.activeElement).toBe(radio("Pro"));
  });

  it("keeps to one axis when oriented", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(radioCardHtml({ value: "basic", orientation: "horizontal" }));
    radio("Basic").focus();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(root().getAttribute("value")).toBe("basic");
  });

  it("reports the change with a bubbling, cancelable primitiv-radio-card-change event", async () => {
    // Arrange
    const user = userEvent.setup();
    const events: Array<CustomEvent<{ value: string }>> = [];
    document.addEventListener("primitiv-radio-card-change", (event) => {
      events.push(event as CustomEvent<{ value: string }>);
    });
    await mount(radioCardHtml({ value: "basic" }));

    // Act
    await user.click(radio("Pro"));

    // Assert
    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ value: "pro" });
    expect(events[0].bubbles).toBe(true);
    expect(events[0].cancelable).toBe(true);
  });

  it("applies nothing when the change event is vetoed", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(radioCardHtml({ value: "basic" }));
    root().addEventListener("primitiv-radio-card-change", (event) => event.preventDefault());

    // Act
    await user.click(radio("Pro"));
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("basic");
    expect(radio("Pro").getAttribute("aria-checked")).toBe("false");
  });

  it("reads and sets the selection through the value property", async () => {
    // Arrange
    await mount(radioCardHtml({ value: "basic" }));
    const read = root().value;

    // Act
    root().value = "team";
    await settle();

    // Assert
    expect(read).toBe("basic");
    expect(radio("Team").getAttribute("aria-checked")).toBe("true");
  });
});
