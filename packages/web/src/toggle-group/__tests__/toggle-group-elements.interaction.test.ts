import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineToggleGroup, type PrimitivToggleGroupElement } from "../elements";
import { toggleGroupHtml } from "./toggle-group.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mount(html: string) {
  defineToggleGroup();
  document.body.innerHTML = html;
  await settle();
}

const root = () => document.querySelector("primitiv-toggle-group") as PrimitivToggleGroupElement;
const button = (name: string) => screen.getByRole("button", { name });

describe("<primitiv-toggle-group> interaction", () => {
  it("reflects a clicked item into the value attribute", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(toggleGroupHtml({ value: "bold" }));

    // Act
    await user.click(button("Italic"));
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("italic");
    expect(button("Italic").getAttribute("aria-pressed")).toBe("true");
    expect(button("Bold").getAttribute("aria-pressed")).toBe("false");
  });

  it("joins several pressed items with a space in multiple mode, and empties the value as the last one lets go", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(toggleGroupHtml({ type: "multiple", value: "bold" }));

    // Act
    await user.click(button("Underline"));
    const both = root().getAttribute("value");
    await user.click(button("Bold"));
    await user.click(button("Underline"));

    // Assert
    expect(both).toBe("bold underline");
    expect(root().getAttribute("value")).toBe("");
  });

  it("reports the change with a bubbling, cancelable primitiv-toggle-group-change event", async () => {
    // Arrange
    const user = userEvent.setup();
    const events: Array<CustomEvent<{ value: string[] }>> = [];
    document.addEventListener("primitiv-toggle-group-change", (event) => {
      events.push(event as CustomEvent<{ value: string[] }>);
    });
    await mount(toggleGroupHtml({ type: "multiple", value: "bold" }));

    // Act
    await user.click(button("Italic"));

    // Assert
    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ value: ["bold", "italic"] });
    expect(events[0].bubbles).toBe(true);
    expect(events[0].cancelable).toBe(true);
  });

  it("starts from nothing pressed when there is no value", async () => {
    // Arrange
    const user = userEvent.setup();
    const events: Array<CustomEvent<{ value: string[] }>> = [];
    await mount(toggleGroupHtml({ type: "multiple" }));
    root().addEventListener("primitiv-toggle-group-change", (event) => {
      events.push(event as CustomEvent<{ value: string[] }>);
    });

    // Act
    await user.click(button("Italic"));

    // Assert
    expect(events[0].detail).toEqual({ value: ["italic"] });
  });

  it("applies nothing when the change event is vetoed", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(toggleGroupHtml({ value: "bold" }));
    root().addEventListener("primitiv-toggle-group-change", (event) => event.preventDefault());

    // Act
    await user.click(button("Italic"));
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("bold");
    expect(button("Italic").getAttribute("aria-pressed")).toBe("false");
  });

  it("reads and sets the pressed items through the value property, as an array or a string", async () => {
    // Arrange
    await mount(toggleGroupHtml({ type: "multiple", value: "bold  italic" }));
    const read = root().value;

    // Act
    root().value = ["underline", "bold"];
    const fromArray = root().getAttribute("value");
    root().value = "italic";
    await settle();

    // Assert
    expect(read).toEqual(["bold", "italic"]);
    expect(fromArray).toBe("underline bold");
    expect(button("Italic").getAttribute("aria-pressed")).toBe("true");
  });

  it("reads type at the moment of a toggle, single unless it is multiple", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(toggleGroupHtml({ type: "multiple", value: "bold" }));

    // Act
    root().setAttribute("type", "something");
    await user.click(button("Italic"));

    // Assert
    expect(root().getAttribute("value")).toBe("italic");
  });

  it("moves the tab stop to the item focus moves to", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(toggleGroupHtml({ value: "bold" }));

    // Act
    await user.click(button("Underline"));
    await user.click(button("Underline"));
    await settle();

    // Assert
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("tabindex"))).toEqual(["-1", "-1", "0"]);
  });
});
