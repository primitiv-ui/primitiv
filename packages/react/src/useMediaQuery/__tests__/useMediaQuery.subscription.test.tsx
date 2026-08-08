import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useMediaQuery } from "../useMediaQuery.ts";

type ChangeListener = () => void;

function createMatchMediaMock(initialMatches: Record<string, boolean>) {
  const listeners = new Map<string, Set<ChangeListener>>();

  const matchMedia = vi.fn((query: string) => ({
    get matches() {
      return initialMatches[query] ?? false;
    },
    media: query,
    onchange: null,
    addEventListener: vi.fn((_type: "change", listener: ChangeListener) => {
      if (!listeners.has(query)) listeners.set(query, new Set());
      listeners.get(query)?.add(listener);
    }),
    removeEventListener: vi.fn((_type: "change", listener: ChangeListener) => {
      listeners.get(query)?.delete(listener);
    }),
    dispatchEvent: vi.fn(),
  }));

  return {
    matchMedia,
    change(query: string, matches: boolean) {
      initialMatches[query] = matches;
      listeners.get(query)?.forEach((listener) => listener());
    },
    listenerCount(query: string) {
      return listeners.get(query)?.size ?? 0;
    },
  };
}

function MediaQueryProbe({ query }: { query: string }) {
  const matches = useMediaQuery(query);
  return <span data-testid="result">{matches ? "true" : "false"}</span>;
}

describe("useMediaQuery live subscription", () => {
  afterEach(() => {
    // @ts-expect-error: restore by deletion so other suites get jsdom default.
    delete window.matchMedia;
  });

  it("should update when the media query's match state changes", () => {
    const mock = createMatchMediaMock({ "(min-width: 40rem)": false });
    window.matchMedia = mock.matchMedia;
    render(<MediaQueryProbe query="(min-width: 40rem)" />);

    act(() => {
      mock.change("(min-width: 40rem)", true);
    });

    expect(screen.getByTestId("result")).toHaveTextContent("true");
  });

  it("should remove its change listener on unmount", () => {
    const mock = createMatchMediaMock({ "(min-width: 40rem)": false });
    window.matchMedia = mock.matchMedia;
    const { unmount } = render(<MediaQueryProbe query="(min-width: 40rem)" />);
    expect(mock.listenerCount("(min-width: 40rem)")).toBe(1);

    unmount();

    expect(mock.listenerCount("(min-width: 40rem)")).toBe(0);
  });

  it("should resubscribe when the query argument changes", () => {
    const mock = createMatchMediaMock({
      "(min-width: 40rem)": false,
      "(min-width: 64rem)": true,
    });
    window.matchMedia = mock.matchMedia;
    const { rerender } = render(<MediaQueryProbe query="(min-width: 40rem)" />);
    expect(mock.listenerCount("(min-width: 40rem)")).toBe(1);

    rerender(<MediaQueryProbe query="(min-width: 64rem)" />);

    expect(screen.getByTestId("result")).toHaveTextContent("true");
    expect(mock.listenerCount("(min-width: 40rem)")).toBe(0);
    expect(mock.listenerCount("(min-width: 64rem)")).toBe(1);
  });
});
