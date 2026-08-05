import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Listbox } from "../Listbox";

/**
 * Options read a strict context, so rendering one outside its provider throws
 * a consumer-actionable message rather than failing obscurely further down.
 * The message itself is the contract — assert it, not just that something threw.
 */
describe("Listbox strict context", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("names <Listbox.Root> when an Option is rendered outside one", () => {
    expect(() =>
      render(<Listbox.Option value="apple">Apple</Listbox.Option>),
    ).toThrow("Listbox.Option must be rendered as a child of Listbox.Root");
  });
});
