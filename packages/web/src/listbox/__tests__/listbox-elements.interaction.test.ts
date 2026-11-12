import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineListbox } from "../elements";
import { listboxHtml } from "./listbox.fixtures";

beforeEach(() => {
  // jsdom has no scrollIntoView; the cursor asks for it on every move.
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

const listbox = () => screen.getByRole("listbox");
const option = (name: string) => screen.getByRole("option", { name });
const cursor = () => listbox().getAttribute("aria-activedescendant");
const highlighted = () => [...document.querySelectorAll("[data-highlighted]")].map((o) => o.textContent);

/** Every `primitiv-listbox-change` the page hears, by its `value`. */
function changes() {
  const heard: string[][] = [];
  document.addEventListener("primitiv-listbox-change", (event) => {
    heard.push((event as CustomEvent<{ value: string[] }>).detail.value);
  });
  return heard;
}

describe("<primitiv-listbox> interaction", () => {
  it("puts the cursor on the selected option when it takes focus, and clears it on blur", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(listboxHtml({ value: "banana" }) + "<button>After</button>");

    // Act
    await user.tab();
    const during = { cursor: cursor(), highlighted: highlighted() };
    const mark = option("Banana").getAttribute("data-highlighted");
    await user.tab();

    // Assert
    expect(during).toEqual({ cursor: option("Banana").id, highlighted: ["Banana"] });
    expect(mark).toBe("");
    expect(listbox().hasAttribute("aria-activedescendant")).toBe(false);
    expect(highlighted()).toEqual([]);
  });

  it("moves the cursor with the arrows without moving focus or selecting", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(listboxHtml());
    await user.tab();

    // Act
    await user.keyboard("{ArrowDown}{ArrowDown}");

    // Assert
    expect(cursor()).toBe(option("Banana").id);
    expect(document.activeElement).toBe(listbox());
    expect(listbox().hasAttribute("value")).toBe(false);
  });

  it("selects the option under the cursor on Enter, announcing the change first", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(listboxHtml({ value: "apple" }));
    const heard = changes();
    await user.tab();

    // Act
    await user.keyboard("{ArrowDown}{Enter}");

    // Assert
    expect(heard).toEqual([["avocado"]]);
    expect(listbox().getAttribute("value")).toBe("avocado");
    expect(option("Avocado").getAttribute("aria-selected")).toBe("true");
    expect(option("Apple").getAttribute("aria-selected")).toBe("false");
  });

  it("chooses a clicked option and moves the cursor there", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(listboxHtml());

    // Act
    await user.click(option("Banana"));

    // Assert
    expect(listbox().getAttribute("value")).toBe("banana");
    expect(cursor()).toBe(option("Banana").id);
  });

  it("keeps the selection when the change is vetoed", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(listboxHtml({ value: "apple" }));
    const veto = (event: Event) => event.preventDefault();
    document.addEventListener("primitiv-listbox-change", veto);

    // Act
    await user.click(option("Banana"));
    document.removeEventListener("primitiv-listbox-change", veto);

    // Assert
    expect(listbox().getAttribute("value")).toBe("apple");
  });

  it("toggles options independently in a multiple listbox", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(listboxHtml({ type: "multiple", value: "apple" }));

    // Act
    await user.click(option("Banana"));
    await user.click(option("Apple"));

    // Assert
    expect(listbox().getAttribute("value")).toBe("banana");
  });

  it("extends the selection with Shift+Arrow in a multiple listbox", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(listboxHtml({ type: "multiple", value: "apple" }));
    await user.tab();

    // Act
    await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");

    // Assert
    expect(document.querySelector("primitiv-listbox")?.value).toEqual(["apple", "avocado", "banana"]);
  });

  it("selects as the cursor moves when selection follows focus", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(listboxHtml({ followFocus: true, value: "apple" }));
    await user.tab();

    // Act
    await user.keyboard("{End}");

    // Assert
    expect(listbox().getAttribute("value")).toBe("carrot");
  });

  it("jumps to the option whose text starts with what is typed", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(listboxHtml());
    await user.tab();

    // Act
    await user.keyboard("c");

    // Assert
    expect(cursor()).toBe(option("Carrot").id);
  });

  it("uses the horizontal arrows, mirrored under right-to-left, in a horizontal listbox", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<div dir="rtl">${listboxHtml({ orientation: "horizontal" })}</div>`);
    await user.tab();

    // Act
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(cursor()).toBe(option("Avocado").id);
  });

  it("skips a disabled option and never chooses it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(listboxHtml({ disabled: ["avocado"] }));
    await user.tab();

    // Act
    await user.keyboard("{ArrowDown}");
    await user.click(option("Avocado"));

    // Assert
    expect(cursor()).toBe(option("Banana").id);
    expect(listbox().hasAttribute("value")).toBe(false);
  });

  it("navigates options across groups as one list", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(listboxHtml({ grouped: true }));
    await user.tab();

    // Act
    await user.keyboard("{End}{Enter}");

    // Assert
    expect(listbox().getAttribute("value")).toBe("carrot");
  });

  it("sets the selection through the value property, as an array or a string", async () => {
    // Arrange
    await mount(listboxHtml({ type: "multiple" }));
    const element = listbox() as HTMLElement & { value: string | string[] };

    // Act
    element.value = ["apple", "carrot"];
    await settle();
    const fromArray = element.getAttribute("value");
    element.value = "banana";
    await settle();

    // Assert
    expect(fromArray).toBe("apple carrot");
    expect(element.getAttribute("value")).toBe("banana");
    expect(option("Banana").getAttribute("aria-selected")).toBe("true");
  });
});
