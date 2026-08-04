import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SplitButton } from "../SplitButton";

const outsideRoot =
  "SplitButton sub-components must be rendered inside a <SplitButton.Root>.";

describe("SplitButton — error handling", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when SplitButton.Action is used outside SplitButton.Root", () => {
    expect(() =>
      render(<SplitButton.Action>Orphan</SplitButton.Action>),
    ).toThrowError(outsideRoot);
  });

  it("throws when SplitButton.Trigger is used outside SplitButton.Root", () => {
    expect(() => render(<SplitButton.Trigger aria-label="Orphan" />)).toThrowError(
      outsideRoot,
    );
  });
});
