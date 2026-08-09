import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePagination } from "../usePagination.ts";
import type { UsePaginationOptions } from "../usePagination.ts";

function SliceProbe(options: UsePaginationOptions) {
  const { startIndex, endIndex } = usePagination(options);
  return (
    <span data-testid="slice">
      {startIndex}..{endIndex}
    </span>
  );
}

describe("usePagination slice bounds", () => {
  it("should give a zero-based half-open range for the first page", () => {
    // Half-open so it drops straight into Array.slice and into a
    // LIMIT/OFFSET query without an off-by-one at the call site.
    render(<SliceProbe totalItems={200} pageSize={10} />);

    expect(screen.getByTestId("slice")).toHaveTextContent("0..10");
  });

  it("should offset the range by the current page", () => {
    render(<SliceProbe totalItems={200} pageSize={10} defaultPage={3} />);

    expect(screen.getByTestId("slice")).toHaveTextContent("20..30");
  });

  it("should stop the last page's range at the item count, not the page size", () => {
    // 237 items at 10/page: the last page holds 7, so endIndex must not run
    // past the data.
    render(<SliceProbe totalItems={237} pageSize={10} defaultPage={24} />);

    expect(screen.getByTestId("slice")).toHaveTextContent("230..237");
  });

  it("should collapse to an empty range when there are no items", () => {
    render(<SliceProbe totalItems={0} pageSize={10} />);

    expect(screen.getByTestId("slice")).toHaveTextContent("0..0");
  });

  it("should not clamp the range when the total is unknown", () => {
    // A server that reports pageCount but not an exact total is common. With
    // no total to clamp against, the range is just a full page wide.
    render(<SliceProbe pageCount={10} pageSize={10} defaultPage={3} />);

    expect(screen.getByTestId("slice")).toHaveTextContent("20..30");
  });

  it("should report an empty range when the page size is unknown", () => {
    // pageCount given directly — the hook has no idea how big a page is, so it
    // cannot invent slice bounds.
    render(<SliceProbe pageCount={10} defaultPage={3} />);

    expect(screen.getByTestId("slice")).toHaveTextContent("0..0");
  });
});
