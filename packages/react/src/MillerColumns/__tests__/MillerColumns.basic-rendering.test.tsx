import { render, screen } from "@testing-library/react";

import { MillerColumns } from "../MillerColumns";

describe("MillerColumns — basic rendering", () => {
  it("renders a strip container with a horizontal orientation hook", () => {
    const { container } = render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    const strip = container.querySelector("[data-miller-columns-strip]");

    expect(strip).toBeInTheDocument();
    expect(strip).toHaveAttribute("data-orientation", "horizontal");
  });

  it("renders the tree widget inside the strip container", () => {
    const { container } = render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    const tree = screen.getByRole("tree");

    expect(tree).toHaveAttribute("data-miller-columns-tree");
    expect(container.querySelector("[data-miller-columns-strip]")).toContainElement(tree);
  });

  it("projects the top-level column into the strip as a group", () => {
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    const strip = screen.getByRole("tree");
    const column = screen.getByRole("group");

    expect(strip).toContainElement(column);
  });

  it("renders each item as a treeitem with its content", () => {
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">Apples</MillerColumns.Item>
          <MillerColumns.Item value="b">Bananas</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    const items = screen.getAllByRole("treeitem");

    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Apples");
    expect(items[1]).toHaveTextContent("Bananas");
  });
});
