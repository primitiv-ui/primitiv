import { screen } from "@testing-library/dom";

import { defineListbox, type ElementRegistry } from "../elements";
import { listboxHtml } from "./listbox.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/** Mount markup and let the root's first reconcile settle. */
async function mount(html: string) {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineListbox();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const listbox = () => screen.getByRole("listbox");
const option = (name: string) => screen.getByRole("option", { name });
const selected = () => screen.getAllByRole("option").map((o) => o.getAttribute("aria-selected"));

const ELEMENTS = ["primitiv-listbox", "primitiv-listbox-option", "primitiv-listbox-group", "primitiv-listbox-group-label"];

describe("<primitiv-listbox> rendering", () => {
  it("defines every element, and defining twice is harmless", () => {
    // Arrange & Act
    defineListbox();
    defineListbox();

    // Assert
    for (const name of ELEMENTS) {
      expect(customElements.get(name)).toBeDefined();
    }
  });

  it("defines exactly its tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-listbox-group" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineListbox(registry);

    // Assert
    expect(defined).toEqual(["primitiv-listbox", "primitiv-listbox-option", "primitiv-listbox-group-label"]);
  });

  it("does nothing where there is no registry", () => {
    // Arrange & Act & Assert
    expect(() => defineListbox(undefined)).not.toThrow();
  });

  it("makes the root a focusable, named listbox", async () => {
    // Arrange & Act
    await mount(listboxHtml());

    // Assert
    expect(screen.getByRole("listbox", { name: "Produce" }).getAttribute("tabindex")).toBe("0");
  });

  it("selects the options in its value and no others", async () => {
    // Arrange & Act
    await mount(listboxHtml({ type: "multiple", value: "apple banana" }));

    // Assert
    expect(selected()).toEqual(["true", "false", "true", "false"]);
  });

  it("selects nothing with no value", async () => {
    // Arrange & Act
    await mount(listboxHtml());

    // Assert
    expect(selected()).toEqual(["false", "false", "false", "false"]);
  });

  it("marks only a multiple listbox multiselectable", async () => {
    // Arrange & Act
    await mount(listboxHtml({ type: "multiple" }) + listboxHtml({ type: "single", label: "Single" }));

    // Assert
    const [multiple, single] = screen.getAllByRole("listbox");
    expect(multiple.getAttribute("aria-multiselectable")).toBe("true");
    expect(single.hasAttribute("aria-multiselectable")).toBe(false);
  });

  it("publishes data-orientation, vertical by default, and aria-orientation only when horizontal", async () => {
    // Arrange & Act
    await mount(listboxHtml() + listboxHtml({ orientation: "horizontal", label: "Row" }));

    // Assert
    const [vertical, horizontal] = screen.getAllByRole("listbox");
    expect(vertical.getAttribute("data-orientation")).toBe("vertical");
    expect(vertical.hasAttribute("aria-orientation")).toBe(false);
    expect(horizontal.getAttribute("data-orientation")).toBe("horizontal");
    expect(horizontal.getAttribute("aria-orientation")).toBe("horizontal");
  });

  it("gives each option an id derived from the root's id and its value", async () => {
    // Arrange & Act
    await mount(listboxHtml().replace("<primitiv-listbox ", '<primitiv-listbox id="produce" '));

    // Assert
    expect(option("Avocado").id).toBe("produce-option-avocado");
  });

  it("generates a root id when it has none, distinct between two listboxes", async () => {
    // Arrange & Act
    await mount(listboxHtml() + listboxHtml({ label: "Other" }));

    // Assert
    const ids = screen.getAllByRole("option", { name: "Apple" }).map((o) => o.id);
    expect(ids[0]).toMatch(/^primitiv-listbox-\d+-option-apple$/);
    expect(new Set(ids).size).toBe(2);
  });

  it("keeps an id the server rendered on an option", async () => {
    // Arrange & Act
    await mount(listboxHtml({ optionId: "first" }));

    // Assert
    expect(option("Apple").id).toBe("first");
  });

  it("marks a disabled option with aria-disabled and data-disabled, and no other", async () => {
    // Arrange & Act
    await mount(listboxHtml({ disabled: ["avocado"] }));

    // Assert
    expect(option("Avocado").getAttribute("aria-disabled")).toBe("true");
    expect(option("Avocado").getAttribute("data-disabled")).toBe("");
    expect(option("Apple").hasAttribute("aria-disabled")).toBe(false);
    expect(option("Apple").hasAttribute("data-disabled")).toBe(false);
  });

  it("has no cursor until it takes focus", async () => {
    // Arrange & Act
    await mount(listboxHtml({ value: "banana" }));

    // Assert
    expect(listbox().hasAttribute("aria-activedescendant")).toBe(false);
    expect(document.querySelector("[data-highlighted]")).toBeNull();
  });

  it("names each group by its label, which is presentational", async () => {
    // Arrange & Act
    await mount(listboxHtml({ grouped: true }));

    // Assert
    const fruit = screen.getByRole("group", { name: "Fruit" });
    const label = fruit.querySelector("primitiv-listbox-group-label") as HTMLElement;
    expect(label.getAttribute("role")).toBe("presentation");
    expect(fruit.getAttribute("aria-labelledby")).toBe(label.id);
    expect(screen.getByRole("group", { name: "Vegetables" })).toBeDefined();
  });

  it("keeps a group label's own id, and leaves an unlabelled group's aria-label alone", async () => {
    // Arrange & Act
    await mount(
      `<primitiv-listbox aria-label="Produce">` +
        `<primitiv-listbox-group><primitiv-listbox-group-label id="fruit">Fruit</primitiv-listbox-group-label>` +
        `<primitiv-listbox-option value="apple">Apple</primitiv-listbox-option></primitiv-listbox-group>` +
        `<primitiv-listbox-group aria-label="Roots"><primitiv-listbox-option value="carrot">Carrot</primitiv-listbox-option></primitiv-listbox-group>` +
        `</primitiv-listbox>`,
    );

    // Assert
    expect(screen.getByRole("group", { name: "Fruit" }).getAttribute("aria-labelledby")).toBe("fruit");
    expect(screen.getByRole("group", { name: "Roots" }).hasAttribute("aria-labelledby")).toBe(false);
  });

  it("reports an option with no value once, and leaves it undecorated", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(
      `<primitiv-listbox aria-label="Produce"><primitiv-listbox-option>Mystery</primitiv-listbox-option>` +
        `<primitiv-listbox-option value="apple">Apple</primitiv-listbox-option></primitiv-listbox>`,
    );
    listbox().setAttribute("value", "apple");
    await Promise.resolve();

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0]).toBe("<primitiv-listbox-option> needs a value.");
    expect(screen.getByText("Mystery").hasAttribute("role")).toBe(false);
    expect(option("Apple").getAttribute("aria-selected")).toBe("true");
    error.mockRestore();
  });
});
