import { render } from "@testing-library/react";

import { Popover } from "../Popover";

describe("Popover error handling", () => {
  beforeEach(() => {
    // Suppress React's noisy uncaught-error logging while we deliberately
    // render sub-components outside their Root.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when Popover.Trigger is rendered without a Popover.Root", () => {
    expect(() => render(<Popover.Trigger>Open</Popover.Trigger>)).toThrow(
      /Popover\.Root/,
    );
  });

  it("throws when Popover.Anchor is rendered without a Popover.Root", () => {
    expect(() => render(<Popover.Anchor>Ref</Popover.Anchor>)).toThrow(
      /Popover\.Root/,
    );
  });

  it("throws when Popover.Content is rendered without a Popover.Root", () => {
    expect(() => render(<Popover.Content>Content</Popover.Content>)).toThrow(
      /Popover\.Root/,
    );
  });

  it("throws when Popover.Close is rendered without a Popover.Root", () => {
    expect(() => render(<Popover.Close>Close</Popover.Close>)).toThrow(
      /Popover\.Root/,
    );
  });

  it("throws when Popover.Title is rendered without a Popover.Root", () => {
    expect(() => render(<Popover.Title>Title</Popover.Title>)).toThrow(
      /Popover\.Root/,
    );
  });

  it("throws when Popover.Description is rendered without a Popover.Root", () => {
    expect(() =>
      render(<Popover.Description>Desc</Popover.Description>),
    ).toThrow(/Popover\.Root/);
  });
});
