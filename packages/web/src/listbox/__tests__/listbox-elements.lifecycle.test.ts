import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineListbox } from "../elements";
import { listboxHtml } from "./listbox.fixtures";

beforeEach(() => {
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  document.body.replaceChildren();
});

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mount(html: string) {
  defineListbox();
  document.body.innerHTML = html;
  await settle();
}

const root = () => document.querySelector("primitiv-listbox") as HTMLElement;
const option = (name: string) => screen.getByRole("option", { name });

describe("<primitiv-listbox> lifecycle", () => {
  it("picks up an option added after it rendered", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(listboxHtml());
    root().insertAdjacentHTML("beforeend", '<primitiv-listbox-option value="date">Date</primitiv-listbox-option>');
    await settle();

    // Act
    await user.click(option("Date"));

    // Assert
    expect(option("Date").getAttribute("aria-selected")).toBe("true");
  });

  it("forgets an option once it is removed, so End skips it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(listboxHtml());
    option("Carrot").remove();
    await settle();
    await user.tab();

    // Act
    await user.keyboard("{End}");

    // Assert
    expect(root().getAttribute("aria-activedescendant")).toBe(option("Banana").id);
  });

  it("follows an option's value changing later", async () => {
    // Arrange
    await mount(listboxHtml({ value: "kiwi" }));

    // Act
    option("Apple").setAttribute("value", "kiwi");
    await settle();

    // Assert
    expect(option("Apple").getAttribute("aria-selected")).toBe("true");
  });

  it("follows an option becoming disabled", async () => {
    // Arrange
    await mount(listboxHtml());

    // Act
    option("Banana").setAttribute("disabled", "");
    await settle();

    // Assert
    expect(option("Banana").getAttribute("aria-disabled")).toBe("true");
  });

  it("follows the type changing later", async () => {
    // Arrange
    await mount(listboxHtml());

    // Act
    root().setAttribute("type", "multiple");
    await settle();

    // Assert
    expect(root().getAttribute("aria-multiselectable")).toBe("true");
  });

  it("follows the orientation changing later", async () => {
    // Arrange
    await mount(listboxHtml());

    // Act
    root().setAttribute("orientation", "horizontal");
    await settle();

    // Assert
    expect(root().getAttribute("aria-orientation")).toBe("horizontal");
  });

  it("names a group by a label added later, and stops once it is removed", async () => {
    // Arrange
    await mount(
      `<primitiv-listbox aria-label="Produce"><primitiv-listbox-group>` +
        `<primitiv-listbox-option value="apple">Apple</primitiv-listbox-option></primitiv-listbox-group></primitiv-listbox>`,
    );
    const group = document.querySelector("primitiv-listbox-group") as HTMLElement;

    // Act
    group.insertAdjacentHTML("afterbegin", "<primitiv-listbox-group-label>Fruit</primitiv-listbox-group-label>");
    await settle();
    const named = group.getAttribute("aria-labelledby");
    group.querySelector("primitiv-listbox-group-label")?.remove();
    await settle();

    // Assert
    expect(named).toMatch(/-group-label-0$/);
    expect(group.hasAttribute("aria-labelledby")).toBe(false);
  });

  it("stops responding once removed from the document", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(listboxHtml());
    const listbox = root();
    const holder = document.createElement("div");
    listbox.remove();
    holder.append(listbox);

    // Act
    await user.click(within(holder).getByRole("option", { name: "Banana", hidden: true }));

    // Assert
    expect(listbox.hasAttribute("value")).toBe(false);
  });

  it("handles each event exactly once after being moved", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<section id="a">${listboxHtml({ type: "multiple" })}</section><section id="b"></section>`);
    const heard: string[][] = [];
    document.addEventListener("primitiv-listbox-change", (event) => {
      heard.push((event as CustomEvent<{ value: string[] }>).detail.value);
    });

    // Act
    document.getElementById("b")?.append(root());
    await settle();
    await user.click(option("Banana"));

    // Assert
    expect(heard).toEqual([["banana"]]);
  });
});
