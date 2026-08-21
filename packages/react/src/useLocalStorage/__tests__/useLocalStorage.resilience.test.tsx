import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { useLocalStorage } from "../useLocalStorage.ts";

const KEY = "primitiv-test-key";

function Probe() {
  const [value, setValue] = useLocalStorage(KEY, "light");
  return (
    <>
      <span data-testid="value">{value}</span>
      <button type="button" onClick={() => setValue("dark")}>
        set
      </button>
    </>
  );
}

/*
 * Storage methods are stubbed on `Storage.prototype`, NOT on
 * `window.localStorage`. jsdom's localStorage is a Proxy, so an instance spy
 * silently never intercepts — `vi.spyOn(window.localStorage, "setItem")`
 * records zero calls and the real write goes through. That is exactly the shape
 * of bug that makes a test pass for the wrong reason, so each test below stores
 * a real value first, ensuring the fallback can ONLY come from the throw path.
 */
describe("useLocalStorage resilience", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("should fall back when the stored value is not valid JSON", () => {
    // Storage is shared, long-lived and hand-editable, so a bad value has to
    // degrade rather than throw.
    window.localStorage.setItem(KEY, "{not json");

    render(<Probe />);

    expect(screen.getByTestId("value")).toHaveTextContent("light");
  });

  it("should fall back when reading storage throws", () => {
    // A readable "dark" is present, so "light" can only mean the read threw.
    window.localStorage.setItem(KEY, JSON.stringify("dark"));
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    render(<Probe />);

    expect(screen.getByTestId("value")).toHaveTextContent("light");
  });

  it("should leave the value untouched when writing to storage throws", async () => {
    const user = userEvent.setup();
    render(<Probe />);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    await user.click(screen.getByRole("button", { name: "set" }));

    // The write failed, so storage still holds nothing and the re-read returns
    // the fallback — the hook does not optimistically keep an unsaved value.
    expect(screen.getByTestId("value")).toHaveTextContent("light");
  });

  it("should pick up a change made in another tab", () => {
    render(<Probe />);

    // What the browser dispatches when a different document writes the key.
    act(() => {
      window.localStorage.setItem(KEY, JSON.stringify("dark"));
      window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
    });

    expect(screen.getByTestId("value")).toHaveTextContent("dark");
  });

  it("should stop listening once the last consumer unmounts", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<Probe />);
    unmount();

    const added = add.mock.calls.filter(([type]) => type === "storage").length;
    const removed = remove.mock.calls.filter(
      ([type]) => type === "storage",
    ).length;
    expect(added).toBeGreaterThan(0);
    expect(removed).toBe(added);
  });
});
