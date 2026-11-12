import userEvent from "@testing-library/user-event";

import { comboboxHtml } from "./combobox.fixtures";
import { field, item, mount, popup, root, settle, shown } from "./mount";

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("<primitiv-combobox> lifecycle", () => {
  it("picks up an item added after it rendered, and commits it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ open: true }));
    popup().insertAdjacentHTML("beforeend", '<primitiv-combobox-item value="svelte">Svelte</primitiv-combobox-item>');
    await settle();

    // Act
    await user.click(item("svelte"));
    await settle();

    // Assert
    expect(item("svelte").getAttribute("role")).toBe("option");
    expect(root().value).toBe("svelte");
  });

  it("skips an item that becomes disabled later", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ open: true }));
    item("react").setAttribute("disabled", "");
    await settle();
    field().focus();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(item("react").getAttribute("aria-disabled")).toBe("true");
    expect(field().getAttribute("aria-activedescendant")).toBe(item("preact").id);
  });

  it("keeps the committed text when a filter swaps the committed item out", async () => {
    // Arrange
    await mount(comboboxHtml({ value: "vue" }));

    // Act
    item("vue").remove();
    await settle();

    // Assert
    expect(field().value).toBe("Vue");
  });

  it("decorates a field that arrives later, showing the committed text in it", async () => {
    // Arrange
    await mount(comboboxHtml({ value: "vue" }).replace('<input aria-label="Framework">', ""));

    // Act
    document.querySelector("primitiv-combobox-input")?.insertAdjacentHTML("beforeend", '<input aria-label="Framework">');
    await settle();

    // Assert
    expect(field().getAttribute("role")).toBe("combobox");
    expect(field().value).toBe("Vue");
  });

  it("works without content, and picks up content added later", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml().replace(/<primitiv-combobox-content.*<\/primitiv-combobox-content>/, ""));
    await user.type(field(), "r");
    await settle();
    expect(field().hasAttribute("aria-controls")).toBe(false);

    // Act
    root().insertAdjacentHTML(
      "beforeend",
      '<primitiv-combobox-content><primitiv-combobox-item value="react">React</primitiv-combobox-item></primitiv-combobox-content>',
    );
    await settle();

    // Assert
    expect(field().getAttribute("aria-controls")).toBe(popup().id);
    expect(shown(popup())).toBe(true);
  });

  it("works without a field part, committing a clicked item", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ value: "vue", open: true }).replace(/<primitiv-combobox-input>.*<\/primitiv-combobox-input>/, ""));
    expect(shown(popup())).toBe(true);

    // Act
    await user.click(item("react"));
    await settle();

    // Assert
    expect(item("react").getAttribute("aria-selected")).toBe("true");
    expect(root().open).toBe(false);
  });

  it("stops responding once removed from the document", async () => {
    // Arrange
    await mount(comboboxHtml());
    const element = root();
    const input = field();
    const queries: unknown[] = [];
    element.addEventListener("primitiv-combobox-query-change", (event) => queries.push(event));
    element.remove();

    // Act
    input.value = "r";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();

    // Assert
    expect(queries).toEqual([]);
    expect(element.open).toBe(false);
  });

  it("closes without a field part when the browser light-dismisses it", async () => {
    // Arrange
    await mount(comboboxHtml({ open: true }).replace(/<primitiv-combobox-input>.*<\/primitiv-combobox-input>/, ""));

    // Act
    popup().hidePopover();
    await settle();

    // Assert
    expect(root().open).toBe(false);
  });

  it("handles each event exactly once after being moved", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<div id="a">${comboboxHtml()}</div><div id="b"></div>`);
    const opens: unknown[] = [];
    root().addEventListener("primitiv-combobox-open-change", (event) => opens.push(event));
    document.getElementById("b")?.append(root());
    await settle();

    // Act
    await user.type(field(), "r");
    await settle();

    // Assert
    expect(opens).toHaveLength(1);
    expect(shown(popup())).toBe(true);
  });

  it("keeps a nested combobox's parts out of its own", async () => {
    // Arrange & Act
    await mount(
      comboboxHtml({ id: "outer", value: "react" }).replace(
        "</primitiv-combobox-content>",
        `${comboboxHtml({ id: "inner", value: "vue" })}</primitiv-combobox-content>`,
      ),
    );

    // Assert
    const inner = document.getElementById("inner") as HTMLElement;
    const innerVue = inner.querySelector('primitiv-combobox-item[value="vue"]') as HTMLElement;
    expect(innerVue.id).toBe("inner-option-vue");
    expect(innerVue.getAttribute("aria-selected")).toBe("true");
  });
});
