import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TYPEAHEAD_RESET_MS } from "../constants";
import { MillerColumns } from "../MillerColumns";

function Tree() {
  return (
    <MillerColumns.Root>
      <MillerColumns.Column>
        <MillerColumns.Item value="apricot">Apricot</MillerColumns.Item>
        <MillerColumns.Item value="banana">Banana</MillerColumns.Item>
        <MillerColumns.Item value="blueberry">Blueberry</MillerColumns.Item>
        <MillerColumns.Item value="cherry">
          Cherry
          <MillerColumns.Column>
            <MillerColumns.Item value="morello">Morello</MillerColumns.Item>
            <MillerColumns.Item value="maraschino">
              Maraschino
            </MillerColumns.Item>
          </MillerColumns.Column>
        </MillerColumns.Item>
      </MillerColumns.Column>
    </MillerColumns.Root>
  );
}

describe("MillerColumns — typeahead", () => {
  it("focuses the first item whose label starts with the typed character", async () => {
    const user = userEvent.setup();

    render(<Tree />);
    screen.getByRole("treeitem", { name: "Apricot" }).focus();

    await user.keyboard("c");

    expect(screen.getByRole("treeitem", { name: "Cherry" })).toHaveFocus();
  });

  it("accumulates characters into a prefix query", async () => {
    const user = userEvent.setup();

    render(<Tree />);
    screen.getByRole("treeitem", { name: "Apricot" }).focus();

    await user.keyboard("bl");

    expect(screen.getByRole("treeitem", { name: "Blueberry" })).toHaveFocus();
  });

  it("cycles through matches when the same character repeats", async () => {
    const user = userEvent.setup();

    render(<Tree />);
    screen.getByRole("treeitem", { name: "Apricot" }).focus();

    await user.keyboard("b");
    expect(screen.getByRole("treeitem", { name: "Banana" })).toHaveFocus();

    await user.keyboard("b");
    expect(screen.getByRole("treeitem", { name: "Blueberry" })).toHaveFocus();
  });

  it("searches only within the focused column", async () => {
    const user = userEvent.setup();

    render(<Tree />);
    await user.click(screen.getByRole("treeitem", { name: "Cherry" }));
    screen.getByRole("treeitem", { name: "Morello" }).focus();

    // "B" matches Banana and Blueberry, but both are in the parent column.
    await user.keyboard("b");
    expect(screen.getByRole("treeitem", { name: "Morello" })).toHaveFocus();

    // Let the query lapse — otherwise the next keys extend it to "bma".
    await new Promise((resolve) =>
      setTimeout(resolve, TYPEAHEAD_RESET_MS + 100),
    );

    await user.keyboard("ma");
    expect(screen.getByRole("treeitem", { name: "Maraschino" })).toHaveFocus();
  });

  it("skips disabled items", async () => {
    const user = userEvent.setup();

    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">Apricot</MillerColumns.Item>
          <MillerColumns.Item value="b1" disabled>
            Banana
          </MillerColumns.Item>
          <MillerColumns.Item value="b2">Blueberry</MillerColumns.Item>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );
    screen.getByRole("treeitem", { name: "Apricot" }).focus();

    await user.keyboard("b");

    expect(screen.getByRole("treeitem", { name: "Blueberry" })).toHaveFocus();
  });
});
