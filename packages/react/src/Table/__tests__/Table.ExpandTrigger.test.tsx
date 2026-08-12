import { Table } from "../index.ts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

function renderPair(props?: { expanded?: boolean }) {
  return render(
    <table>
      <tbody>
        <Table.Expandable expanded={props?.expanded}>
          <Table.Row>
            <Table.Cell>
              <Table.ExpandTrigger>Show details for Ada</Table.ExpandTrigger>
            </Table.Cell>
          </Table.Row>
          <Table.DetailRow colSpan={2}>Detail panel</Table.DetailRow>
        </Table.Expandable>
      </tbody>
    </table>,
  );
}

describe("Table.ExpandTrigger accessibility", () => {
  it("should own the expanded state on the button and point aria-controls at the detail row", () => {
    // Arrange
    renderPair({ expanded: true });
    const trigger = screen.getByRole("button", {
      name: /show details for ada/i,
    });
    const detailRow = screen.getAllByRole("row")[1];

    // Assert — the button carries the state, because a button's expanded state
    // is announced universally while a row's is only reliable in a treegrid.
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(detailRow).toHaveAttribute("id");
    expect(trigger).toHaveAttribute(
      "aria-controls",
      detailRow.getAttribute("id"),
    );
  });
});

describe("Table.ExpandTrigger composition", () => {
  it("should hand its aria wiring to a consumer's own control when asChild is set", () => {
    // Arrange — the styled layer composes a real ghost Button here rather than
    // hand-rolling a bare <button>, which is what the Figma set models.
    render(
      <table>
        <tbody>
          <Table.Expandable>
            <Table.Row>
              <Table.Cell>
                <Table.ExpandTrigger asChild>
                  <button type="button" className="my-button">
                    Details
                  </button>
                </Table.ExpandTrigger>
              </Table.Cell>
            </Table.Row>
            <Table.DetailRow colSpan={1}>Panel</Table.DetailRow>
          </Table.Expandable>
        </tbody>
      </table>,
    );
    const trigger = screen.getByRole("button", { name: "Details" });

    // Assert — one button, the consumer's, carrying the wiring
    expect(trigger).toHaveClass("my-button");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls");
    expect(trigger).toHaveAttribute("data-state", "closed");
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});

describe("Table.ExpandTrigger activation", () => {
  it("should report the next expanded state and reveal the detail row when uncontrolled", async () => {
    // Arrange
    const onExpandedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <table>
        <tbody>
          <Table.Expandable onExpandedChange={onExpandedChange}>
            <Table.Row>
              <Table.Cell>
                <Table.ExpandTrigger>Show details for Ada</Table.ExpandTrigger>
              </Table.Cell>
            </Table.Row>
            <Table.DetailRow colSpan={2}>Detail panel</Table.DetailRow>
          </Table.Expandable>
        </tbody>
      </table>,
    );

    // Act
    await user.click(screen.getByRole("button"));

    // Assert
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.getByText("Detail panel")).toBeVisible();
  });
});
