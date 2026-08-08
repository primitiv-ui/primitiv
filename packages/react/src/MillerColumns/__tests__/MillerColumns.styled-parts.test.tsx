import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Children, type ComponentProps, type ReactNode } from "react";

import { MillerColumns } from "../MillerColumns";
import { MILLER_COLUMNS_PART } from "../utils";

/**
 * A stand-in for a styling layer's wrapper — exactly what the registry
 * `miller-columns` surface renders. `Item` inspects its children *before*
 * rendering them, so it sees this component, not the `MillerColumns.Column`
 * it returns.
 */
function StyledColumn(props: ComponentProps<typeof MillerColumns.Column>) {
  return <MillerColumns.Column {...props} />;
}
StyledColumn[MILLER_COLUMNS_PART] = "column" as const;

function Tree() {
  return (
    <MillerColumns.Root>
      <MillerColumns.Column>
        <MillerColumns.Item value="fruit">
          Fruit
          <StyledColumn>
            <MillerColumns.Item value="apple">Apple</MillerColumns.Item>
          </StyledColumn>
        </MillerColumns.Item>
        <MillerColumns.Item value="veg">
          Veg
          <StyledColumn>
            <MillerColumns.Item value="carrot">Carrot</MillerColumns.Item>
          </StyledColumn>
        </MillerColumns.Item>
      </MillerColumns.Column>
    </MillerColumns.Root>
  );
}

describe("MillerColumns — styled wrappers standing in for parts", () => {
  it("keeps a wrapped child column closed until its branch is selected", async () => {
    const user = userEvent.setup();

    render(<Tree />);

    // Nothing is selected, so the child column must not be mounted at all.
    expect(
      screen.queryByRole("treeitem", { name: "Apple" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("treeitem", { name: "Fruit" }));

    expect(screen.getByRole("treeitem", { name: "Apple" })).toBeInTheDocument();
  });

  it("opens only the selected branch's column, not every sibling's at once", async () => {
    const user = userEvent.setup();

    render(<Tree />);

    await user.click(screen.getByRole("treeitem", { name: "Fruit" }));

    // Selecting Fruit opens a slot at depth 1. Every unrecognised wrapped
    // column projects into that slot on sight, so Veg's children ride along.
    expect(screen.getByRole("treeitem", { name: "Apple" })).toBeInTheDocument();
    expect(
      screen.queryByRole("treeitem", { name: "Carrot" }),
    ).not.toBeInTheDocument();
  });

  it("treats a wrapped child column as the branch's column, not cell content", () => {
    render(<Tree />);

    // A branch is a branch because it nests a column — even a wrapped one.
    expect(screen.getByRole("treeitem", { name: "Fruit" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("treeitem", { name: "Fruit" })).toHaveAttribute(
      "data-has-children",
    );
  });
});

/**
 * The registry surface wraps BOTH parts, and its Item maps over `children` to
 * wrap bare text in a label span before handing them to the headless. That map
 * sits between the consumer's JSX and `partitionItemChildren`, so it is the
 * thing most likely to lose a nested column.
 */
function wrapRowTextNodes(children: ReactNode): ReactNode {
  const mapped = Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <span className="label">{child}</span>
    ) : (
      child
    ),
  );
  return Array.isArray(mapped) && mapped.length === 1 ? mapped[0] : mapped;
}

function StyledItem({
  children,
  ...props
}: ComponentProps<typeof MillerColumns.Item>) {
  return (
    <MillerColumns.Item {...props}>
      {wrapRowTextNodes(children)}
    </MillerColumns.Item>
  );
}

describe("MillerColumns — the registry's own composition", () => {
  it("opens only the selected branch when Item and Column are both wrapped", async () => {
    const user = userEvent.setup();

    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <StyledItem value="fruit">
            Fruit
            <StyledColumn>
              <StyledItem value="apple">Apple</StyledItem>
            </StyledColumn>
          </StyledItem>
          <StyledItem value="veg">
            Veg
            <StyledColumn>
              <StyledItem value="carrot">Carrot</StyledItem>
            </StyledColumn>
          </StyledItem>
        </MillerColumns.Column>
      </MillerColumns.Root>,
    );

    await user.click(screen.getByRole("treeitem", { name: "Fruit" }));

    expect(screen.getByRole("treeitem", { name: "Apple" })).toBeInTheDocument();
    expect(
      screen.queryByRole("treeitem", { name: "Carrot" }),
    ).not.toBeInTheDocument();
  });
});
