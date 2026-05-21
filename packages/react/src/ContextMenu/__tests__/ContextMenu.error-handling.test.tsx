import { render } from "@testing-library/react";

import { ContextMenu } from "../ContextMenu";

describe("ContextMenu error handling", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when ContextMenu.Trigger is used outside ContextMenu.Root", () => {
    expect(() =>
      render(<ContextMenu.Trigger>Orphan</ContextMenu.Trigger>),
    ).toThrowError(
      "ContextMenu sub-components must be rendered inside a <ContextMenu.Root>.",
    );
  });

  it("throws when ContextMenu.Content is used outside ContextMenu.Root", () => {
    expect(() =>
      render(
        <ContextMenu.Content>
          <ContextMenu.Item>Orphan</ContextMenu.Item>
        </ContextMenu.Content>,
      ),
    ).toThrowError(
      "ContextMenu sub-components must be rendered inside a <ContextMenu.Root>.",
    );
  });

  it("throws when ContextMenu.Item is used outside ContextMenu.Root", () => {
    expect(() =>
      render(<ContextMenu.Item>Orphan</ContextMenu.Item>),
    ).toThrowError(
      "ContextMenu sub-components must be rendered inside a <ContextMenu.Root>.",
    );
  });

  it("throws when ContextMenu.CheckboxItem is used outside ContextMenu.Root", () => {
    expect(() =>
      render(<ContextMenu.CheckboxItem>Orphan</ContextMenu.CheckboxItem>),
    ).toThrowError(
      "ContextMenu sub-components must be rendered inside a <ContextMenu.Root>.",
    );
  });

  it("throws when ContextMenu.RadioItem is used outside ContextMenu.RadioGroup", () => {
    expect(() =>
      render(
        <ContextMenu.Root defaultOpen>
          <ContextMenu.Trigger>Area</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.RadioItem value="a">A</ContextMenu.RadioItem>
          </ContextMenu.Content>
        </ContextMenu.Root>,
      ),
    ).toThrowError(
      "ContextMenu.RadioItem must be rendered inside a <ContextMenu.RadioGroup>.",
    );
  });

  it("throws when ContextMenu.SubTrigger is used outside ContextMenu.Sub", () => {
    expect(() =>
      render(
        <ContextMenu.Root defaultOpen>
          <ContextMenu.Trigger>Area</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.SubTrigger>Orphan</ContextMenu.SubTrigger>
          </ContextMenu.Content>
        </ContextMenu.Root>,
      ),
    ).toThrowError(
      "ContextMenu.SubTrigger and ContextMenu.SubContent must be rendered inside a <ContextMenu.Sub>.",
    );
  });

  it("throws when ContextMenu.SubContent is used outside ContextMenu.Sub", () => {
    expect(() =>
      render(
        <ContextMenu.Root defaultOpen>
          <ContextMenu.Trigger>Area</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Orphan</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Content>
        </ContextMenu.Root>,
      ),
    ).toThrowError(
      "ContextMenu.SubTrigger and ContextMenu.SubContent must be rendered inside a <ContextMenu.Sub>.",
    );
  });

  it("throws when ContextMenu.ItemIndicator is rendered outside a CheckboxItem or RadioItem", () => {
    expect(() =>
      render(
        <ContextMenu.Root defaultOpen>
          <ContextMenu.Trigger>Area</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.ItemIndicator>
              <span>orphan</span>
            </ContextMenu.ItemIndicator>
          </ContextMenu.Content>
        </ContextMenu.Root>,
      ),
    ).toThrowError(
      "ContextMenu.ItemIndicator must be rendered inside a <ContextMenu.CheckboxItem> or <ContextMenu.RadioItem>.",
    );
  });
});
