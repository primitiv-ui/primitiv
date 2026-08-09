import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePagination } from "../usePagination.ts";
import type { UsePaginationOptions } from "../usePagination.ts";

function NavigationProbe(options: UsePaginationOptions) {
  const { page, next, previous, first, last, canPrevious, canNext } = usePagination(options);
  return (
    <>
      <span data-testid="page">{page}</span>
      <span data-testid="flags">
        {canPrevious ? "prev" : "-"}/{canNext ? "next" : "-"}
      </span>
      <button type="button" onClick={previous}>
        previous
      </button>
      <button type="button" onClick={next}>
        next
      </button>
      <button type="button" onClick={first}>
        first
      </button>
      <button type="button" onClick={last}>
        last
      </button>
    </>
  );
}

describe("usePagination navigation", () => {
  it("should step forward one page", async () => {
    const user = userEvent.setup();
    render(<NavigationProbe pageCount={10} defaultPage={3} />);

    await user.click(screen.getByRole("button", { name: "next" }));

    expect(screen.getByTestId("page")).toHaveTextContent("4");
  });

  it("should step back one page", async () => {
    const user = userEvent.setup();
    render(<NavigationProbe pageCount={10} defaultPage={3} />);

    await user.click(screen.getByRole("button", { name: "previous" }));

    expect(screen.getByTestId("page")).toHaveTextContent("2");
  });

  it("should stay on the last page when stepping forward from it", async () => {
    const user = userEvent.setup();
    render(<NavigationProbe pageCount={10} defaultPage={10} />);

    await user.click(screen.getByRole("button", { name: "next" }));

    expect(screen.getByTestId("page")).toHaveTextContent("10");
  });

  it("should stay on the first page when stepping back from it", async () => {
    const user = userEvent.setup();
    render(<NavigationProbe pageCount={10} defaultPage={1} />);

    await user.click(screen.getByRole("button", { name: "previous" }));

    expect(screen.getByTestId("page")).toHaveTextContent("1");
  });

  it("should jump to the first page", async () => {
    const user = userEvent.setup();
    render(<NavigationProbe pageCount={10} defaultPage={7} />);

    await user.click(screen.getByRole("button", { name: "first" }));

    expect(screen.getByTestId("page")).toHaveTextContent("1");
  });

  it("should jump to the last page", async () => {
    const user = userEvent.setup();
    render(<NavigationProbe pageCount={10} defaultPage={2} />);

    await user.click(screen.getByRole("button", { name: "last" }));

    expect(screen.getByTestId("page")).toHaveTextContent("10");
  });

  it("should report both directions available mid-range", () => {
    render(<NavigationProbe pageCount={10} defaultPage={5} />);

    expect(screen.getByTestId("flags")).toHaveTextContent("prev/next");
  });

  it("should report no previous on the first page", () => {
    render(<NavigationProbe pageCount={10} defaultPage={1} />);

    expect(screen.getByTestId("flags")).toHaveTextContent("-/next");
  });

  it("should report no next on the last page", () => {
    render(<NavigationProbe pageCount={10} defaultPage={10} />);

    expect(screen.getByTestId("flags")).toHaveTextContent("prev/-");
  });

  it("should report neither direction when there is only one page", () => {
    render(<NavigationProbe pageCount={1} />);

    expect(screen.getByTestId("flags")).toHaveTextContent("-/-");
  });
});
