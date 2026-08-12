import { Table } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("Table displayNames", () => {
  it("sets a displayName on the compound and each sub-component", () => {
    // Assert — empty displayNames would render each as anonymous in DevTools.
    // `Table`, `Table.Root` and the underlying function are one object
    // (Object.assign compound), so the compound's "Table" alias is the
    // observable Root displayName; the sub-components are distinct objects.
    expect(Table.displayName).toBe("Table");
    expect(Table.Head.displayName).toBe("TableHead");
    expect(Table.Body.displayName).toBe("TableBody");
    expect(Table.Footer.displayName).toBe("TableFooter");
    expect(Table.Row.displayName).toBe("TableRow");
    expect(Table.Header.displayName).toBe("TableHeader");
    expect(Table.Cell.displayName).toBe("TableCell");
    expect(Table.ScrollArea.displayName).toBe("TableScrollArea");
    expect(Table.Caption.displayName).toBe("TableCaption");
    expect(Table.Expandable.displayName).toBe("TableExpandable");
    expect(Table.ExpandTrigger.displayName).toBe("TableExpandTrigger");
    expect(Table.DetailRow.displayName).toBe("TableDetailRow");
  });
});

describe("Table.Expandable contract", () => {
  it("should require its parts to be rendered inside a provider", () => {
    // Assert — the strict context is what stops a trigger being wired to
    // nothing. React logs the throw, so silence the expected console noise.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() =>
      render(
        <table>
          <tbody>
            <Table.DetailRow colSpan={2}>Orphan</Table.DetailRow>
          </tbody>
        </table>,
      ),
    ).toThrow(
      "Table.ExpandTrigger and Table.DetailRow must be rendered inside a <Table.Expandable>.",
    );

    consoleError.mockRestore();
  });

  it("should apply the hidden attribute — not merely leave the row unannounced — while collapsed", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <Table.Expandable>
            <Table.DetailRow colSpan={2}>Detail panel</Table.DetailRow>
          </Table.Expandable>
        </tbody>
      </table>,
    );

    // Assert — pins the `forceMount` default. Without `hidden` the row is only
    // missing from the accessibility tree, which an aria-hidden row would be too.
    expect(screen.getByText("Detail panel").closest("tr")).toHaveAttribute(
      "hidden",
    );
  });

  it.each([
    { expanded: true, state: "open" },
    { expanded: false, state: "closed" },
  ])(
    "should publish data-state=$state on both parts for the styling layer",
    ({ expanded, state }) => {
      // Arrange
      render(
        <table>
          <tbody>
            <Table.Expandable expanded={expanded}>
              <Table.Row>
                <Table.Cell>
                  <Table.ExpandTrigger>Toggle</Table.ExpandTrigger>
                </Table.Cell>
              </Table.Row>
              <Table.DetailRow colSpan={2} forceMount>
                Detail panel
              </Table.DetailRow>
            </Table.Expandable>
          </tbody>
        </table>,
      );

      // Assert — the registry stylesheet animates the panel off this attribute,
      // because a CSS transition needs a selector, not an unmount.
      expect(screen.getByRole("button", { name: "Toggle" })).toHaveAttribute(
        "data-state",
        state,
      );
      expect(
        screen.getByText("Detail panel").closest("tr"),
      ).toHaveAttribute("data-state", state);
    },
  );

  it("should not aria-hide a force-mounted row once it is expanded", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <Table.Expandable expanded>
            <Table.DetailRow colSpan={2} forceMount>
              Detail panel
            </Table.DetailRow>
          </Table.Expandable>
        </tbody>
      </table>,
    );

    // Assert — aria-hidden belongs to "force-mounted AND collapsed" only; an
    // expanded panel that is not announced would be invisible to a screen reader.
    expect(screen.getByRole("row")).not.toHaveAttribute("aria-hidden");
  });
});
