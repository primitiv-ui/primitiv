import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RadioCard } from "../RadioCard";

describe("RadioCard disabled items", () => {
  it("sets the native disabled attribute on a disabled item", () => {
    // Arrange & Act
    render(
      <RadioCard.Root aria-label="Plan">
        <RadioCard.Item value="starter" disabled>
          Starter
        </RadioCard.Item>
      </RadioCard.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "Starter" })).toBeDisabled();
  });

  it("does not change selection when a disabled item is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioCard.Root aria-label="Plan" onValueChange={onValueChange}>
        <RadioCard.Item value="starter" disabled>
          Starter
        </RadioCard.Item>
      </RadioCard.Root>,
    );

    // Act
    await user.click(screen.getByRole("radio", { name: "Starter" }));

    // Assert
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("re-registers an item's disabled flag when it changes after mount", async () => {
    // Arrange — all enabled at mount; Pro becomes disabled afterwards.
    const user = userEvent.setup();
    function Fixture({ proDisabled }: { proDisabled: boolean }) {
      return (
        <RadioCard.Root aria-label="Plan" defaultValue="starter">
          <RadioCard.Item value="starter">Starter</RadioCard.Item>
          <RadioCard.Item value="pro" disabled={proDisabled}>
            Pro
          </RadioCard.Item>
          <RadioCard.Item value="enterprise">Enterprise</RadioCard.Item>
        </RadioCard.Root>
      );
    }
    const { rerender } = render(<Fixture proDisabled={false} />);

    // Act — disable Pro after mount, then arrow forwards from Starter.
    rerender(<Fixture proDisabled />);
    screen.getByRole("radio", { name: "Starter" }).focus();
    await user.keyboard("{ArrowDown}");

    // Assert — the registrar effect re-ran, so Pro is skipped and focus lands
    // on Enterprise. A stale registration would keep Pro navigable and strand
    // focus (a disabled button cannot receive it).
    expect(screen.getByRole("radio", { name: "Enterprise" })).toHaveFocus();
  });

  it("excludes disabled items from the roving-tabindex home base", () => {
    // Arrange & Act — no default value, first NON-disabled item is the tab stop
    render(
      <RadioCard.Root aria-label="Plan">
        <RadioCard.Item value="starter" disabled>
          Starter
        </RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "Starter" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("radio", { name: "Pro" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });
});
