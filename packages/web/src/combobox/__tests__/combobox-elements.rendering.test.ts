import { screen } from "@testing-library/dom";

import { defineCombobox, type ElementRegistry } from "../elements";
import { comboboxHtml } from "./combobox.fixtures";
import { field, item, mount, popup, root, settle, shown } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

const ELEMENTS = [
  "primitiv-combobox",
  "primitiv-combobox-input",
  "primitiv-combobox-content",
  "primitiv-combobox-item",
  "primitiv-combobox-empty",
];

describe("<primitiv-combobox> rendering", () => {
  it("defines every element, and defining twice is harmless", () => {
    // Arrange & Act
    defineCombobox();
    defineCombobox();

    // Assert
    for (const name of ELEMENTS) expect(customElements.get(name)).toBeDefined();
  });

  it("defines exactly its tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-combobox-empty" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineCombobox(registry);

    // Assert
    expect(defined).toEqual(ELEMENTS.filter((name) => name !== "primitiv-combobox-empty"));
  });

  it("does nothing where there is no registry", () => {
    // Arrange & Act & Assert
    expect(() => defineCombobox(undefined)).not.toThrow();
  });

  it("makes the field a list-autocomplete combobox controlling the popup", async () => {
    // Arrange & Act
    await mount(comboboxHtml());

    // Assert
    const combobox = screen.getByRole("combobox", { name: "Framework" });
    expect(combobox).toBe(field());
    expect(combobox.getAttribute("aria-autocomplete")).toBe("list");
    expect(combobox.getAttribute("aria-expanded")).toBe("false");
    expect(combobox.getAttribute("aria-controls")).toBe(popup().id);
    expect(combobox.hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("makes the content a popover listbox, with an id derived from the root's", async () => {
    // Arrange & Act
    await mount(comboboxHtml({ id: "framework" }));

    // Assert
    expect(screen.getByRole("listbox", { hidden: true })).toBe(popup());
    expect(popup().id).toBe("framework-content");
    expect(popup().getAttribute("popover")).toBe("auto");
  });

  it("keeps a content id and a popover mode the server rendered", async () => {
    // Arrange & Act
    await mount(
      comboboxHtml().replace("<primitiv-combobox-content", '<primitiv-combobox-content id="mine" popover="manual"'),
    );

    // Assert
    expect(popup().id).toBe("mine");
    expect(popup().getAttribute("popover")).toBe("manual");
    expect(field().getAttribute("aria-controls")).toBe("mine");
  });

  it("generates a root id when it has none, distinct between two comboboxes", async () => {
    // Arrange & Act
    await mount(comboboxHtml() + comboboxHtml());

    // Assert
    const [first, second] = [...document.querySelectorAll("primitiv-combobox-content")];
    expect(first.id).toMatch(/^primitiv-combobox-\d+-content$/);
    expect(first.id).not.toBe(second.id);
  });

  it("makes each item an option with an id derived from the root's and its value, selecting only the value", async () => {
    // Arrange & Act
    await mount(comboboxHtml({ id: "framework", value: "preact" }));

    // Assert
    expect(item("react").getAttribute("role")).toBe("option");
    expect(item("react").id).toBe("framework-option-react");
    expect(item("preact").getAttribute("aria-selected")).toBe("true");
    expect(item("react").getAttribute("aria-selected")).toBe("false");
    expect(item("vue").getAttribute("aria-selected")).toBe("false");
  });

  it("keeps an id the server rendered on an item", async () => {
    // Arrange & Act
    await mount(comboboxHtml().replace('value="vue"', 'value="vue" id="own"'));

    // Assert
    expect(item("vue").id).toBe("own");
  });

  it("marks a disabled item with aria-disabled and data-disabled, and no other", async () => {
    // Arrange & Act
    await mount(comboboxHtml({ disabledItems: ["vue"] }));

    // Assert
    expect(item("vue").getAttribute("aria-disabled")).toBe("true");
    expect(item("vue").getAttribute("data-disabled")).toBe("");
    expect(item("react").hasAttribute("aria-disabled")).toBe(false);
    expect(item("react").hasAttribute("data-disabled")).toBe(false);
  });

  it("shows the committed item's text in an empty field", async () => {
    // Arrange & Act
    await mount(comboboxHtml({ value: "vue" }));

    // Assert
    expect(field().value).toBe("Vue");
  });

  it("shows an item's text without the space around it", async () => {
    // Arrange & Act
    await mount(comboboxHtml({ value: "vue" }).replace(">Vue<", ">\n  Vue\n<"));

    // Assert
    expect(field().value).toBe("Vue");
  });

  it("shows an item's label attribute in place of its text", async () => {
    // Arrange & Act
    await mount(comboboxHtml({ value: "vue" }).replace('item value="vue">', 'item value="vue" label="Vue.js">'));

    // Assert
    expect(field().value).toBe("Vue.js");
  });

  it("shows the value itself when no item carries it", async () => {
    // Arrange & Act
    await mount(comboboxHtml({ value: "svelte" }));

    // Assert
    expect(field().value).toBe("svelte");
  });

  it("keeps the text the server rendered in the field", async () => {
    // Arrange & Act
    await mount(comboboxHtml({ value: "vue", text: "Vue 3" }));

    // Assert
    expect(field().value).toBe("Vue 3");
  });

  it("shows the empty part only while no item is shown, as a presentation", async () => {
    // Arrange
    await mount(comboboxHtml({ empty: true }));
    const empty = document.querySelector("primitiv-combobox-empty") as HTMLElement;
    expect(empty.getAttribute("hidden")).toBe("");
    expect(empty.getAttribute("role")).toBe("presentation");

    // Act
    item("react").hidden = true;
    await settle();
    const whileOneShows = empty.hidden;
    for (const value of ["preact", "vue"]) item(value).hidden = true;
    await settle();

    // Assert
    expect(whileOneShows).toBe(true);
    expect(empty.hidden).toBe(false);
  });

  it("shows the popup when it renders open", async () => {
    // Arrange & Act
    await mount(comboboxHtml({ open: true }));

    // Assert
    expect(shown(popup())).toBe(true);
    expect(field().getAttribute("aria-expanded")).toBe("true");
  });

  it("reports an item with no value once, and leaves it undecorated", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(comboboxHtml().replace('<primitiv-combobox-item value="vue">', "<primitiv-combobox-item>"));
    root().setAttribute("value", "react");
    await settle();

    // Assert
    const bare = document.querySelectorAll("primitiv-combobox-item")[2];
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith("<primitiv-combobox-item> needs a value.", bare);
    expect(bare.hasAttribute("role")).toBe(false);
  });

  it("reports an input part that does not hold exactly one element, and leaves it undecorated", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(comboboxHtml().replace('<input aria-label="Framework">', "<input><input>"));

    // Assert
    const part = document.querySelector("primitiv-combobox-input") as HTMLElement;
    expect(error).toHaveBeenCalledWith(
      "<primitiv-combobox-input> needs exactly one element child (an <input>) to decorate.",
      part,
    );
    expect(document.querySelector('[role="combobox"]')).toBeNull();
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(comboboxHtml({ id: "framework", value: "vue", text: "Vue", empty: true }));
    const rendered = document.body.innerHTML;
    document.body.replaceChildren();
    const writes = vi.spyOn(Element.prototype, "setAttribute");
    const removals = vi.spyOn(Element.prototype, "removeAttribute");

    // Act
    document.body.innerHTML = rendered;
    await Promise.resolve();

    // Assert
    expect(writes).not.toHaveBeenCalled();
    expect(removals).not.toHaveBeenCalled();
  });

  it("writes no class and no style on anything", async () => {
    // Arrange & Act
    await mount(comboboxHtml({ value: "react", empty: true }));

    // Assert
    expect(document.querySelectorAll("[class], [style]")).toHaveLength(0);
  });
});
