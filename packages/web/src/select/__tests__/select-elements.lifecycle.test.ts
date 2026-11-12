import "./popover-polyfill";

import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineSelect } from "../elements";
import { selectHtml } from "./select.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mount(html: string) {
  defineSelect();
  document.body.innerHTML = html;
  await settle();
}

const root = () => document.querySelector("primitiv-select") as HTMLElement & { value: string };
const content = () => document.querySelector("primitiv-select-content") as HTMLElement;
const option = (name: string) => screen.getByRole("option", { name, hidden: true });
const trigger = () => screen.getByRole("button", { name: "Fruit" });
const valueText = () => document.querySelector("primitiv-select-value")?.textContent;

describe("<primitiv-select> lifecycle", () => {
  it("picks up an item added after it rendered", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(selectHtml({ open: true }));
    content().insertAdjacentHTML("beforeend", '<primitiv-select-item value="date">Date</primitiv-select-item>');
    await settle();

    // Act
    await user.click(option("Date"));

    // Assert
    expect(root().value).toBe("date");
    expect(valueText()).toBe("Date");
  });

  it("falls back to the placeholder once the chosen item is removed", async () => {
    // Arrange
    await mount(selectHtml({ value: "banana" }));

    // Act
    option("Banana").remove();
    await settle();

    // Assert
    expect(valueText()).toBe("Pick a fruit");
  });

  it("follows an item's value changing later", async () => {
    // Arrange
    await mount(selectHtml({ value: "kiwi" }));

    // Act
    option("Apple").setAttribute("value", "kiwi");
    await settle();

    // Assert
    expect(option("Apple").getAttribute("aria-selected")).toBe("true");
  });

  it("follows a group's label changing later", async () => {
    // Arrange
    await mount(selectHtml({ grouped: true }));

    // Act
    document.querySelector("primitiv-select-group")?.setAttribute("label", "Fruits");
    await settle();

    // Assert
    expect(screen.getByRole("group", { name: "Fruits", hidden: true })).toBeDefined();
  });

  it("follows an indicator's force-mount changing later", async () => {
    // Arrange
    await mount(selectHtml({ indicators: true }));

    // Act
    document.querySelector("primitiv-select-item-indicator")?.setAttribute("force-mount", "");
    await settle();

    // Assert
    expect(document.querySelector("primitiv-select-item-indicator")?.hasAttribute("hidden")).toBe(false);
  });

  it("follows the placeholder changing later", async () => {
    // Arrange
    await mount(selectHtml());

    // Act
    document.querySelector("primitiv-select-value")?.setAttribute("placeholder", "Choose");
    await settle();

    // Assert
    expect(valueText()).toBe("Choose");
  });

  it("decorates the trigger's button again when it is replaced", async () => {
    // Arrange
    await mount(selectHtml());

    // Act
    (document.querySelector("primitiv-select-trigger") as HTMLElement).innerHTML =
      '<button type="button" aria-label="Fruit"><primitiv-select-value placeholder="Pick a fruit"></primitiv-select-value></button>';
    await settle();

    // Assert
    expect(trigger().getAttribute("aria-haspopup")).toBe("listbox");
  });

  it("stops responding once removed from the document", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(selectHtml());
    const select = root();
    const holder = document.createElement("div");
    select.remove();
    holder.append(select);

    // Act
    await user.click(within(holder).getByRole("button", { name: "Fruit" }));

    // Assert
    expect(select.hasAttribute("open")).toBe(false);
  });

  it("handles each event exactly once after being moved", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<section id="a">${selectHtml()}</section><section id="b"></section>`);
    const opens: boolean[] = [];
    document.addEventListener("primitiv-select-open-change", (event) => {
      opens.push((event as CustomEvent<{ open: boolean }>).detail.open);
    });

    // Act
    document.getElementById("b")?.append(root());
    await settle();
    await user.click(trigger());

    // Assert
    expect(opens).toEqual([true]);
  });

  it("lets go of its content once it is removed", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(selectHtml({ open: true }));
    const list = content();

    // Act
    list.remove();
    await settle();
    await user.click(within(list).getByRole("option", { name: "Apple", hidden: true }));

    // Assert
    expect(trigger().hasAttribute("aria-controls")).toBe(false);
    expect(root().hasAttribute("value")).toBe(false);
  });

  it("renders its items with no trigger part", async () => {
    // Arrange & Act
    await mount(selectHtml({ value: "apple" }).replace(/<primitiv-select-trigger>.*<\/primitiv-select-trigger>/, ""));

    // Assert
    expect(option("Apple").getAttribute("aria-selected")).toBe("true");
  });

  it("works without content, and picks up content added later", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(selectHtml().replace(/<primitiv-select-content>.*<\/primitiv-select-content>/, ""));
    await user.click(trigger());
    const expanded = trigger().getAttribute("aria-expanded");
    const controls = trigger().hasAttribute("aria-controls");

    // Act
    root().insertAdjacentHTML("beforeend", '<primitiv-select-content><primitiv-select-item value="apple">Apple</primitiv-select-item></primitiv-select-content>');
    await settle();

    // Assert
    expect(expanded).toBe("true");
    expect(controls).toBe(false);
    expect(trigger().getAttribute("aria-controls")).toBe(content().id);
    expect(document.activeElement).toBe(option("Apple"));
  });
});
