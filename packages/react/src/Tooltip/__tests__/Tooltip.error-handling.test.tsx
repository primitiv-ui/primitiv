import { render } from "@testing-library/react";

import { Tooltip } from "../Tooltip";

describe("Tooltip error handling", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when Tooltip.Root is used outside Tooltip.Provider", () => {
    expect(() =>
      render(
        <Tooltip.Root>
          <Tooltip.Trigger>Orphan</Tooltip.Trigger>
        </Tooltip.Root>,
      ),
    ).toThrowError(
      "Tooltip sub-components must be rendered inside a <Tooltip.Provider>.",
    );
  });

  it("throws when Tooltip.Trigger is used outside Tooltip.Root", () => {
    expect(() =>
      render(
        <Tooltip.Provider>
          <Tooltip.Trigger>Orphan</Tooltip.Trigger>
        </Tooltip.Provider>,
      ),
    ).toThrowError(
      "Tooltip sub-components must be rendered inside a <Tooltip.Root>.",
    );
  });
});
