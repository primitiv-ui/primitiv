import "./popover-polyfill";

import userEvent from "@testing-library/user-event";

import { defineSelect } from "../elements";
import { selectHtml, type SelectFixture } from "./select.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function mountForm(fixture: SelectFixture) {
  defineSelect();
  document.body.innerHTML = `<form>${selectHtml(fixture)}</form>`;
  await settle();
  return document.querySelector("form") as HTMLFormElement;
}

const root = () => document.querySelector("primitiv-select") as HTMLElement & { value: string };
const native = () => root().querySelector("select") as HTMLSelectElement | null;

describe("<primitiv-select> in a form", () => {
  it("submits its value under its name through a hidden native select", async () => {
    // Arrange & Act
    const form = await mountForm({ name: "fruit", value: "banana" });

    // Assert
    expect([...new FormData(form).entries()]).toEqual([["fruit", "banana"]]);
    expect(native()?.getAttribute("aria-hidden")).toBe("true");
    expect(native()?.getAttribute("tabindex")).toBe("-1");
    expect([...(native()?.options ?? [])].map((o) => o.value)).toEqual(["", "apple", "banana", "cherry"]);
  });

  it("submits the empty string with nothing selected", async () => {
    // Arrange & Act
    const form = await mountForm({ name: "fruit" });

    // Assert
    expect([...new FormData(form).entries()]).toEqual([["fruit", ""]]);
  });

  it("follows the value as the user chooses", async () => {
    // Arrange
    const user = userEvent.setup();
    const form = await mountForm({ name: "fruit", value: "apple", open: true });

    // Act
    await user.click(document.querySelectorAll("primitiv-select-item")[2] as HTMLElement);
    await settle();

    // Assert
    expect(new FormData(form).get("fruit")).toBe("cherry");
  });

  it("is invalid while required and empty, and valid once chosen", async () => {
    // Arrange
    const form = await mountForm({ name: "fruit", required: true });
    const before = form.checkValidity();

    // Act
    root().value = "apple";
    await settle();

    // Assert
    expect(before).toBe(false);
    expect(form.checkValidity()).toBe(true);
  });

  it("follows required and disabled changing later", async () => {
    // Arrange
    const form = await mountForm({ name: "fruit" });

    // Act
    root().setAttribute("required", "");
    await settle();
    const invalid = !form.checkValidity();
    root().setAttribute("disabled", "");
    await settle();

    // Assert
    expect(invalid).toBe(true);
    expect([...new FormData(form).entries()]).toEqual([]);
  });

  it("adds no second empty option for an item valued with the empty string", async () => {
    // Arrange & Act
    await mountForm({ name: "fruit" });
    root().querySelector("primitiv-select-content")?.insertAdjacentHTML("afterbegin", '<primitiv-select-item value="">None</primitiv-select-item>');
    await settle();

    // Assert
    expect([...(native()?.options ?? [])].map((o) => o.value)).toEqual(["", "apple", "banana", "cherry"]);
    expect([...(native()?.options ?? [])].map((o) => o.textContent)).toEqual(["", "", "", ""]);
    expect(native()?.getAttribute("data-primitiv-select-native")).toBe("");
  });

  it("submits nothing while disabled", async () => {
    // Arrange & Act
    const form = await mountForm({ name: "fruit", value: "apple", disabled: true });

    // Assert
    expect([...new FormData(form).entries()]).toEqual([]);
  });

  it("returns to the value it rendered with when the form resets", async () => {
    // Arrange
    const user = userEvent.setup();
    const form = await mountForm({ name: "fruit", value: "apple", open: true });
    await user.click(document.querySelectorAll("primitiv-select-item")[1] as HTMLElement);
    await settle();

    // Act
    form.reset();
    await settle();

    // Assert
    expect(root().value).toBe("apple");
    expect(new FormData(form).get("fruit")).toBe("apple");
  });

  it("stops answering its old form's reset once it leaves that form", async () => {
    // Arrange
    const form = await mountForm({ name: "fruit", value: "apple" });
    const select = root();
    document.body.append(select);
    await settle();
    select.setAttribute("value", "cherry");
    await settle();

    // Act
    form.reset();
    await settle();

    // Assert
    expect(select.getAttribute("value")).toBe("cherry");
  });

  it("keeps no native select without a name, and drops it once the name goes", async () => {
    // Arrange
    await mountForm({ value: "apple" });
    const without = native();
    root().setAttribute("name", "fruit");
    await settle();
    const named = native();

    // Act
    root().removeAttribute("name");
    await settle();

    // Assert
    expect(without).toBeNull();
    expect(named).not.toBeNull();
    expect(native()).toBeNull();
  });
});
