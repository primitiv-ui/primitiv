import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineToggleGroup } from "../elements";
import { toggleGroupHtml } from "./toggle-group.fixtures";

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
  defineToggleGroup();
  document.body.innerHTML = html;
  await settle();
}

const root = () => document.querySelector("primitiv-toggle-group") as HTMLElement;
const button = (name: string) => screen.getByRole("button", { name });
const item = (value: string) => document.querySelector(`primitiv-toggle-group-item[value="${value}"]`) as HTMLElement;

const STRIKE =
  '<primitiv-toggle-group-item value="strike"><button type="button">Strike</button></primitiv-toggle-group-item>';

describe("<primitiv-toggle-group> lifecycle", () => {
  it("picks up an item added after it rendered", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(toggleGroupHtml());
    root().insertAdjacentHTML("beforeend", STRIKE);
    await settle();
    button("Underline").focus();

    // Act
    await user.keyboard("{ArrowRight}{Enter}");
    await settle();

    // Assert
    expect(button("Strike")).toBe(document.activeElement);
    expect(button("Strike").getAttribute("aria-pressed")).toBe("true");
  });

  it("forgets an item once it is removed, so End skips it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(toggleGroupHtml());
    item("underline").remove();
    await settle();
    button("Bold").focus();

    // Act
    await user.keyboard("{End}");

    // Assert
    expect(button("Italic")).toBe(document.activeElement);
  });

  it("follows an item's value changing later", async () => {
    // Arrange
    await mount(toggleGroupHtml({ value: "strong" }));

    // Act
    item("bold").setAttribute("value", "strong");
    await settle();

    // Assert
    expect(button("Bold").getAttribute("aria-pressed")).toBe("true");
  });

  it("follows an item becoming disabled, moving the tab stop off it", async () => {
    // Arrange
    await mount(toggleGroupHtml());

    // Act
    item("bold").setAttribute("disabled", "");
    await settle();

    // Assert
    expect(button("Bold").getAttribute("aria-disabled")).toBe("true");
    expect(button("Italic").getAttribute("tabindex")).toBe("0");
  });

  it("follows the orientation changing later", async () => {
    // Arrange
    await mount(toggleGroupHtml());

    // Act
    root().setAttribute("orientation", "vertical");
    await settle();

    // Assert
    expect(root().getAttribute("data-orientation")).toBe("vertical");
  });

  it("decorates an item's child again when it is replaced", async () => {
    // Arrange
    await mount(toggleGroupHtml({ value: "italic" }));

    // Act
    item("italic").innerHTML = '<button type="button">Italic, replaced</button>';
    await settle();

    // Assert
    expect(button("Italic, replaced").getAttribute("aria-pressed")).toBe("true");
  });

  it("stops responding once removed from the document", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(toggleGroupHtml());
    const group = root();
    const holder = document.createElement("div");
    group.remove();
    holder.append(group);

    // Act
    await user.click(within(holder).getByRole("button", { name: "Italic", hidden: true }));

    // Assert
    expect(group.hasAttribute("value")).toBe(false);
  });

  it("handles each event exactly once after being moved", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<section id="a">${toggleGroupHtml()}</section><section id="b"></section>`);
    const changes: string[][] = [];
    document.addEventListener("primitiv-toggle-group-change", (event) => {
      changes.push((event as CustomEvent<{ value: string[] }>).detail.value);
    });

    // Act
    document.getElementById("b")?.append(root());
    await settle();
    await user.click(button("Italic"));

    // Assert
    expect(changes).toEqual([["italic"]]);
  });

  it("keeps a group nested in another independent of it, tab stop included", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(toggleGroupHtml({ value: "bold" }));
    root().insertAdjacentHTML(
      "beforeend",
      '<primitiv-toggle-group aria-label="Inner"><primitiv-toggle-group-item value="inner">' +
        '<button type="button">Inner</button></primitiv-toggle-group-item></primitiv-toggle-group>',
    );
    await settle();

    // Act
    await user.click(button("Inner"));
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("bold");
    expect(button("Bold").getAttribute("tabindex")).toBe("0");
    expect(button("Inner").getAttribute("aria-pressed")).toBe("true");
  });
});
