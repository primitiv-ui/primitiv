import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useMediaQuery } from "../useMediaQuery.ts";

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function MediaQueryProbe({ query }: { query: string }) {
  const matches = useMediaQuery(query);
  return <span data-testid="result">{matches ? "true" : "false"}</span>;
}

describe("useMediaQuery matching", () => {
  afterEach(() => {
    // @ts-expect-error: restore by deletion so other suites get jsdom default.
    delete window.matchMedia;
  });

  it("should return true when the query currently matches", () => {
    mockMatchMedia(true);

    render(<MediaQueryProbe query="(min-width: 40rem)" />);

    expect(screen.getByTestId("result")).toHaveTextContent("true");
  });

  it("should return false when the query does not currently match", () => {
    mockMatchMedia(false);

    render(<MediaQueryProbe query="(min-width: 40rem)" />);

    expect(screen.getByTestId("result")).toHaveTextContent("false");
  });
});
