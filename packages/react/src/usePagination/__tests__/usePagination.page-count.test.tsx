import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePagination } from "../usePagination.ts";
import type { UsePaginationOptions } from "../usePagination.ts";

function PageCountProbe(options: UsePaginationOptions) {
  const { page, pageCount } = usePagination(options);
  return (
    <span data-testid="result">
      {page}/{pageCount}
    </span>
  );
}

describe("usePagination page count", () => {
  it("should derive pageCount by dividing totalItems by pageSize", () => {
    render(<PageCountProbe totalItems={200} pageSize={10} />);

    expect(screen.getByTestId("result")).toHaveTextContent("1/20");
  });

  it("should round a partial last page up so its items stay reachable", () => {
    render(<PageCountProbe totalItems={237} pageSize={10} />);

    expect(screen.getByTestId("result")).toHaveTextContent("1/24");
  });

  it("should take pageCount directly when the consumer supplies it", () => {
    render(<PageCountProbe pageCount={7} />);

    expect(screen.getByTestId("result")).toHaveTextContent("1/7");
  });

  it("should fall back to one page when given no sizing information at all", () => {
    // Neither an explicit pageCount nor a totalItems/pageSize pair — there is
    // nothing to derive a count from, so the range collapses to a single page
    // rather than reporting 0 (which `page` could never sit inside).
    render(<PageCountProbe />);

    expect(screen.getByTestId("result")).toHaveTextContent("1/1");
  });

  it("should fall back to one page when only half the sizing pair is given", () => {
    render(<PageCountProbe totalItems={200} />);

    expect(screen.getByTestId("result")).toHaveTextContent("1/1");
  });

  it("should report a single empty page when there are no items at all", () => {
    // A range has to have somewhere to stand: reporting 0 pages would make
    // `page` (1-based) immediately out of range for every consumer.
    render(<PageCountProbe totalItems={0} pageSize={10} />);

    expect(screen.getByTestId("result")).toHaveTextContent("1/1");
  });
});
