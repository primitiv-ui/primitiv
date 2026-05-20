import { useState } from "react";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tree, useTreePath, useTreeSelectionPaths } from "../../Tree";
import type { TreePathSegment } from "../../Tree";

function PathProbe({ value }: { value: string }) {
  const path = useTreePath(value);
  return <pre data-testid={`path-${value}`}>{JSON.stringify(path)}</pre>;
}

function readPath(value: string): TreePathSegment[] {
  return JSON.parse(screen.getByTestId(`path-${value}`).textContent ?? "[]");
}

describe("Tree selection-path tests", () => {
  describe("useTreePath", () => {
    it("should return the root-to-leaf path of an item with labels carried from props", () => {
      // Arrange
      render(
        <Tree.Root defaultExpandedValues={["src", "components"]}>
          <Tree.Branch value="src" label="src">
            <Tree.BranchControl>src</Tree.BranchControl>
            <Tree.BranchContent>
              <Tree.Branch value="components" label="components">
                <Tree.BranchControl>components</Tree.BranchControl>
                <Tree.BranchContent>
                  <Tree.Item value="button" label="button.tsx">
                    button.tsx
                  </Tree.Item>
                </Tree.BranchContent>
              </Tree.Branch>
            </Tree.BranchContent>
          </Tree.Branch>
          <PathProbe value="button" />
        </Tree.Root>,
      );

      // Assert
      const path = readPath("button");

      expect(path.map((segment) => segment.value)).toEqual([
        "src",
        "components",
        "button",
      ]);
      expect(path.map((segment) => segment.label)).toEqual([
        "src",
        "components",
        "button.tsx",
      ]);
      expect(path.map((segment) => segment.isBranch)).toEqual([
        true,
        true,
        false,
      ]);
    });

    it("should still resolve the path after an ancestor branch collapses and unmounts its descendants", async () => {
      // Arrange
      function Fixture() {
        const [expanded, setExpanded] = useState<string[]>(["src"]);
        return (
          <>
            <button type="button" onClick={() => setExpanded([])}>
              collapse
            </button>
            <Tree.Root
              expandedValues={expanded}
              onExpandedChange={setExpanded}
            >
              <Tree.Branch value="src" label="src">
                <Tree.BranchControl>src</Tree.BranchControl>
                <Tree.BranchContent>
                  <Tree.Item value="button" label="button.tsx">
                    button.tsx
                  </Tree.Item>
                </Tree.BranchContent>
              </Tree.Branch>
              <PathProbe value="button" />
            </Tree.Root>
          </>
        );
      }

      const user = userEvent.setup();
      render(<Fixture />);

      // Sanity: while expanded, the path is fully resolved.
      expect(readPath("button").map((segment) => segment.value)).toEqual([
        "src",
        "button",
      ]);

      // Act — collapse the branch; its content (and the descendant item)
      // is unmounted because `forceMount` is not used.
      await user.click(screen.getByRole("button", { name: "collapse" }));

      // Assert — ancestry is still resolvable from the persisted registry.
      const path = readPath("button");
      expect(path.map((segment) => segment.value)).toEqual([
        "src",
        "button",
      ]);
      expect(path.map((segment) => segment.label)).toEqual([
        "src",
        "button.tsx",
      ]);
    });

    it("should return an empty array for a value never registered in the tree", () => {
      // Arrange
      render(
        <Tree.Root>
          <Tree.Item value="readme" label="readme.md">
            readme.md
          </Tree.Item>
          <PathProbe value="missing" />
        </Tree.Root>,
      );

      // Assert
      expect(readPath("missing")).toEqual([]);
    });
  });

  describe("useTreeSelectionPaths", () => {
    function SelectionProbe() {
      const paths = useTreeSelectionPaths();
      return <pre data-testid="selection">{JSON.stringify(paths)}</pre>;
    }

    it("should return one path per selected value, in selection order", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Tree.Root
          selectionMode="multiple"
          defaultExpandedValues={["src"]}
          defaultSelectedValues={["dialog"]}
        >
          <Tree.Branch value="src" label="src">
            <Tree.BranchControl>src</Tree.BranchControl>
            <Tree.BranchContent>
              <Tree.Item value="button" label="button.tsx">
                button.tsx
              </Tree.Item>
              <Tree.Item value="dialog" label="dialog.tsx">
                dialog.tsx
              </Tree.Item>
            </Tree.BranchContent>
          </Tree.Branch>
          <SelectionProbe />
        </Tree.Root>,
      );

      // Act — Ctrl-click button.tsx to append it.
      await user.keyboard("{Control>}");
      await user.click(screen.getByText("button.tsx"));
      await user.keyboard("{/Control}");

      // Assert — selection-order preserved (dialog first, button appended).
      const paths = JSON.parse(
        screen.getByTestId("selection").textContent ?? "[]",
      ) as TreePathSegment[][];

      expect(paths.map((path) => path[path.length - 1].value)).toEqual([
        "dialog",
        "button",
      ]);
    });
  });

  describe("Tree.SelectionPath default rendering", () => {
    it("should render the wrapper with data-empty when no item is selected", () => {
      // Arrange
      render(
        <Tree.Root>
          <Tree.Item value="readme" label="readme.md">
            readme.md
          </Tree.Item>
          <Tree.SelectionPath data-testid="path" />
        </Tree.Root>,
      );

      // Assert
      const wrapper = screen.getByTestId("path");

      expect(wrapper).toHaveAttribute("data-empty", "");
      expect(wrapper).not.toContainElement(screen.queryByRole("navigation"));
    });

    it("should render one Breadcrumb trail per selected value, in selection order, under multi-select mode", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Tree.Root
          selectionMode="multiple"
          defaultExpandedValues={["src"]}
          defaultSelectedValues={["button"]}
        >
          <Tree.Branch value="src" label="src">
            <Tree.BranchControl>src</Tree.BranchControl>
            <Tree.BranchContent>
              <Tree.Item value="button" label="button.tsx">
                button.tsx
              </Tree.Item>
              <Tree.Item value="dialog" label="dialog.tsx">
                dialog.tsx
              </Tree.Item>
            </Tree.BranchContent>
          </Tree.Branch>
          <Tree.SelectionPath data-testid="path" />
        </Tree.Root>,
      );

      // Act — Ctrl-click `dialog.tsx` to add it to the selection.
      await user.keyboard("{Control>}");
      await user.click(screen.getByText("dialog.tsx"));
      await user.keyboard("{/Control}");

      // Assert
      const wrapper = screen.getByTestId("path");
      const trails = within(wrapper).getAllByRole("navigation", {
        name: "Breadcrumb",
      });

      expect(trails).toHaveLength(2);
      expect(trails[0]).toHaveTextContent("button.tsx");
      expect(trails[1]).toHaveTextContent("dialog.tsx");
    });

    it("should render one Breadcrumb trail for a single selected item, with the final segment as the current page", () => {
      // Arrange
      render(
        <Tree.Root
          defaultExpandedValues={["src"]}
          defaultSelectedValue="button"
        >
          <Tree.Branch value="src" label="src">
            <Tree.BranchControl>src</Tree.BranchControl>
            <Tree.BranchContent>
              <Tree.Item value="button" label="button.tsx">
                button.tsx
              </Tree.Item>
            </Tree.BranchContent>
          </Tree.Branch>
          <Tree.SelectionPath data-testid="path" />
        </Tree.Root>,
      );

      // Assert
      const wrapper = screen.getByTestId("path");

      expect(wrapper).not.toHaveAttribute("data-empty");

      const trails = within(wrapper).getAllByRole("navigation", {
        name: "Breadcrumb",
      });
      expect(trails).toHaveLength(1);
      expect(trails[0]).toHaveTextContent(/src/);
      expect(trails[0]).toHaveTextContent(/button\.tsx/);

      // The leaf label is the current page, not a link.
      const current = within(trails[0]).getByText("button.tsx");
      expect(current).toHaveAttribute("aria-current", "page");
    });

    it("should fall back to the value for segments rendered without a label prop", () => {
      // Arrange
      render(
        <Tree.Root
          defaultExpandedValues={["src"]}
          defaultSelectedValue="button"
        >
          <Tree.Branch value="src">
            <Tree.BranchControl>src</Tree.BranchControl>
            <Tree.BranchContent>
              <Tree.Item value="button">button.tsx</Tree.Item>
            </Tree.BranchContent>
          </Tree.Branch>
          <Tree.SelectionPath data-testid="path" />
        </Tree.Root>,
      );

      // Assert
      const wrapper = screen.getByTestId("path");
      const trail = within(wrapper).getByRole("navigation", {
        name: "Breadcrumb",
      });

      // Both labels were omitted, so the rendering falls back to value.
      expect(within(trail).getByText("src")).toBeInTheDocument();
      expect(within(trail).getByText("button")).toBeInTheDocument();
    });

    it("should bypass default rendering when children is a function and pass the resolved paths", () => {
      // Arrange
      render(
        <Tree.Root
          defaultExpandedValues={["src"]}
          defaultSelectedValue="button"
        >
          <Tree.Branch value="src" label="src">
            <Tree.BranchControl>src</Tree.BranchControl>
            <Tree.BranchContent>
              <Tree.Item value="button" label="button.tsx">
                button.tsx
              </Tree.Item>
            </Tree.BranchContent>
          </Tree.Branch>
          <Tree.SelectionPath data-testid="path">
            {({ paths }) => (
              <ul data-testid="custom">
                {paths[0]?.map((segment) => (
                  <li key={segment.value} data-value={segment.value}>
                    {segment.label}
                  </li>
                ))}
              </ul>
            )}
          </Tree.SelectionPath>
        </Tree.Root>,
      );

      // Assert — default Breadcrumb markup is replaced by the render-prop output.
      const wrapper = screen.getByTestId("path");
      expect(
        within(wrapper).queryByRole("navigation", { name: "Breadcrumb" }),
      ).not.toBeInTheDocument();

      const items = within(screen.getByTestId("custom")).getAllByRole(
        "listitem",
      );
      expect(items.map((node) => node.getAttribute("data-value"))).toEqual([
        "src",
        "button",
      ]);
    });

    it("should mark disabled segments with data-disabled in both the leaf and ancestor positions", () => {
      // Arrange — both the branch and the leaf are disabled.
      render(
        <Tree.Root
          defaultExpandedValues={["legacy"]}
          defaultSelectedValue="old-button"
        >
          <Tree.Branch value="legacy" label="legacy" disabled>
            <Tree.BranchControl>legacy</Tree.BranchControl>
            <Tree.BranchContent>
              <Tree.Item value="old-button" label="old-button.tsx" disabled>
                old-button.tsx
              </Tree.Item>
            </Tree.BranchContent>
          </Tree.Branch>
          <Tree.SelectionPath data-testid="path" />
        </Tree.Root>,
      );

      // Assert
      const wrapper = screen.getByTestId("path");
      const segments = within(wrapper).getAllByText(/legacy|old-button\.tsx/);

      for (const segment of segments) {
        expect(segment).toHaveAttribute("data-disabled", "");
      }
    });

    it("should pass the separator prop to every Breadcrumb.Separator in each trail", () => {
      // Arrange
      render(
        <Tree.Root
          defaultExpandedValues={["src", "components"]}
          defaultSelectedValue="button"
        >
          <Tree.Branch value="src" label="src">
            <Tree.BranchControl>src</Tree.BranchControl>
            <Tree.BranchContent>
              <Tree.Branch value="components" label="components">
                <Tree.BranchControl>components</Tree.BranchControl>
                <Tree.BranchContent>
                  <Tree.Item value="button" label="button.tsx">
                    button.tsx
                  </Tree.Item>
                </Tree.BranchContent>
              </Tree.Branch>
            </Tree.BranchContent>
          </Tree.Branch>
          <Tree.SelectionPath
            data-testid="path"
            separator={<span data-testid="sep">»</span>}
          />
        </Tree.Root>,
      );

      // Assert
      const seps = within(screen.getByTestId("path")).getAllByTestId("sep");
      // 3-segment path → 2 separators.
      expect(seps).toHaveLength(2);
    });
  });
});
