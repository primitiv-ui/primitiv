import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tree } from "..";

const item = (name: string) => screen.getByRole("treeitem", { name });

describe("Tree lifecycle", () => {
  it("leaves an item that unmounted out of the keyboard order", async () => {
    // Arrange
    const user = userEvent.setup();
    const tree = (b: boolean) => (
      <Tree.Root>
        <Tree.Item value="a">A</Tree.Item>
        {b && <Tree.Item value="b">B</Tree.Item>}
        <Tree.Item value="c">C</Tree.Item>
      </Tree.Root>
    );
    const { rerender } = render(tree(true));
    rerender(tree(false));
    item("A").focus();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(document.activeElement).toBe(item("C"));
  });

  it("leaves a branch that unmounted out of the keyboard order", async () => {
    // Arrange
    const user = userEvent.setup();
    const tree = (b: boolean) => (
      <Tree.Root>
        <Tree.Item value="a">A</Tree.Item>
        {b && (
          <Tree.Branch value="b">
            <Tree.BranchControl>B</Tree.BranchControl>
          </Tree.Branch>
        )}
        <Tree.Item value="c">C</Tree.Item>
      </Tree.Root>
    );
    const { rerender } = render(tree(true));
    rerender(tree(false));
    item("A").focus();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(document.activeElement).toBe(item("C"));
  });

  it("follows a branch's disabled prop that changes after mount", async () => {
    // Arrange
    const user = userEvent.setup();
    const tree = (disabled: boolean) => (
      <Tree.Root>
        <Tree.Branch value="a" disabled={disabled}>
          <Tree.BranchControl>A</Tree.BranchControl>
        </Tree.Branch>
      </Tree.Root>
    );
    const { rerender } = render(tree(false));
    rerender(tree(true));

    // Act
    await user.click(screen.getByText("A"));

    // Assert
    expect(item("A").getAttribute("aria-expanded")).toBe("false");
    expect(item("A").getAttribute("data-state")).toBe("closed");
  });

  it("follows a disabled prop that changes after mount", async () => {
    // Arrange
    const user = userEvent.setup();
    const tree = (disabled: boolean) => (
      <Tree.Root>
        <Tree.Item value="a" disabled={disabled}>
          A
        </Tree.Item>
      </Tree.Root>
    );
    const { rerender } = render(tree(false));
    rerender(tree(true));

    // Act
    await user.click(item("A"));

    // Assert
    expect(item("A").getAttribute("aria-selected")).toBe("false");
  });

  it("calls the selection callback it has now, not the one it mounted with", async () => {
    // Arrange
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const tree = (onSelectedValueChange: (value: string | null) => void) => (
      <Tree.Root onSelectedValueChange={onSelectedValueChange}>
        <Tree.Item value="a">A</Tree.Item>
      </Tree.Root>
    );
    const { rerender } = render(tree(first));
    rerender(tree(second));

    // Act
    await user.click(item("A"));

    // Assert
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("a");
  });

  it("shows each label change in the selection path", () => {
    // Arrange
    const tree = (label: string) => (
      <Tree.Root defaultSelectedValue="a">
        <Tree.Item value="a" label={label}>
          A
        </Tree.Item>
        <Tree.SelectionPath />
      </Tree.Root>
    );
    const { rerender, container } = render(tree("One"));

    // Act
    rerender(tree("Two"));
    const second = container.querySelector("[aria-current]")?.textContent;
    rerender(tree("Three"));

    // Assert
    expect(second).toBe("Two");
    expect(container.querySelector("[aria-current]")?.textContent).toBe("Three");
  });

  it("holds a controlled multiple selection to the values it is given", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelectedValuesChange = vi.fn();
    render(
      <Tree.Root selectionMode="multiple" selectedValues={["a"]} onSelectedValuesChange={onSelectedValuesChange}>
        <Tree.Item value="a">A</Tree.Item>
        <Tree.Item value="b">B</Tree.Item>
      </Tree.Root>,
    );

    // Act
    await user.click(item("B"));

    // Assert
    expect(onSelectedValuesChange).toHaveBeenCalledWith(["b"]);
    expect(item("A").getAttribute("aria-selected")).toBe("true");
    expect(item("B").getAttribute("aria-selected")).toBe("false");
  });

  it("keeps the selection path empty with nothing selected in multiple mode", () => {
    // Arrange & Act
    const { container } = render(
      <Tree.Root selectionMode="multiple">
        <Tree.Item value="a">A</Tree.Item>
        <Tree.SelectionPath />
      </Tree.Root>,
    );

    // Assert
    expect(container.querySelector("[data-tree-selection-path]")?.hasAttribute("data-empty")).toBe(true);
  });

  it("renders a branch with a row and no group", () => {
    // Arrange & Act
    render(
      <Tree.Root defaultExpandedValues={["a"]}>
        <Tree.Branch value="a">
          <Tree.BranchControl>A</Tree.BranchControl>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Assert
    expect(item("A").getAttribute("aria-expanded")).toBe("true");
  });

  it("marks a branch's state, selection and disabled exactly, labels it by its row, and its group's depth", () => {
    // Arrange & Act
    render(
      <Tree.Root defaultExpandedValues={["a"]} defaultSelectedValue="a">
        <Tree.Branch value="a" disabled>
          <Tree.BranchControl>A</Tree.BranchControl>
          <Tree.BranchContent>
            <Tree.Item value="b">B</Tree.Item>
          </Tree.BranchContent>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Assert
    expect(item("A").getAttribute("data-state")).toBe("open");
    expect(item("A").getAttribute("data-branch")).toBe("");
    expect(item("A").getAttribute("data-selected")).toBe("");
    expect(item("A").getAttribute("data-disabled")).toBe("");
    expect(item("A").getAttribute("aria-labelledby")).toMatch(/-branch-control-a$/);
    expect(screen.getByRole("group").getAttribute("data-depth")).toBe("1");
  });

  it("moves the tab stop to a branch focus lands on", () => {
    // Arrange
    render(
      <Tree.Root>
        <Tree.Item value="a">A</Tree.Item>
        <Tree.Branch value="b">
          <Tree.BranchControl>B</Tree.BranchControl>
        </Tree.Branch>
      </Tree.Root>,
    );

    // Act
    act(() => item("B").focus());

    // Assert
    expect(item("B").tabIndex).toBe(0);
    expect(item("A").tabIndex).toBe(-1);
  });
});
