import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePagination } from "../usePagination.ts";
import type { UsePaginationOptions } from "../usePagination.ts";

function PageStateProbe(options: UsePaginationOptions & { goTo?: number }) {
  const { goTo, ...rest } = options;
  const { page, setPage } = usePagination(rest);
  return (
    <>
      <span data-testid="page">{page}</span>
      <button type="button" onClick={() => setPage(goTo ?? 1)}>
        go
      </button>
    </>
  );
}

describe("usePagination page state", () => {
  it("should start on page 1 when no default is given", () => {
    render(<PageStateProbe pageCount={10} />);

    expect(screen.getByTestId("page")).toHaveTextContent("1");
  });

  it("should start on defaultPage when uncontrolled", () => {
    render(<PageStateProbe pageCount={10} defaultPage={4} />);

    expect(screen.getByTestId("page")).toHaveTextContent("4");
  });

  it("should move to the requested page", async () => {
    const user = userEvent.setup();
    render(<PageStateProbe pageCount={10} goTo={6} />);

    await user.click(screen.getByRole("button", { name: "go" }));

    expect(screen.getByTestId("page")).toHaveTextContent("6");
  });

  it("should clamp a request above the last page down to the last page", async () => {
    const user = userEvent.setup();
    render(<PageStateProbe pageCount={10} goTo={99} />);

    await user.click(screen.getByRole("button", { name: "go" }));

    expect(screen.getByTestId("page")).toHaveTextContent("10");
  });

  it("should clamp a request below the first page up to page 1", async () => {
    const user = userEvent.setup();
    render(<PageStateProbe pageCount={10} defaultPage={5} goTo={0} />);

    await user.click(screen.getByRole("button", { name: "go" }));

    expect(screen.getByTestId("page")).toHaveTextContent("1");
  });

  it("should clamp an out-of-range defaultPage", () => {
    // A page index restored from a URL or localStorage can easily outlive the
    // data it pointed at.
    render(<PageStateProbe pageCount={10} defaultPage={999} />);

    expect(screen.getByTestId("page")).toHaveTextContent("10");
  });

  it("should notify onPageChange with the clamped page, not the raw request", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<PageStateProbe pageCount={10} goTo={99} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "go" }));

    expect(onPageChange).toHaveBeenCalledWith(10);
  });

  it("should not notify onPageChange when the page has not actually changed", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<PageStateProbe pageCount={10} defaultPage={3} goTo={3} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "go" }));

    expect(onPageChange).not.toHaveBeenCalled();
  });
});
