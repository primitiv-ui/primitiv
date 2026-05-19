import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tree } from "../Tree";

type SingleSelectionOverrides = {
  defaultSelectedValue?: string | null;
  selectedValue?: string | null;
  onSelectedValueChange?: (value: string | null) => void;
};

function renderTree(props?: SingleSelectionOverrides) {
  return render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tree.Root {...(props as any)}>
      <Tree.Item value="a">Apples</Tree.Item>
      <Tree.Item value="b">Bananas</Tree.Item>
    </Tree.Root>,
  );
}

describe("Tree single selection tests", () => {
  it("should leave items unselected by default", () => {
    // Arrange
    renderTree();

    // Assert
    expect(screen.getByText("Apples")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Bananas")).toHaveAttribute("aria-selected", "false");
  });

  it("should reflect defaultSelectedValue on first render", () => {
    // Arrange
    renderTree({ defaultSelectedValue: "a" });

    // Assert
    expect(screen.getByText("Apples")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Bananas")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("should select an item when it is clicked (uncontrolled)", async () => {
    // Arrange
    const user = userEvent.setup();
    renderTree();

    // Act
    await user.click(screen.getByText("Apples"));

    // Assert
    expect(screen.getByText("Apples")).toHaveAttribute("aria-selected", "true");
  });

  it("should replace selection when a different item is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    renderTree({ defaultSelectedValue: "a" });

    // Act
    await user.click(screen.getByText("Bananas"));

    // Assert
    expect(screen.getByText("Apples")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Bananas")).toHaveAttribute("aria-selected", "true");
  });

  it("should report the new value through onSelectedValueChange", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelectedValueChange = vi.fn();
    renderTree({ onSelectedValueChange });

    // Act
    await user.click(screen.getByText("Apples"));

    // Assert
    expect(onSelectedValueChange).toHaveBeenCalledWith("a");
  });

  it("should not change selection itself when controlled", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelectedValueChange = vi.fn();
    renderTree({ selectedValue: null, onSelectedValueChange });

    // Act
    await user.click(screen.getByText("Apples"));

    // Assert — the component defers; the consumer must flip selectedValue
    expect(screen.getByText("Apples")).toHaveAttribute("aria-selected", "false");
    expect(onSelectedValueChange).toHaveBeenCalledWith("a");
  });

  it("should not refire onSelectedValueChange when the same item is reclicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelectedValueChange = vi.fn();
    renderTree({ defaultSelectedValue: "a", onSelectedValueChange });

    // Act
    await user.click(screen.getByText("Apples"));

    // Assert
    expect(onSelectedValueChange).not.toHaveBeenCalled();
  });
});
