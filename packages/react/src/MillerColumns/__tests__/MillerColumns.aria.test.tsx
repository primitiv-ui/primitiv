import { render, screen, within } from "@testing-library/react";
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

describe("MillerColumns — aria", () => {
  it("nests treeitems inside group columns inside the tree", () => {
    render(<Tree />);

    const tree = screen.getByRole("tree");
    const column = within(tree).getByRole("group");
    expect(within(column).getByRole("treeitem", { name: "Fruit" })).toBeInTheDocument();
  });

  it("sets aria-level reflecting the column depth", async () => {
    const user = userEvent.setup();

    render(<Tree />);

    expect(screen.getByRole("treeitem", { name: "Fruit" })).toHaveAttribute(
      "aria-level",
      "1",
    );

    await user.click(screen.getByRole("treeitem", { name: "Fruit" }));

    expect(screen.getByRole("treeitem", { name: "Apple" })).toHaveAttribute(
      "aria-level",
      "2",
    );
  });

  it("sets aria-expanded on branch items only", async () => {
    const user = userEvent.setup();

    render(<Tree />);

    expect(screen.getByRole("treeitem", { name: "Fruit" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(
      screen.getByRole("treeitem", { name: "Veg" }),
    ).not.toHaveAttribute("aria-expanded");

    await user.click(screen.getByRole("treeitem", { name: "Fruit" }));

    expect(screen.getByRole("treeitem", { name: "Fruit" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("puts the tree role on an inner element, not the strip container", () => {
    const { container } = render(<Tree />);

    const strip = container.querySelector("[data-miller-columns-strip]");
    const tree = screen.getByRole("tree");

    expect(strip).not.toBe(tree);
    expect(strip).toContainElement(tree);
  });

  it("keeps the preview panel outside the tree", () => {
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
        <MillerColumns.PreviewPanel data-testid="preview">
          Preview
        </MillerColumns.PreviewPanel>
      </MillerColumns.Root>,
    );

    // A tree may only own treeitem and group; the panel is neither.
    expect(screen.getByRole("tree")).not.toContainElement(
      screen.getByTestId("preview"),
    );
  });

  it("splits aria-* onto the tree widget and everything else onto the strip", () => {
    const { container } = render(
      <MillerColumns.Root aria-label="Files" className="strip" id="picker">
        <MillerColumns.Column>
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    const strip = container.querySelector(".strip")!;

    // The widget is what needs naming; the container is what needs styling.
    expect(screen.getByRole("tree", { name: "Files" })).toBeInTheDocument();
    expect(strip).not.toHaveAttribute("aria-label");
    expect(strip).toHaveAttribute("id", "picker");
  });

  it("keeps a treeitem's accessible name to its own cell content", async () => {
    const user = userEvent.setup();

    render(<Tree />);

    await user.click(screen.getByRole("treeitem", { name: "Fruit" }));

    // Revealing the child column must not pollute the parent's name.
    expect(
      screen.getByRole("treeitem", { name: "Fruit" }),
    ).toBeInTheDocument();
  });
});
