import "./popover-polyfill";

import { screen } from "@testing-library/dom";
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

const root = () => document.querySelector("primitiv-select") as HTMLElement & { value: string; open: boolean };
const trigger = () => screen.getByRole("button", { name: "Fruit" });
const listbox = () => screen.getByRole("listbox", { hidden: true });
const option = (name: string) => screen.getByRole("option", { name, hidden: true });
const shown = () => listbox().hasAttribute("data-popover-open");

/** Every event of `type` the page hears, by its detail. */
function heard<T>(type: string) {
  const details: T[] = [];
  const listener = (event: Event) => details.push((event as CustomEvent<T>).detail);
  document.addEventListener(type, listener);
  return { details, stop: () => document.removeEventListener(type, listener) };
}

describe("<primitiv-select> interaction", () => {
  it("opens from the trigger, announcing it first, with focus on the selected option", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(selectHtml({ value: "banana" }));
    const opens = heard<{ open: boolean }>("primitiv-select-open-change");

    // Act
    await user.click(trigger());
    opens.stop();

    // Assert
    expect(opens.details).toEqual([{ open: true }]);
    expect(root().hasAttribute("open")).toBe(true);
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(shown()).toBe(true);
    expect(document.activeElement).toBe(option("Banana"));
  });

  it("closes from the trigger when it is open", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(selectHtml({ open: true }));

    // Act
    await user.click(trigger());

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
    expect(shown()).toBe(false);
  });

  it("chooses a clicked option: the value changes, the list closes and focus returns to the trigger", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(selectHtml({ value: "apple" }));
    const changes = heard<{ value: string }>("primitiv-select-change");
    await user.click(trigger());

    // Act
    await user.click(option("Cherry"));
    changes.stop();

    // Assert
    expect(changes.details).toEqual([{ value: "cherry" }]);
    expect(root().getAttribute("value")).toBe("cherry");
    expect(root().hasAttribute("open")).toBe(false);
    expect(document.activeElement).toBe(trigger());
    expect(document.querySelector("primitiv-select-value")?.textContent).toBe("Cherry");
  });

  it("chooses with the keyboard", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(selectHtml({ value: "apple" }));
    await user.click(trigger());

    // Act
    await user.keyboard("{ArrowDown}{Enter}");

    // Assert
    expect(root().value).toBe("banana");
  });

  it("announces no value change when the selected option is chosen again", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(selectHtml({ value: "apple" }));
    const changes = heard<{ value: string }>("primitiv-select-change");
    await user.click(trigger());

    // Act
    await user.click(option("Apple"));
    changes.stop();

    // Assert
    expect(changes.details).toEqual([]);
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("keeps the value when the change is vetoed, closing all the same", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(selectHtml({ value: "apple" }));
    const veto = (event: Event) => event.preventDefault();
    document.addEventListener("primitiv-select-change", veto);
    await user.click(trigger());

    // Act
    await user.click(option("Cherry"));
    document.removeEventListener("primitiv-select-change", veto);

    // Assert
    expect(root().value).toBe("apple");
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("stays closed when opening is vetoed", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(selectHtml());
    const veto = (event: Event) => event.preventDefault();
    document.addEventListener("primitiv-select-open-change", veto);

    // Act
    await user.click(trigger());
    document.removeEventListener("primitiv-select-open-change", veto);

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
    expect(shown()).toBe(false);
  });

  it("shows the list again after a vetoed light dismiss", async () => {
    // Arrange
    await mount(selectHtml({ open: true }));
    const veto = (event: Event) => event.preventDefault();
    document.addEventListener("primitiv-select-open-change", veto);

    // Act
    listbox().hidePopover();
    await settle();
    document.removeEventListener("primitiv-select-open-change", veto);

    // Assert
    expect(root().hasAttribute("open")).toBe(true);
    expect(shown()).toBe(true);
  });

  it("anchors the list to the trigger's button", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(selectHtml());
    const showPopover = vi.spyOn(listbox(), "showPopover");

    // Act
    await user.click(trigger());

    // Assert
    expect(showPopover).toHaveBeenCalledWith({ source: trigger() });
  });

  it("announces exactly one close for Escape", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(selectHtml());
    await user.click(trigger());
    const opens = heard<{ open: boolean }>("primitiv-select-open-change");

    // Act
    await user.keyboard("{Escape}");
    await settle();
    opens.stop();

    // Assert
    expect(opens.details).toEqual([{ open: false }]);
  });

  it("closes on Escape with focus back on the trigger", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(selectHtml());
    await user.click(trigger());

    // Act
    await user.keyboard("{Escape}");

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
    expect(document.activeElement).toBe(trigger());
  });

  it("never chooses a disabled item", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(selectHtml({ disabledItems: ["cherry"], open: true }));

    // Act
    await user.click(option("Cherry"));

    // Assert
    expect(root().hasAttribute("value")).toBe(false);
  });

  it("survives a vetoed open with no content, and a click with no trigger", async () => {
    // Arrange
    const user = userEvent.setup();
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error);
    window.addEventListener("error", onError);
    await mount(
      selectHtml().replace(/<primitiv-select-content>.*<\/primitiv-select-content>/, "") +
        selectHtml().replace(/<primitiv-select-trigger>.*<\/primitiv-select-trigger>/, ""),
    );
    const veto = (event: Event) => event.preventDefault();
    document.addEventListener("primitiv-select-open-change", veto);

    // Act
    await user.click(trigger());
    await settle();
    document.removeEventListener("primitiv-select-open-change", veto);
    await user.click(document.querySelectorAll("primitiv-select")[1] as HTMLElement);
    window.removeEventListener("error", onError);

    // Assert
    expect(errors).toEqual([]);
  });

  it("opens and sets the value through its properties", async () => {
    // Arrange
    await mount(selectHtml());

    // Act
    root().value = "banana";
    root().open = true;
    await settle();
    const opened = shown();
    root().open = false;
    await settle();

    // Assert
    expect(opened).toBe(true);
    expect(root().getAttribute("value")).toBe("banana");
    expect(root().open).toBe(false);
    expect(shown()).toBe(false);
  });
});
