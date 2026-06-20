import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Radio } from "../Radio";

/**
 * The behaviour this whole redesign exists to fix: three standalone radios
 * sharing a `name` must form a *native* radio group, where the browser — not
 * React — enforces single-selection and silently deselects the others. The
 * old `<button role="radio">` could never do this; a real `<input
 * type="radio">` does it for free.
 */
describe("Radio native grouping", () => {
  function DensityGroup() {
    return (
      <fieldset>
        {["compact", "comfortable", "spacious"].map((value) => (
          <Radio.Root key={value} name="density" value={value} aria-label={value} />
        ))}
      </fieldset>
    );
  }

  it("enforces single-selection across siblings sharing a name", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DensityGroup />);
    const compact = screen.getByRole("radio", { name: "compact" });
    const comfortable = screen.getByRole("radio", { name: "comfortable" });
    const spacious = screen.getByRole("radio", { name: "spacious" });

    // Act: select the first
    await user.click(compact);

    // Assert: only it is checked
    expect(compact).toBeChecked();
    expect(comfortable).not.toBeChecked();
    expect(spacious).not.toBeChecked();

    // Act: select a sibling — the browser deselects the first
    await user.click(comfortable);

    // Assert: selection moved; no two radios are checked at once
    expect(compact).not.toBeChecked();
    expect(comfortable).toBeChecked();
    expect(spacious).not.toBeChecked();
  });

  it("submits the selected radio's value with an enclosing form", async () => {
    // Arrange
    const user = userEvent.setup();
    const submitted: string[] = [];
    function Form() {
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            submitted.push(String(data.get("density")));
          }}
        >
          <Radio.Root name="density" value="compact" aria-label="compact" />
          <Radio.Root name="density" value="spacious" aria-label="spacious" />
          <button type="submit">Save</button>
        </form>
      );
    }
    render(<Form />);

    // Act
    await user.click(screen.getByRole("radio", { name: "spacious" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Assert
    expect(submitted).toEqual(["spacious"]);
  });
});
