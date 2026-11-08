import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineAccordion, type PrimitivAccordionElement } from "../elements";
import { accordionHtml } from "./accordion.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mount(html: string) {
  defineAccordion();
  document.body.innerHTML = html;
  await settle();
}

const root = () => document.querySelector("primitiv-accordion") as PrimitivAccordionElement;
const button = (name: string) => screen.getByRole("button", { name });

describe("<primitiv-accordion> interaction", () => {
  it("reflects a clicked item into the value attribute", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(accordionHtml({ value: "one" }));

    // Act
    await user.click(button("Two"));
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("two");
    expect(button("Two").getAttribute("aria-expanded")).toBe("true");
  });

  it("joins several open items with a space in multiple mode, and empties the value as the last one closes", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(accordionHtml({ value: "one", multiple: true }));

    // Act
    await user.click(button("Three"));
    const both = root().getAttribute("value");
    await user.click(button("One"));
    await user.click(button("Three"));

    // Assert
    expect(both).toBe("one three");
    expect(root().getAttribute("value")).toBe("");
  });

  it("reports the change with a bubbling, cancelable primitiv-accordion-change event", async () => {
    // Arrange
    const user = userEvent.setup();
    const events: Array<CustomEvent<{ value: string[] }>> = [];
    document.addEventListener("primitiv-accordion-change", (event) => {
      events.push(event as CustomEvent<{ value: string[] }>);
    });
    await mount(accordionHtml({ value: "one", multiple: true }));

    // Act
    await user.click(button("Two"));

    // Assert
    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ value: ["one", "two"] });
    expect(events[0].bubbles).toBe(true);
    expect(events[0].cancelable).toBe(true);
  });

  it("keeps the open items when the change event is cancelled", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(accordionHtml({ value: "one" }));
    root().addEventListener("primitiv-accordion-change", (event) => event.preventDefault());

    // Act
    await user.click(button("Two"));
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("one");
    expect(button("Two").getAttribute("aria-expanded")).toBe("false");
  });

  it("moves focus with the arrows and toggles with Enter", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(accordionHtml());
    button("One").focus();

    // Act
    await user.keyboard("{ArrowDown}{Enter}");
    await settle();

    // Assert
    expect(button("Two")).toBe(document.activeElement);
    expect(root().getAttribute("value")).toBe("two");
  });

  it("reads multiple, orientation and direction from the markup", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<div dir="rtl">${accordionHtml({ orientation: "horizontal", multiple: true, value: "one" })}</div>`);
    button("One").focus();

    // Act
    await user.keyboard("{ArrowLeft}{Enter}");

    // Assert
    expect(button("Two")).toBe(document.activeElement);
    expect(root().getAttribute("value")).toBe("one two");
  });

  it("skips a disabled trigger and never toggles it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(accordionHtml({ disabled: ["two"] }));
    button("One").focus();

    // Act
    await user.keyboard("{ArrowDown}");
    const focused = document.activeElement;
    await user.click(button("Two"));

    // Assert
    expect(focused).toBe(button("Three"));
    expect(root().hasAttribute("value")).toBe(false);
  });

  it("follows a value set from outside, as an attribute or a property", async () => {
    // Arrange
    await mount(accordionHtml({ value: "one", multiple: true }));

    // Act
    root().setAttribute("value", "two");
    await settle();
    const fromAttribute = button("Two").getAttribute("aria-expanded");
    root().value = ["one", "three"];
    await settle();

    // Assert
    expect(fromAttribute).toBe("true");
    expect(root().getAttribute("value")).toBe("one three");
    expect(root().value).toEqual(["one", "three"]);
    expect(button("Three").getAttribute("aria-expanded")).toBe("true");
  });

  it("accepts a space-separated string as the value property, and splits on any whitespace", async () => {
    // Arrange
    await mount(accordionHtml({ multiple: true }));

    // Act
    root().value = "one two";
    const fromString = root().value;
    root().setAttribute("value", "  two\n three ");

    // Assert
    expect(fromString).toEqual(["one", "two"]);
    expect(root().value).toEqual(["two", "three"]);
  });

  it("reads an absent value as nothing open", async () => {
    // Arrange & Act
    await mount(accordionHtml());

    // Assert
    expect(root().value).toEqual([]);
  });

  it("fires primitiv-accordion-show on a panel as it opens, not on first render", async () => {
    // Arrange
    const user = userEvent.setup();
    const shown: string[] = [];
    document.addEventListener("primitiv-accordion-show", (event) => {
      shown.push((event.target as HTMLElement).textContent ?? "");
    });
    await mount(accordionHtml({ value: "one", multiple: true }));

    // Act
    await user.click(button("Two"));
    await settle();
    await user.click(button("One"));
    await settle();
    await user.click(button("One"));
    await settle();

    // Assert
    expect(shown).toEqual(["Second panel", "First panel"]);
  });
});
