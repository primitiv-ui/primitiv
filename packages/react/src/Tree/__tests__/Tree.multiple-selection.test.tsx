import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tree } from "../Tree";

function renderTree(props?: {
  defaultSelectedValues?: string[];
  selectedValues?: string[];
  onSelectedValuesChange?: (values: string[]) => void;
}) {
  return render(
    <Tree.Root selectionMode="multiple" {...props}>
      <Tree.Item value="a">Apples</Tree.Item>
      <Tree.Item value="b">Bananas</Tree.Item>
      <Tree.Item value="c">Cherries</Tree.Item>
    </Tree.Root>,
  );
}

describe("Tree multiple selection tests", () => {
  it("should expose aria-multiselectable on the tree root in multiple mode", () => {
    // Arrange
    renderTree();

    // Assert
    expect(screen.getByRole("tree")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
  });

  it("should reflect defaultSelectedValues on first render", () => {
    // Arrange
    renderTree({ defaultSelectedValues: ["a", "c"] });

    // Assert
    expect(screen.getByText("Apples")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Bananas")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByText("Cherries")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("should replace selection on a plain click", async () => {
    // Arrange
    const user = userEvent.setup();
    renderTree({ defaultSelectedValues: ["a", "b"] });

    // Act
    await user.click(screen.getByText("Cherries"));

    // Assert
    expect(screen.getByText("Apples")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Bananas")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByText("Cherries")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("should add to selection on Ctrl+click", async () => {
    // Arrange
    const user = userEvent.setup();
    renderTree({ defaultSelectedValues: ["a"] });

    // Act
    await user.keyboard("{Control>}");
    await user.click(screen.getByText("Bananas"));
    await user.keyboard("{/Control}");

    // Assert
    expect(screen.getByText("Apples")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Bananas")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("should remove from selection on Ctrl+click of an already-selected item", async () => {
    // Arrange
    const user = userEvent.setup();
    renderTree({ defaultSelectedValues: ["a", "b"] });

    // Act
    await user.keyboard("{Control>}");
    await user.click(screen.getByText("Apples"));
    await user.keyboard("{/Control}");

    // Assert
    expect(screen.getByText("Apples")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Bananas")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("should report onSelectedValuesChange with the next array", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelectedValuesChange = vi.fn();
    renderTree({ defaultSelectedValues: ["a"], onSelectedValuesChange });

    // Act
    await user.keyboard("{Control>}");
    await user.click(screen.getByText("Bananas"));
    await user.keyboard("{/Control}");

    // Assert
    expect(onSelectedValuesChange).toHaveBeenCalledWith(["a", "b"]);
  });

  it("should not refire onSelectedValuesChange on a plain click of the only selected item", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelectedValuesChange = vi.fn();
    renderTree({
      defaultSelectedValues: ["a"],
      onSelectedValuesChange,
    });

    // Act — plain click on the already-only-selected item
    await user.click(screen.getByText("Apples"));

    // Assert
    expect(onSelectedValuesChange).not.toHaveBeenCalled();
  });

  it("should not expose aria-multiselectable in single mode", () => {
    // Arrange
    render(
      <Tree.Root>
        <Tree.Item value="a">Apples</Tree.Item>
      </Tree.Root>,
    );

    // Assert
    expect(screen.getByRole("tree")).not.toHaveAttribute(
      "aria-multiselectable",
    );
  });
});
