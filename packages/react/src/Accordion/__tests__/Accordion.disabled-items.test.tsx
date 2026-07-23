import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Accordion } from "../Accordion";

describe("Accordion disabled items tests", () => {
  it("should apply aria-disabled='false' to accordion trigger by default", () => {
    // Arrange
    const title = "Accordion Trigger 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger = screen.getByRole("button", { name: title });

    // Assert
    expect(trigger).toHaveAttribute("aria-disabled", "false");
  });

  it("should apply aria-disabled='true' to accordion trigger when disabled prop is provided", () => {
    // Arrange
    const title = "Accordion Trigger 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger disabled>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger = screen.getByRole("button", { name: title });

    // Assert
    expect(trigger).toHaveAttribute("aria-disabled", "true");
  });

  it("should NOT set the native disabled HTML attribute on the trigger when disabled prop is provided", () => {
    // Arrange
    const title = "Accordion Trigger 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger disabled>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger = screen.getByRole("button", { name: title });

    // Assert
    expect(trigger).not.toHaveAttribute("disabled");
  });

  it("should apply data-disabled='false' to accordion trigger by default", () => {
    // Arrange
    const title = "Accordion Trigger 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger = screen.getByRole("button", { name: title });

    // Assert
    expect(trigger).toHaveAttribute("data-disabled", "false");
  });

  it("should apply data-disabled='true' to accordion trigger when disabled prop is provided", () => {
    // Arrange
    const title = "Accordion Trigger 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger disabled>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger = screen.getByRole("button", { name: title });

    // Assert
    expect(trigger).toHaveAttribute("data-disabled", "true");
  });

  it("should not toggle the accordion panel when clicking a disabled trigger", async () => {
    // Arrange
    const user = userEvent.setup();
    const title = "Accordion Trigger 1";
    const content = "Accordion Content 1";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger disabled>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>{content}</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger = screen.getByRole("button", { name: title });
    const panel = screen.getByText(content);

    // Act
    await user.click(trigger);

    // Assert — panel remains closed
    expect(panel).not.toBeVisible();
  });

  it("should skip a disabled trigger when navigating with ArrowDown", async () => {
    // Arrange
    const user = userEvent.setup();
    const title1 = "Trigger 1";
    const title2 = "Trigger 2";
    const title3 = "Trigger 3";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title1}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger disabled>{title2}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title3}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger3 = screen.getByRole("button", { name: title3 });

    // Act — tab to trigger 1, arrow down should skip disabled trigger 2
    await user.tab();
    await user.keyboard("[ArrowDown]");

    // Assert
    expect(trigger3).toHaveFocus();
  });

  it("should skip a disabled trigger when navigating with ArrowUp", async () => {
    // Arrange
    const user = userEvent.setup();
    const title1 = "Trigger 1";
    const title2 = "Trigger 2";
    const title3 = "Trigger 3";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title1}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger disabled>{title2}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title3}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger1 = screen.getByRole("button", { name: title1 });

    // Act — tab to trigger 3, arrow up should skip disabled trigger 2
    await user.tab();
    await user.tab();
    await user.tab();
    await user.keyboard("[ArrowUp]");

    // Assert
    expect(trigger1).toHaveFocus();
  });

  it("should skip a disabled trigger when navigating with Home", async () => {
    // Arrange
    const user = userEvent.setup();
    const title1 = "Trigger 1";
    const title2 = "Trigger 2";
    const title3 = "Trigger 3";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger disabled>{title1}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title2}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title3}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger2 = screen.getByRole("button", { name: title2 });

    // Act — tab to trigger 3, Home should skip disabled trigger 1 and land on trigger 2
    await user.tab();
    await user.tab();
    await user.keyboard("[Home]");

    // Assert
    expect(trigger2).toHaveFocus();
  });

  it("should skip a disabled trigger when navigating with End", async () => {
    // Arrange
    const user = userEvent.setup();
    const title1 = "Trigger 1";
    const title2 = "Trigger 2";
    const title3 = "Trigger 3";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title1}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>{title2}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger disabled>{title3}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger2 = screen.getByRole("button", { name: title2 });

    // Act — tab to trigger 1, End should skip disabled trigger 3 and land on trigger 2
    await user.tab();
    await user.keyboard("[End]");

    // Assert
    expect(trigger2).toHaveFocus();
  });

  it("re-registers a trigger's disabled flag when it changes after mount", async () => {
    // Arrange — all enabled at mount; the middle trigger becomes disabled after.
    const user = userEvent.setup();
    function Fixture({ middleDisabled }: { middleDisabled: boolean }) {
      return (
        <Accordion.Root>
          <Accordion.Item value="a">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>Content</Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="b">
            <Accordion.Header>
              <Accordion.Trigger disabled={middleDisabled}>
                Trigger 2
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>Content</Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="c">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 3</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>Content</Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      );
    }
    const { rerender } = render(<Fixture middleDisabled={false} />);

    // Act — disable Trigger 2 after mount, then arrow down from Trigger 1.
    rerender(<Fixture middleDisabled />);
    screen.getByRole("button", { name: "Trigger 1" }).focus();
    await user.keyboard("[ArrowDown]");

    // Assert — the registrar effect re-ran, so Trigger 2 is skipped and focus
    // lands on Trigger 3. A stale registration would keep Trigger 2 navigable,
    // landing focus on it (aria-disabled stays focusable).
    expect(screen.getByRole("button", { name: "Trigger 3" })).toHaveFocus();
  });

  it("should not throw when all triggers are disabled and arrow key is pressed", async () => {
    // Arrange
    const user = userEvent.setup();
    const title1 = "Trigger 1";
    const title2 = "Trigger 2";
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger disabled>{title1}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger disabled>{title2}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger1 = screen.getByRole("button", { name: title1 });

    // Act — focus trigger directly (tabbing skips aria-disabled elements) and press arrow
    trigger1.focus();
    await expect(
      user.keyboard("[ArrowDown]"),
    ).resolves.not.toThrow();
  });
});
