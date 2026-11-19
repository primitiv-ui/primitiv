import { render } from "@testing-library/react";

import { CheckboxCard } from "..";

describe("CheckboxCard without a name", () => {
  it("renders no hidden input at all, so it takes no part in its form", () => {
    // Arrange & Act
    const { container } = render(
      <form>
        <CheckboxCard.Root defaultChecked value="email" aria-label="Email updates" />
      </form>,
    );

    // Assert
    expect(container.querySelector('input[type="hidden"]')).toBeNull();
  });
});
