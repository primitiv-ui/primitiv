import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MillerColumns } from "../MillerColumns";

function Tree() {
  return (
    <MillerColumns.Root>
      <MillerColumns.Column>
        <MillerColumns.Item value="fruit">
          Fruit
          <MillerColumns.Column>
            <MillerColumns.Item value="apple">Apple</MillerColumns.Item>
          </MillerColumns.Column>
        </MillerColumns.Item>
        <MillerColumns.Item value="veg">Veg</MillerColumns.Item>
      </MillerColumns.Column>
    </MillerColumns.Root>
  );
}

describe("MillerColumns — data attributes", () => {
  it("marks each projected column with a depth hook", async () => {
    const user = userEvent.setup();

    render(<Tree />);

    await user.click(screen.getByRole("treeitem", { name: "Fruit" }));

    const groups = screen.getAllByRole("group");
    expect(groups[0]).toHaveAttribute("data-miller-columns-column");
    expect(groups[0]).toHaveAttribute("data-depth", "0");
    expect(groups[1]).toHaveAttribute("data-depth", "1");
  });

  it("reflects selection through data-state", async () => {
    const user = userEvent.setup();

    render(<Tree />);

    const veg = screen.getByRole("treeitem", { name: "Veg" });
    expect(veg).toHaveAttribute("data-state", "unselected");

    await user.click(veg);

    expect(veg).toHaveAttribute("data-state", "selected");
  });

  it("marks only the deepest selected item with data-terminal", async () => {
    const user = userEvent.setup();

    render(<Tree />);

    const fruit = screen.getByRole("treeitem", { name: "Fruit" });

    // Selected and deepest — it is the terminal selection.
    await user.click(fruit);
    expect(fruit).toHaveAttribute("data-terminal");

    // Still selected, but now an ancestor of a deeper selection.
    await user.click(screen.getByRole("treeitem", { name: "Apple" }));

    expect(fruit).toHaveAttribute("data-state", "selected");
    expect(fruit).not.toHaveAttribute("data-terminal");
    expect(screen.getByRole("treeitem", { name: "Apple" })).toHaveAttribute(
      "data-terminal",
    );

    // Unselected, but sitting at the same depth the terminal item once
    // occupied — depth alone must not be what earns the attribute.
    expect(
      screen.getByRole("treeitem", { name: "Veg" }),
    ).not.toHaveAttribute("data-terminal");
  });

  it("flags branch items with data-has-children and omits it on leaves", () => {
    render(<Tree />);

    expect(screen.getByRole("treeitem", { name: "Fruit" })).toHaveAttribute(
      "data-has-children",
    );
    expect(
      screen.getByRole("treeitem", { name: "Veg" }),
    ).not.toHaveAttribute("data-has-children");
  });

  it("marks each item with its column depth", async () => {
    const user = userEvent.setup();

    render(<Tree />);

    expect(screen.getByRole("treeitem", { name: "Fruit" })).toHaveAttribute(
      "data-depth",
      "0",
    );

    await user.click(screen.getByRole("treeitem", { name: "Fruit" }));

    expect(screen.getByRole("treeitem", { name: "Apple" })).toHaveAttribute(
      "data-depth",
      "1",
    );
  });
});
