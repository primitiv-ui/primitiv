import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DirectionProvider } from "../../DirectionProvider/index.ts";
import { MillerColumns } from "../MillerColumns";
import { verticalArrowCases } from "./MillerColumns.fixtures";

function FlatList() {
  return (
    <MillerColumns.Root>
      <MillerColumns.Column>
        <MillerColumns.Item value="a">A</MillerColumns.Item>
        <MillerColumns.Item value="b">B</MillerColumns.Item>
        <MillerColumns.Item value="c">C</MillerColumns.Item>
      </MillerColumns.Column>
    </MillerColumns.Root>
  );
}

function Tree({ dir }: { dir?: "ltr" | "rtl" } = {}) {
  return (
    <MillerColumns.Root dir={dir}>
      <MillerColumns.Column>
        <MillerColumns.Item value="fruit">
          Fruit
          <MillerColumns.Column>
            <MillerColumns.Item value="apple">Apple</MillerColumns.Item>
            <MillerColumns.Item value="pear">Pear</MillerColumns.Item>
          </MillerColumns.Column>
        </MillerColumns.Item>
        <MillerColumns.Item value="veg">Veg</MillerColumns.Item>
      </MillerColumns.Column>
    </MillerColumns.Root>
  );
}

describe("MillerColumns — keyboard interaction", () => {
  describe("vertical navigation within a column", () => {
    it.each(verticalArrowCases)(
      "$key moves focus from $from to $to",
      async ({ key, from, to }) => {
        const user = userEvent.setup();

        render(<FlatList />);
        screen.getByRole("treeitem", { name: from }).focus();

        await user.keyboard(key);

        expect(screen.getByRole("treeitem", { name: to })).toHaveFocus();
      },
    );

    it("skips disabled items during arrow navigation", async () => {
      const user = userEvent.setup();

      render(
        <MillerColumns.Root>
          <MillerColumns.Column>
            <MillerColumns.Item value="a">A</MillerColumns.Item>
            <MillerColumns.Item value="b" disabled>
              B
            </MillerColumns.Item>
            <MillerColumns.Item value="c">C</MillerColumns.Item>
          </MillerColumns.Column>
        </MillerColumns.Root>,
      );
      screen.getByRole("treeitem", { name: "A" }).focus();

      await user.keyboard("{ArrowDown}");

      expect(screen.getByRole("treeitem", { name: "C" })).toHaveFocus();
    });
  });

  describe("activation", () => {
    it("Enter selects the focused item", async () => {
      const user = userEvent.setup();

      render(<FlatList />);
      const item = screen.getByRole("treeitem", { name: "B" });
      item.focus();

      await user.keyboard("{Enter}");

      expect(item).toHaveAttribute("aria-selected", "true");
    });

    it("Space selects the focused item", async () => {
      const user = userEvent.setup();

      render(<FlatList />);
      const item = screen.getByRole("treeitem", { name: "C" });
      item.focus();

      await user.keyboard(" ");

      expect(item).toHaveAttribute("aria-selected", "true");
    });

    it("Enter does not select a disabled focused item", async () => {
      const user = userEvent.setup();

      render(
        <MillerColumns.Root>
          <MillerColumns.Column>
            <MillerColumns.Item value="a">A</MillerColumns.Item>
            <MillerColumns.Item value="b" disabled>
              B
            </MillerColumns.Item>
          </MillerColumns.Column>
        </MillerColumns.Root>,
      );
      const item = screen.getByRole("treeitem", { name: "B" });
      item.focus();

      await user.keyboard("{Enter}");

      expect(item).toHaveAttribute("aria-selected", "false");
    });
  });

  describe("horizontal navigation between columns", () => {
    it("ArrowRight on a branch selects it and focuses the first child item", async () => {
      const user = userEvent.setup();

      render(<Tree />);
      screen.getByRole("treeitem", { name: "Fruit" }).focus();

      await user.keyboard("{ArrowRight}");

      expect(screen.getByRole("treeitem", { name: "Apple" })).toHaveFocus();
    });

    it("ArrowRight on an already-expanded branch focuses its child column", async () => {
      const user = userEvent.setup();

      render(<Tree />);
      await user.click(screen.getByRole("treeitem", { name: "Fruit" }));
      screen.getByRole("treeitem", { name: "Fruit" }).focus();

      await user.keyboard("{ArrowRight}");

      expect(screen.getByRole("treeitem", { name: "Apple" })).toHaveFocus();
    });

    it("ArrowRight on a leaf does nothing", async () => {
      const user = userEvent.setup();

      render(<Tree />);
      const veg = screen.getByRole("treeitem", { name: "Veg" });
      veg.focus();

      await user.keyboard("{ArrowRight}");

      expect(veg).toHaveFocus();
    });

    it("ArrowLeft focuses the selected item of the parent column", async () => {
      const user = userEvent.setup();

      render(<Tree />);
      await user.click(screen.getByRole("treeitem", { name: "Fruit" }));
      screen.getByRole("treeitem", { name: "Pear" }).focus();

      await user.keyboard("{ArrowLeft}");

      expect(screen.getByRole("treeitem", { name: "Fruit" })).toHaveFocus();
    });

    it("ArrowLeft in the root column does nothing", async () => {
      const user = userEvent.setup();

      render(<Tree />);
      const veg = screen.getByRole("treeitem", { name: "Veg" });
      veg.focus();

      await user.keyboard("{ArrowLeft}");

      expect(veg).toHaveFocus();
    });
  });

  describe("reading direction", () => {
    it("swaps the horizontal arrow pair under rtl", async () => {
      const user = userEvent.setup();

      render(<Tree dir="rtl" />);
      screen.getByRole("treeitem", { name: "Fruit" }).focus();

      // The child column sits to the LEFT in rtl, so ArrowLeft steps in.
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("treeitem", { name: "Apple" })).toHaveFocus();

      // ...and ArrowRight walks back out to the parent.
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("treeitem", { name: "Fruit" })).toHaveFocus();
    });

    it("inherits the direction from a DirectionProvider", async () => {
      const user = userEvent.setup();

      render(
        <DirectionProvider dir="rtl">
          <Tree />
        </DirectionProvider>,
      );
      screen.getByRole("treeitem", { name: "Fruit" }).focus();

      await user.keyboard("{ArrowLeft}");

      expect(screen.getByRole("treeitem", { name: "Apple" })).toHaveFocus();
    });
  });
});
