import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl keyboard interaction", () => {
  it("selects and focuses the next segment on ArrowRight (horizontal default)", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SegmentedControl.Root aria-label="Mode" defaultValue="a">
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
        <SegmentedControl.Item value="c">C</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const a = screen.getByRole("radio", { name: "A" });
    const b = screen.getByRole("radio", { name: "B" });
    a.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(b).toHaveFocus();
    expect(b).toHaveAttribute("aria-checked", "true");
    expect(a).toHaveAttribute("aria-checked", "false");
  });

  it("selects and focuses the previous segment on ArrowLeft", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SegmentedControl.Root aria-label="Mode" defaultValue="b">
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const a = screen.getByRole("radio", { name: "A" });
    const b = screen.getByRole("radio", { name: "B" });
    b.focus();

    // Act
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(a).toHaveFocus();
    expect(a).toHaveAttribute("aria-checked", "true");
  });

  it("wraps from last to first on ArrowRight", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SegmentedControl.Root aria-label="Mode" defaultValue="b">
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const a = screen.getByRole("radio", { name: "A" });
    const b = screen.getByRole("radio", { name: "B" });
    b.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(a).toHaveFocus();
    expect(a).toHaveAttribute("aria-checked", "true");
  });

  it("wraps from first to last on ArrowLeft", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SegmentedControl.Root aria-label="Mode" defaultValue="a">
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const a = screen.getByRole("radio", { name: "A" });
    const b = screen.getByRole("radio", { name: "B" });
    a.focus();

    // Act
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(b).toHaveFocus();
    expect(b).toHaveAttribute("aria-checked", "true");
  });

  it("selects and focuses with vertical arrows when orientation is vertical", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SegmentedControl.Root
        aria-label="Mode"
        orientation="vertical"
        defaultValue="a"
      >
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const a = screen.getByRole("radio", { name: "A" });
    const b = screen.getByRole("radio", { name: "B" });
    a.focus();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(b).toHaveFocus();
    expect(b).toHaveAttribute("aria-checked", "true");
  });
});
