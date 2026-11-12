import userEvent from "@testing-library/user-event";

import { comboboxHtml } from "./combobox.fixtures";
import { field, item, mount, root, settle } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
});

const hidden = () => document.querySelector<HTMLInputElement>('input[type="hidden"]');

describe("<primitiv-combobox> in a form", () => {
  it("submits its value, not the field's text, under its name", async () => {
    // Arrange
    await mount(`<form>${comboboxHtml({ name: "framework", value: "vue" })}</form>`);

    // Act
    const data = new FormData(document.querySelector("form") as HTMLFormElement);

    // Assert
    expect(data.get("framework")).toBe("vue");
    expect(hidden()?.getAttribute("data-primitiv-combobox-native")).toBe("");
  });

  it("keeps its hidden input in step with the value", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(comboboxHtml({ name: "framework", open: true }));

    // Act
    await user.click(item("react"));
    await settle();

    // Assert
    expect(hidden()?.value).toBe("react");
  });

  it("keeps no hidden input without a name, and drops it when the name goes", async () => {
    // Arrange
    await mount(comboboxHtml({ name: "framework" }));

    // Act
    root().removeAttribute("name");
    await settle();

    // Assert
    expect(hidden()).toBeNull();
  });

  it("follows a name that changes", async () => {
    // Arrange
    await mount(comboboxHtml({ name: "framework" }));

    // Act
    root().setAttribute("name", "stack");
    await settle();

    // Assert
    expect(hidden()?.name).toBe("stack");
    expect(document.querySelectorAll('input[type="hidden"]')).toHaveLength(1);
  });

  it("stops following its old form's reset once it leaves it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<form>${comboboxHtml({ name: "framework", value: "vue" })}</form>`);
    const form = document.querySelector("form") as HTMLFormElement;
    document.body.append(root());
    await user.click(item("react"));
    await settle();

    // Act
    form.reset();
    await settle();

    // Assert
    expect(root().value).toBe("react");
  });

  it("restores the value and its text it first rendered with when its form resets", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(`<form>${comboboxHtml({ name: "framework", value: "vue" })}</form>`);
    await user.clear(field());
    await user.type(field(), "rea");
    await user.click(item("react"));
    await settle();

    // Act
    (document.querySelector("form") as HTMLFormElement).reset();
    await settle();

    // Assert
    expect(root().value).toBe("vue");
    expect(field().value).toBe("Vue");
  });
});
