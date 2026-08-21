import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { useLocalStorage } from "../useLocalStorage.ts";

const KEY = "primitiv-test-key";

function Probe({ next }: { next: string }) {
  const [value, setValue] = useLocalStorage(KEY, "light");
  return (
    <>
      <span data-testid="value">{value}</span>
      <button type="button" onClick={() => setValue(next)}>
        set
      </button>
    </>
  );
}

/** Two independent consumers of the SAME key, to prove they stay in step. */
function TwoProbes() {
  return (
    <>
      <Probe next="dark" />
      <SecondReader />
    </>
  );
}

function SecondReader() {
  const [value] = useLocalStorage(KEY, "light");
  return <span data-testid="second">{value}</span>;
}

describe("useLocalStorage writing", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("should update the returned value when the setter is called", async () => {
    const user = userEvent.setup();
    render(<Probe next="dark" />);

    await user.click(screen.getByRole("button", { name: "set" }));

    expect(screen.getByTestId("value")).toHaveTextContent("dark");
  });

  it("should persist the new value to localStorage as JSON", async () => {
    const user = userEvent.setup();
    render(<Probe next="dark" />);

    await user.click(screen.getByRole("button", { name: "set" }));

    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify("dark"));
  });

  /*
   * The `storage` event does NOT fire in the document that performed the write,
   * so without an in-document notification a second consumer of the same key
   * would keep rendering the stale value until something else re-rendered it.
   */
  it("should update every consumer of the same key in the same document", async () => {
    const user = userEvent.setup();
    render(<TwoProbes />);

    await user.click(screen.getByRole("button", { name: "set" }));

    expect(screen.getByTestId("second")).toHaveTextContent("dark");
  });
});
