import { SkipNav } from "..";
import { render, screen } from "@testing-library/react";

describe("SkipNav id wiring", () => {
  it("should derive SkipNav.Link href from the contentId prop", () => {
    render(<SkipNav.Link contentId="main-content">Skip to content</SkipNav.Link>);

    expect(screen.getByRole("link")).toHaveAttribute("href", "#main-content");
  });
});
