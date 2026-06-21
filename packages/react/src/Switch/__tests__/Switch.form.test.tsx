import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Switch } from "../Switch";

/**
 * The switch is a real native input (a checkbox with the switch role), so it
 * participates in forms: an on switch submits its `value` under `name`, an off
 * one submits nothing. The old `<button role="switch">` could do neither.
 */
describe("Switch form participation", () => {
  function SettingsForm({ onSubmit }: { onSubmit: (value: string | null) => void }) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onSubmit(data.get("notify") as string | null);
        }}
      >
        <Switch.Root name="notify" value="on" aria-label="Enable notifications">
          <Switch.Thumb />
        </Switch.Root>
        <button type="submit">Save</button>
      </form>
    );
  }

  it("submits the value when on", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SettingsForm onSubmit={onSubmit} />);

    // Act
    await user.click(screen.getByRole("switch", { name: "Enable notifications" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Assert
    expect(onSubmit).toHaveBeenCalledWith("on");
  });

  it("submits nothing when off", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SettingsForm onSubmit={onSubmit} />);

    // Act
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Assert
    expect(onSubmit).toHaveBeenCalledWith(null);
  });
});
