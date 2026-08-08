import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
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

describe("useMediaQuery matching", () => {
  afterEach(() => {
    // @ts-expect-error: restore by deletion so other suites get jsdom default.
    delete window.matchMedia;
  });

  it("should return true when the query currently matches", () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => useMediaQuery("(min-width: 40rem)"));

    expect(result.current).toBe(true);
  });

  it("should return false when the query does not currently match", () => {
    mockMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery("(min-width: 40rem)"));

    expect(result.current).toBe(false);
  });
});
