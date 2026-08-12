import { Table } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("Table.DetailRow rendering", () => {
  it("should render a row whose single cell spans every column", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <Table.Expandable expanded>
            <Table.DetailRow colSpan={4}>Detail panel</Table.DetailRow>
          </Table.Expandable>
        </tbody>
      </table>,
    );
    const cell = screen.getByRole("cell");

    // Assert
    expect(cell).toHaveAttribute("colspan", "4");
    expect(cell).toHaveTextContent("Detail panel");
  });

  it("should offset the panel behind an empty gutter cell, still spanning every column between them", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <Table.Expandable expanded>
            <Table.DetailRow colSpan={5} gutter={2}>
              Detail panel
            </Table.DetailRow>
          </Table.Expandable>
        </tbody>
      </table>,
    );
    const [gutter, panel] = screen.getAllByRole("cell");

    // Assert — the gutter is what aligns the panel with the first DATA column
    // at every size and density: it spans the control columns, so the browser's
    // own table layout does the arithmetic and nothing has to be measured.
    expect(gutter).toBeEmptyDOMElement();
    expect(gutter).toHaveAttribute("colspan", "2");
    expect(panel).toHaveAttribute("colspan", "3");
    expect(panel).toHaveTextContent("Detail panel");
  });

  it("should hide the row while collapsed so it leaves the row count truthful", () => {
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

    // Assert
    expect(screen.queryByRole("row")).not.toBeInTheDocument();
  });

  it("should stay mounted but aria-hidden while collapsed when forceMount is set", () => {
    // Arrange
    render(
      <table>
        <tbody>
          <Table.Expandable>
            <Table.DetailRow colSpan={2} forceMount>
              Detail panel
            </Table.DetailRow>
          </Table.Expandable>
        </tbody>
      </table>,
    );
    const row = screen.getByRole("row", { hidden: true });

    // Assert — no `hidden`, so CSS can transition it; `aria-hidden` instead, so
    // a collapsed panel still does not inflate the table's announced row count.
    expect(row).not.toHaveAttribute("hidden");
    expect(row).toHaveAttribute("aria-hidden", "true");
  });
});
