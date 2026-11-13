import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RadioCard } from "..";

describe("RadioCard without a name", () => {
  it("renders no hidden input at all, so it takes no part in its form", () => {
    // Arrange & Act
    const { container } = render(
      <form>
        <RadioCard.Root defaultValue="basic" aria-label="Plan"><RadioCard.Item value="basic">Basic</RadioCard.Item></RadioCard.Root>
      </form>,
    );

    // Assert
    expect(container.querySelector('input[type="hidden"]')).toBeNull();
  });
});
