import { SkipNav } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("SkipNav id wiring", () => {
  it("should derive SkipNav.Link href from the contentId prop", () => {
    render(<SkipNav.Link contentId="main-content">Skip to content</SkipNav.Link>);

    expect(screen.getByRole("link")).toHaveAttribute("href", "#main-content");
  });

  it("should default SkipNav.Link href to the shared content id", () => {
    render(<SkipNav.Link>Skip to content</SkipNav.Link>);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "#primitiv-skip-nav",
    );
  });
});
