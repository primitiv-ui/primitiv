import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { comboboxHtml } from "./combobox.fixtures";
import { field, item, mount, popup, root, settle, shown } from "./mount";

beforeAll(() => {
  // jsdom has no scrollIntoView; the cursor asks for it on every move.
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

/** Record every event of `type` the root fires. */
function record<T>(type: string): T[] {
  const details: T[] = [];
  root().addEventListener(type, (event) => details.push((event as CustomEvent<T>).detail));
  return details;
}

describe("<primitiv-combobox> interaction", () => {
  it("opens as the user types, announcing the query and the opening", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml());
    const queries: unknown[] = [];
    document.body.addEventListener("primitiv-combobox-query-change", (event) =>
      queries.push((event as CustomEvent).detail),
    );
    const opens = record<{ open: boolean }>("primitiv-combobox-open-change");

    // Act
    await user.type(field(), "re");
    await settle();

    // Assert
    expect(queries).toEqual([{ query: "r" }, { query: "re" }]);
    expect(opens).toEqual([{ open: true }]);
    expect(root().open).toBe(true);
    expect(shown(popup())).toBe(true);
    expect(field().getAttribute("aria-expanded")).toBe("true");
  });

  it("anchors the popup to the root's child that holds the field", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml());
    const showPopover = vi.spyOn(popup(), "showPopover");

    // Act
    await user.type(field(), "r");
    await settle();

    // Assert
    expect(showPopover).toHaveBeenCalledWith({ source: document.querySelector("primitiv-combobox-input") });
  });

  it("opens on ArrowDown, then moves a cursor published on the field and the option", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ disabledItems: ["preact"] }));
    field().focus();

    // Act
    await user.keyboard("{ArrowDown}");
    await settle();
    await user.keyboard("{ArrowDown}{ArrowDown}");

    // Assert
    expect(root().open).toBe(true);
    expect(field().getAttribute("aria-activedescendant")).toBe(item("vue").id);
    expect(item("vue").getAttribute("data-highlighted")).toBe("");
    expect(item("react").hasAttribute("data-highlighted")).toBe(false);
  });

  it("commits with Enter: the value changes, the field shows its text and the popup closes", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ open: true }));
    const changes = record<{ value: string }>("primitiv-combobox-change");
    field().focus();

    // Act
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    await settle();

    // Assert
    expect(changes).toEqual([{ value: "preact" }]);
    expect(root().value).toBe("preact");
    expect(field().value).toBe("Preact");
    expect(root().open).toBe(false);
    expect(shown(popup())).toBe(false);
    expect(field().hasAttribute("aria-activedescendant")).toBe(false);
    expect(item("preact").getAttribute("aria-selected")).toBe("true");
  });

  it("commits a clicked option, keeping focus in the field", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ open: true }));

    // Act
    await user.click(screen.getByRole("option", { name: "Vue", hidden: true }));
    await settle();

    // Assert
    expect(root().value).toBe("vue");
    expect(field().value).toBe("Vue");
    expect(document.activeElement).toBe(field());
  });

  it("announces no change when the committed option is chosen again, but still puts its text back", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ value: "vue" }));
    const changes = record<{ value: string }>("primitiv-combobox-change");
    await user.type(field(), "x");
    await settle();

    // Act
    await user.click(item("vue"));
    await settle();

    // Assert
    expect(changes).toEqual([]);
    expect(field().value).toBe("Vue");
  });

  it("keeps the value and its text when a commit is vetoed, closing all the same", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ value: "react", open: true }));
    root().addEventListener("primitiv-combobox-change", (event) => event.preventDefault());

    // Act
    await user.click(item("vue"));
    await settle();

    // Assert
    expect(root().value).toBe("react");
    expect(field().value).toBe("React");
    expect(root().open).toBe(false);
  });

  it("dismisses on Escape: closes and puts the committed text back over the query", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ value: "react" }));
    await user.type(field(), "zz{ArrowDown}");
    await settle();

    // Act
    await user.keyboard("{Escape}");
    await settle();

    // Assert
    expect(root().open).toBe(false);
    expect(field().value).toBe("React");
    expect(root().value).toBe("react");
  });

  it("dismisses the same way when the browser light-dismisses the popup", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ value: "vue" }));
    await user.type(field(), "p");
    await settle();

    // Act
    popup().hidePopover();
    await settle();

    // Assert
    expect(root().open).toBe(false);
    expect(field().value).toBe("Vue");
  });

  it("shows the popup again after a vetoed light dismiss", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml());
    await user.type(field(), "p");
    await settle();
    root().addEventListener("primitiv-combobox-open-change", (event) => event.preventDefault());

    // Act
    popup().hidePopover();
    await settle();

    // Assert
    expect(root().open).toBe(true);
    expect(shown(popup())).toBe(true);
  });

  it("stays closed when opening is vetoed", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml());
    root().addEventListener("primitiv-combobox-open-change", (event) => event.preventDefault());

    // Act
    await user.type(field(), "r");
    await settle();

    // Assert
    expect(root().open).toBe(false);
    expect(shown(popup())).toBe(false);
  });

  it("clears the value when the field is emptied, so Escape leaves it empty", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ value: "vue" }));
    const changes = record<{ value: string }>("primitiv-combobox-change");

    // Act
    await user.clear(field());
    await user.keyboard("{Escape}");
    await settle();

    // Assert
    expect(changes).toEqual([{ value: "" }]);
    expect(root().value).toBe("");
    expect(field().value).toBe("");
  });

  it("keeps the value when clearing is vetoed, and Escape puts its text back", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ value: "vue" }));
    root().addEventListener("primitiv-combobox-change", (event) => event.preventDefault());

    // Act
    await user.clear(field());
    await user.keyboard("{Escape}");
    await settle();

    // Assert
    expect(root().value).toBe("vue");
    expect(field().value).toBe("Vue");
  });

  it("skips a hidden option, and drops a cursor whose option a filter hides", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ open: true, hiddenItems: ["react"] }));
    field().focus();
    await user.keyboard("{ArrowDown}");
    expect(field().getAttribute("aria-activedescendant")).toBe(item("preact").id);

    // Act
    item("preact").hidden = true;
    await settle();

    // Assert
    expect(field().hasAttribute("aria-activedescendant")).toBe(false);
    expect(item("preact").hasAttribute("data-highlighted")).toBe(false);
  });

  it("never commits a disabled option", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ open: true, disabledItems: ["vue"] }));

    // Act
    await user.click(item("vue"));
    await settle();

    // Assert
    expect(root().value).toBe("");
    expect(root().open).toBe(true);
  });

  it("follows its value and open properties, showing the new value's text", async () => {
    // Arrange
    await mount(comboboxHtml({ value: "react" }));

    // Act
    root().value = "vue";
    root().open = true;
    await settle();

    // Assert
    expect(root().getAttribute("value")).toBe("vue");
    expect(field().value).toBe("Vue");
    expect(shown(popup())).toBe(true);
  });

  it("reads an empty value when it has no value attribute", async () => {
    // Arrange & Act
    await mount(comboboxHtml());

    // Assert
    expect(root().value).toBe("");
  });

  it("leaves the caret alone when the field already shows the committed text", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ value: "react" }));
    field().focus();
    await user.keyboard("{ArrowDown}");
    await settle();
    field().setSelectionRange(2, 2);

    // Act
    await user.keyboard("{Escape}");
    await settle();

    // Assert
    expect(field().selectionStart).toBe(2);
  });

  it("clears the cursor when the popup closes", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ open: true }));
    field().focus();
    await user.keyboard("{ArrowDown}");

    // Act
    root().open = false;
    await settle();

    // Assert
    expect(field().hasAttribute("aria-activedescendant")).toBe(false);
  });
});
