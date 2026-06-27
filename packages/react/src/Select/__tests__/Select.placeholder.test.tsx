import { render, screen } from "@testing-library/react";

import { Select } from "../Select";

describe("Select placeholder", () => {
  it("renders a non-selectable placeholder option that holds the initial selection until the user picks something", () => {
    // Arrange & Act
    const { container } = render(
      <Select.Root>
        <Select.Placeholder>Choose a fruit…</Select.Placeholder>
        <Select.Option value="apple">Apple</Select.Option>
      </Select.Root>,
    );

    // Assert — placeholder is in the DOM with the attributes that make it
    // unreachable from the dropdown after the first selection. The
    // `hidden` attribute also pulls it out of the ARIA tree, so query the
    // DOM directly rather than via getByRole.
    const placeholder = container.querySelector(
      "option[hidden]",
    ) as HTMLOptionElement | null;
    expect(placeholder).not.toBeNull();
    expect(placeholder).toBeDisabled();
    expect(placeholder).toHaveAttribute("value", "");
    expect(placeholder).toHaveTextContent("Choose a fruit…");

    // …and is the initial selection because it's the first option with an
    // empty value.
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("");
  });

  it("ignores non-element children when scanning for a placeholder", () => {
    // Arrange & Act — a bare text node sits among the options (e.g. stray
    // whitespace or a conditional that resolved to a string). The placeholder
    // scan must skip it rather than treat it as a candidate.
    const { container } = render(
      <Select.Root>
        {"  "}
        <Select.Option value="apple">Apple</Select.Option>
      </Select.Root>,
    );

    // Assert — with no placeholder present, no empty-value default is inferred,
    // so the browser falls back to the first real option.
    expect(container.querySelector("option[hidden]")).toBeNull();
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("apple");
  });
});
