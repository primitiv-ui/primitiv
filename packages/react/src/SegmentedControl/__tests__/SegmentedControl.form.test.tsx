import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SegmentedControl } from "..";

describe("SegmentedControl without a name", () => {
  it("renders no hidden input at all, so it takes no part in its form", () => {
    // Arrange & Act
    const { container } = render(
      <form>
        <SegmentedControl.Root defaultValue="day" aria-label="Range"><SegmentedControl.Item value="day">Day</SegmentedControl.Item></SegmentedControl.Root>
      </form>,
    );

    // Assert
    expect(container.querySelector('input[type="hidden"]')).toBeNull();
  });
});
