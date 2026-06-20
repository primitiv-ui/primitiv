import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Checkbox } from "../Checkbox";

/**
 * The checkbox is a real native input, so it participates in forms: a checked
 * box submits its `value` under `name`, and an unchecked one submits nothing.
 * The old `<button role="checkbox">` could do neither.
 */
describe("Checkbox form participation", () => {
  function NewsletterForm({ onSubmit }: { onSubmit: (value: string | null) => void }) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onSubmit(data.get("newsletter") as string | null);
        }}
      >
        <Checkbox.Root name="newsletter" value="weekly" aria-label="Subscribe" />
        <button type="submit">Save</button>
      </form>
    );
  }

  it("submits the value when checked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<NewsletterForm onSubmit={onSubmit} />);

    // Act
    await user.click(screen.getByRole("checkbox", { name: "Subscribe" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Assert
    expect(onSubmit).toHaveBeenCalledWith("weekly");
  });

  it("submits nothing when unchecked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<NewsletterForm onSubmit={onSubmit} />);

    // Act
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Assert
    expect(onSubmit).toHaveBeenCalledWith(null);
  });
});
