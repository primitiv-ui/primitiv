import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ToggleGroup } from "..";

describe("ToggleGroup without a name", () => {
  it("renders no hidden input at all, so it takes no part in its form", () => {
    // Arrange & Act
    const { container } = render(
      <form>
        <ToggleGroup.Root type="multiple" defaultValue={["bold"]} aria-label="Formatting"><ToggleGroup.Item value="bold">Bold</ToggleGroup.Item></ToggleGroup.Root>
      </form>,
    );

    // Assert
    expect(container.querySelector('input[type="hidden"]')).toBeNull();
  });
});
