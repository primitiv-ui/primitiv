import { ComponentProps, ReactNode } from "react";
import { render, screen } from "@testing-library/react";

import { Select } from "../Select";

function StyledSelect({
  children,
  ...rest
}: ComponentProps<"select"> & { children: ReactNode }) {
  return (
    <select {...rest} className="styled-select" data-testid="styled">
      {children}
    </select>
  );
}

describe("Select asChild", () => {
  it("delegates to a consumer-supplied <select> wrapper, merging Root's props onto it", () => {
    // Arrange & Act
    render(
      <Select.Root native asChild disabled>
        <StyledSelect>
          <Select.Item value="apple">Apple</Select.Item>
        </StyledSelect>
      </Select.Root>,
    );

    // Assert — the consumer's <select> is the rendered element, with
    // Root's props merged in.
    const select = screen.getByTestId("styled");
    expect(select.tagName).toBe("SELECT");
    expect(select).toHaveClass("styled-select");
    expect(select).toHaveAttribute("data-disabled", "");
    expect(select).toBeDisabled();
  });
});
