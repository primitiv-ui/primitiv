import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState, type RefObject } from "react";
import { describe, expect, it, vi } from "vitest";

import { Combobox } from "../Combobox";

const field = () => screen.getByRole("combobox", { name: "Framework" });
const option = (name: string) => screen.getByRole("option", { hidden: true, name });

describe("Combobox's state, refs and registry", () => {
  it("empties the field on Escape before anything has been committed", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Combobox.Root>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Item value="react">React</Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>,
    );

    // Act
    await user.type(field(), "zz");
    await user.keyboard("{Escape}");

    // Assert
    expect(field()).toHaveValue("");
  });

  it("derives each option's id as an option id under the combobox's", () => {
    // Arrange & Act
    render(
      <Combobox.Root defaultOpen>
        <Combobox.Input aria-label="Framework" />
        <Combobox.Content aria-label="Frameworks">
          <Combobox.Item value="react">React</Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>,
    );

    // Assert
    expect(option("React").id).toMatch(/-option-react$/);
  });

  it("throws a helpful error for a part outside Combobox.Root", () => {
    // Arrange
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Act & Assert
    expect(() => render(<Combobox.Input aria-label="Framework" />)).toThrow(
      "Combobox sub-components must be rendered as children of Combobox.Root",
    );
    vi.restoreAllMocks();
  });

  it("forgets an item once it unmounts, so the cursor never lands on it", async () => {
    // Arrange
    const user = userEvent.setup();
    function Filtered() {
      const [query, setQuery] = useState("");
      const items = ["React", "Preact", "Vue"].filter((label) => query.length < 2 || label !== "React");
      return (
        <Combobox.Root onQueryChange={setQuery}>
          <Combobox.Input aria-label="Framework" />
          <Combobox.Content aria-label="Frameworks">
            {items.map((label) => (
              <Combobox.Item key={label} value={label.toLowerCase()}>
                {label}
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Root>
      );
    }
    render(<Filtered />);

    // Act
    await user.type(field(), "xx");
    await user.keyboard("{ArrowDown}");
    const entered = field().getAttribute("aria-activedescendant");
    await user.keyboard("{ArrowUp}");

    // Assert
    expect(entered).toBe(option("Preact").id);
    expect(field()).toHaveAttribute("aria-activedescendant", option("Vue").id);
  });

  it("commits an item's current label after it changes", async () => {
    // Arrange
    const user = userEvent.setup();
    function Relabelled() {
      const [label, setLabel] = useState("React");
      return (
        <Combobox.Root onQueryChange={(query) => setLabel(query.length > 1 ? "React 19" : "React")}>
          <Combobox.Input aria-label="Framework" />
          <Combobox.Content aria-label="Frameworks">
            <Combobox.Item value="react">{label}</Combobox.Item>
          </Combobox.Content>
        </Combobox.Root>
      );
    }
    render(<Relabelled />);

    // Act
    await user.type(field(), "re");
    await user.keyboard("{ArrowDown}{Enter}");

    // Assert
    expect(field()).toHaveValue("React 19");
  });

  it("hands every part's element to a consumer ref that changes between renders", () => {
    // Arrange
    function Parts({ refs }: { refs: RefObject<HTMLElement | null>[] }) {
      const [root, input, content, item] = refs;
      return (
        <Combobox.Root ref={root as RefObject<HTMLDivElement | null>} defaultOpen>
          <Combobox.Input aria-label="Framework" ref={input as RefObject<HTMLInputElement | null>} />
          <Combobox.Content aria-label="Frameworks" ref={content as RefObject<HTMLDivElement | null>}>
            <Combobox.Item value="react" ref={item as RefObject<HTMLDivElement | null>}>
              React
            </Combobox.Item>
          </Combobox.Content>
        </Combobox.Root>
      );
    }
    const first = [createRef<HTMLElement>(), createRef<HTMLElement>(), createRef<HTMLElement>(), createRef<HTMLElement>()];
    const second = [createRef<HTMLElement>(), createRef<HTMLElement>(), createRef<HTMLElement>(), createRef<HTMLElement>()];
    const { rerender } = render(<Parts refs={first} />);

    // Act
    rerender(<Parts refs={second} />);

    // Assert
    expect(second.map((ref) => ref.current)).toEqual([
      field().parentElement,
      field(),
      screen.getByRole("listbox", { hidden: true }),
      option("React"),
    ]);
  });
});
