import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MillerColumns } from "../MillerColumns";

function Tree({ forceMount }: { forceMount?: boolean } = {}) {
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
      <MillerColumns.PreviewPanel forceMount={forceMount}>
        preview
      </MillerColumns.PreviewPanel>
    </MillerColumns.Root>
  );
}

/**
 * Finder's rule: the preview occupies the slot *after* the selected item, so it
 * exists only when that item has no children of its own. Select a folder and
 * you get its contents there instead; select nothing and there is no preview
 * at all.
 */
describe("MillerColumns — preview panel visibility", () => {
  it("renders no preview until something is selected", () => {
    render(<Tree />);

    expect(screen.queryByText("preview")).not.toBeInTheDocument();
  });

  it("renders no preview while a branch is selected", async () => {
    const user = userEvent.setup();

    render(<Tree />);
    await user.click(screen.getByRole("treeitem", { name: "Fruit" }));

    // The slot after Fruit belongs to its children, not to a preview.
    expect(screen.getByRole("treeitem", { name: "Apple" })).toBeInTheDocument();
    expect(screen.queryByText("preview")).not.toBeInTheDocument();
  });

  it("renders the preview once a leaf is selected", async () => {
    const user = userEvent.setup();

    render(<Tree />);
    await user.click(screen.getByRole("treeitem", { name: "Veg" }));

    expect(screen.getByText("preview")).toBeInTheDocument();
  });

  it("renders the preview for a leaf nested inside a branch", async () => {
    const user = userEvent.setup();

    render(<Tree />);
    await user.click(screen.getByRole("treeitem", { name: "Fruit" }));
    await user.click(screen.getByRole("treeitem", { name: "Apple" }));

    expect(screen.getByText("preview")).toBeInTheDocument();
  });

  it("keeps the panel mounted throughout when forceMount is set", async () => {
    const user = userEvent.setup();

    render(<Tree forceMount />);

    expect(screen.getByText("preview")).toBeInTheDocument();

    await user.click(screen.getByRole("treeitem", { name: "Fruit" }));

    expect(screen.getByText("preview")).toBeInTheDocument();
  });
});
