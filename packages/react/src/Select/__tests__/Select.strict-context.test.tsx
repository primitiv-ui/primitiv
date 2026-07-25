import { render } from "@testing-library/react";

import { Select } from "../Select";

/**
 * The rich sub-components read a strict context, so rendering one outside its
 * provider throws a consumer-actionable message rather than failing obscurely
 * further down. The message itself is the contract — assert it, not just that
 * something threw.
 */
describe("Select strict context", () => {
  // React logs the error boundary-less throw; silence it so the run stays clean.
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it.each([
    ["Trigger", <Select.Trigger key="t" />],
    ["Value", <Select.Value key="v" />],
    ["Content", <Select.Content key="c" />],
  ])("names <Select.Root> when %s is rendered outside one", (_name, element) => {
    expect(() => render(element)).toThrow(
      "Select rich sub-components (Trigger, Value, Content, Item) must be rendered inside a <Select.Root>.",
    );
  });

  it("names <Select.Item> when an ItemIndicator is rendered outside one", () => {
    expect(() =>
      render(
        <Select.Root>
          <Select.ItemIndicator forceMount>✓</Select.ItemIndicator>
        </Select.Root>,
      ),
    ).toThrow("Select.ItemIndicator must be rendered inside a <Select.Item>.");
  });
});
