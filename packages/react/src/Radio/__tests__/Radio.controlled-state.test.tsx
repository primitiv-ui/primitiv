import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { Radio } from "../Radio";

describe("Radio controlled state", () => {
  it("reflects the controlled `checked` prop", () => {
    // Arrange & Act
    const { rerender } = render(
      <Radio.Root checked={false} onCheckedChange={() => {}} aria-label="Compact" />,
    );
    const radio = screen.getByRole("radio", { name: "Compact" });
    expect(radio).toHaveAttribute("aria-checked", "false");

    rerender(
      <Radio.Root checked onCheckedChange={() => {}} aria-label="Compact" />,
    );

    // Assert
    expect(radio).toHaveAttribute("aria-checked", "true");
    expect(radio).toHaveAttribute("data-state", "checked");
  });

  it("does not update its rendered state when the parent refuses to update `checked`", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Radio.Root
        checked={false}
        onCheckedChange={onCheckedChange}
        aria-label="Compact"
      />,
    );
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Act
    await user.click(radio);

    // Assert: callback fired but the rendered state stays false because the
    // parent did not flip the controlled prop.
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(radio).toHaveAttribute("aria-checked", "false");
    expect(radio).toHaveAttribute("data-state", "unchecked");
  });

  it("lets a parent drive the value end to end", async () => {
    // Arrange
    const user = userEvent.setup();
    function Harness() {
      const [checked, setChecked] = useState(false);
      return (
        <Radio.Root
          checked={checked}
          onCheckedChange={setChecked}
          aria-label="Compact"
        />
      );
    }
    render(<Harness />);
    const radio = screen.getByRole("radio", { name: "Compact" });
    expect(radio).toHaveAttribute("aria-checked", "false");

    // Act & Assert: the click is deferred to the parent, which selects it.
    await user.click(radio);
    expect(radio).toHaveAttribute("aria-checked", "true");
  });
});
