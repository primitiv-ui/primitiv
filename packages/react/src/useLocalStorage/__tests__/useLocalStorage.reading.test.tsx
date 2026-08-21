import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { useLocalStorage } from "../useLocalStorage.ts";

const KEY = "primitiv-test-key";

function Probe({ fallback }: { fallback: string }) {
  const [value] = useLocalStorage(KEY, fallback);
  return <span data-testid="value">{value}</span>;
}

describe("useLocalStorage reading", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("should return the fallback when nothing is stored under the key", () => {
    render(<Probe fallback="light" />);

    expect(screen.getByTestId("value")).toHaveTextContent("light");
  });

  it("should return the stored value when one is present", () => {
    window.localStorage.setItem(KEY, JSON.stringify("dark"));

    render(<Probe fallback="light" />);

    expect(screen.getByTestId("value")).toHaveTextContent("dark");
  });
});
