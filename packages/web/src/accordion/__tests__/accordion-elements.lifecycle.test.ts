import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineAccordion } from "../elements";
import { accordionHtml } from "./accordion.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/**
 * Let mutation-observer callbacks and the reconcile they schedule run. Each is
 * a microtask; a macrotask boundary drains both.
 */
async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mount(html: string) {
  defineAccordion();
  document.body.innerHTML = html;
  await settle();
}

const root = () => document.querySelector("primitiv-accordion") as HTMLElement;
const button = (name: string) => screen.getByRole("button", { name });
const item = (value: string) => document.querySelector(`primitiv-accordion-item[value="${value}"]`) as HTMLElement;

const FOUR =
  '<primitiv-accordion-item value="four"><h3><primitiv-accordion-trigger><button type="button">Four</button>' +
  "</primitiv-accordion-trigger></h3><primitiv-accordion-content>Fourth panel</primitiv-accordion-content>" +
  "</primitiv-accordion-item>";

describe("<primitiv-accordion> lifecycle", () => {
  it("picks up an item added after it rendered", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(accordionHtml());
    root().insertAdjacentHTML("beforeend", FOUR);
    await settle();
    button("Three").focus();

    // Act
    await user.keyboard("{ArrowDown}{Enter}");
    await settle();

    // Assert
    expect(button("Four")).toBe(document.activeElement);
    expect(screen.getByRole("region", { name: "Four" }).textContent).toBe("Fourth panel");
  });

  it("forgets an item once it is removed, so End skips it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(accordionHtml());
    item("three").remove();
    await settle();
    button("One").focus();

    // Act
    await user.keyboard("{End}");

    // Assert
    expect(button("Two")).toBe(document.activeElement);
  });

  it("follows an item's value changing later", async () => {
    // Arrange
    await mount(accordionHtml({ value: "uno" }));

    // Act
    item("one").setAttribute("value", "uno");
    await settle();

    // Assert
    expect(button("One").getAttribute("aria-expanded")).toBe("true");
  });

  it("follows a trigger becoming disabled", async () => {
    // Arrange
    await mount(accordionHtml());

    // Act
    item("two").querySelector("primitiv-accordion-trigger")?.setAttribute("disabled", "");
    await settle();

    // Assert
    expect(button("Two").getAttribute("aria-disabled")).toBe("true");
  });

  it("follows the orientation changing later", async () => {
    // Arrange
    await mount(accordionHtml());

    // Act
    root().setAttribute("orientation", "horizontal");
    await settle();

    // Assert
    expect(root().getAttribute("data-orientation")).toBe("horizontal");
  });

  it("follows force-mount set later on a closed panel", async () => {
    // Arrange
    await mount(accordionHtml({ value: "one" }));
    const closed = item("two").querySelector("primitiv-accordion-content") as HTMLElement;

    // Act
    closed.setAttribute("force-mount", "");
    await settle();

    // Assert
    expect(closed.hidden).toBe(false);
    expect(closed.getAttribute("aria-hidden")).toBe("true");
  });

  it("reads multiple at the moment of a toggle, with no reconcile needed", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(accordionHtml({ value: "one" }));

    // Act
    root().setAttribute("multiple", "");
    await user.click(button("Two"));

    // Assert
    expect(root().getAttribute("value")).toBe("one two");
  });

  it("decorates a trigger's child again when it is replaced", async () => {
    // Arrange
    await mount(accordionHtml({ value: "two" }));
    const trigger = item("two").querySelector("primitiv-accordion-trigger") as HTMLElement;

    // Act
    trigger.innerHTML = '<button type="button">Two, replaced</button>';
    await settle();

    // Assert
    expect(button("Two, replaced").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("region", { name: "Two, replaced" })).toBeDefined();
  });

  it("stops responding once removed from the document", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(accordionHtml());
    const accordion = root();
    const holder = document.createElement("div");
    accordion.remove();
    holder.append(accordion);

    // Act
    await user.click(within(holder).getByRole("button", { name: "Two", hidden: true }));

    // Assert
    expect(accordion.hasAttribute("value")).toBe(false);
  });

  it("handles each event exactly once after being moved", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<section id="a">${accordionHtml()}</section><section id="b"></section>`);
    const changes: string[][] = [];
    document.addEventListener("primitiv-accordion-change", (event) => {
      changes.push((event as CustomEvent<{ value: string[] }>).detail.value);
    });

    // Act
    document.getElementById("b")?.append(root());
    await settle();
    await user.click(button("Two"));

    // Assert
    expect(changes).toEqual([["two"]]);
  });

  it("keeps an accordion nested in a panel independent of its parent", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(accordionHtml({ value: "one" }));
    const firstPanel = document.querySelector("primitiv-accordion-content") as HTMLElement;
    firstPanel.innerHTML =
      '<primitiv-accordion><primitiv-accordion-item value="inner"><h4><primitiv-accordion-trigger>' +
      '<button type="button">Inner</button></primitiv-accordion-trigger></h4>' +
      "<primitiv-accordion-content>Inner panel</primitiv-accordion-content></primitiv-accordion-item></primitiv-accordion>";
    await settle();

    // Act
    await user.click(button("Inner"));
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("one");
    expect(button("One").getAttribute("aria-expanded")).toBe("true");
    expect(button("Inner").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });
});
