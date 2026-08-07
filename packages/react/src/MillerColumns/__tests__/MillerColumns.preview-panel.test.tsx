import { render, screen } from "@testing-library/react";

import { MillerColumns } from "../MillerColumns";

describe("MillerColumns — preview panel", () => {
  it("renders a panel at the trailing edge of the strip", () => {
    const { container } = render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
        <MillerColumns.PreviewPanel>preview</MillerColumns.PreviewPanel>
      </MillerColumns.Root>,
    );

    const strip = container.querySelector("[data-miller-columns-strip]")!;
    const panel = screen.getByText("preview");

    expect(panel).toHaveAttribute("data-miller-columns-preview");
    expect(strip).toContainElement(panel);
    expect(strip.lastElementChild).toBe(panel);
  });

  it("forwards props to the panel element", () => {
    render(
      <MillerColumns.Root>
        <MillerColumns.Column>
          <MillerColumns.Item value="a">A</MillerColumns.Item>
        </MillerColumns.Column>
        <MillerColumns.PreviewPanel className="preview" aria-label="Preview">
          preview
        </MillerColumns.PreviewPanel>
      </MillerColumns.Root>,
    );

    const panel = screen.getByText("preview");

    expect(panel).toHaveClass("preview");
    expect(panel).toHaveAttribute("aria-label", "Preview");
  });

  it("throws when PreviewPanel is rendered outside Root", () => {
    expect(() =>
      render(<MillerColumns.PreviewPanel>x</MillerColumns.PreviewPanel>),
    ).toThrow("<MillerColumns.Root>");
  });
});
